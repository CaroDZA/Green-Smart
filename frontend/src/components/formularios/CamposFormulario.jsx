// Piezas que se repiten en todos los formularios

// Título + campo + texto de ayuda
export function Campo({ etiqueta, requerido, pista, children }) {
    return (
        <div className="form-group">
            <label className="form-label">
                {etiqueta}
                {/* Asterisco rojo si es obligatorio */}
                {requerido && <span className="req">*</span>}
            </label>
            {/* El campo (caja de texto, lista, etc.) */}
            {children}
            {/* Texto de ayuda opcional */}
            {pista && <div className="form-hint">{pista}</div>}
        </div>
    );
}

// Crea las opciones de una lista, ej: <Opciones mapa={ETAPAS} />
export function Opciones({ mapa, vacio }) {
    return (
        <>
            {/* Primera opción vacía, ej: "Ninguna" */}
            {vacio !== undefined && <option value="">{vacio}</option>}
            {/* Una opción por cada valor */}
            {Object.entries(mapa).map(([valor, texto]) => (
                <option key={valor} value={valor}>{texto}</option>
            ))}
        </>
    );
}

// Lista para escoger un lote
export function SelectLote({ lotes, value, onChange, disabled }) {
    return (
        <select className="form-input select" value={value} onChange={onChange} disabled={disabled} required>
            <option value="">Selecciona un lote…</option>
            {lotes.map((l) => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
            ))}
        </select>
    );
}

// Recuadro rojo con el error (solo si hay mensaje)
export function ErrorForm({ mensaje }) {
    return mensaje ? <div className="form-error">{mensaje}</div> : null;
}

// Botones Cancelar y Guardar
export function PieForm({ onCerrar, guardando, texto, formId }) {
    return (
        <>
            <button type="button" className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
            {/* form={formId} conecta este botón con su formulario */}
            <button type="submit" form={formId} className="btn btn-primary btn-auto" disabled={guardando}>
                {guardando ? 'Guardando…' : texto}
            </button>
        </>
    );
}
