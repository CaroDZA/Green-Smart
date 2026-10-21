// Formulario para planificar o editar una etapa del cultivo (RF-02)

import { useState } from 'react';
// Para mostrar el mensaje de éxito
import { useAvisos } from '../../context/AvisosContexto';
// Llamadas al backend de etapas
import { etapasService } from '../../services/greensmart';
import { aInputFecha, ETAPAS } from '../../utils/formatos';
import VentanaModal from '../VentanaModal';
import { Campo, ErrorForm, Opciones, PieForm, SelectLote } from './CamposFormulario';

// Si llega "etapa" se edita. Si llega "loteId" el lote ya está elegido
export default function FormularioEtapa({ etapa, loteId, lotes = [], onCerrar, onGuardado }) {
    const { toast } = useAvisos();
    // Valores de los campos
    const [datos, setDatos] = useState({
        loteId: etapa?.loteId || loteId || '',
        nombre: etapa?.nombre || 'VEGETATIVA',
        fechaInicio: aInputFecha(etapa?.fechaInicio),
        fechaFin: aInputFecha(etapa?.fechaFin),
        descripcion: etapa?.descripcion || '',
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
        // Lote, etapa y fecha de inicio son obligatorios
        if (!datos.loteId || !datos.nombre || !datos.fechaInicio) {
            return setError('El lote, la etapa y la fecha de inicio son obligatorios.');
        }
        // La fecha de fin no puede ser antes de la de inicio
        if (datos.fechaFin && datos.fechaFin < datos.fechaInicio) {
            return setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
        }

        // Datos que se envían al backend
        const cuerpo = {
            nombre: datos.nombre,
            fechaInicio: datos.fechaInicio,
            // Sin fecha de fin = etapa en curso
            fechaFin: datos.fechaFin || null,
            descripcion: datos.descripcion.trim(),
        };

        setGuardando(true);
        try {
            // Editar (PUT) o crear (POST)
            if (etapa) await etapasService.actualizar(etapa.id, cuerpo);
            else await etapasService.crear({ ...cuerpo, loteId: Number(datos.loteId) });
            toast(etapa ? 'Etapa actualizada' : 'Etapa planificada', ETAPAS[datos.nombre]);
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
            titulo={etapa ? 'Editar etapa' : 'Planificar etapa'}
            subtitulo="Asigna una etapa del cultivo a un lote con sus fechas"
            onCerrar={onCerrar}
            pie={<PieForm formId="formEtapa" onCerrar={onCerrar} guardando={guardando} texto={etapa ? 'Guardar cambios' : 'Planificar etapa'} />}
        >
            <form id="formEtapa" onSubmit={enviar} noValidate>
                <ErrorForm mensaje={error} />
                {/* Pide el lote solo si no viene elegido */}
                {!loteId && !etapa && (
                    <Campo etiqueta="Lote" requerido>
                        <SelectLote lotes={lotes} value={datos.loteId} onChange={cambiar('loteId')} />
                    </Campo>
                )}
                <Campo etiqueta="Etapa del cultivo" requerido>
                    <select className="form-input select" value={datos.nombre} onChange={cambiar('nombre')}>
                        <Opciones mapa={ETAPAS} />
                    </select>
                </Campo>
                <div className="form-row-2">
                    <Campo etiqueta="Fecha de inicio" requerido>
                        <input type="date" className="form-input" value={datos.fechaInicio} onChange={cambiar('fechaInicio')} />
                    </Campo>
                    {/* No deja escoger un fin antes del inicio */}
                    <Campo etiqueta="Fecha de fin" pista="Vacío = etapa en curso">
                        <input type="date" className="form-input" value={datos.fechaFin} min={datos.fechaInicio || undefined} onChange={cambiar('fechaFin')} />
                    </Campo>
                </div>
                <Campo etiqueta="Descripción">
                    <textarea className="form-input" value={datos.descripcion} onChange={cambiar('descripcion')} placeholder="Aparición y desarrollo de flores…" />
                </Campo>
            </form>
        </VentanaModal>
    );
}
