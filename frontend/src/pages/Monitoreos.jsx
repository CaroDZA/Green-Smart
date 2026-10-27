// Página Monitoreo del cultivo (RF-06, RF-08 y RF-09)

import { useState } from 'react';
// Trae el texto del buscador de arriba
import { useOutletContext } from 'react-router-dom';
import { Cargando, ErrorCarga, Vacio } from '../components/Mensajes';
import { Opciones } from '../components/formularios/CamposFormulario';
import FormularioMonitoreo from '../components/formularios/FormularioMonitoreo';
import { IconoMas, IconoMonitoreo } from '../components/Iconos';
import { MonitoreosTabla } from '../components/Tablas';
import { useSesion } from '../context/SesionContexto';
import { useCarga } from '../hooks/useCarga';
import { lotesService, monitoreosService } from '../services/greensmart';
import { ESTADOS_CULTIVO } from '../utils/formatos';

export default function Monitoreos() {
    const { puede } = useSesion();
    // Texto del buscador
    const { busqueda } = useOutletContext();
    // true = formulario abierto
    const [creando, setCreando] = useState(false);
    // Filtros elegidos
    const [filtroLote, setFiltroLote] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // Pide al backend los monitoreos y los lotes
    const { datos, cargando, error, recargar } = useCarga(async () => {
        const [monitoreos, lotes] = await Promise.all([monitoreosService.listar(), lotesService.listar()]);
        return { monitoreos, lotes };
    });

    // Monitoreos que cumplen los filtros y la búsqueda
    const texto = busqueda.trim().toLowerCase();
    const visibles = (datos?.monitoreos || []).filter((m) =>
        (!filtroLote || m.loteId === Number(filtroLote)) &&
        (!filtroEstado || m.estado === filtroEstado) &&
        (!texto || `${m.lote?.nombre} ${m.condicionObservada} ${m.observaciones || ''} ${m.usuario?.nombre || ''}`.toLowerCase().includes(texto)),
    );

    return (
        <section>
            {/* Título y botón */}
            <div className="view-head">
                <div>
                    <div className="view-title">Monitoreo del cultivo</div>
                    <div className="view-sub">Estado visible de las plantas, plagas y enfermedades detectadas</div>
                </div>
                {/* Administrador y coordinador; se desactiva si no hay lotes */}
                {puede.planificar && (
                    <button className="btn btn-primary btn-auto" onClick={() => setCreando(true)} disabled={!datos?.lotes.length}>
                        <IconoMas size={16} /> Registrar monitoreo
                    </button>
                )}
            </div>

            <div className="card">
                {/* Título de la tabla y filtros */}
                <div className="card-head">
                    <div className="card-title">Monitoreos {datos && `(${visibles.length})`}</div>
                    <div className="filters-bar">
                        {/* Filtro por lote */}
                        <select className="form-input select filter-mini" value={filtroLote} onChange={(e) => setFiltroLote(e.target.value)} aria-label="Lote">
                            <option value="">Todos los lotes</option>
                            {datos?.lotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                        </select>
                        {/* Filtro por estado */}
                        <select className="form-input select filter-mini" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} aria-label="Estado">
                            <Opciones mapa={ESTADOS_CULTIVO} vacio="Todos los estados" />
                        </select>
                    </div>
                </div>
                {/* Mientras carga */}
                {cargando && !datos && <Cargando />}
                {/* Si falló */}
                {error && <ErrorCarga error={error} onReintentar={recargar} />}
                {/* Tabla o mensaje de vacío */}
                {datos && (visibles.length ? (
                    <MonitoreosTabla monitoreos={visibles} mostrarLote onCambio={recargar} />
                ) : (
                    <Vacio titulo="No hay datos de monitoreo disponibles" mensaje="Registra un monitoreo para ver el estado del cultivo." icono={<IconoMonitoreo size={22} />} />
                ))}
            </div>

            {/* Formulario para registrar un monitoreo */}
            {creando && (
                <FormularioMonitoreo lotes={datos.lotes} onCerrar={() => setCreando(false)} onGuardado={() => { setCreando(false); recargar(); }} />
            )}
        </section>
    );
}
