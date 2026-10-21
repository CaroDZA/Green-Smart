// Ventana que aparece encima de la pantalla (formularios, detalles, etc.)

import { useEffect, useRef } from 'react';

// Lista de ventanas abiertas, en orden
const ventanasAbiertas = [];

export default function VentanaModal({ titulo, subtitulo, onCerrar, children, pie, className = '', acciones, sinCuerpo = false }) {
    // Guarda la función que cierra esta ventana
    const cerrarRef = useRef(onCerrar);

    // Mantiene actualizada la función de cerrar
    useEffect(() => {
        cerrarRef.current = onCerrar;
    });

    // Al abrir la ventana: permite cerrarla con la tecla Escape
    useEffect(() => {
        // Nombre único para esta ventana
        const id = Symbol('ventana');
        // La agregamos a la lista de abiertas
        ventanasAbiertas.push(id);

        // Si presionan Escape, se cierra solo la última ventana abierta
        const alPresionarTecla = (e) => {
            const esLaUltima = ventanasAbiertas[ventanasAbiertas.length - 1] === id;
            if (e.key === 'Escape' && esLaUltima) cerrarRef.current();
        };
        document.addEventListener('keydown', alPresionarTecla);

        // Al cerrar la ventana: la quitamos de la lista y dejamos de escuchar el teclado
        return () => {
            ventanasAbiertas.splice(ventanasAbiertas.indexOf(id), 1);
            document.removeEventListener('keydown', alPresionarTecla);
        };
    }, []);

    return (
        // Fondo oscuro: si le dan clic, se cierra la ventana
        <div className="modal-backdrop open" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
            {/* Caja blanca de la ventana */}
            <div className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={titulo}>
                {/* Parte de arriba: título y botón X */}
                <div className="modal-head">
                    <div>
                        <div className="modal-title">{titulo}</div>
                        {/* El subtítulo solo se muestra si existe */}
                        {subtitulo && <div className="modal-sub">{subtitulo}</div>}
                    </div>
                    <div className="modal-head-actions">
                        {/* Botones extra, por ejemplo "PDF" */}
                        {acciones}
                        {/* Botón X para cerrar */}
                        <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">×</button>
                    </div>
                </div>
                {/* Contenido de la ventana */}
                {sinCuerpo ? children : <div className="modal-body">{children}</div>}
                {/* Parte de abajo: botones Cancelar / Guardar */}
                {pie && <div className="modal-foot">{pie}</div>}
            </div>
        </div>
    );
}
