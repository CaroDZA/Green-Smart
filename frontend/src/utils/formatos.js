// Formatos, textos y permisos que usa toda la app

// ---------- FECHAS ----------

// Fecha sin hora, ej: "18 de oct de 2026" (etapas y actividades)
export const fmtDia = (iso) => {
    // Sin fecha mostramos una raya
    if (!iso) return '—';
    // Se usa UTC para que no salga un día antes
    return new Date(iso).toLocaleDateString('es-CO', {
        timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric',
    });
};

// Fecha con hora, ej: "18 de oct de 2026, 04:25 p. m."
export const fmtFechaHora = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
};

// Fecha en hora de Colombia, sin la hora
export const fmtFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ---------- NÚMEROS ----------

// Dinero, ej: 350000 → "$ 350.000"
export const fmtDinero = (n) => '$ ' + Math.round(n || 0).toLocaleString('es-CO');
// Número con puntos, ej: 1500 → "1.500"
export const fmtNumero = (n) => (n || 0).toLocaleString('es-CO');

// ---------- CAMPOS DE FECHA ----------

// Fecha para un campo de fecha: "AAAA-MM-DD"
export const aInputFecha = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

// Fecha de hoy como "AAAA-MM-DD"
export const hoyISO = () => {
    const d = new Date();
    // Ajuste por la hora de Colombia
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
};

// Fecha y hora para un campo de fecha con hora
export const aInputFechaHora = (fecha = new Date()) => {
    const d = new Date(fecha);
    // Ajuste por la hora de Colombia
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

// ---------- TEXTOS ----------

// Iniciales de un nombre, ej: "Carolina Duque" → "CD"
export const iniciales = (nombre) =>
    (nombre || '').split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();

// Estado en minúsculas para usarlo como clase CSS, ej: "BUENO" → "bueno"
export const claseEstado = (valor) => (valor || 'sin-datos').toLowerCase();

// Primera letra en mayúscula, ej: "OTRA" → "Otra"
const titulo = (s) => s.charAt(0) + s.slice(1).toLowerCase();

// Nombres para mostrar de cada valor del backend

// Roles
export const ROLES = {
    ADMINISTRADOR: 'Administrador de finca',
    COORDINADOR: 'Coordinador de campo',
    OPERARIO: 'Operario',
};

// Etapas del cultivo
export const ETAPAS = {
    VEGETATIVA: 'Vegetativa',
    FLORACION: 'Floración',
    FRUCTIFICACION: 'Fructificación',
    MADURACION: 'Maduración',
    REPOSO: 'Reposo',
};

// Tipos de actividad
export const TIPOS_ACTIVIDAD = {
    PLATEO: 'Plateo',
    DESHIERBE: 'Deshierbe',
    FERTILIZACION: 'Fertilización',
    RIEGO: 'Riego',
    PODA: 'Poda',
    FUMIGACION: 'Fumigación',
    COSECHA: 'Cosecha',
    MONITOREO: 'Monitoreo',
    OTRA: 'Otra',
};

// Estados de una actividad
export const ESTADOS_ACTIVIDAD = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En proceso',
    COMPLETADA: 'Completada',
    CANCELADA: 'Cancelada',
};

// Estados del cultivo
export const ESTADOS_CULTIVO = {
    BUENO: 'Bueno',
    REGULAR: 'Regular',
    CRITICO: 'Crítico',
};

// Plagas
export const PLAGAS = {
    PICUDO: 'Picudo',
    PASADOR: 'Pasador del fruto',
    CHINCHE: 'Chinche',
    ARANITA: 'Arañita roja',
    TRIPS: 'Trips',
    COCHINILLA: 'Cochinilla',
    BARRENADOR: 'Barrenador',
    OTRA: 'Otra',
};

// Enfermedades
export const ENFERMEDADES = {
    MARCHITEZ: 'Marchitez',
    PUDRICION_RAIZ: 'Pudrición de raíz',
    ANTRACNOSIS: 'Antracnosis',
    OTRA: 'Otra',
};

// Busca el nombre para mostrar, ej: etiqueta(ETAPAS, 'FLORACION') → "Floración"
export const etiqueta = (mapa, valor) => (valor ? mapa[valor] || titulo(valor) : '—');

// Color de cada estado del cultivo
export const COLOR_ESTADO_CULTIVO = {
    BUENO: 'var(--success)',   // verde
    REGULAR: 'var(--warning)', // amarillo
    CRITICO: 'var(--danger)',  // rojo
};

// ---------- PERMISOS (iguales a los del backend) ----------

export const permisos = (rol) => ({
    // Crear, editar y desactivar lotes
    gestionarLotes: rol === 'ADMINISTRADOR',
    // Crear etapas, actividades y monitoreos
    planificar: rol === 'ADMINISTRADOR' || rol === 'COORDINADOR',
    // Eliminar registros
    eliminar: rol === 'ADMINISTRADOR',
    // Entrar a GreenControl
    gestionarUsuarios: rol === 'ADMINISTRADOR',
});

// ---------- ETAPA ACTUAL ----------

// Busca en qué etapa está el lote hoy
export const etapaActual = (etapas) => {
    // Sin etapas no hay etapa actual
    if (!etapas?.length) return null;
    // Fecha de hoy
    const hoy = new Date(hoyISO() + 'T00:00:00Z');
    // Etapas que ya empezaron, de la más nueva a la más vieja
    const iniciadas = etapas
        .filter((e) => new Date(e.fechaInicio) <= hoy)
        .sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
    // La que todavía no ha terminado
    const vigente = iniciadas.find((e) => !e.fechaFin || new Date(e.fechaFin) >= hoy);
    // Si todas terminaron, la última que empezó
    return vigente || iniciadas[0] || null;
};
