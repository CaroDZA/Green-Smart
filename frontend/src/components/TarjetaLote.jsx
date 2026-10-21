// Cuadrito de un lote en la página Lotes (al hacer clic abre el detalle)

import { claseEstado, COLOR_ESTADO_CULTIVO, ESTADOS_CULTIVO, ETAPAS, etiqueta, fmtFecha } from '../utils/formatos';
import { Etiqueta } from './Mensajes';
import { IconoLote, IconoUbicacion } from './Iconos';

export default function TarjetaLote({ lote, etapa, ultimoMonitoreo, pendientes, onClick }) {
    // Estado del último monitoreo (Bueno, Regular o Crítico)
    const estado = ultimoMonitoreo?.estado;

    return (
        <button
            type="button"
            className="lote-card"
            onClick={onClick}
            // Color del borde izquierdo según el estado
            style={{ '--estado-color': COLOR_ESTADO_CULTIVO[estado] || 'var(--border)' }}
            aria-label={`Ver detalle de ${lote.nombre}`}
        >
            {/* Arriba: nombre, ubicación y estado */}
            <div className="lote-card-head">
                <div className="lote-card-icon"><IconoLote size={20} /></div>
                <div>
                    <div className="lote-card-title">{lote.nombre}</div>
                    <div className="lote-card-sub">
                        <IconoUbicacion size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} />
                        {lote.ubicacion}
                    </div>
                </div>
                <Etiqueta clase={claseEstado(estado)} punto>{estado ? ESTADOS_CULTIVO[estado] : 'Sin monitoreo'}</Etiqueta>
            </div>

            {/* Centro: área, etapa actual y pendientes */}
            <div className="lote-card-stats">
                <div>
                    <div className="lote-stat-value">{lote.area != null ? `${lote.area} ha` : '—'}</div>
                    <div className="lote-stat-label">Área</div>
                </div>
                <div>
                    <div className="lote-stat-value">{etapa ? etiqueta(ETAPAS, etapa.nombre) : '—'}</div>
                    <div className="lote-stat-label">Etapa</div>
                </div>
                <div>
                    <div className="lote-stat-value">{pendientes}</div>
                    <div className="lote-stat-label">Pendientes</div>
                </div>
            </div>

            {/* Abajo: cultivo, última fecha y "Ver todo" */}
            <div className="lote-card-foot">
                <span>
                    {lote.cultivo} · {ultimoMonitoreo ? `Monitoreado ${fmtFecha(ultimoMonitoreo.fecha)}` : `Registrado ${fmtFecha(lote.createdAt)}`}
                </span>
                <span className="lote-card-more">Ver todo →</span>
            </div>
        </button>
    );
}
