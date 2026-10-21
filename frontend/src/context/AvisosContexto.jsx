// Muestra mensajes ("Lote registrado") y la ventana "¿Estás seguro?"

import { createContext, useCallback, useContext, useRef, useState } from 'react';

// Espacio compartido para los avisos
const AvisosContexto = createContext(null);

export function ProveedorAvisos({ children }) {
    // Mensajes que se ven en la esquina
    const [toasts, setToasts] = useState([]);
    // Pregunta de confirmación abierta (o null)
    const [confirmacion, setConfirmacion] = useState(null);
    // Contador para numerar los mensajes
    const idRef = useRef(0);

    // Muestra un mensaje: 'success' (verde), 'error' (rojo) o 'warn' (amarillo)
    const toast = useCallback((title, msg = '', type = 'success') => {
        const id = ++idRef.current;
        // Agrega el mensaje
        setToasts((t) => [...t, { id, title, msg, type }]);
        // Lo quita a los 3,5 segundos
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    }, []);

    // Muestra el error que mandó el backend
    const toastError = useCallback((error) => toast('Algo salió mal', error.message, 'error'), [toast]);

    // Abre "¿Estás seguro?" y espera la respuesta (sí = true, no = false)
    const confirmar = useCallback(
        ({ titulo = '¿Estás seguro?', mensaje = '', textoOk = 'Confirmar', peligro = true }) =>
            new Promise((resolve) => {
                setConfirmacion({ titulo, mensaje, textoOk, peligro, resolve });
            }),
        [],
    );

    // Entrega la respuesta y cierra la pregunta
    const responder = (valor) => {
        confirmacion?.resolve(valor);
        setConfirmacion(null);
    };

    return (
        <AvisosContexto.Provider value={{ toast, toastError, confirmar }}>
            {children}

            {/* Mensajes de la esquina superior derecha */}
            <div className="toast-wrap" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast ${t.type}`}>
                        {/* Ícono según el tipo de mensaje */}
                        <div className="toast-icon">{t.type === 'error' ? '!' : t.type === 'warn' ? '⚠' : '✓'}</div>
                        <div className="toast-content">
                            <div className="toast-title">{t.title}</div>
                            {t.msg && <div className="toast-msg">{t.msg}</div>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Ventana "¿Estás seguro?" */}
            {confirmacion && (
                // Clic en el fondo = Cancelar
                <div className="confirm-backdrop open" onClick={() => responder(false)}>
                    {/* Clic dentro de la caja no la cierra */}
                    <div className="confirm-card" role="alertdialog" onClick={(e) => e.stopPropagation()}>
                        {/* Ícono rojo si es para eliminar, verde si no */}
                        <div
                            className="confirm-icon"
                            style={confirmacion.peligro ? undefined : { background: 'var(--green-100)', color: 'var(--green-700)' }}
                        >
                            {confirmacion.peligro ? '!' : '?'}
                        </div>
                        <div className="confirm-title">{confirmacion.titulo}</div>
                        <div className="confirm-msg">{confirmacion.mensaje}</div>
                        <div className="confirm-actions">
                            <button className="btn btn-ghost" onClick={() => responder(false)}>Cancelar</button>
                            {/* Botón rojo para eliminar, verde para lo demás */}
                            <button
                                className={`btn ${confirmacion.peligro ? 'btn-danger' : 'btn-primary'}`}
                                onClick={() => responder(true)}
                                autoFocus
                            >
                                {confirmacion.textoOk}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AvisosContexto.Provider>
    );
}

// Para usar los avisos en cualquier pantalla
export const useAvisos = () => useContext(AvisosContexto);
