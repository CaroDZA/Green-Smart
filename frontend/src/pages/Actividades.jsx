// Página Cronograma de actividades (RF-03, RF-04 y RF-07)

import { useState } from 'react';
// useOutletContext: trae la búsqueda. useNavigate: cambiar de página
import { useNavigate, useOutletContext } from 'react-router-dom';
import Calendario from '../components/Calendario';
import { Cargando, ErrorCarga, Vacio } from '../components/Mensajes';
import FormularioActividad from '../components/formularios/FormularioActividad';
import { Opciones } from '../components/formularios/CamposFormulario';
import { IconoCalendario, IconoMas } from '../components/Iconos';
import { ActividadesTabla } from '../components/Tablas';
import { useSesion } from '../context/SesionContexto';
import { useCarga } from '../hooks/useCarga';
import { actividadesService, lotesService } from '../services/greensmart';
import { ESTADOS_ACTIVIDAD, estaVencida, TIPOS_ACTIVIDAD } from '../utils/formatos';

// Formas de ver el cronograma (una a la vez)
const VISTAS = [
    { valor: 'tabla', texto: 'Tabla' },
    { valor: 'calendario', texto: 'Calendario' },
];

export default function Actividades() {
    const { puede, usuario } = useSesion();
    // El operario solo recibe del backend las tareas asignadas a él
    const esOperario = usuario.rol === 'OPERARIO';
    // Texto del buscador
    const { busqueda } = useOutletContext();
    const navigate = useNavigate();
    // Forma de ver: tabla o calendario
    const [vista, setVista] = useState('tabla');
    // true = formulario abierto
    const [creando, setCreando] = useState(false);
    // Filtros elegidos
    const [filtros, setFiltros] = useState({ lote: '', estado: '', tipo: '', desde: '', hasta: '' });

    // Pide al backend las actividades y los lotes
    const { datos, cargando, error, recargar } = useCarga(async () => {
        const [actividades, lotes] = await Promise.all([actividadesService.listar(), lotesService.listar()]);
        return { actividades, lotes };
    });

    // Cambia un filtro
    const cambiar = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value });
    // Quita todos los filtros
    const limpiar = () => setFiltros({ lote: '', estado: '', tipo: '', desde: '', hasta: '' });

    // Actividades que cumplen los filtros y la búsqueda
    const texto = busqueda.trim().toLowerCase();
    const visibles = (datos?.actividades || []).filter((a) => {
        // Fecha programada como "AAAA-MM-DD"
        const dia = a.fechaProgramada.slice(0, 10);
        return (
            (!filtros.lote || a.loteId === Number(filtros.lote)) &&
            // "VENCIDA" no es un estado del backend: se calcula con la fecha
            (!filtros.estado || (filtros.estado === 'VENCIDA' ? estaVencida(a) : a.estado === filtros.estado)) &&
            (!filtros.tipo || a.tipo === filtros.tipo) &&
            (!filtros.desde || dia >= filtros.desde) &&
            (!filtros.hasta || dia <= filtros.hasta) &&
            (!texto || `${a.lote?.nombre} ${TIPOS_ACTIVIDAD[a.tipo]} ${a.descripcion || ''} ${a.novedades || ''} ${a.asignadoA?.nombre || ''}`.toLowerCase().includes(texto))
        );
    });

    return (
        <section>
            {/* Título y botón */}
            <div className="view-head">
                <div>
                    <div className="view-title">Cronograma de actividades</div>
                    <div className="view-sub">
                        {esOperario ? 'Tus tareas asignadas, su ejecución y novedades en campo' : 'Labores programadas, su ejecución y novedades en campo'}
                    </div>
                </div>
                {/* Administrador y coordinador; se desactiva si no hay lotes */}
                {puede.planificar && (
                    <button className="btn btn-primary btn-auto" onClick={() => setCreando(true)} disabled={!datos?.lotes.length}>
                        <IconoMas size={16} /> Programar actividad
                    </button>
                )}
            </div>

            {/* Botones para escoger cómo ver el cronograma */}
            <div className="chip-group" role="group" aria-label="Forma de ver" style={{ marginBottom: 16 }}>
                {VISTAS.map((v) => (
                    <button key={v.valor} className={`chip ${vista === v.valor ? 'active' : ''}`} aria-pressed={vista === v.valor} onClick={() => setVista(v.valor)}>
                        {v.texto}
                    </button>
                ))}
            </div>

            <div className="card">
                {/* Título de la tabla y filtros */}
                <div className="card-head">
                    <div className="card-title">Actividades {datos && `(${visibles.length})`}</div>
                    <div className="filters-bar">
                        {/* Rango de fechas */}
                        <input type="date" className="form-input filter-mini" value={filtros.desde} onChange={cambiar('desde')} title="Desde" aria-label="Desde" />
                        <input type="date" className="form-input filter-mini" value={filtros.hasta} onChange={cambiar('hasta')} title="Hasta" aria-label="Hasta" />
                        {/* Filtro por lote */}
                        <select className="form-input select filter-mini" value={filtros.lote} onChange={cambiar('lote')} aria-label="Lote">
                            <option value="">Todos los lotes</option>
                            {datos?.lotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                        </select>
                        {/* Filtro por tipo */}
                        <select className="form-input select filter-mini" value={filtros.tipo} onChange={cambiar('tipo')} aria-label="Tipo">
                            <Opciones mapa={TIPOS_ACTIVIDAD} vacio="Todos los tipos" />
                        </select>
                        {/* Filtro por estado */}
                        <select className="form-input select filter-mini" value={filtros.estado} onChange={cambiar('estado')} aria-label="Estado">
                            <Opciones mapa={ESTADOS_ACTIVIDAD} vacio="Todos los estados" />
                            <option value="VENCIDA">Vencidas</option>
                        </select>
                        <button type="button" className="btn btn-ghost btn-clear-filters" onClick={limpiar}>Limpiar filtros</button>
                    </div>
                </div>
                {/* Mientras carga */}
                {cargando && !datos && <Cargando />}
                {/* Si falló */}
                {error && <ErrorCarga error={error} onReintentar={recargar} />}
                {/* Tabla o mensaje de vacío (si se escogió "Tabla") */}
                {datos && vista === 'tabla' && (visibles.length ? (
                    <ActividadesTabla actividades={visibles} mostrarLote onCambio={recargar} />
                ) : (
                    <Vacio
                        titulo="No hay actividades"
                        mensaje={esOperario && !datos.actividades.length ? 'Todavía no tienes tareas asignadas.' : 'No se encontraron actividades con estos filtros.'}
                        icono={<IconoCalendario size={22} />}
                    />
                ))}
                {/* Calendario (si se escogió "Calendario"); al hacer clic abre el lote */}
                {datos && vista === 'calendario' && (
                    <Calendario actividades={visibles} onClickActividad={(a) => navigate(`/lotes?lote=${a.loteId}`)} />
                )}
            </div>

            {/* Formulario para programar una actividad */}
            {creando && (
                <FormularioActividad lotes={datos.lotes} onCerrar={() => setCreando(false)} onGuardado={() => { setCreando(false); recargar(); }} />
            )}
        </section>
    );
}
