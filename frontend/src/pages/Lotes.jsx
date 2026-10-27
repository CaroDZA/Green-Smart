// Página Lotes: registrar y ver los lotes de la finca como cuadritos (RF-01)

import { useMemo, useState } from 'react';
// useOutletContext: trae la búsqueda. useSearchParams: lee "?lote=1" de la dirección
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Cargando, ErrorCarga, Vacio } from '../components/Mensajes';
import FormularioLote from '../components/formularios/FormularioLote';
import { IconoLote, IconoMas } from '../components/Iconos';
import TarjetaLote from '../components/TarjetaLote';
import TarjetaLoteInactivo from '../components/TarjetaLoteInactivo';
import DetalleLote from '../components/DetalleLote';
import { useSesion } from '../context/SesionContexto';
import { useCarga } from '../hooks/useCarga';
import { actividadesService, etapasService, lotesService, monitoreosService } from '../services/greensmart';
import { etapaActual } from '../utils/formatos';

// Botones para filtrar por estado
const FILTROS = [
    { valor: '', texto: 'Todos' },
    { valor: 'BUENO', texto: 'Bueno' },
    { valor: 'REGULAR', texto: 'Regular' },
    { valor: 'CRITICO', texto: 'Crítico' },
    { valor: 'SIN', texto: 'Sin monitoreo' },
];

