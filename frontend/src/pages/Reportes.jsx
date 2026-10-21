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

const pct = (parte, total) => (total ? Math.round((parte / total) * 100) : 0);

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

// RF-16 / RF-18: reportes del cultivo, resaltando los mejores resultados
export default function Reportes() {
    const { toast, toastError } = useAvisos();

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

    // Indicadores calculados a partir de los datos del backend
    const ind = useMemo(() => {
        if (!datos) return null;
        const { actividades, monitoreos, panel, lotes } = datos;
        const completadas = actividades.filter((a) => a.estado === 'COMPLETADA');
        const validas = actividades.filter((a) => a.estado !== 'CANCELADA');
        const aTiempo = completadas.filter(
            (a) => a.fechaEjecucion && new Date(a.fechaEjecucion) <= new Date(a.fechaProgramada.slice(0, 10) + 'T23:59:59'),
        );
        const costoTotal = actividades.reduce((s, a) => s + (a.costo || 0), 0);
        const conCosto = actividades.filter((a) => a.costo != null);

        const porLote = lotes.map((l) => {
            const acts = actividades.filter((a) => a.loteId === l.id);
            const val = acts.filter((a) => a.estado !== 'CANCELADA');
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
        const rangoEstado = { BUENO: 0, REGULAR: 1, CRITICO: 2 };
        const ranking = [...porLote].sort(
            (a, b) =>
                b.cumplimiento - a.cumplimiento ||
                (rangoEstado[a.ultimo?.estado] ?? 3) - (rangoEstado[b.ultimo?.estado] ?? 3) ||
                b.completadas - a.completadas,
        );
        const mejorLote = ranking.find((r) => r.total > 0);

        const conteoTipos = {};
        completadas.forEach((a) => (conteoTipos[a.tipo] = (conteoTipos[a.tipo] || 0) + 1));
        const tipoTop = Object.entries(conteoTipos).sort((a, b) => b[1] - a[1])[0];

        const monitoreados = panel.filter((p) => p.ultimoMonitoreo);
        const sanos = monitoreados.filter((p) => !p.ultimoMonitoreo.plaga && !p.ultimoMonitoreo.enfermedad);
        const buenos = monitoreados.filter((p) => p.ultimoMonitoreo.estado === 'BUENO');
        const monitoreosBuenos = monitoreos.filter((m) => m.estado === 'BUENO');

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
            estados: {
                BUENO: buenos.length,
                REGULAR: monitoreados.filter((p) => p.ultimoMonitoreo.estado === 'REGULAR').length,
                CRITICO: monitoreados.filter((p) => p.ultimoMonitoreo.estado === 'CRITICO').length,
                SIN: panel.length - monitoreados.length,
            },
        };
    }, [datos]);

    // ---- Reporte por rango de fechas ----
    const [rango, setRango] = useState(() => {
        const inicio = new Date();
        inicio.setMonth(inicio.getMonth() - 3);
        return { fechaInicio: inicio.toISOString().slice(0, 10), fechaFin: hoyISO(), loteId: '' };
    });
    const [reporte, setReporte] = useState(null);
    const [errorRango, setErrorRango] = useState('');
    const [generando, setGenerando] = useState(false);
    const [lotePDF, setLotePDF] = useState('');
    const [descargando, setDescargando] = useState(false);

    const generar = async (e) => {
        e.preventDefault();
        setErrorRango('');
        if (!rango.fechaInicio || !rango.fechaFin) return setErrorRango('Selecciona la fecha inicial y la final.');
        if (rango.fechaFin < rango.fechaInicio) return setErrorRango('La fecha final no puede ser anterior a la inicial.');
        setGenerando(true);
        try {
            setReporte(await reportesService.porFechas(rango));
        } catch (err) {
            setErrorRango(err.message);
        } finally {
            setGenerando(false);
        }
    };

    const descargarPDF = async () => {
        const lote = datos.lotes.find((l) => l.id === Number(lotePDF));
        setDescargando(true);
        try {
            await reportesService.descargarPDF(lote.id, lote.nombre);
            toast('Reporte generado', `Historial de ${lote.nombre}`);
        } catch (err) {
            toastError(err);
        } finally {
            setDescargando(false);
        }
    };

    if (cargando && !datos) return <div className="card"><Cargando texto="Generando reportes…" /></div>;
    if (error) return <div className="card"><ErrorCarga error={error} onReintentar={recargar} /></div>;

    const { resumen } = datos;
    const costoRango = reporte?.actividades.reduce((s, a) => s + (a.costo || 0), 0) || 0;

    return (
        <section>
            <div className="view-head">
                <div>
                    <div className="view-title">Reportes</div>
                    <div className="view-sub">Los mejores resultados del cultivo y reportes para la toma de decisiones</div>
                </div>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-row">
                        <span className="kpi-label">Cumplimiento de actividades</span>
                        <div className="kpi-icon"><IconoCheck /></div>
                    </div>
                    <div className="kpi-value">{ind.cumplimiento}%</div>
                    <div className="progress"><span style={{ width: `${ind.cumplimiento}%` }} /></div>
                    <div className="kpi-trend">{ind.completadas} de {ind.validas} completadas</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-row">
                        <span className="kpi-label">Lotes en buen estado</span>
                        <div className="kpi-icon"><IconoHoja /></div>
                    </div>
                    <div className="kpi-value">{ind.pctBuenos}%</div>
                    <div className="progress"><span style={{ width: `${ind.pctBuenos}%` }} /></div>
                    <div className="kpi-trend">{ind.buenos} de {ind.monitoreados} lotes monitoreados</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-row">
                        <span className="kpi-label">Completadas a tiempo</span>
                        <div className="kpi-icon info"><IconoReloj /></div>
                    </div>
                    <div className="kpi-value">{ind.pctATiempo}%</div>
                    <div className="progress"><span style={{ width: `${ind.pctATiempo}%` }} /></div>
                    <div className="kpi-trend">{ind.aTiempo} labores en o antes de su fecha</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-row">
                        <span className="kpi-label">Inversión registrada</span>
                        <div className="kpi-icon warning"><IconoDinero /></div>
                    </div>
                    <div className="kpi-value">{fmtDinero(resumen.costoTotal)}</div>
                    <div className="kpi-trend">promedio {fmtDinero(ind.costoPromedio)} por actividad</div>
                </div>
            </div>

            <div className="card mb-16" style={{ marginBottom: 22 }}>
                <div className="card-head">
                    <div>
                        <div className="card-title">Lo más destacado</div>
                        <div className="card-sub">Los resultados más favorables registrados en Green Smart</div>
                    </div>
                </div>
                <div className="card-body">
                    <div className="highlight-grid">
                        <Destacado
                            Icono={IconoTrofeo}
                            titulo="Lote con mejor desempeño"
                            valor={ind.mejorLote ? ind.mejorLote.lote.nombre : 'Sin datos aún'}
                            sub={ind.mejorLote && `${ind.mejorLote.cumplimiento}% de cumplimiento · ${ind.mejorLote.completadas} labores completadas`}
                        />
                        <Destacado
                            Icono={IconoCalendario}
                            titulo="Labor más realizada"
                            valor={ind.tipoTop ? etiqueta(TIPOS_ACTIVIDAD, ind.tipoTop[0]) : 'Sin datos aún'}
                            sub={ind.tipoTop && `completada ${ind.tipoTop[1]} ${ind.tipoTop[1] === 1 ? "vez" : "veces"}`}
                            clase="info"
                        />
                        <Destacado
                            Icono={IconoHoja}
                            titulo="Lotes libres de plagas y enfermedades"
                            valor={`${ind.sanos} de ${ind.monitoreados}`}
                            sub="según su último monitoreo"
                        />
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

            <div className="reports-grid" style={{ marginBottom: 22 }}>
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
                                datos={[...resumen.actividadesPorTipo]
                                    .sort((a, b) => b._count.tipo - a._count.tipo)
                                    .map((t) => ({ etiqueta: etiqueta(TIPOS_ACTIVIDAD, t.tipo), valor: t._count.tipo }))}
                            />
                        ) : (
                            <Vacio titulo="Sin actividades registradas" />
                        )}
                    </div>
                </div>
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
                                {ind.ranking.map((r, i) => (
                                    <tr key={r.lote.id}>
                                        <td className="muted">{i + 1}</td>
                                        <td><b>{r.lote.nombre}</b><div className="txn-meta">{r.lote.ubicacion}</div></td>
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
                        <button className="btn btn-primary btn-auto" onClick={descargarPDF} disabled={!lotePDF || descargando}>
                            <IconoDescargar size={16} /> {descargando ? 'Generando PDF…' : 'Descargar PDF'}
                        </button>
                        <div className="info-banner" style={{ marginTop: 16, marginBottom: 0 }}>
                            <IconoLote size={12} style={{ verticalAlign: '-1px' }} /> También puedes descargarlo desde el detalle de cada lote.
                        </div>
                    </div>
                </div>
            </div>

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
                                        <tfoot><tr><td colSpan={5}>Total</td><td>{fmtDinero(costoRango)}</td></tr></tfoot>
                                    </table>
                                </div>
                            ) : (
                                <p className="muted" style={{ fontSize: 13 }}>No hay actividades en este rango.</p>
                            )}
                        </div>
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
