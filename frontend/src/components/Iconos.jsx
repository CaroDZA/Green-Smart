// Íconos de la app, ej: <IconoLote size={20} />

// Marco que comparten todos los íconos
const Svg = ({ size = 18, children, ...props }) => (
    <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        {children}
    </svg>
);

// Ícono de cuadritos (menú Dashboard)
export const IconoDashboard = (p) => (
    <Svg {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Svg>
);
// Ícono de mapa (lotes)
export const IconoLote = (p) => (
    <Svg {...p}><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></Svg>
);
// Ícono de planta (etapas del cultivo)
export const IconoEtapas = (p) => (
    <Svg {...p}><path d="M12 22V12" /><path d="M12 12C12 7 8 4 3 4c0 5 4 8 9 8z" /><path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7z" /></Svg>
);
// Ícono de calendario (actividades)
export const IconoCalendario = (p) => (
    <Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></Svg>
);
// Ícono de ojo (monitoreo)
export const IconoMonitoreo = (p) => (
    <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Svg>
);
// Ícono de barras (reportes)
export const IconoReportes = (p) => (
    <Svg {...p}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></Svg>
);
// Ícono de personas (SmartControl)
export const IconoUsuarios = (p) => (
    <Svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>
);
// Ícono de puerta con flecha (cerrar sesión)
export const IconoSalir = (p) => (
    <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Svg>
);
// Ícono de tres rayas (abrir menú en celular)
export const IconoMenu = (p) => (
    <Svg {...p}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></Svg>
);
// Ícono de lupa (buscador)
export const IconoBuscar = (p) => (
    <Svg {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Svg>
);
// Ícono de sol (modo claro)
export const IconoSol = (p) => (
    <Svg {...p}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></Svg>
);
// Ícono de luna (modo oscuro)
export const IconoLuna = (p) => (
    <Svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Svg>
);
// Ícono de pantalla (tema del sistema)
export const IconoMonitor = (p) => (
    <Svg {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></Svg>
);
// Ícono de campana (alertas)
export const IconoCampana = (p) => (
    <Svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Svg>
);
// Ícono de triángulo de advertencia
export const IconoAlerta = (p) => (
    <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Svg>
);
// Ícono de reloj (actividades vencidas o próximas)
export const IconoReloj = (p) => (
    <Svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Svg>
);
// Ícono de chulito (completar actividad)
export const IconoCheck = (p) => (
    <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>
);
// Ícono de pin de ubicación
export const IconoUbicacion = (p) => (
    <Svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></Svg>
);
// Ícono de lápiz (editar)
export const IconoEditar = (p) => (
    <Svg size={14} {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>
);
// Ícono de caneca (eliminar)
export const IconoBorrar = (p) => (
    <Svg size={14} {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></Svg>
);
// Ícono de flecha hacia abajo (descargar PDF)
export const IconoDescargar = (p) => (
    <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Svg>
);
// Ícono de signo más (agregar)
export const IconoMas = (p) => (
    <Svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Svg>
);
// Ícono de signo de pesos (costos)
export const IconoDinero = (p) => (
    <Svg {...p}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Svg>
);
// Ícono de trofeo (mejor resultado)
export const IconoTrofeo = (p) => (
    <Svg {...p}><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3" /><path d="M7 5H4v2a3 3 0 0 0 3 3" /></Svg>
);
// Ícono de hoja (sin datos)
export const IconoHoja = (p) => (
    <Svg {...p}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></Svg>
);