export default function Lotes() {
    const { puede } = useSesion();
    // Texto del buscador de arriba
    const { busqueda } = useOutletContext();
    // Parámetros de la dirección (ej: /lotes?lote=3)
    const [params, setParams] = useSearchParams();
    // true = formulario de registro abierto
    const [registrando, setRegistrando] = useState(false);
    // Filtro de estado elegido
    const [filtro, setFiltro] = useState('');
    // true = se muestran los lotes desactivados
    const [verInactivos, setVerInactivos] = useState(false);
    // Pide al backend los lotes inactivos solo cuando se van a ver
    const inactivos = useCarga(() => (verInactivos ? lotesService.listar(true) : Promise.resolve([])), [verInactivos]);

    // Lote abierto en el detalle (según la dirección)
    const loteAbierto = params.get('lote');
    // Abre el detalle de un lote
    const abrirLote = (id) => setParams({ lote: id });
    // Cierra el detalle
    const cerrarLote = () => setParams({});

    // Pide al backend lotes, estados, etapas y actividades
    const { datos, cargando, error, recargar } = useCarga(async () => {
        const [lotes, panel, etapas, actividades] = await Promise.all([
            lotesService.listar(),
            monitoreosService.panelEstado(),
            etapasService.listar(),
            actividadesService.listar(),
        ]);
        return { lotes, panel, etapas, actividades };
    });

    // Arma la información de cada cuadrito
    const tarjetas = useMemo(() => {
        if (!datos) return [];
        return datos.lotes.map((lote) => ({
            lote,
            // Último monitoreo de este lote
            ultimoMonitoreo: datos.panel.find((p) => p.loteId === lote.id)?.ultimoMonitoreo || null,
            // Etapa actual de este lote
            etapa: etapaActual(datos.etapas.filter((e) => e.loteId === lote.id)),
            // Actividades pendientes o en proceso de este lote
            pendientes: datos.actividades.filter(
                (a) => a.loteId === lote.id && (a.estado === 'PENDIENTE' || a.estado === 'EN_PROCESO'),
            ).length,
        }));
    }, [datos]);

    // Cuadritos que cumplen la búsqueda y el filtro
    const visibles = tarjetas.filter(({ lote, ultimoMonitoreo }) => {
        const texto = busqueda.trim().toLowerCase();
        // Busca en nombre, ubicación y cultivo
        const coincide = !texto || `${lote.nombre} ${lote.ubicacion} ${lote.cultivo}`.toLowerCase().includes(texto);
        // Estado del lote ("SIN" si nunca se monitoreó)
        const estado = ultimoMonitoreo?.estado || 'SIN';
        return coincide && (!filtro || filtro === estado);
    });

    return (
        <section>
            {/* Título y botón de registrar */}
            <div className="view-head">
                <div>
                    <div className="view-title">Lotes de la finca</div>
                    <div className="view-sub">Lotes o tajos en los que se divide el cultivo</div>
                </div>
                {/* Solo el administrador registra lotes */}
                {puede.gestionarLotes && (
                    <button className="btn btn-primary btn-auto" onClick={() => setRegistrando(true)}>
                        <IconoMas size={16} /> Registrar lote de la finca
                    </button>
                )}
            </div>

            {/* Mientras carga */}
            {cargando && !datos && <div className="card"><Cargando texto="Cargando lotes…" /></div>}
            {/* Si falló */}
            {error && <div className="card"><ErrorCarga error={error} onReintentar={recargar} /></div>}

            {datos && (
                <>
                    {/* Contador y filtros por estado */}
                    <div className="card-head" style={{ padding: '0 0 16px', border: 'none' }}>
                        <div className="card-sub" style={{ fontSize: 12 }}>
                            {visibles.length} de {tarjetas.length} lotes · haz clic en un lote para ver toda su información
                        </div>
                        <div className="chip-group" role="group" aria-label="Filtrar por estado">
                            {FILTROS.map((f) => (
                                <button
                                    key={f.valor}
                                    className={`chip ${filtro === f.valor ? 'active' : ''}`}
                                    aria-pressed={filtro === f.valor}
                                    onClick={() => setFiltro(f.valor)}
                                >
                                    {f.texto}
                                </button>
                            ))}
                        </div>
                    </div>

                    {tarjetas.length === 0 ? (
                        // No hay ningún lote todavía
                        <div className="card">
                            <Vacio
                                titulo="Aún no hay lotes registrados"
                                mensaje={puede.gestionarLotes ? 'Registra el primer lote de la finca para empezar.' : 'El administrador de finca debe registrar los lotes.'}
                                icono={<IconoLote size={22} />}
                            >
                                {puede.gestionarLotes && (
                                    <button className="btn btn-primary btn-auto" onClick={() => setRegistrando(true)}>
                                        <IconoMas size={16} /> Registrar lote de la finca
                                    </button>
                                )}
                            </Vacio>
                        </div>
                    ) : visibles.length === 0 ? (
                        // Hay lotes, pero ninguno cumple el filtro
                        <div className="card"><Vacio titulo="Sin resultados" mensaje="Ningún lote coincide con la búsqueda o el filtro." /></div>
                    ) : (
                        // Cuadritos de los lotes
                        <div className="lotes-grid">
                            {visibles.map((t) => (
                                <TarjetaLote key={t.lote.id} {...t} onClick={() => abrirLote(t.lote.id)} />
                            ))}
                        </div>
                    )}

                    {/* Botón para mostrar u ocultar los lotes desactivados (solo administrador) */}
                    {puede.gestionarLotes && (
                        <div style={{ marginTop: 24 }}>
                            <button className="btn btn-ghost btn-auto" onClick={() => setVerInactivos((v) => !v)}>
                                {verInactivos ? 'Ocultar lotes inactivos' : 'Ver lotes inactivos'}
                            </button>
                        </div>
                    )}

                    {/* Lotes desactivados (su historial se conserva) */}
                    {verInactivos && (
                        <div style={{ marginTop: 16 }}>
                            {inactivos.cargando && !inactivos.datos && <div className="card"><Cargando texto="Cargando lotes inactivos…" /></div>}
                            {inactivos.error && <div className="card"><ErrorCarga error={inactivos.error} onReintentar={inactivos.recargar} /></div>}
                            {inactivos.datos && (inactivos.datos.length ? (
                                <div className="lotes-grid">
                                    {inactivos.datos.map((l) => <TarjetaLoteInactivo key={l.id} lote={l} />)}
                                </div>
                            ) : (
                                <div className="card"><Vacio titulo="No hay lotes inactivos" /></div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Formulario para registrar un lote */}
            {registrando && (
                <FormularioLote
                    onCerrar={() => setRegistrando(false)}
                    onGuardado={() => {
                        setRegistrando(false);
                        recargar();
                    }}
                />
            )}

            {/* Detalle del lote abierto */}
            {loteAbierto && <DetalleLote key={loteAbierto} loteId={Number(loteAbierto)} onCerrar={cerrarLote} onCambio={() => { recargar(); inactivos.recargar(); }} />}
        </section>
    );
}
