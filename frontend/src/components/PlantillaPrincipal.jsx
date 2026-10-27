// Estructura de todas las páginas: menú lateral, barra superior y contenido

import { useState } from 'react';
// NavLink: enlace del menú. Outlet: lugar donde se muestra cada página
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useSesion } from '../context/SesionContexto';
import { useTema } from '../context/TemaContexto';
import { useAvisos } from '../context/AvisosContexto';
import { iniciales, ROLES } from '../utils/formatos';
import MenuAlertas from './MenuAlertas';
import {
    IconoBuscar, IconoCalendario, IconoDashboard, IconoEtapas, IconoLote, IconoLuna,
    IconoMenu, IconoMonitoreo, IconoReportes, IconoSalir, IconoSol, IconoUsuarios,
} from './Iconos';
import VentanaApariencia from './VentanaApariencia';

// Opciones del menú lateral, agrupadas por sección
const SECCIONES = [
    {
        titulo: 'Principal',
        items: [
            { ruta: '/dashboard', texto: 'Dashboard', Icono: IconoDashboard },
            { ruta: '/reportes', texto: 'Reportes', Icono: IconoReportes },
        ],
    },
    {
        titulo: 'Gestión del cultivo',
        items: [
            { ruta: '/lotes', texto: 'Lotes de la finca', Icono: IconoLote },
            { ruta: '/etapas', texto: 'Planificación por etapas', Icono: IconoEtapas },
            { ruta: '/actividades', texto: 'Cronograma de actividades', Icono: IconoCalendario },
        ],
    },
    {
        titulo: 'Seguimiento',
        items: [{ ruta: '/monitoreos', texto: 'Monitoreo del cultivo', Icono: IconoMonitoreo }],
    },
];

// Texto del buscador según la página (si no está aquí, no hay buscador)
const PLACEHOLDERS = {
    '/lotes': 'Buscar lotes por nombre o ubicación…',
    '/etapas': 'Buscar por lote o etapa…',
    '/actividades': 'Buscar por lote, tipo o descripción…',
    '/monitoreos': 'Buscar por lote, condición o responsable…',
    '/smartcontrol': 'Buscar personal por nombre, correo o rol…',
};

export default function PlantillaPrincipal() {
    const { usuario, puede, cerrarSesion } = useSesion();
    const { tema } = useTema();
    const { confirmar } = useAvisos();
    // Página actual
    const location = useLocation();
    // Menú lateral abierto (en celular)
    const [menuAbierto, setMenuAbierto] = useState(false);
    // Ventana de apariencia abierta
    const [temaAbierto, setTemaAbierto] = useState(false);
    // Texto del buscador y página donde se escribió
    const [filtro, setFiltro] = useState({ ruta: location.pathname, texto: '' });
    // Al cambiar de página el buscador queda vacío
    const busqueda = filtro.ruta === location.pathname ? filtro.texto : '';
    // Guarda lo que se escribe en el buscador
    const setBusqueda = (texto) => setFiltro({ ruta: location.pathname, texto });

    // Pregunta antes de cerrar sesión
    const salir = async () => {
        const ok = await confirmar({ titulo: 'Cerrar sesión', mensaje: '¿Quieres salir de Green Smart?', textoOk: 'Cerrar sesión', peligro: false });
        if (ok) cerrarSesion();
    };

    // Texto del buscador para esta página
    const placeholder = PLACEHOLDERS[location.pathname];

    return (
        <div className="app active">
            {/* Fondo oscuro detrás del menú en celular */}
            <div className={`sidebar-backdrop ${menuAbierto ? 'open' : ''}`} onClick={() => setMenuAbierto(false)} />

            {/* ---------- MENÚ LATERAL ---------- */}
            <aside className={`sidebar ${menuAbierto ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-brand">
                    <img src={logo} alt="" />
                    <div className="sidebar-brand-text">GreenSmart</div>
                </div>

                {/* Secciones y opciones del menú */}
                {SECCIONES.map((seccion) => (
                    <div key={seccion.titulo}>
                        <div className="sidebar-section-label">{seccion.titulo}</div>
                        {seccion.items.map(({ ruta, texto, Icono }) => (
                            // La opción de la página actual se marca en verde
                            <NavLink key={ruta} to={ruta} onClick={() => setMenuAbierto(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Icono className="nav-icon" />
                                <span>{texto}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}

                {/* SmartControl solo para el administrador */}
                {puede.gestionarUsuarios && (
                    <>
                        <div className="sidebar-section-label">Administración</div>
                        <NavLink to="/smartcontrol" onClick={() => setMenuAbierto(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <IconoUsuarios className="nav-icon" />
                            <span>SmartControl</span>
                        </NavLink>
                    </>
                )}

                {/* Cerrar sesión */}
                <div className="sidebar-section-label">Cuenta</div>
                <button className="nav-item" onClick={salir}>
                    <IconoSalir className="nav-icon" />
                    <span>Cerrar sesión</span>
                </button>

                {/* Usuario actual abajo del menú */}
                <div className="sidebar-foot">
                    <div className="user-card">
                        <div className="user-avatar">{iniciales(usuario.nombre)}</div>
                        <div className="user-info">
                            <div className="user-name">{usuario.nombre}</div>
                            <div className="user-role">{ROLES[usuario.rol] || usuario.rol}</div>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="main">
                {/* ---------- BARRA SUPERIOR ---------- */}
                <div className="topbar">
                    {/* Botón para abrir el menú en celular */}
                    <button className="icon-btn menu-toggle" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
                        <IconoMenu />
                    </button>
                    {/* Buscador (se oculta en páginas sin búsqueda) */}
                    <div className="topbar-search" style={{ visibility: placeholder ? 'visible' : 'hidden' }}>
                        <IconoBuscar />
                        <input
                            type="search"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder={placeholder || ''}
                            aria-label="Buscar"
                        />
                    </div>
                    <div className="topbar-actions">
                        {/* Campana de alertas */}
                        <MenuAlertas recargarCuando={location.pathname} />
                        {/* Botón de modo oscuro: abre la ventana de apariencia */}
                        <button className="icon-btn" title="Apariencia (modo oscuro)" aria-label="Cambiar apariencia" onClick={() => setTemaAbierto(true)}>
                            {tema === 'dark' ? <IconoSol /> : <IconoLuna />}
                        </button>
                    </div>
                </div>

                {/* ---------- CONTENIDO ---------- */}
                <div className="content">
                    {/* Aquí se muestra la página actual (le pasamos la búsqueda) */}
                    <Outlet context={{ busqueda }} />
                </div>
            </main>

            {/* Ventana de apariencia */}
            {temaAbierto && <VentanaApariencia onCerrar={() => setTemaAbierto(false)} />}
        </div>
    );
}
