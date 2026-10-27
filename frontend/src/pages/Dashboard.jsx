// Página Dashboard: resumen general y estado de cada lote (RF-05)

// Link: enlace a otra página. useNavigate: cambiar de página con código
import { Link, useNavigate } from 'react-router-dom';
import { Dona } from '../components/Graficas';
import { Cargando, ErrorCarga, Etiqueta, Vacio } from '../components/Mensajes';
import { IconoAlerta, IconoCalendario, IconoLote, IconoMonitoreo, IconoReloj } from '../components/Iconos';
import { useSesion } from '../context/SesionContexto';
import { useCarga } from '../hooks/useCarga';
import { monitoreosService, reportesService } from '../services/greensmart';
import {
    claseEstado, ESTADOS_ACTIVIDAD, ESTADOS_CULTIVO, etiqueta, fmtDia, fmtFecha, fmtFechaHora, TIPOS_ACTIVIDAD,
} from '../utils/formatos';

// Color de cada estado de actividad en la gráfica
const COLORES_ACTIVIDAD = {
    PENDIENTE: 'var(--warning)',
    EN_PROCESO: 'var(--info)',
    COMPLETADA: 'var(--success)',
    CANCELADA: 'var(--text-muted)',
};

export default function Dashboard() {
    const { usuario } = useSesion();
    const navigate = useNavigate();

    // Pide al backend: resumen, estado de lotes, alertas y monitoreos
    const { datos, cargando, error, recargar } = useCarga(async () => {
        const [resumen, panel, alertas, monitoreos] = await Promise.all([
            reportesService.resumen(),
            monitoreosService.panelEstado(),
            reportesService.alertas(),
            monitoreosService.listar(),
        ]);
        return { resumen, panel, alertas, monitoreos };
    });

    // Primer nombre para el saludo
    const primerNombre = usuario.nombre.split(' ')[0];

    // Mientras carga
    if (cargando && !datos) return <div className="card"><Cargando texto="Cargando dashboard…" /></div>;
    // Si falló
    if (error) return <div className="card"><ErrorCarga error={error} onReintentar={recargar} /></div>;

    const { resumen, panel, alertas, monitoreos } = datos;
    // Cantidad de actividades vencidas (la calcula el backend)
    const vencidas = alertas.actividadesVencidas.length;
    // Vencidas y próximas en una sola lista
    const recordatorios = [
        ...alertas.actividadesVencidas.map((a) => ({ ...a, vencida: true })),
        ...alertas.actividadesProximas.map((a) => ({ ...a, vencida: false })),
    ];
    // Cuántos lotes están en estado crítico
    const criticos = panel.filter((p) => p.ultimoMonitoreo?.estado === 'CRITICO').length;
    // Cuántos lotes están en buen estado
    const buenos = panel.filter((p) => p.ultimoMonitoreo?.estado === 'BUENO').length;
    // Actividades por estado (vienen del backend)
    const porEstado = resumen.actividadesPorEstado;

    return (
        <section>
            {/* Saludo y botón */}
            <div className="view-head">
                <div>
                    <div className="view-title">Hola, {primerNombre} 👋</div>
                    <div className="view-sub">Resumen general del cultivo de aguacate · {fmtFecha(new Date())}</div>
                </div>
                <Link to="/lotes" className="btn btn-primary btn-auto" style={{ textDecoration: 'none' }}>
                    <IconoLote size={16} /> Ver lotes de la finca
                </Link>
            </div>

            {/* ---------- 4 TARJETAS DE NÚMEROS ---------- */}
            <div className="kpi-grid">
                {/* Lotes activos */}
                <div className="kpi-card">
                    <div className="kpi-row">
                        <span className="kpi-label">Lotes activos</span>
                        <div className="kpi-icon"><IconoLote /></div>
                    </div>
                    <div className="kpi-value">{resumen.totalLotes}</div>
                    <div className="kpi-trend">{buenos} en buen estado</div>
                </div>
                {/* Actividades pendientes o en proceso */}
                <div className="kpi-card">
                    <div className="kpi-row">
                        <span className="kpi-label">Actividades por hacer</span>
                        <div className="kpi-icon info"><IconoCalendario /></div>
                    </div>
                    <div className="kpi-value">{porEstado.pendientes + porEstado.enProceso}</div>
                    {/* En rojo si hay vencidas */}
                    <div className={`kpi-trend ${vencidas ? 'down' : ''}`}>
                        {vencidas ? `${vencidas} vencidas` : 'pendientes / en proceso, ninguna vencida'}
                    </div>
                </div>
                {/* Monitoreos registrados */}
                <div className="kpi-card">
                    <div className="kpi-row">
                        <span className="kpi-label">Monitoreos registrados</span>
                        <div className="kpi-icon"><IconoMonitoreo /></div>
                    </div>
                    <div className="kpi-value">{resumen.totalMonitoreos}</div>
                    <div className="kpi-trend">
                        {monitoreos[0] ? `último: ${fmtFecha(monitoreos[0].fecha)}` : 'sin registros aún'}
                    </div>
                </div>
                {/* Lotes críticos */}
                <div className="kpi-card">
                    <div className="kpi-row">
                        <span className="kpi-label">Lotes en estado crítico</span>
                        <div className={`kpi-icon ${criticos ? 'danger' : ''}`}><IconoAlerta /></div>
                    </div>
                    <div className="kpi-value">{criticos}</div>
                    <div className={`kpi-trend ${criticos ? 'down' : ''}`}>{criticos ? 'requieren atención' : 'todo bajo control'}</div>
                </div>
            </div>

            <div className="grid-2">
                {/* ---------- ESTADO DE CADA LOTE ---------- */}
                <div className="card">
                    <div className="card-head">
                        <div>
                            <div className="card-title">Estado del cultivo por lote</div>
                            <div className="card-sub">Según el último monitoreo de cada lote</div>
                        </div>
                        <Link to="/monitoreos">Ver monitoreos →</Link>
                    </div>
                    {panel.length === 0 ? (
                        <Vacio titulo="No hay datos disponibles" mensaje="Registra lotes y monitoreos para ver el estado del cultivo." />
                    ) : (
                        <div className="txn-list">
                            {/* Una fila por lote; al hacer clic abre su detalle */}
                            {panel.map((p) => {
                                // Último monitoreo del lote
                                const m = p.ultimoMonitoreo;
                                return (
                                    <div key={p.loteId} className="txn clickable" onClick={() => navigate(`/lotes?lote=${p.loteId}`)}>
                                        {/* Ícono rojo, amarillo o verde según el estado */}
                                        <div className={`txn-icon ${m?.estado === 'CRITICO' ? 'danger' : m?.estado === 'REGULAR' ? 'warning' : ''}`}>
                                            <IconoLote size={16} />
                                        </div>
                                        <div className="txn-info">
                                            <div className="txn-title">{p.nombre}</div>
                                            <div className="txn-meta">
                                                {m ? `${m.condicionObservada} · ${fmtFechaHora(m.fecha)}` : `${p.ubicacion} · sin monitoreos`}
                                            </div>
                                        </div>
                                        <Etiqueta clase={claseEstado(m?.estado)} punto>{m ? ESTADOS_CULTIVO[m.estado] : 'Sin datos'}</Etiqueta>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ---------- GRÁFICA DE ACTIVIDADES ---------- */}
                <div className="card">
                    <div className="card-head">
                        <div>
                            <div className="card-title">Actividades por estado</div>
                            <div className="card-sub">{resumen.totalActividades} actividades en total</div>
                        </div>
                    </div>
                    <div className="card-body">
                        {resumen.totalActividades ? (
                            <Dona
                                subCentro="Actividades"
                                datos={[
                                    { etiqueta: 'Completadas', valor: porEstado.completadas, color: COLORES_ACTIVIDAD.COMPLETADA },
                                    { etiqueta: 'Pendientes', valor: porEstado.pendientes, color: COLORES_ACTIVIDAD.PENDIENTE },
                                    { etiqueta: 'En proceso', valor: porEstado.enProceso, color: COLORES_ACTIVIDAD.EN_PROCESO },
                                    { etiqueta: 'Canceladas', valor: porEstado.canceladas, color: COLORES_ACTIVIDAD.CANCELADA },
                                ]}
                            />
                        ) : (
                            <Vacio titulo="Sin actividades" mensaje="Aún no hay actividades programadas." />
                        )}
                    </div>
                </div>
            </div>

            <div className="grid-2">
                {/* ---------- ACTIVIDADES VENCIDAS Y PRÓXIMAS ---------- */}
                <div className="card">
                    <div className="card-head">
                        <div>
                            <div className="card-title">Actividades vencidas y próximas</div>
                            <div className="card-sub">Pendientes o en proceso · próximos 3 días</div>
                        </div>
                        <Link to="/actividades">Ver cronograma →</Link>
                    </div>
                    {recordatorios.length === 0 ? (
                        <Vacio titulo="Nada pendiente" mensaje="No hay actividades vencidas ni para los próximos 3 días." />
                    ) : (
                        <div className="txn-list">
                            {/* Una fila por actividad; al hacer clic abre su lote */}
                            {recordatorios.map((a) => {
                                const { vencida } = a;
                                return (
                                    <div key={a.id} className="txn clickable" onClick={() => navigate(`/lotes?lote=${a.lote.id}`)}>
                                        {/* Rojo si está vencida, amarillo si es próxima */}
                                        <div className={`txn-icon ${vencida ? 'danger' : 'warning'}`}><IconoReloj size={16} /></div>
                                        <div className="txn-info">
                                            <div className="txn-title">{etiqueta(TIPOS_ACTIVIDAD, a.tipo)} · {a.lote?.nombre}</div>
                                            <div className="txn-meta">{vencida ? 'Vencida · ' : ''}{fmtDia(a.fechaProgramada)}</div>
                                        </div>
                                        <Etiqueta clase={claseEstado(a.estado)}>{ESTADOS_ACTIVIDAD[a.estado]}</Etiqueta>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ---------- ÚLTIMOS 5 MONITOREOS ---------- */}
                <div className="card">
                    <div className="card-head">
                        <div className="card-title">Últimos monitoreos</div>
                        <Link to="/monitoreos">Ver todo →</Link>
                    </div>
                    {monitoreos.length === 0 ? (
                        <Vacio titulo="No hay datos de monitoreo disponibles" />
                    ) : (
                        <div className="txn-list">
                            {monitoreos.slice(0, 5).map((m) => (
                                <div key={m.id} className="txn">
                                    <div className="txn-icon info"><IconoMonitoreo size={16} /></div>
                                    <div className="txn-info">
                                        <div className="txn-title">{m.lote?.nombre}</div>
                                        <div className="txn-meta">{fmtFecha(m.fecha)} · {m.usuario?.nombre}</div>
                                    </div>
                                    <Etiqueta clase={claseEstado(m.estado)} punto>{ESTADOS_CULTIVO[m.estado]}</Etiqueta>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
