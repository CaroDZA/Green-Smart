// Formulario para marcar una actividad como hecha y escribir novedades (RF-07)

import { useState } from 'react';
// Para mostrar el mensaje de éxito
import { useAvisos } from '../../context/AvisosContexto';
// Llamadas al backend de actividades
import { actividadesService } from '../../services/greensmart';
import { etiqueta, fmtDia, TIPOS_ACTIVIDAD } from '../../utils/formatos';
import VentanaModal from '../VentanaModal';
import { Campo, ErrorForm, PieForm } from './CamposFormulario';

export default function FormularioCompletar({ actividad, onCerrar, onGuardado }) {
    const { toast } = useAvisos();
    // Texto de las novedades
    const [novedades, setNovedades] = useState(actividad.novedades || '');
    // Mensaje de error
    const [error, setError] = useState('');
    // true mientras se guarda
    const [guardando, setGuardando] = useState(false);

    // Al presionar "Marcar como completada"
    const enviar = async (e) => {
        e.preventDefault();
        setError('');
        setGuardando(true);
        try {
            // El backend la marca COMPLETADA con la fecha de hoy
            await actividadesService.completar(actividad.id, novedades.trim());
            toast('Actividad completada', etiqueta(TIPOS_ACTIVIDAD, actividad.tipo));
            onGuardado();
        } catch (err) {
            // Ej: "Esta actividad ya esta cerrada"
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <VentanaModal
            titulo="Registrar actividad realizada"
            subtitulo={`${etiqueta(TIPOS_ACTIVIDAD, actividad.tipo)} · programada para ${fmtDia(actividad.fechaProgramada)}`}
            onCerrar={onCerrar}
            pie={<PieForm formId="formCompletar" onCerrar={onCerrar} guardando={guardando} texto="Marcar como completada" />}
        >
            <form id="formCompletar" onSubmit={enviar}>
                <ErrorForm mensaje={error} />
                <div className="info-banner">La fecha de ejecución se registra automáticamente con la fecha y hora actual.</div>
                <Campo etiqueta="Novedades u observaciones">
                    <textarea
                        className="form-input"
                        value={novedades}
                        onChange={(e) => setNovedades(e.target.value)}
                        placeholder="Se aplicó en todo el lote, se observó humedad alta en el sector sur…"
                        autoFocus
                    />
                </Campo>
            </form>
        </VentanaModal>
    );
}
