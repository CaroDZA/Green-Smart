import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Cargando, ErrorCarga, Vacio } from '../components/Mensajes';
import FormularioEtapa from '../components/formularios/FormularioEtapa';
import { Opciones } from '../components/formularios/CamposFormulario';
import { IconoEtapas, IconoMas } from '../components/Iconos';
import { EtapasTabla } from '../components/Tablas';
import { useSesion } from '../context/SesionContexto';
import { useCarga } from '../hooks/useCarga';
import { etapasService, lotesService } from '../services/greensmart';
import { ETAPAS } from '../utils/formatos';

// RF-02: planificación por etapas de todos los lotes
export default function Etapas() {
    const { puede } = useSesion();
    const { busqueda } = useOutletContext();
    const [creando, setCreando] = useState(false);
    const [filtroLote, setFiltroLote] = useState('');
    const [filtroEtapa, setFiltroEtapa] = useState('');

    const { datos, cargando, error, recargar } = useCarga(async () => {
        const [etapas, lotes] = await Promise.all([etapasService.listar(), lotesService.listar()]);
        return { etapas, lotes };
    });

    const texto = busqueda.trim().toLowerCase();
    const visibles = (datos?.etapas || []).filter((e) =>
        (!filtroLote || e.loteId === Number(filtroLote)) &&
        (!filtroEtapa || e.nombre === filtroEtapa) &&
        (!texto || `${e.lote?.nombre} ${ETAPAS[e.nombre]} ${e.descripcion || ''}`.toLowerCase().includes(texto)),
    );

    return (
        <section>
            <div className="view-head">
                <div>
                    <div className="view-title">Planificación por etapas</div>
                    <div className="view-sub">Etapas del cultivo asignadas a cada lote con sus fechas</div>
                </div>
                {puede.planificar && (
                    <button className="btn btn-primary btn-auto" onClick={() => setCreando(true)} disabled={!datos?.lotes.length}>
                        <IconoMas size={16} /> Planificar etapa
                    </button>
                )}
            </div>

            <div className="card">
                <div className="card-head">
                    <div className="card-title">Etapas {datos && `(${visibles.length})`}</div>
                    <div className="filters-bar">
                        <select className="form-input select filter-mini" value={filtroLote} onChange={(e) => setFiltroLote(e.target.value)} aria-label="Filtrar por lote">
                            <option value="">Todos los lotes</option>
                            {datos?.lotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                        </select>
                        <select className="form-input select filter-mini" value={filtroEtapa} onChange={(e) => setFiltroEtapa(e.target.value)} aria-label="Filtrar por etapa">
                            <Opciones mapa={ETAPAS} vacio="Todas las etapas" />
                        </select>
                    </div>
                </div>
                {cargando && !datos && <Cargando />}
                {error && <ErrorCarga error={error} onReintentar={recargar} />}
                {datos && (visibles.length ? (
                    <EtapasTabla etapas={visibles} mostrarLote onCambio={recargar} />
                ) : (
                    <Vacio titulo="No hay etapas" mensaje="No se encontraron etapas con estos filtros." icono={<IconoEtapas size={22} />} />
                ))}
            </div>

            {creando && (
                <FormularioEtapa lotes={datos.lotes} onCerrar={() => setCreando(false)} onGuardado={() => { setCreando(false); recargar(); }} />
            )}
        </section>
    );
}
