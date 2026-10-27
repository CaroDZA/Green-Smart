// Página Reportes: mejores resultados, gráficas, reporte por fechas y PDF (RF-16 y RF-18)

import { useMemo, useState } from 'react';
import { Barras, Dona } from '../components/Graficas';
import { Cargando, ErrorCarga, Etiqueta, Vacio } from '../components/Mensajes';
import { Campo, ErrorForm } from '../components/formularios/CamposFormulario';
import {
    IconoCalendario, IconoCheck, IconoDescargar, IconoDinero, IconoHoja, IconoLote, IconoMonitoreo, IconoReloj, IconoTrofeo,
} from '../components/Iconos';
import { useAvisos } from '../context/AvisosContexto';
import { useCarga } from '../hooks/useCarga';
import {
    actividadesService, lotesService, monitoreosService, reportesService,
} from '../services/greensmart';
import {
    claseEstado, ESTADOS_ACTIVIDAD, ESTADOS_CULTIVO, etiqueta, fmtDia, fmtDinero, fmtFechaHora, hoyISO, TIPOS_ACTIVIDAD,
} from '../utils/formatos';

// Calcula un porcentaje redondeado, ej: pct(1, 4) → 25
const pct = (parte, total) => (total ? Math.round((parte / total) * 100) : 0);

// Cuadro de "Lo más destacado": ícono, título, valor y texto pequeño
function Destacado({ Icono, titulo, valor, sub, clase = '' }) {
    return (
        <div className="highlight">
            <div className={`kpi-icon ${clase}`}><Icono /></div>
            <div style={{ minWidth: 0 }}>
                <div className="highlight-title">{titulo}</div>
                <div className="highlight-value">{valor}</div>
                {sub && <div className="highlight-sub">{sub}</div>}
            </div>
        </div>
    );
}

