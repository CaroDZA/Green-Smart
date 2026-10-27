// Formulario para desactivar un lote escribiendo el motivo

import { useState } from 'react';
// Llamadas al backend de lotes
import { lotesService } from '../../services/greensmart';
import { agregarMotivo } from '../../utils/formatos';
import VentanaModal from '../VentanaModal';
import { Campo, ErrorForm } from './CamposFormulario';

export default function FormularioDesactivarLote({ lote, onCerrar, onDesactivado }) {
    // Motivo escrito
    const [motivo, setMotivo] = useState('');
    // Mensaje de error
    const [error, setError] = useState('');
    // true mientras se guarda
    const [guardando, setGuardando] = useState(false);

    // Al presionar "Desactivar"
    const enviar = async (e) => {
        e.preventDefault();
        setError('');
        // El motivo es obligatorio
        if (!motivo.trim()) return setError('Escribe el motivo para desactivar el lote.');
        setGuardando(true);
        try {
            // 1. Guarda el motivo en la descripción del lote (el backend no tiene campo para el motivo)
            await lotesService.actualizar(lote.id, { descripcion: agregarMotivo(lote.descripcion, motivo.trim()) });
            // 2. Desactiva el lote
            await lotesService.eliminar(lote.id);
            onDesactivado();
        } catch (err) {
            // Muestra el error del backend
            setError(err.message);
            setGuardando(false);
        }
    };

    return (
        <VentanaModal
            titulo="Desactivar lote"
            subtitulo={`“${lote.nombre}” dejará de aparecer en la lista. Su historial se conserva.`}
            onCerrar={onCerrar}
            pie={
                <>
                    <button type="button" className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
                    {/* Botón rojo conectado al formulario */}
                    <button type="submit" form="formDesactivar" className="btn btn-danger btn-auto" disabled={guardando}>
                        {guardando ? 'Desactivando…' : 'Desactivar'}
                    </button>
                </>
            }
        >
            <form id="formDesactivar" onSubmit={enviar} noValidate>
                <ErrorForm mensaje={error} />
                <Campo etiqueta="Motivo de la desactivación" requerido>
                    <textarea className="form-input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: el lote se vendió, se renovó el cultivo…" autoFocus />
                </Campo>
            </form>
        </VentanaModal>
    );
}
