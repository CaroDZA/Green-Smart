// Mensajes que se repiten en varias pantallas

import { IconoHoja } from './Iconos';

// Rueda que gira mientras cargan los datos
export function Cargando({ texto = 'Cargando…' }) {
    return (
        <div className="loading-box">
            <div className="spinner" />
            {texto}
        </div>
    );
}

// Mensaje cuando no hay datos
export function Vacio({ titulo = 'No hay datos disponibles', mensaje, icono, children }) {
    return (
        <div className="empty-state">
            {/* Ícono (por defecto una hoja) */}
            <div className="empty-icon">{icono || <IconoHoja size={22} />}</div>
            <div className="empty-title">{titulo}</div>
            {/* Texto opcional */}
            {mensaje && <div className="empty-msg">{mensaje}</div>}
            {/* Botón opcional */}
            {children && <div style={{ marginTop: 14 }}>{children}</div>}
        </div>
    );
}

// Mensaje cuando el backend falla, con botón para reintentar
export function ErrorCarga({ error, onReintentar }) {
    return (
        <Vacio titulo="No se pudo cargar la información" mensaje={error?.message}>
            {onReintentar && (
                <button className="btn btn-ghost btn-auto btn-sm" onClick={onReintentar}>Reintentar</button>
            )}
        </Vacio>
    );
}

// Etiqueta de color para estados (Bueno, Pendiente, Crítico...)
export function Etiqueta({ clase, children, punto = false }) {
    // "clase" da el color; "punto" agrega un puntico antes del texto
    return <span className={`pill ${clase} ${punto ? 'pill-dot' : ''}`}>{children}</span>;
}
