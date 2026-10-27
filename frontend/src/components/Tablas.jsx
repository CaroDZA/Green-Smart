// Tablas de etapas, actividades y monitoreos (se usan en las páginas y en el detalle del lote)

import { useState } from 'react';
// Para saber qué puede hacer el usuario
import { useSesion } from '../context/SesionContexto';
// Para preguntar "¿Estás seguro?" y mostrar mensajes
import { useAvisos } from '../context/AvisosContexto';
// Llamadas al backend para eliminar
import { actividadesService, etapasService, monitoreosService } from '../services/greensmart';
import {
    claseEstado, ENFERMEDADES, ESTADOS_ACTIVIDAD, ESTADOS_CULTIVO, estaVencida, ETAPAS, etiqueta,
    fmtDia, fmtDinero, fmtFecha, fmtFechaHora, PLAGAS, TIPOS_ACTIVIDAD,
} from '../utils/formatos';
import { Etiqueta } from './Mensajes';
import FormularioActividad from './formularios/FormularioActividad';
import FormularioCompletar from './formularios/FormularioCompletar';
import FormularioEtapa from './formularios/FormularioEtapa';
import FormularioMonitoreo from './formularios/FormularioMonitoreo';
import { IconoBorrar, IconoCheck, IconoEditar } from './Iconos';

// Tabla normal (páginas) o pequeña (dentro del detalle del lote)
function Tabla({ compacta, ancha, children }) {
    return compacta ? (
        <div className="detail-table-wrap"><table className="detail-table">{children}</table></div>
    ) : (
        // "ancha" = tabla con muchas columnas, se le quita espacio
        <div className="table-wrap"><table className={`tbl ${ancha ? 'tbl-ancha' : ''}`}>{children}</table></div>
    );
}

// Botón pequeño con ícono (editar, eliminar, completar)
function BotonAccion({ tipo, titulo, onClick, children }) {
    return (
        <button className={`action-btn ${tipo}`} title={titulo} aria-label={titulo} onClick={onClick}>
            {children}
        </button>
    );
}

// Elimina algo después de preguntar "¿Estás seguro?"
function useEliminar(onCambio) {
    const { confirmar, toast, toastError } = useAvisos();
    return async ({ titulo, mensaje, accion, exito }) => {
        // Pregunta antes de eliminar
        const ok = await confirmar({ titulo, mensaje, textoOk: 'Eliminar' });
        // Si dijo que no, no hace nada
        if (!ok) return;
        try {
            // Llama al backend para eliminar
            await accion();
            toast(exito);
            // Avisa para recargar la lista
            onCambio();
        } catch (e) {
            toastError(e);
        }
    };
}

