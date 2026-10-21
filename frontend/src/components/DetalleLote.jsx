// Ventana con toda la información de un lote (se abre al hacer clic en su cuadrito)

import { useMemo, useState } from 'react';
import { useSesion } from '../context/SesionContexto';
import { useAvisos } from '../context/AvisosContexto';
// Para traer los datos del backend
import { useCarga } from '../hooks/useCarga';
import { actividadesService, etapasService, lotesService, monitoreosService, reportesService } from '../services/greensmart';
import {
    claseEstado, ENFERMEDADES, ESTADOS_ACTIVIDAD, ESTADOS_CULTIVO, etapaActual, ETAPAS, etiqueta,
    fmtDia, fmtDinero, fmtFecha, fmtFechaHora, PLAGAS, TIPOS_ACTIVIDAD,
} from '../utils/formatos';
import { Cargando, ErrorCarga, Etiqueta, Vacio } from './Mensajes';
import FormularioActividad from './formularios/FormularioActividad';
import FormularioEtapa from './formularios/FormularioEtapa';
import FormularioLote from './formularios/FormularioLote';
import FormularioMonitoreo from './formularios/FormularioMonitoreo';
import { IconoBorrar, IconoDescargar, IconoEditar, IconoMas } from './Iconos';
import VentanaModal from './VentanaModal';
import { ActividadesTabla, EtapasTabla, MonitoreosTabla } from './Tablas';

// Pestañas de la ventana
const PESTANAS = [
    { id: 'resumen', texto: 'Información' },
    { id: 'etapas', texto: 'Etapas' },
    { id: 'actividades', texto: 'Actividades' },
    { id: 'monitoreos', texto: 'Monitoreos' },
    { id: 'historial', texto: 'Historial' },
];

// Muestra un dato con su título, ej: "ÁREA  3.5 hectáreas"
const Dato = ({ etiqueta: label, children }) => (
    <div className="detail-item">
        <label>{label}</label>
        <span>{children}</span>
    </div>
);

