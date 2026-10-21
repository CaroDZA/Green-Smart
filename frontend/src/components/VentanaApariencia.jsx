// Ventana para elegir modo claro, oscuro o el del sistema

// Para leer y cambiar el tema
import { useTema } from '../context/TemaContexto';
import { IconoLuna, IconoMonitor, IconoSol } from './Iconos';
import VentanaModal from './VentanaModal';

// Las tres opciones
const OPCIONES = [
    { valor: 'light', etiqueta: 'Claro', Icono: IconoSol },
    { valor: 'dark', etiqueta: 'Oscuro', Icono: IconoLuna },
    { valor: 'system', etiqueta: 'Sistema', Icono: IconoMonitor },
];

export default function VentanaApariencia({ onCerrar }) {
    // Opción elegida y función para cambiarla
    const { preferencia, elegirTema } = useTema();

    return (
        <VentanaModal
            titulo="Apariencia"
            subtitulo="Elige cómo quieres ver Green Smart"
            className="modal-theme"
            onCerrar={onCerrar}
            pie={<button className="btn btn-primary btn-auto" onClick={onCerrar}>Listo</button>}
        >
            <div className="theme-options" role="radiogroup" aria-label="Modo de color">
                {/* Un botón por cada opción */}
                {OPCIONES.map(({ valor, etiqueta, Icono }) => (
                    <button
                        key={valor}
                        type="button"
                        role="radio"
                        aria-checked={preferencia === valor}
                        // La opción elegida se marca en verde
                        className={`theme-option ${preferencia === valor ? 'active' : ''}`}
                        // Al hacer clic cambia el tema
                        onClick={() => elegirTema(valor)}
                    >
                        {/* Dibujo pequeño de cómo se ve */}
                        <div className={`theme-preview ${valor}`}>
                            <div className="tp-side"><i className="acc" /><i /><i /></div>
                            <div className="tp-main"><i style={{ width: '60%' }} /><i /><i style={{ width: '80%' }} /></div>
                        </div>
                        {/* Nombre de la opción */}
                        <span className="theme-option-label"><Icono size={14} /> {etiqueta}</span>
                    </button>
                ))}
            </div>
            <p className="form-hint" style={{ marginTop: 14 }}>
                “Sistema” usa automáticamente el modo de tu dispositivo. Tu elección se guarda en este navegador.
            </p>
        </VentanaModal>
    );
}