// ---------- TABLA DE ETAPAS ----------
// mostrarLote: agrega la columna "Lote". onCambio: recarga después de editar o eliminar
export function EtapasTabla({ etapas, mostrarLote, compacta, onCambio }) {
    const { puede } = useSesion();
    // Etapa que se está editando (o null)
    const [editando, setEditando] = useState(null);
    const eliminar = useEliminar(onCambio);

    return (
        <>
            <Tabla compacta={compacta}>
                <thead>
                    <tr>
                        {mostrarLote && <th>Lote</th>}
                        <th>Etapa</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th>Descripción</th>
                        {/* Columna de botones solo si puede editar */}
                        {puede.planificar && <th />}
                    </tr>
                </thead>
                <tbody>
                    {/* Una fila por cada etapa */}
                    {etapas.map((e) => (
                        <tr key={e.id}>
                            {mostrarLote && <td><b>{e.lote?.nombre}</b></td>}
                            <td><Etiqueta clase="etapa">{etiqueta(ETAPAS, e.nombre)}</Etiqueta></td>
                            <td className="nowrap">{fmtDia(e.fechaInicio)}</td>
                            {/* Sin fecha de fin = en curso */}
                            <td className="nowrap">{e.fechaFin ? fmtDia(e.fechaFin) : <span className="muted">En curso</span>}</td>
                            <td className="cell-wrap">{e.descripcion || <span className="muted">—</span>}</td>
                            {puede.planificar && (
                                <td className="cell-actions">
                                    <span className="row-actions">
                                        {/* Editar */}
                                        <BotonAccion tipo="edit-btn" titulo="Editar etapa" onClick={() => setEditando(e)}><IconoEditar /></BotonAccion>
                                        {/* Eliminar (solo administrador) */}
                                        {puede.eliminar && (
                                            <BotonAccion
                                                tipo="delete-btn"
                                                titulo="Eliminar etapa"
                                                onClick={() => eliminar({
                                                    titulo: 'Eliminar etapa',
                                                    mensaje: `Se eliminará la etapa ${etiqueta(ETAPAS, e.nombre)}.`,
                                                    accion: () => etapasService.eliminar(e.id),
                                                    exito: 'Etapa eliminada',
                                                })}
                                            >
                                                <IconoBorrar />
                                            </BotonAccion>
                                        )}
                                    </span>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </Tabla>
            {/* Formulario de edición */}
            {editando && (
                <FormularioEtapa etapa={editando} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); onCambio(); }} />
            )}
        </>
    );
}

// ---------- TABLA DE ACTIVIDADES ----------
export function ActividadesTabla({ actividades, mostrarLote, compacta, onCambio }) {
    const { puede } = useSesion();
    // Actividad que se está editando
    const [editando, setEditando] = useState(null);
    // Actividad que se está marcando como hecha
    const [completando, setCompletando] = useState(null);
    const eliminar = useEliminar(onCambio);

    return (
        <>
            <Tabla compacta={compacta} ancha={mostrarLote}>
                <thead>
                    <tr>
                        {mostrarLote && <th>Lote</th>}
                        <th>Actividad</th>
                        {/* "Asignado a" solo en la lista general (ahí el backend manda el nombre) */}
                        {mostrarLote && <th>Asignado a</th>}
                        <th>Programada</th>
                        <th>Estado</th>
                        <th>Ejecutada</th>
                        <th>Costo</th>
                        <th>Detalle / novedades</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {/* Una fila por cada actividad */}
                    {actividades.map((a) => {
                        // Todavía se puede completar si está pendiente o en proceso
                        const abierta = a.estado === 'PENDIENTE' || a.estado === 'EN_PROCESO';
                        return (
                            <tr key={a.id}>
                                {mostrarLote && <td className="nowrap"><b>{a.lote?.nombre}</b></td>}
                                <td><b>{etiqueta(TIPOS_ACTIVIDAD, a.tipo)}</b></td>
                                {mostrarLote && <td className="nowrap">{a.asignadoA?.nombre || <span className="muted">Sin asignar</span>}</td>}
                                <td className="nowrap">{fmtDia(a.fechaProgramada)}</td>
                                <td className="nowrap">
                                    <Etiqueta clase={claseEstado(a.estado)}>{etiqueta(ESTADOS_ACTIVIDAD, a.estado)}</Etiqueta>
                                    {/* Etiqueta roja si ya pasó su fecha y no se ha hecho */}
                                    {estaVencida(a) && <> <Etiqueta clase="critico">Vencida</Etiqueta></>}
                                </td>
                                <td className="nowrap" title={a.fechaEjecucion ? fmtFechaHora(a.fechaEjecucion) : undefined}>{a.fechaEjecucion ? fmtFecha(a.fechaEjecucion) : <span className="muted">—</span>}</td>
                                <td className="nowrap">{a.costo != null ? fmtDinero(a.costo) : <span className="muted">—</span>}</td>
                                <td className="cell-wrap">
                                    {a.descripcion || <span className="muted">Sin descripción</span>}
                                    {a.novedades && <div className="txn-meta">Novedades: {a.novedades}</div>}
                                </td>
                                <td className="cell-actions">
                                    <span className="row-actions">
                                        {/* Marcar como hecha (todos los roles) */}
                                        {abierta && (
                                            <BotonAccion tipo="download-btn" titulo="Registrar como realizada" onClick={() => setCompletando(a)}><IconoCheck size={14} /></BotonAccion>
                                        )}
                                        {/* Editar (administrador y coordinador; las completadas ya no se editan) */}
                                        {puede.planificar && a.estado !== 'COMPLETADA' && (
                                            <BotonAccion tipo="edit-btn" titulo="Editar actividad" onClick={() => setEditando(a)}><IconoEditar /></BotonAccion>
                                        )}
                                        {/* Eliminar (solo administrador) */}
                                        {puede.eliminar && (
                                            <BotonAccion
                                                tipo="delete-btn"
                                                titulo="Eliminar actividad"
                                                onClick={() => eliminar({
                                                    titulo: 'Eliminar actividad',
                                                    mensaje: `Se eliminará la actividad de ${etiqueta(TIPOS_ACTIVIDAD, a.tipo)} del ${fmtDia(a.fechaProgramada)}.`,
                                                    accion: () => actividadesService.eliminar(a.id),
                                                    exito: 'Actividad eliminada',
                                                })}
                                            >
                                                <IconoBorrar />
                                            </BotonAccion>
                                        )}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Tabla>
            {/* Formulario de edición */}
            {editando && (
                <FormularioActividad actividad={editando} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); onCambio(); }} />
            )}
            {/* Formulario para marcar como hecha */}
            {completando && (
                <FormularioCompletar actividad={completando} onCerrar={() => setCompletando(null)} onGuardado={() => { setCompletando(null); onCambio(); }} />
            )}
        </>
    );
}

// ---------- TABLA DE MONITOREOS ----------
export function MonitoreosTabla({ monitoreos, mostrarLote, compacta, onCambio }) {
    const { puede } = useSesion();
    // Monitoreo que se está editando
    const [editando, setEditando] = useState(null);
    const eliminar = useEliminar(onCambio);

    return (
        <>
            <Tabla compacta={compacta}>
                <thead>
                    <tr>
                        {mostrarLote && <th>Lote</th>}
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Condición observada</th>
                        <th>Plaga / enfermedad</th>
                        <th>Registró</th>
                        {puede.planificar && <th />}
                    </tr>
                </thead>
                <tbody>
                    {/* Una fila por cada monitoreo */}
                    {monitoreos.map((m) => (
                        <tr key={m.id}>
                            {mostrarLote && <td><b>{m.lote?.nombre}</b></td>}
                            <td className="nowrap">{fmtFechaHora(m.fecha)}</td>
                            <td><Etiqueta clase={claseEstado(m.estado)} punto>{etiqueta(ESTADOS_CULTIVO, m.estado)}</Etiqueta></td>
                            <td className="cell-wrap">
                                {m.condicionObservada}
                                {m.observaciones && <div className="txn-meta">{m.observaciones}</div>}
                            </td>
                            <td className="cell-wrap">
                                {/* Si no hay plaga ni enfermedad */}
                                {!m.plaga && !m.enfermedad && <span className="muted">Ninguna</span>}
                                {m.plaga && <div>Plaga: {etiqueta(PLAGAS, m.plaga)}</div>}
                                {m.enfermedad && <div>Enfermedad: {etiqueta(ENFERMEDADES, m.enfermedad)}</div>}
                            </td>
                            {/* Quién hizo el monitoreo */}
                            <td>{m.usuario?.nombre || '—'}</td>
                            {puede.planificar && (
                                <td className="cell-actions">
                                    <span className="row-actions">
                                        {/* Editar */}
                                        <BotonAccion tipo="edit-btn" titulo="Editar monitoreo" onClick={() => setEditando(m)}><IconoEditar /></BotonAccion>
                                        {/* Eliminar (solo administrador) */}
                                        {puede.eliminar && (
                                            <BotonAccion
                                                tipo="delete-btn"
                                                titulo="Eliminar monitoreo"
                                                onClick={() => eliminar({
                                                    titulo: 'Eliminar monitoreo',
                                                    mensaje: `Se eliminará el monitoreo del ${fmtFechaHora(m.fecha)}.`,
                                                    accion: () => monitoreosService.eliminar(m.id),
                                                    exito: 'Monitoreo eliminado',
                                                })}
                                            >
                                                <IconoBorrar />
                                            </BotonAccion>
                                        )}
                                    </span>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </Tabla>
            {/* Formulario de edición */}
            {editando && (
                <FormularioMonitoreo monitoreo={editando} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); onCambio(); }} />
            )}
        </>
    );
}
