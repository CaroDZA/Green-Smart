// Cuadrito de un lote desactivado (no abre detalle, solo deja bajar su PDF)

import { useState } from 'react';
import { useAvisos } from '../context/AvisosContexto';
import { reportesService } from '../services/greensmart';
import { fmtFecha, separarMotivo } from '../utils/formatos';
import { Etiqueta } from './Mensajes';
import { IconoDescargar, IconoLote, IconoUbicacion } from './Iconos';

export default function TarjetaLoteInactivo({ lote }) {
    const { toast, toastError } = useAvisos();
    // true mientras se genera el PDF
    const [descargando, setDescargando] = useState(false);
    // Motivo guardado al final de la descripción
    const { motivo } = separarMotivo(lote.descripcion);

    // Descarga el PDF del historial (el backend lo conserva aunque el lote esté inactivo)
    const descargarPDF = async () => {
        setDescargando(true);
        try {
            await reportesService.descargarPDF(lote.id, lote.nombre);
            toast('Reporte generado', 'El PDF con el historial del lote se descargó');
        } catch (e) {
            toastError(e);
        } finally {
            setDescargando(false);
        }
    };

    return (
        <div className="lote-card lote-card-inactivo">
            {/* Arriba: nombre, ubicación y etiqueta "Inactivo" */}
            <div className="lote-card-head">
                <div className="lote-card-icon"><IconoLote size={20} /></div>
                <div>
                    <div className="lote-card-title">{lote.nombre}</div>
                    <div className="lote-card-sub">
                        <IconoUbicacion size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} />
                        {lote.ubicacion}
                    </div>
                </div>
                <Etiqueta clase="sin-datos">Inactivo</Etiqueta>
            </div>

            {/* Centro: área y cultivo */}
            <div className="lote-card-stats">
                <div>
                    <div className="lote-stat-value">{lote.area != null ? `${lote.area} ha` : '—'}</div>
                    <div className="lote-stat-label">Área</div>
                </div>
                <div>
                    <div className="lote-stat-value">{lote.cultivo}</div>
                    <div className="lote-stat-label">Cultivo</div>
                </div>
            </div>

            {/* Motivo con el que se desactivó (si lo tiene) */}
            {motivo && <div className="lote-motivo"><b>Motivo:</b> {motivo}</div>}

            {/* Abajo: fecha de registro y botón PDF */}
            <div className="lote-card-foot">
                <span>Registrado {fmtFecha(lote.createdAt)}</span>
                <button className="btn btn-ghost btn-auto btn-sm" onClick={descargarPDF} disabled={descargando}>
                    <IconoDescargar size={14} /> {descargando ? 'Generando…' : 'PDF'}
                </button>
            </div>
        </div>
    );
}
