import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Cargando, ErrorCarga, Vacio } from '../components/Mensajes';
import FormularioActividad from '../components/formularios/FormularioActividad';
import { Opciones } from '../components/formularios/CamposFormulario';
import { IconoCalendario, IconoMas } from '../components/Iconos';
import { ActividadesTabla } from '../components/Tablas';
import { useSesion } from '../context/SesionContexto';
import { useCarga } from '../hooks/useCarga';
import { actividadesService, lotesService } from '../services/greensmart';
import { ESTADOS_ACTIVIDAD, TIPOS_ACTIVIDAD } from '../utils/formatos';

// RF-03 / RF-04 / RF-07: cronograma, modificación y registro de actividades
export default function Actividades() {
    const { puede } = useSesion();
    const { busqueda } = useOutletContext();
    const [creando, setCreando] = useState(false);
    const [filtros, setFiltros] = useState({ lote: '', estado: '', tipo: '', desde: '', hasta: '' });

    const { datos, cargando, error, recargar } = useCarga(async () => {
        const [actividades, lotes] = await Promise.all([actividadesService.listar(), lotesService.listar()]);
        return { actividades, lotes };
    });

    const cambiar = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value });
    const limpiar = () => setFiltros({ lote: '', estado: '', tipo: '', desde: '', hasta: '' });

    const texto = busqueda.trim().toLowerCase();
    const visibles = (datos?.actividades || []).filter((a) => {
        const dia = a.fechaProgramada.slice(0, 10);
        return (
            (!filtros.lote || a.loteId === Number(filtros.lote)) &&
            (!filtros.estado || a.estado === filtros.estado) &&
            (!filtros.tipo || a.tipo === filtros.tipo) &&
            (!filtros.desde || dia >= filtros.desde) &&
            (!filtros.hasta || dia <= filtros.hasta) &&
            (!texto || `${a.lote?.nombre} ${TIPOS_ACTIVIDAD[a.tipo]} ${a.descripcion || ''} ${a.novedades || ''}`.toLowerCase().includes(texto))
        );
    });

    return (
        <section>
            <div className="view-head">
                <div>
                    <div className="view-title">Cronograma de actividades</div>
                    <div className="view-sub">Labores programadas, su ejecución y novedades en campo</div>
                </div>
                {puede.planificar && (
                    <button className="btn btn-primary btn-auto" onClick={() => setCreando(true)} disabled={!datos?.lotes.length}>
                        <IconoMas size={16} /> Programar actividad
                    </button>
                )}
            </div>

            <div className="card">
                <div className="card-head">
                    <div className="card-title">Actividades {datos && `(${visibles.length})`}</div>
                    <div className="filters-bar">
                        <input type="date" className="form-input filter-mini" value={filtros.desde} onChange={cambiar('desde')} title="Desde" aria-label="Desde" />
                        <input type="date" className="form-input filter-mini" value={filtros.hasta} onChange={cambiar('hasta')} title="Hasta" aria-label="Hasta" />
                        <select className="form-input select filter-mini" value={filtros.lote} onChange={cambiar('lote')} aria-label="Lote">
                            <option value="">Todos los lotes</option>
                            {datos?.lotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                        </select>
                        <select className="form-input select filter-mini" value={filtros.tipo} onChange={cambiar('tipo')} aria-label="Tipo">
                            <Opciones mapa={TIPOS_ACTIVIDAD} vacio="Todos los tipos" />
                        </select>
                        <select className="form-input select filter-mini" value={filtros.estado} onChange={cambiar('estado')} aria-label="Estado">
                            <Opciones mapa={ESTADOS_ACTIVIDAD} vacio="Todos los estados" />
                        </select>
                        <button type="button" className="btn btn-ghost btn-clear-filters" onClick={limpiar}>Limpiar filtros</button>
                    </div>
                </div>
                {cargando && !datos && <Cargando />}
                {error && <ErrorCarga error={error} onReintentar={recargar} />}
                {datos && (visibles.length ? (
                    <ActividadesTabla actividades={visibles} mostrarLote onCambio={recargar} />
                ) : (
                    <Vacio titulo="No hay actividades" mensaje="No se encontraron actividades con estos filtros." icono={<IconoCalendario size={22} />} />
                ))}
            </div>

            {creando && (
                <FormularioActividad lotes={datos.lotes} onCerrar={() => setCreando(false)} onGuardado={() => { setCreando(false); recargar(); }} />
            )}
        </section>
    );
}
