// Formulario para programar o editar una actividad (RF-03 y RF-04)

import { useState } from 'react';
// Para mostrar el mensaje de éxito
import { useAvisos } from '../../context/AvisosContexto';
// Llamadas al backend de actividades
import { actividadesService } from '../../services/greensmart';
import { aInputFecha, ESTADOS_ACTIVIDAD, TIPOS_ACTIVIDAD } from '../../utils/formatos';
import VentanaModal from '../VentanaModal';
import { Campo, ErrorForm, Opciones, PieForm, SelectLote } from './CamposFormulario';

// Si llega "actividad" se edita. Si llega "loteId" el lote ya está elegido
export default function FormularioActividad({ actividad, loteId, lotes = [], onCerrar, onGuardado }) {
    const { toast } = useAvisos();
    // Valores de los campos
    const [datos, setDatos] = useState({
        loteId: actividad?.loteId || loteId || '',
        tipo: actividad?.tipo || 'FERTILIZACION',
        fechaProgramada: aInputFecha(actividad?.fechaProgramada),
        estado: actividad?.estado || 'PENDIENTE',
        costo: actividad?.costo ?? '',
        descripcion: actividad?.descripcion || '',
        novedades: actividad?.novedades || '',
    });
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
        if (!datos.tipo) faltan.push('tipo de actividad');
        if (!datos.fechaProgramada) faltan.push('fecha programada');
        if (faltan.length) return setError(`Completa los campos: ${faltan.join(', ')}.`);
        // El costo debe ser un número positivo
        if (datos.costo !== '' && (isNaN(parseFloat(datos.costo)) || parseFloat(datos.costo) < 0)) {
            return setError('El costo debe ser un número positivo.');
        }

        // Costo vacío = null
        const costo = datos.costo === '' ? null : parseFloat(datos.costo);
        setGuardando(true);
        try {
            if (actividad) {
                // Editar (PUT), aquí también se guardan las novedades
                await actividadesService.actualizar(actividad.id, {
                    tipo: datos.tipo,
                    fechaProgramada: datos.fechaProgramada,
                    estado: datos.estado,
                    costo,
                    descripcion: datos.descripcion.trim(),
                    novedades: datos.novedades.trim(),
                });
            } else {
                // Crear (POST)
                await actividadesService.crear({
                    loteId: Number(datos.loteId),
                    tipo: datos.tipo,
                    fechaProgramada: datos.fechaProgramada,
                    estado: datos.estado,
                    // Sin costo no se envía
                    costo: costo ?? undefined,
                    descripcion: datos.descripcion.trim(),
                });
            }
            toast(actividad ? 'Actividad actualizada' : 'Actividad programada', TIPOS_ACTIVIDAD[datos.tipo]);
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
            titulo={actividad ? 'Editar actividad' : 'Programar actividad'}
            subtitulo={actividad ? 'Modifica la planificación o registra novedades' : 'Agrega una labor al cronograma del lote'}
            onCerrar={onCerrar}
            pie={<PieForm formId="formActividad" onCerrar={onCerrar} guardando={guardando} texto={actividad ? 'Guardar cambios' : 'Programar actividad'} />}
        >
            <form id="formActividad" onSubmit={enviar} noValidate>
                <ErrorForm mensaje={error} />
                {/* Pide el lote solo si no viene elegido */}
                {!loteId && !actividad && (
                    <Campo etiqueta="Lote" requerido>
                        <SelectLote lotes={lotes} value={datos.loteId} onChange={cambiar('loteId')} />
                    </Campo>
                )}
                <div className="form-row-2">
                    <Campo etiqueta="Tipo de actividad" requerido>
                        <select className="form-input select" value={datos.tipo} onChange={cambiar('tipo')}>
                            <Opciones mapa={TIPOS_ACTIVIDAD} />
                        </select>
                    </Campo>
                    <Campo etiqueta="Fecha programada" requerido>
                        <input type="date" className="form-input" value={datos.fechaProgramada} onChange={cambiar('fechaProgramada')} />
                    </Campo>
                </div>
                <div className="form-row-2">
                    <Campo etiqueta="Estado">
                        <select className="form-input select" value={datos.estado} onChange={cambiar('estado')}>
                            <Opciones mapa={ESTADOS_ACTIVIDAD} />
                        </select>
                    </Campo>
                    <Campo etiqueta="Costo (COP)">
                        <input type="number" min="0" step="100" className="form-input" value={datos.costo} onChange={cambiar('costo')} placeholder="150000" />
                    </Campo>
                </div>
                <Campo etiqueta="Descripción">
                    <textarea className="form-input" value={datos.descripcion} onChange={cambiar('descripcion')} placeholder="Aplicación de fertilizante orgánico…" />
                </Campo>
                {/* Novedades solo al editar */}
                {actividad && (
                    <Campo etiqueta="Novedades">
                        <textarea className="form-input" value={datos.novedades} onChange={cambiar('novedades')} placeholder="Observaciones durante la labor…" />
                    </Campo>
                )}
            </form>
        </VentanaModal>
    );
}