export default function DetalleLote({ loteId, onCerrar, onCambio }) {
    const { puede } = useSesion();
    const { confirmar, toast, toastError } = useAvisos();
    // Pestaña abierta
    const [pestana, setPestana] = useState('resumen');
    // Formulario abierto (lote, etapa, actividad o monitoreo)
    const [formulario, setFormulario] = useState(null);
    // true mientras se descarga el PDF
    const [descargando, setDescargando] = useState(false);

    // Pide al backend todo lo del lote al mismo tiempo
    const { datos, cargando, error, recargar } = useCarga(async () => {
        const [lote, etapas, actividades, monitoreos, historial] = await Promise.all([
            lotesService.ver(loteId),
            etapasService.porLote(loteId),
            actividadesService.porLote(loteId),
            monitoreosService.porLote(loteId),
            reportesService.historial(loteId),
        ]);
        return { lote, etapas, actividades, monitoreos, historial: historial.historial };
    }, [loteId]);

    // Recarga esta ventana y la lista de lotes
    const actualizar = () => {
        recargar();
        onCambio?.();
    };

    // Historial (RF-16): junta actividades y monitoreos ordenados por fecha
    const historial = useMemo(() => {
        if (!datos) return [];
        const eventos = [
            ...datos.historial.actividades.map((a) => ({ tipo: 'actividad', fecha: a.fechaProgramada, dia: true, item: a })),
            ...datos.historial.monitoreos.map((m) => ({ tipo: 'monitoreo', fecha: m.fecha, item: m })),
        ];
        // Del más antiguo al más reciente
        return eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    }, [datos]);

    // Descarga el PDF que genera el backend (RF-18)
    const descargarPDF = async () => {
        setDescargando(true);
        try {
            await reportesService.descargarPDF(loteId, datos?.lote.nombre);
            toast('Reporte generado', 'El PDF con el historial del lote se descargó');
        } catch (e) {
            toastError(e);
        } finally {
            setDescargando(false);
        }
    };

    // Desactiva el lote (el backend no lo borra, solo lo oculta)
    const eliminarLote = async () => {
        // Pregunta antes
        const ok = await confirmar({
            titulo: 'Desactivar lote',
            mensaje: `“${datos.lote.nombre}” dejará de aparecer en la lista. Su historial se conserva.`,
            textoOk: 'Desactivar',
        });
        if (!ok) return;
        try {
            await lotesService.eliminar(loteId);
            toast('Lote desactivado', datos.lote.nombre);
            // Recarga la lista y cierra la ventana
            onCambio?.();
            onCerrar();
        } catch (e) {
            toastError(e);
        }
    };

    // Cierra el formulario abierto
    const cerrarForm = () => setFormulario(null);
    // Cierra el formulario y recarga los datos
    const guardadoForm = () => {
        setFormulario(null);
        actualizar();
    };

    // Datos que se usan en la pantalla
    const lote = datos?.lote;
    // Etapa en la que está el lote hoy
    const etapa = datos && etapaActual(datos.etapas);
    // Último monitoreo (el backend los manda del más nuevo al más viejo)
    const ultimo = datos?.monitoreos[0];
    // Números que salen al lado de cada pestaña
    const conteos = datos && {
        etapas: datos.etapas.length,
        actividades: datos.actividades.length,
        monitoreos: datos.monitoreos.length,
        historial: historial.length,
    };

    // Botón verde "+ algo" que abre un formulario
    const botonAgregar = (texto, form) => (
        <button className="btn btn-primary btn-auto btn-sm" onClick={() => setFormulario(form)}>
            <IconoMas size={14} /> {texto}
        </button>
    );

    return (
        <>
            <VentanaModal
                titulo={lote?.nombre || 'Lote'}
                subtitulo={lote ? `${lote.ubicacion} · ${lote.cultivo}` : 'Cargando…'}
                className="modal-lote"
                onCerrar={onCerrar}
                sinCuerpo
                // Botón PDF junto a la X
                acciones={
                    lote && (
                        <button className="btn btn-ghost btn-auto btn-sm" onClick={descargarPDF} disabled={descargando}>
                            <IconoDescargar size={14} /> {descargando ? 'Generando…' : 'PDF'}
                        </button>
                    )
                }
                pie={<button className="btn btn-ghost" onClick={onCerrar}>Cerrar</button>}
            >
                {/* Botones de las pestañas */}
                <div className="tabs" role="tablist">
                    {PESTANAS.map((p) => (
                        <button
                            key={p.id}
                            role="tab"
                            aria-selected={pestana === p.id}
                            className={`tab ${pestana === p.id ? 'active' : ''}`}
                            onClick={() => setPestana(p.id)}
                        >
                            {p.texto}
                            {/* Cantidad de registros de la pestaña */}
                            {conteos && conteos[p.id] !== undefined && <span className="tab-count">{conteos[p.id]}</span>}
                        </button>
                    ))}
                </div>

                <div className="modal-body">
                    {/* Mientras carga */}
                    {cargando && !datos && <Cargando />}
                    {/* Si falló */}
                    {error && <ErrorCarga error={error} onReintentar={recargar} />}

                    {/* ---------- PESTAÑA INFORMACIÓN ---------- */}
                    {datos && pestana === 'resumen' && (
                        <>
                            {/* Datos del lote */}
                            <div className="detail-section">
                                <div className="section-head">
                                    <div className="detail-section-title">Datos del lote</div>
                                    {/* Editar y desactivar: solo administrador */}
                                    {puede.gestionarLotes && (
                                        <span className="row-actions">
                                            <button className="btn btn-ghost btn-auto btn-sm" onClick={() => setFormulario({ tipo: 'lote' })}>
                                                <IconoEditar /> Editar
                                            </button>
                                            <button className="btn btn-ghost btn-auto btn-sm" onClick={eliminarLote} style={{ color: 'var(--danger)' }}>
                                                <IconoBorrar /> Desactivar
                                            </button>
                                        </span>
                                    )}
                                </div>
                                <div className="detail-grid">
                                    <Dato etiqueta="Nombre">{lote.nombre}</Dato>
                                    <Dato etiqueta="Ubicación">{lote.ubicacion}</Dato>
                                    <Dato etiqueta="Área">{lote.area != null ? `${lote.area} hectáreas` : 'No especificada'}</Dato>
                                    <Dato etiqueta="Cultivo">{lote.cultivo}</Dato>
                                    <Dato etiqueta="Registrado">{fmtFecha(lote.createdAt)}</Dato>
                                    <Dato etiqueta="Última actualización">{fmtFecha(lote.updatedAt)}</Dato>
                                </div>
                                {/* Descripción, si tiene */}
                                {lote.descripcion && (
                                    <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{lote.descripcion}</p>
                                )}
                            </div>

                            {/* Estado según el último monitoreo (RF-05) */}
                            <div className="detail-section">
                                <div className="detail-section-title">Estado actual del cultivo</div>
                                {ultimo ? (
                                    <div className="detail-grid">
                                        <Dato etiqueta="Estado">
                                            <Etiqueta clase={claseEstado(ultimo.estado)} punto>{ESTADOS_CULTIVO[ultimo.estado]}</Etiqueta>
                                        </Dato>
                                        <Dato etiqueta="Último monitoreo">{fmtFechaHora(ultimo.fecha)}</Dato>
                                        <Dato etiqueta="Condición observada">{ultimo.condicionObservada}</Dato>
                                        <Dato etiqueta="Plaga / enfermedad">
                                            {/* Junta plaga y enfermedad; si no hay, "Ninguna" */}
                                            {[ultimo.plaga && etiqueta(PLAGAS, ultimo.plaga), ultimo.enfermedad && etiqueta(ENFERMEDADES, ultimo.enfermedad)].filter(Boolean).join(' · ') || 'Ninguna'}
                                        </Dato>
                                    </div>
                                ) : (
                                    <p className="muted" style={{ fontSize: 13 }}>No hay datos de monitoreo disponibles para este lote.</p>
                                )}
                            </div>

                            {/* Resumen de etapas, actividades y costos */}
                            <div className="detail-section">
                                <div className="detail-section-title">Resumen</div>
                                <div className="detail-grid">
                                    <Dato etiqueta="Etapa actual">{etapa ? `${ETAPAS[etapa.nombre]} (desde ${fmtDia(etapa.fechaInicio)})` : 'Sin planificar'}</Dato>
                                    {/* Cuenta las completadas */}
                                    <Dato etiqueta="Actividades">
                                        {datos.actividades.filter((a) => a.estado === 'COMPLETADA').length} completadas de {datos.actividades.length}
                                    </Dato>
                                    {/* Cuenta las que faltan */}
                                    <Dato etiqueta="Pendientes / en proceso">
                                        {datos.actividades.filter((a) => a.estado === 'PENDIENTE' || a.estado === 'EN_PROCESO').length}
                                    </Dato>
                                    {/* Suma de costos */}
                                    <Dato etiqueta="Costo registrado">{fmtDinero(datos.actividades.reduce((s, a) => s + (a.costo || 0), 0))}</Dato>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ---------- PESTAÑA ETAPAS ---------- */}
                    {datos && pestana === 'etapas' && (
                        <>
                            <div className="section-head">
                                <div className="detail-section-title">Planificación por etapas</div>
                                {puede.planificar && botonAgregar('Planificar etapa', { tipo: 'etapa' })}
                            </div>
                            {datos.etapas.length ? (
                                <EtapasTabla etapas={datos.etapas} compacta onCambio={actualizar} />
                            ) : (
                                <Vacio titulo="Sin etapas planificadas" mensaje="Asigna las etapas del cultivo con sus fechas." />
                            )}
                        </>
                    )}

                    {/* ---------- PESTAÑA ACTIVIDADES ---------- */}
                    {datos && pestana === 'actividades' && (
                        <>
                            <div className="section-head">
                                <div className="detail-section-title">Cronograma de actividades</div>
                                {puede.planificar && botonAgregar('Programar actividad', { tipo: 'actividad' })}
                            </div>
                            {datos.actividades.length ? (
                                <ActividadesTabla actividades={datos.actividades} compacta onCambio={actualizar} />
                            ) : (
                                <Vacio titulo="Sin actividades" mensaje="Todavía no se han programado labores para este lote." />
                            )}
                        </>
                    )}

                    {/* ---------- PESTAÑA MONITOREOS ---------- */}
                    {datos && pestana === 'monitoreos' && (
                        <>
                            <div className="section-head">
                                <div className="detail-section-title">Monitoreos del cultivo</div>
                                {puede.planificar && botonAgregar('Registrar monitoreo', { tipo: 'monitoreo' })}
                            </div>
                            {datos.monitoreos.length ? (
                                <MonitoreosTabla monitoreos={datos.monitoreos} compacta onCambio={actualizar} />
                            ) : (
                                <Vacio titulo="Sin monitoreos" mensaje="No hay datos de monitoreo disponibles." />
                            )}
                        </>
                    )}

                    {/* ---------- PESTAÑA HISTORIAL ---------- */}
                    {datos && pestana === 'historial' && (
                        <>
                            <div className="section-head">
                                <div className="detail-section-title">Historial cronológico</div>
                                <button className="btn btn-ghost btn-auto btn-sm" onClick={descargarPDF} disabled={descargando}>
                                    <IconoDescargar size={14} /> Descargar historial en PDF
                                </button>
                            </div>
                            {historial.length ? (
                                // Línea de tiempo
                                <div className="timeline">
                                    {historial.map(({ tipo, fecha, dia, item }) => (
                                        <div className="timeline-item" key={`${tipo}-${item.id}`}>
                                            {/* Círculo verde (actividad) o azul (monitoreo) */}
                                            <div className={`timeline-dot ${tipo}`} />
                                            <div className="timeline-date">{dia ? fmtDia(fecha) : fmtFechaHora(fecha)}</div>
                                            {/* Si es una actividad */}
                                            {tipo === 'actividad' && (
                                                <>
                                                    <div className="timeline-title">
                                                        {etiqueta(TIPOS_ACTIVIDAD, item.tipo)}
                                                        <Etiqueta clase={claseEstado(item.estado)}>{ESTADOS_ACTIVIDAD[item.estado]}</Etiqueta>
                                                    </div>
                                                    <div className="timeline-body">
                                                        {item.descripcion || 'Sin descripción'}
                                                        {item.novedades && <div>Novedades: {item.novedades}</div>}
                                                        {item.costo != null && <div>Costo: {fmtDinero(item.costo)}</div>}
                                                    </div>
                                                </>
                                            )}
                                            {/* Si es un monitoreo */}
                                            {tipo === 'monitoreo' && (
                                                <>
                                                    <div className="timeline-title">
                                                        Monitoreo
                                                        <Etiqueta clase={claseEstado(item.estado)} punto>{ESTADOS_CULTIVO[item.estado]}</Etiqueta>
                                                    </div>
                                                    <div className="timeline-body">
                                                        {item.condicionObservada}
                                                        {item.plaga && <div>Plaga: {etiqueta(PLAGAS, item.plaga)}</div>}
                                                        {item.enfermedad && <div>Enfermedad: {etiqueta(ENFERMEDADES, item.enfermedad)}</div>}
                                                        {item.observaciones && <div>{item.observaciones}</div>}
                                                        {item.usuario && <div className="muted">Registró: {item.usuario.nombre}</div>}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Vacio titulo="Sin historial" mensaje="Aún no hay actividades ni monitoreos registrados para este lote." />
                            )}
                        </>
                    )}
                </div>
            </VentanaModal>

            {/* Formularios que se abren desde esta ventana */}
            {formulario?.tipo === 'lote' && <FormularioLote lote={lote} onCerrar={cerrarForm} onGuardado={guardadoForm} />}
            {formulario?.tipo === 'etapa' && <FormularioEtapa loteId={loteId} onCerrar={cerrarForm} onGuardado={guardadoForm} />}
            {formulario?.tipo === 'actividad' && <FormularioActividad loteId={loteId} onCerrar={cerrarForm} onGuardado={guardadoForm} />}
            {formulario?.tipo === 'monitoreo' && <FormularioMonitoreo loteId={loteId} onCerrar={cerrarForm} onGuardado={guardadoForm} />}
        </>
    );
}