export default function Reportes() {
    const { toast, toastError } = useAvisos();

    // Pide al backend: resumen, estado de lotes, actividades, monitoreos y lotes
    const { datos, cargando, error, recargar } = useCarga(async () => {
        const [resumen, panel, actividades, monitoreos, lotes] = await Promise.all([
            reportesService.resumen(),
            monitoreosService.panelEstado(),
            actividadesService.listar(),
            monitoreosService.listar(),
            lotesService.listar(),
        ]);
        return {
            resumen,
            panel,
            lotes,
            actividades,
            monitoreos,
        };
    });

    // ---------- CÁLCULO DE INDICADORES (con los datos del backend) ----------
    const ind = useMemo(() => {
        if (!datos) return null;
        const { actividades, monitoreos, panel, lotes } = datos;
        // Actividades completadas
        const completadas = actividades.filter((a) => a.estado === 'COMPLETADA');
        // Actividades sin contar las canceladas
        const validas = actividades.filter((a) => a.estado !== 'CANCELADA');
        // Completadas el mismo día programado o antes
        const aTiempo = completadas.filter(
            (a) => a.fechaEjecucion && new Date(a.fechaEjecucion) <= new Date(a.fechaProgramada.slice(0, 10) + 'T23:59:59'),
        );
        // Suma de todos los costos
        const costoTotal = actividades.reduce((s, a) => s + (a.costo || 0), 0);
        // Actividades que tienen costo
        const conCosto = actividades.filter((a) => a.costo != null);

        // Resultados de cada lote
        const porLote = lotes.map((l) => {
            // Actividades del lote
            const acts = actividades.filter((a) => a.loteId === l.id);
            // Sin canceladas
            const val = acts.filter((a) => a.estado !== 'CANCELADA');
            // Completadas
            const comp = acts.filter((a) => a.estado === 'COMPLETADA').length;
            return {
                lote: l,
                total: val.length,
                completadas: comp,
                cumplimiento: pct(comp, val.length),
                costo: acts.reduce((s, a) => s + (a.costo || 0), 0),
                ultimo: panel.find((p) => p.loteId === l.id)?.ultimoMonitoreo || null,
            };
        });
        // Orden de los estados: primero Bueno, al final sin datos
        const rangoEstado = { BUENO: 0, REGULAR: 1, CRITICO: 2 };
        // Lotes ordenados del mejor al peor
        const ranking = [...porLote].sort(
            (a, b) =>
                // 1. Mayor cumplimiento
                b.cumplimiento - a.cumplimiento ||
                // 2. Mejor estado
                (rangoEstado[a.ultimo?.estado] ?? 3) - (rangoEstado[b.ultimo?.estado] ?? 3) ||
                // 3. Más actividades completadas
                b.completadas - a.completadas,
        );
        // El mejor lote que tenga actividades
        const mejorLote = ranking.find((r) => r.total > 0);

        // Cuenta cuántas veces se completó cada tipo de labor
        const conteoTipos = {};
        completadas.forEach((a) => (conteoTipos[a.tipo] = (conteoTipos[a.tipo] || 0) + 1));
        // La labor más realizada
        const tipoTop = Object.entries(conteoTipos).sort((a, b) => b[1] - a[1])[0];

        // Lotes que tienen al menos un monitoreo
        const monitoreados = panel.filter((p) => p.ultimoMonitoreo);
        // Lotes sin plaga ni enfermedad
        const sanos = monitoreados.filter((p) => !p.ultimoMonitoreo.plaga && !p.ultimoMonitoreo.enfermedad);
        // Lotes en buen estado
        const buenos = monitoreados.filter((p) => p.ultimoMonitoreo.estado === 'BUENO');
        // Monitoreos con estado bueno
        const monitoreosBuenos = monitoreos.filter((m) => m.estado === 'BUENO');

        // Todos los indicadores que usa la pantalla
        return {
            completadas: completadas.length,
            validas: validas.length,
            cumplimiento: pct(completadas.length, validas.length),
            aTiempo: aTiempo.length,
            pctATiempo: pct(aTiempo.length, completadas.length),
            costoTotal,
            costoPromedio: conCosto.length ? costoTotal / conCosto.length : 0,
            ranking,
            mejorLote,
            tipoTop,
            monitoreados: monitoreados.length,
            sanos: sanos.length,
            buenos: buenos.length,
            pctBuenos: pct(buenos.length, monitoreados.length),
            pctMonitoreosBuenos: pct(monitoreosBuenos.length, monitoreos.length),
            // Cuántos lotes hay en cada estado (para la gráfica)
            estados: {
                BUENO: buenos.length,
                REGULAR: monitoreados.filter((p) => p.ultimoMonitoreo.estado === 'REGULAR').length,
                CRITICO: monitoreados.filter((p) => p.ultimoMonitoreo.estado === 'CRITICO').length,
                SIN: panel.length - monitoreados.length,
            },
        };
    }, [datos]);

    // ---------- REPORTE POR FECHAS ----------
    // Fechas elegidas (por defecto los últimos 3 meses)
    const [rango, setRango] = useState(() => {
        const inicio = new Date();
        inicio.setMonth(inicio.getMonth() - 3);
        return { fechaInicio: inicio.toISOString().slice(0, 10), fechaFin: hoyISO(), loteId: '' };
    });
    // Resultado que devuelve el backend
    const [reporte, setReporte] = useState(null);
    // Error del reporte
    const [errorRango, setErrorRango] = useState('');
    // true mientras se genera
    const [generando, setGenerando] = useState(false);
    // Lote elegido para el PDF
    const [lotePDF, setLotePDF] = useState('');
    // true mientras se descarga el PDF
    const [descargando, setDescargando] = useState(false);

    // Al presionar "Generar reporte"
    const generar = async (e) => {
        e.preventDefault();
        setErrorRango('');
        // Las dos fechas son obligatorias
        if (!rango.fechaInicio || !rango.fechaFin) return setErrorRango('Selecciona la fecha inicial y la final.');
        // La final no puede ser antes de la inicial
        if (rango.fechaFin < rango.fechaInicio) return setErrorRango('La fecha final no puede ser anterior a la inicial.');
        setGenerando(true);
        try {
            // GET /reportes/fechas
            setReporte(await reportesService.porFechas(rango));
        } catch (err) {
            setErrorRango(err.message);
        } finally {
            setGenerando(false);
        }
    };

    // Al presionar "Descargar PDF"
    const descargarPDF = async () => {
        // Busca el lote elegido
        const lote = datos.lotes.find((l) => l.id === Number(lotePDF));
        setDescargando(true);
        try {
            // GET /reportes/pdf/:loteId
            await reportesService.descargarPDF(lote.id, lote.nombre);
            toast('Reporte generado', `Historial de ${lote.nombre}`);
        } catch (err) {
            toastError(err);
        } finally {
            setDescargando(false);
        }
    };

    // Mientras carga
    if (cargando && !datos) return <div className="card"><Cargando texto="Generando reportes…" /></div>;
    // Si falló
    if (error) return <div className="card"><ErrorCarga error={error} onReintentar={recargar} /></div>;

    const { resumen } = datos;
    // Suma de costos del reporte por fechas
    const costoRango = reporte?.actividades.reduce((s, a) => s + (a.costo || 0), 0) || 0;

    return (
        <section>
            {/* Título */}
            <div className="view-head">
                <div>
                    <div className="view-title">Reportes</div>
                    <div className="view-sub">Los mejores resultados del cultivo y reportes para la toma de decisiones</div>
                </div>
            </div>

            {/* ---------- 4 TARJETAS DE PORCENTAJES ---------- */}
            <div className="kpi-grid">
                {/* % de actividades completadas */}
                <div className="kpi-card">
                    <div className="kpi-row">
                        <span className="kpi-label">Cumplimiento de actividades</span>
                        <div className="kpi-icon"><IconoCheck /></div>
                    </div>
                    <div className="kpi-value">{ind.cumplimiento}%</div>
                    {/* Barra de progreso */}
                    <div className="progress"><span style={{ width: `${ind.cumplimiento}%` }} /></div>
                    <div className="kpi-trend">{ind.completadas} de {ind.validas} completadas</div>
                </div>
                {/* % de lotes en buen estado */}
                <div className="kpi-card">
                    <div className="kpi-row">
                        <span className="kpi-label">Lotes en buen estado</span>
                        <div className="kpi-icon"><IconoHoja /></div>
                    </div>
                    <div className="kpi-value">{ind.pctBuenos}%</div>
                    <div className="progress"><span style={{ width: `${ind.pctBuenos}%` }} /></div>
                    <div className="kpi-trend">{ind.buenos} de {ind.monitoreados} lotes monitoreados</div>
                </div>
                {/* % de labores hechas a tiempo */}
                <div className="kpi-card">
                    <div className="kpi-row">
                        <span className="kpi-label">Completadas a tiempo</span>
                        <div className="kpi-icon info"><IconoReloj /></div>
                    </div>
                    <div className="kpi-value">{ind.pctATiempo}%</div>
                    <div className="progress"><span style={{ width: `${ind.pctATiempo}%` }} /></div>
                    <div className="kpi-trend">{ind.aTiempo} labores en o antes de su fecha</div>
                </div>
                {/* Costo total (del backend) */}
                <div className="kpi-card">
                    <div className="kpi-row">
                        <span className="kpi-label">Inversión registrada</span>
                        <div className="kpi-icon warning"><IconoDinero /></div>
                    </div>
                    <div className="kpi-value">{fmtDinero(resumen.costoTotal)}</div>
                    <div className="kpi-trend">promedio {fmtDinero(ind.costoPromedio)} por actividad</div>
                </div>
            </div>

            {/* ---------- LO MÁS DESTACADO ---------- */}
            <div className="card mb-16" style={{ marginBottom: 22 }}>
                <div className="card-head">
                    <div>
                        <div className="card-title">Lo más destacado</div>
                        <div className="card-sub">Los resultados más favorables registrados en Green Smart</div>
                    </div>
                </div>
                <div className="card-body">
                    <div className="highlight-grid">
                        {/* Mejor lote */}
                        <Destacado
                            Icono={IconoTrofeo}
                            titulo="Lote con mejor desempeño"
                            valor={ind.mejorLote ? ind.mejorLote.lote.nombre : 'Sin datos aún'}
                            sub={ind.mejorLote && `${ind.mejorLote.cumplimiento}% de cumplimiento · ${ind.mejorLote.completadas} labores completadas`}
                        />
                        {/* Labor más realizada */}
                        <Destacado
                            Icono={IconoCalendario}
                            titulo="Labor más realizada"
                            valor={ind.tipoTop ? etiqueta(TIPOS_ACTIVIDAD, ind.tipoTop[0]) : 'Sin datos aún'}
                            sub={ind.tipoTop && `completada ${ind.tipoTop[1]} ${ind.tipoTop[1] === 1 ? "vez" : "veces"}`}
                            clase="info"
                        />
                        {/* Lotes sanos */}
                        <Destacado
                            Icono={IconoHoja}
                            titulo="Lotes libres de plagas y enfermedades"
                            valor={`${ind.sanos} de ${ind.monitoreados}`}
                            sub="según su último monitoreo"
                        />
                        {/* Monitoreos buenos */}
                        <Destacado
                            Icono={IconoMonitoreo}
                            titulo="Monitoreos con estado bueno"
                            valor={`${ind.pctMonitoreosBuenos}%`}
                            sub={`de ${resumen.totalMonitoreos} monitoreos realizados`}
                            clase="info"
                        />
                    </div>
                </div>
            </div>

            {/* ---------- GRÁFICAS ---------- */}
            <div className="reports-grid" style={{ marginBottom: 22 }}>
                {/* Barras: actividades por tipo (del backend) */}
                <div className="card">
                    <div className="card-head">
                        <div>
                            <div className="card-title">Actividades por tipo</div>
                            <div className="card-sub">Total de labores registradas</div>
                        </div>
                    </div>
                    <div className="card-body">
                        {resumen.actividadesPorTipo.length ? (
                            <Barras
                                unidad="actividades"
                                // Ordena de mayor a menor y arma los datos de la gráfica
                                datos={[...resumen.actividadesPorTipo]
                                    .sort((a, b) => b._count.tipo - a._count.tipo)
                                    .map((t) => ({ etiqueta: etiqueta(TIPOS_ACTIVIDAD, t.tipo), valor: t._count.tipo }))}
                            />
                        ) : (
                            <Vacio titulo="Sin actividades registradas" />
                        )}
                    </div>
                </div>
                {/* Dona: lotes por estado */}
                <div className="card">
                    <div className="card-head">
                        <div>
                            <div className="card-title">Estado de los lotes</div>
                            <div className="card-sub">Según el último monitoreo</div>
                        </div>
                    </div>
                    <div className="card-body">
                        {datos.panel.length ? (
                            <Dona
                                subCentro="Lotes"
                                datos={[
                                    { etiqueta: 'Bueno', valor: ind.estados.BUENO, color: 'var(--success)' },
                                    { etiqueta: 'Regular', valor: ind.estados.REGULAR, color: 'var(--warning)' },
                                    { etiqueta: 'Crítico', valor: ind.estados.CRITICO, color: 'var(--danger)' },
                                    { etiqueta: 'Sin monitoreo', valor: ind.estados.SIN, color: 'var(--text-muted)' },
                                ]}
                            />
                        ) : (
                            <Vacio titulo="No hay lotes registrados" />
                        )}
                    </div>
                </div>
            </div>

            {/* ---------- TABLA: CUMPLIMIENTO POR LOTE ---------- */}
            <div className="card" style={{ marginBottom: 22 }}>
                <div className="card-head">
                    <div>
                        <div className="card-title">Cumplimiento por lote</div>
                        <div className="card-sub">Ordenado de mejor a menor desempeño</div>
                    </div>
                </div>
                {ind.ranking.length ? (
                    <div className="table-wrap">
                        <table className="tbl">
                            <thead>
                                <tr><th>#</th><th>Lote</th><th>Cumplimiento</th><th>Completadas</th><th>Estado actual</th><th>Costo</th></tr>
                            </thead>
                            <tbody>
                                {/* Una fila por lote, del mejor al peor */}
                                {ind.ranking.map((r, i) => (
                                    <tr key={r.lote.id}>
                                        {/* Puesto */}
                                        <td className="muted">{i + 1}</td>
                                        <td><b>{r.lote.nombre}</b><div className="txn-meta">{r.lote.ubicacion}</div></td>
                                        {/* Porcentaje con barra */}
                                        <td style={{ minWidth: 140 }}>
                                            <b>{r.cumplimiento}%</b>
                                            <div className="progress" style={{ marginTop: 4 }}><span style={{ width: `${r.cumplimiento}%` }} /></div>
                                        </td>
                                        <td>{r.completadas} / {r.total}</td>
                                        <td>
                                            <Etiqueta clase={claseEstado(r.ultimo?.estado)} punto>
                                                {r.ultimo ? ESTADOS_CULTIVO[r.ultimo.estado] : 'Sin datos'}
                                            </Etiqueta>
                                        </td>
                                        <td>{fmtDinero(r.costo)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Vacio titulo="No hay lotes registrados" />
                )}
            </div>

            <div className="reports-grid">
                {/* ---------- FORMULARIO: REPORTE POR FECHAS ---------- */}
                <div className="card">
                    <div className="card-head">
                        <div>
                            <div className="card-title">Reporte por rango de fechas</div>
                            <div className="card-sub">Actividades, novedades, costos y monitoreos (máx. 12 meses)</div>
                        </div>
                    </div>
                    <div className="card-body">
                        <form onSubmit={generar}>
                            <ErrorForm mensaje={errorRango} />
                            <div className="form-row-2">
                                <Campo etiqueta="Fecha inicial" requerido>
                                    <input type="date" className="form-input" value={rango.fechaInicio} onChange={(e) => setRango({ ...rango, fechaInicio: e.target.value })} />
                                </Campo>
                                <Campo etiqueta="Fecha final" requerido>
                                    <input type="date" className="form-input" value={rango.fechaFin} onChange={(e) => setRango({ ...rango, fechaFin: e.target.value })} />
                                </Campo>
                            </div>
                            {/* Lote opcional */}
                            <Campo etiqueta="Lote">
                                <select className="form-input select" value={rango.loteId} onChange={(e) => setRango({ ...rango, loteId: e.target.value })}>
                                    <option value="">Todos los lotes</option>
                                    {datos.lotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                                </select>
                            </Campo>
                            <button type="submit" className="btn btn-primary btn-auto" disabled={generando}>
                                {generando ? 'Generando…' : 'Generar reporte'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ---------- DESCARGAR PDF ---------- */}
                <div className="card">
                    <div className="card-head">
                        <div>
                            <div className="card-title">Historial del lote en PDF</div>
                            <div className="card-sub">Etapas, actividades y monitoreos de un lote</div>
                        </div>
                    </div>
                    <div className="card-body">
                        <Campo etiqueta="Lote" requerido>
                            <select className="form-input select" value={lotePDF} onChange={(e) => setLotePDF(e.target.value)}>
                                <option value="">Selecciona un lote…</option>
                                {datos.lotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                            </select>
                        </Campo>
                        {/* Se activa cuando se elige un lote */}
                        <button className="btn btn-primary btn-auto" onClick={descargarPDF} disabled={!lotePDF || descargando}>
                            <IconoDescargar size={16} /> {descargando ? 'Generando PDF…' : 'Descargar PDF'}
                        </button>
                        <div className="info-banner" style={{ marginTop: 16, marginBottom: 0 }}>
                            <IconoLote size={12} style={{ verticalAlign: '-1px' }} /> También puedes descargarlo desde el detalle de cada lote.
                        </div>
                    </div>
                </div>
            </div>

            {/* ---------- RESULTADO DEL REPORTE POR FECHAS ---------- */}
            {reporte && (
                <div className="card" style={{ marginTop: 22 }}>
                    <div className="card-head">
                        <div>
                            <div className="card-title">
                                Resultado: {fmtDia(reporte.rango.desde)} – {fmtDia(reporte.rango.hasta)}
                            </div>
                            <div className="card-sub">
                                {reporte.totalActividades} actividades · {reporte.totalMonitoreos} monitoreos · costo {fmtDinero(costoRango)}
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        {/* Tabla de actividades */}
                        <div className="detail-section">
                            <div className="detail-section-title">Actividades y novedades</div>
                            {reporte.actividades.length ? (
                                <div className="detail-table-wrap">
                                    <table className="detail-table">
                                        <thead><tr><th>Fecha</th><th>Lote</th><th>Actividad</th><th>Estado</th><th>Novedades</th><th>Costo</th></tr></thead>
                                        <tbody>
                                            {reporte.actividades.map((a) => (
                                                <tr key={a.id}>
                                                    <td>{fmtDia(a.fechaProgramada)}</td>
                                                    <td>{a.lote?.nombre}</td>
                                                    <td>{etiqueta(TIPOS_ACTIVIDAD, a.tipo)}</td>
                                                    <td><Etiqueta clase={claseEstado(a.estado)}>{ESTADOS_ACTIVIDAD[a.estado]}</Etiqueta></td>
                                                    <td className="cell-wrap">{a.novedades || a.descripcion || '—'}</td>
                                                    <td>{a.costo != null ? fmtDinero(a.costo) : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        {/* Fila del total */}
                                        <tfoot><tr><td colSpan={5}>Total</td><td>{fmtDinero(costoRango)}</td></tr></tfoot>
                                    </table>
                                </div>
                            ) : (
                                <p className="muted" style={{ fontSize: 13 }}>No hay actividades en este rango.</p>
                            )}
                        </div>
                        {/* Tabla de monitoreos */}
                        <div className="detail-section">
                            <div className="detail-section-title">Monitoreos</div>
                            {reporte.monitoreos.length ? (
                                <div className="detail-table-wrap">
                                    <table className="detail-table">
                                        <thead><tr><th>Fecha</th><th>Lote</th><th>Estado</th><th>Condición</th><th>Registró</th></tr></thead>
                                        <tbody>
                                            {reporte.monitoreos.map((m) => (
                                                <tr key={m.id}>
                                                    <td>{fmtFechaHora(m.fecha)}</td>
                                                    <td>{m.lote?.nombre}</td>
                                                    <td><Etiqueta clase={claseEstado(m.estado)} punto>{ESTADOS_CULTIVO[m.estado]}</Etiqueta></td>
                                                    <td className="cell-wrap">{m.condicionObservada}</td>
                                                    <td>{m.usuario?.nombre}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="muted" style={{ fontSize: 13 }}>No hay monitoreos en este rango.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
