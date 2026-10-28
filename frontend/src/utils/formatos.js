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

// ---------- VALIDACIONES DE CUENTA ----------

// Mínimo de caracteres de una contraseña (igual que el backend)
export const PASSWORD_MIN = 6;

// Revisa que el correo tenga forma de correo: algo@algo.algo
export const correoValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

// ---------- ACTIVIDAD VENCIDA (misma regla que las alertas del backend) ----------

// Día de hoy en Colombia como "AAAA-MM-DD" (Colombia es UTC-5)
export const hoyColombia = () => new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Vencida = sigue pendiente o en proceso y su fecha ya pasó
export const estaVencida = (a) =>
    (a.estado === 'PENDIENTE' || a.estado === 'EN_PROCESO') && a.fechaProgramada.slice(0, 10) < hoyColombia();

// ---------- MOTIVO DE DESACTIVACIÓN DE UN LOTE ----------
// El backend no tiene campo para el motivo, así que se guarda al final de la descripción

// Texto que separa la descripción del motivo
const MARCA_MOTIVO = 'Motivo de desactivación: ';

// Agrega el motivo al final de la descripción
export const agregarMotivo = (descripcion, motivo) => `${descripcion ? `${descripcion}\n` : ''}${MARCA_MOTIVO}${motivo}`;

// Separa la descripción y el motivo para mostrarlos aparte
export const separarMotivo = (descripcion) => {
    // Sin descripción o sin motivo: se devuelve igual
    if (!descripcion || !descripcion.includes(MARCA_MOTIVO)) return { descripcion, motivo: null };
    // Se corta en la última marca
    const i = descripcion.lastIndexOf(MARCA_MOTIVO);
    return { descripcion: descripcion.slice(0, i).trim() || null, motivo: descripcion.slice(i + MARCA_MOTIVO.length).trim() };
};

// ---------- PERMISOS (iguales a los del backend) ----------

export const permisos = (rol) => ({
    // Crear, editar y desactivar lotes
    gestionarLotes: rol === 'ADMINISTRADOR',
    // Crear etapas, actividades y monitoreos
    planificar: rol === 'ADMINISTRADOR' || rol === 'COORDINADOR',
    // Eliminar registros
    eliminar: rol === 'ADMINISTRADOR',
    // Entrar a SmartControl
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
