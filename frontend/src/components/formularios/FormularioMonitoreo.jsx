// Formulario para registrar o editar un monitoreo del cultivo (RF-06, RF-08 y RF-09)

import { useState } from 'react';
// Para mostrar el mensaje de éxito
import { useAvisos } from '../../context/AvisosContexto';
// Llamadas al backend de monitoreos
import { monitoreosService } from '../../services/greensmart';
import { aInputFechaHora, ENFERMEDADES, ESTADOS_CULTIVO, PLAGAS } from '../../utils/formatos';
import VentanaModal from '../VentanaModal';
import { Campo, ErrorForm, Opciones, PieForm, SelectLote } from './CamposFormulario';

// Si llega "monitoreo" se edita. Si llega "loteId" el lote ya está elegido
export default function FormularioMonitoreo({ monitoreo, loteId, lotes = [], onCerrar, onGuardado }) {
    const { toast } = useAvisos();
    // Valores de los campos (la fecha empieza con la hora actual)
    const [datos, setDatos] = useState(() => ({
        loteId: monitoreo?.loteId || loteId || '',
        fecha: aInputFechaHora(monitoreo?.fecha),
        estado: monitoreo?.estado || 'BUENO',
        condicionObservada: monitoreo?.condicionObservada || '',
        plaga: monitoreo?.plaga || '',
        enfermedad: monitoreo?.enfermedad || '',
        observaciones: monitoreo?.observaciones || '',
    }));
    // Mensaje de error
    const [error, setError] = useState('');
    // true mientras se guarda
    const [guardando, setGuardando] = useState(false);

    // Guarda lo que se escribe en un campo
    const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

    // Al presionar Guardar
    const enviar = async (e) => {
        e.preventDefault();
        setError('');
        // Revisa qué campos obligatorios faltan
        const faltan = [];
        if (!datos.loteId) faltan.push('lote');
        if (!datos.estado) faltan.push('estado');
        if (!datos.condicionObservada.trim()) faltan.push('condición observada');
        if (faltan.length) return setError(`Completa los campos: ${faltan.join(', ')}.`);

        // Fecha del monitoreo (si está vacía, ahora)
        const fecha = datos.fecha ? new Date(datos.fecha) : new Date();
        // No se permiten fechas futuras
        if (fecha > new Date()) return setError('La fecha del monitoreo no puede ser futura.');

        // Datos que se envían al backend
        const cuerpo = {
            fecha: fecha.toISOString(),
            estado: datos.estado,
            condicionObservada: datos.condicionObservada.trim(),
            // Vacío = sin plaga / sin enfermedad
            plaga: datos.plaga,
            enfermedad: datos.enfermedad,
            observaciones: datos.observaciones.trim(),
        };

        setGuardando(true);
        try {
            // Editar (PUT) o crear (POST)
            if (monitoreo) await monitoreosService.actualizar(monitoreo.id, cuerpo);
            else await monitoreosService.crear({ ...cuerpo, loteId: Number(datos.loteId) });
            toast(monitoreo ? 'Monitoreo actualizado' : 'Monitoreo registrado', `Estado: ${ESTADOS_CULTIVO[datos.estado]}`);
            onGuardado();
        } catch (err) {
            // Muestra el error del backend
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <VentanaModal
            titulo={monitoreo ? 'Editar monitoreo' : 'Registrar monitoreo'}
            subtitulo="Estado visible de las plantas durante el recorrido"
            onCerrar={onCerrar}
            pie={<PieForm formId="formMonitoreo" onCerrar={onCerrar} guardando={guardando} texto={monitoreo ? 'Guardar cambios' : 'Registrar monitoreo'} />}
        >
            <form id="formMonitoreo" onSubmit={enviar} noValidate>
                <ErrorForm mensaje={error} />
                {/* Pide el lote solo si no viene elegido */}
                {!loteId && !monitoreo && (
                    <Campo etiqueta="Lote" requerido>
                        <SelectLote lotes={lotes} value={datos.loteId} onChange={cambiar('loteId')} />
                    </Campo>
                )}
                <div className="form-row-2">
                    {/* No deja escoger fechas futuras */}
                    <Campo etiqueta="Fecha y hora" requerido>
                        <input type="datetime-local" className="form-input" value={datos.fecha} max={aInputFechaHora()} onChange={cambiar('fecha')} />
                    </Campo>
                    {/* Bueno, Regular o Crítico */}
                    <Campo etiqueta="Estado del cultivo" requerido>
                        <select className="form-input select" value={datos.estado} onChange={cambiar('estado')}>
                            <Opciones mapa={ESTADOS_CULTIVO} />
                        </select>
                    </Campo>
                </div>
                <Campo etiqueta="Condición observada" requerido>
                    <input className="form-input" value={datos.condicionObservada} onChange={cambiar('condicionObservada')} placeholder="Hojas verdes, buen desarrollo del fruto" />
                </Campo>
                <div className="form-row-2">
                    <Campo etiqueta="Plaga detectada">
                        <select className="form-input select" value={datos.plaga} onChange={cambiar('plaga')}>
                            <Opciones mapa={PLAGAS} vacio="Ninguna" />
                        </select>
                    </Campo>
                    <Campo etiqueta="Enfermedad detectada">
                        <select className="form-input select" value={datos.enfermedad} onChange={cambiar('enfermedad')}>
                            <Opciones mapa={ENFERMEDADES} vacio="Ninguna" />
                        </select>
                    </Campo>
                </div>
                <Campo etiqueta="Observaciones">
                    <textarea className="form-input" value={datos.observaciones} onChange={cambiar('observaciones')} placeholder="Detalles adicionales del recorrido…" />
                </Campo>
            </form>
        </VentanaModal>
    );
}
