// Formulario para registrar o editar un lote (RF-01)

import { useState } from 'react';
// Para mostrar el mensaje de éxito
import { useAvisos } from '../../context/AvisosContexto';
// Llamadas al backend de lotes
import { lotesService } from '../../services/greensmart';
import VentanaModal from '../VentanaModal';
import { Campo, ErrorForm, PieForm } from './CamposFormulario';

// Si llega "lote" se edita; si no, se crea uno nuevo
export default function FormularioLote({ lote, onCerrar, onGuardado }) {
    const { toast } = useAvisos();
    // Valores de los campos
    const [datos, setDatos] = useState({
        nombre: lote?.nombre || '',
        ubicacion: lote?.ubicacion || '',
        area: lote?.area ?? '',
        cultivo: lote?.cultivo || 'Aguacate',
        descripcion: lote?.descripcion || '',
    });
    // Mensaje de error
    const [error, setError] = useState('');
    // true mientras se guarda
    const [guardando, setGuardando] = useState(false);

    // Guarda lo que se escribe en un campo
    const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

    // Al presionar Guardar
    const enviar = async (e) => {
        // Evita que la página se recargue
        e.preventDefault();
        setError('');
        // Nombre y ubicación son obligatorios
        if (!datos.nombre.trim() || !datos.ubicacion.trim()) {
            return setError('El nombre y la ubicación son obligatorios.');
        }
        // El área debe ser un número positivo
        if (datos.area !== '' && (isNaN(parseFloat(datos.area)) || parseFloat(datos.area) < 0)) {
            return setError('El área debe ser un número positivo.');
        }

        // Datos que se envían al backend
        const cuerpo = {
            nombre: datos.nombre.trim(),
            ubicacion: datos.ubicacion.trim(),
            // Área vacía = null
            area: datos.area === '' ? null : parseFloat(datos.area),
            cultivo: datos.cultivo.trim() || 'Aguacate',
            descripcion: datos.descripcion.trim(),
        };

        setGuardando(true);
        try {
            // Editar (PUT) o crear (POST)
            const r = lote ? await lotesService.actualizar(lote.id, cuerpo) : await lotesService.crear(cuerpo);
            toast(lote ? 'Lote actualizado' : 'Lote registrado', cuerpo.nombre);
            // Avisa a la pantalla para que recargue
            onGuardado(r.lote);
        } catch (err) {
            // Muestra el error del backend, ej: nombre repetido
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <VentanaModal
            titulo={lote ? 'Editar lote' : 'Registrar lote de la finca'}
            subtitulo={lote ? lote.nombre : 'Completa los datos del lote o tajo'}
            onCerrar={onCerrar}
            pie={<PieForm formId="formLote" onCerrar={onCerrar} guardando={guardando} texto={lote ? 'Guardar cambios' : 'Registrar lote'} />}
        >
            <form id="formLote" onSubmit={enviar} noValidate>
                <ErrorForm mensaje={error} />
                <Campo etiqueta="Nombre del lote" requerido>
                    <input className="form-input" value={datos.nombre} onChange={cambiar('nombre')} placeholder="Lote El Roble" autoFocus />
                </Campo>
                <Campo etiqueta="Ubicación" requerido>
                    <input className="form-input" value={datos.ubicacion} onChange={cambiar('ubicacion')} placeholder="Sector Norte, Jardín" />
                </Campo>
                {/* Área y cultivo en la misma fila */}
                <div className="form-row-2">
                    <Campo etiqueta="Área (hectáreas)">
                        <input type="number" min="0" step="0.01" className="form-input" value={datos.area} onChange={cambiar('area')} placeholder="2.5" />
                    </Campo>
                    <Campo etiqueta="Cultivo">
                        <input className="form-input" value={datos.cultivo} onChange={cambiar('cultivo')} placeholder="Aguacate" />
                    </Campo>
                </div>
                <Campo etiqueta="Descripción">
                    <textarea className="form-input" value={datos.descripcion} onChange={cambiar('descripcion')} placeholder="Variedad Hass, plantado en 2020…" />
                </Campo>
            </form>
        </VentanaModal>
    );
}
