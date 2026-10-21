// Campana de alertas de la barra superior (RF-10)

import { useEffect, useRef, useState } from 'react';
// Para ir a otra página
import { useNavigate } from 'react-router-dom';
// Llamadas al backend de reportes
import { reportesService } from '../services/greensmart';
import { etiqueta, fmtDia, fmtFecha, TIPOS_ACTIVIDAD } from '../utils/formatos';
import { IconoAlerta, IconoCampana, IconoReloj } from './Iconos';

export default function MenuAlertas({ recargarCuando }) {
    // Si el menú está abierto
    const [abierto, setAbierto] = useState(false);
    // Alertas que mandó el backend
    const [alertas, setAlertas] = useState(null);
    // Referencia al menú (para detectar clics por fuera)
    const ref = useRef(null);
    const navigate = useNavigate();

    // Pide las alertas al cambiar de página o al abrir el menú
    useEffect(() => {
        reportesService.alertas().then(setAlertas).catch(() => setAlertas(null));
    }, [recargarCuando, abierto]);

    // Cierra el menú con un clic por fuera o con Escape
    useEffect(() => {
        if (!abierto) return;
        const fuera = (e) => ref.current && !ref.current.contains(e.target) && setAbierto(false);
        const esc = (e) => e.key === 'Escape' && setAbierto(false);
        document.addEventListener('mousedown', fuera);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('mousedown', fuera);
            document.removeEventListener('keydown', esc);
        };
    }, [abierto]);

    // Cierra el menú y abre el lote de la alerta
    const irALote = (loteId) => {
        setAbierto(false);
        navigate(`/lotes?lote=${loteId}`);
    };

    // Cantidad total de alertas
    const total = alertas?.totalAlertas || 0;

    return (
        <div className="alerts-wrap" ref={ref}>
            {/* Botón de la campana: abre o cierra el menú */}
            <button
                className="icon-btn"
                title="Alertas y recordatorios"
                aria-label={`Alertas (${total})`}
                aria-expanded={abierto}
                onClick={() => setAbierto((v) => !v)}
            >
                <IconoCampana />
                {/* Circulito rojo con el número de alertas */}
                {total > 0 && <span className="badge">{total > 99 ? '99+' : total}</span>}
            </button>

            {/* Menú desplegado */}
            {abierto && (
                <div className="alerts-pop">
                    <div className="card-head">
                        <div>
                            <div className="card-title">Alertas y recordatorios</div>
                            <div className="card-sub">{total ? `${total} pendientes de atención` : 'Todo al día'}</div>
                        </div>
                    </div>
                    <div className="alerts-scroll">
                        {/* Si el backend falló */}
                        {!alertas && <div className="loading-box">No se pudieron cargar las alertas</div>}
                        {/* Si no hay alertas */}
                        {alertas && total === 0 && (
                            <div className="loading-box">No hay actividades vencidas, próximas ni lotes críticos 🌱</div>
                        )}

                        {/* Lotes en estado crítico */}
                        {alertas?.lotesCriticos.length > 0 && (
                            <>
                                <div className="alert-group-label">Lotes en estado crítico</div>
                                {alertas.lotesCriticos.map((l) => (
                                    <div key={`c${l.loteId}`} className="txn clickable" onClick={() => irALote(l.loteId)}>
                                        <div className="txn-icon danger"><IconoAlerta size={16} /></div>
                                        <div className="txn-info">
                                            <div className="txn-title">{l.nombre}</div>
                                            <div className="txn-meta">{l.condicion} · {fmtFecha(l.fecha)}</div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Actividades vencidas */}
                        {alertas?.actividadesVencidas.length > 0 && (
                            <>
                                <div className="alert-group-label">Actividades vencidas</div>
                                {alertas.actividadesVencidas.map((a) => (
                                    <div key={`v${a.id}`} className="txn clickable" onClick={() => irALote(a.lote.id)}>
                                        <div className="txn-icon danger"><IconoReloj size={16} /></div>
                                        <div className="txn-info">
                                            <div className="txn-title">{etiqueta(TIPOS_ACTIVIDAD, a.tipo)} · {a.lote.nombre}</div>
                                            <div className="txn-meta">Programada para {fmtDia(a.fechaProgramada)}</div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Actividades de los próximos 3 días */}
                        {alertas?.actividadesProximas.length > 0 && (
                            <>
                                <div className="alert-group-label">Próximos 3 días</div>
                                {alertas.actividadesProximas.map((a) => (
                                    <div key={`p${a.id}`} className="txn clickable" onClick={() => irALote(a.lote.id)}>
                                        <div className="txn-icon warning"><IconoReloj size={16} /></div>
                                        <div className="txn-info">
                                            <div className="txn-title">{etiqueta(TIPOS_ACTIVIDAD, a.tipo)} · {a.lote.nombre}</div>
                                            <div className="txn-meta">{fmtDia(a.fechaProgramada)}</div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
