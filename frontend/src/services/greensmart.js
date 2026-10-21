// Una función por cada ruta del backend, agrupadas por módulo

// Conexión con el backend
import { api } from './api';

// Módulo de autenticación y usuarios (backend: routes/auth.js)
export const authService = {
    // POST /auth/login → inicia sesión
    login: (email, password) => api.post('/auth/login', { email, password }),
    // POST /auth/register → crea un usuario (el backend lo crea como OPERARIO)
    registrar: (nombre, email, password) => api.post('/auth/register', { nombre, email, password }),
    // GET /auth/usuarios → lista de usuarios (solo administrador)
    listarUsuarios: () => api.get('/auth/usuarios').then((r) => r.usuarios),
    // PUT /auth/usuarios/:id/rol → cambia el rol (solo administrador)
    cambiarRol: (id, rol) => api.put(`/auth/usuarios/${id}/rol`, { rol }),
};

// Módulo de lotes (backend: routes/lotes.js)
export const lotesService = {
    // GET /lotes → lotes activos
    listar: () => api.get('/lotes').then((r) => r.lotes),
    // GET /lotes/:id → un lote con sus actividades
    ver: (id) => api.get(`/lotes/${id}`).then((r) => r.lote),
    // POST /lotes → registrar lote
    crear: (datos) => api.post('/lotes', datos),
    // PUT /lotes/:id → editar lote
    actualizar: (id, datos) => api.put(`/lotes/${id}`, datos),
    // DELETE /lotes/:id → desactivar lote (el historial se conserva)
    eliminar: (id) => api.delete(`/lotes/${id}`),
};

// Módulo de etapas del cultivo (backend: routes/etapas.js)
export const etapasService = {
    // GET /etapas → todas las etapas
    listar: () => api.get('/etapas').then((r) => r.etapas),
    // GET /etapas/lote/:loteId → etapas de un lote
    porLote: (loteId) => api.get(`/etapas/lote/${loteId}`).then((r) => r.etapas),
    // POST /etapas → planificar etapa
    crear: (datos) => api.post('/etapas', datos),
    // PUT /etapas/:id → editar etapa
    actualizar: (id, datos) => api.put(`/etapas/${id}`, datos),
    // DELETE /etapas/:id → eliminar etapa
    eliminar: (id) => api.delete(`/etapas/${id}`),
};

// Módulo de actividades (backend: routes/actividades.js)
export const actividadesService = {
    // GET /actividades → todas las actividades
    listar: () => api.get('/actividades').then((r) => r.actividades),
    // GET /actividades/lote/:loteId → actividades de un lote
    porLote: (loteId) => api.get(`/actividades/lote/${loteId}`).then((r) => r.actividades),
    // POST /actividades → programar actividad
    crear: (datos) => api.post('/actividades', datos),
    // PUT /actividades/:id → editar actividad
    actualizar: (id, datos) => api.put(`/actividades/${id}`, datos),
    // PATCH /actividades/:id/completar → marcar como realizada con sus novedades
    completar: (id, novedades) => api.patch(`/actividades/${id}/completar`, { novedades }),
    // DELETE /actividades/:id → eliminar actividad
    eliminar: (id) => api.delete(`/actividades/${id}`),
};

// Módulo de monitoreos (backend: routes/monitoreos.js)
export const monitoreosService = {
    // GET /monitoreos → todos los monitoreos
    listar: () => api.get('/monitoreos').then((r) => r.monitoreos),
    // GET /monitoreos/lote/:loteId → monitoreos de un lote
    porLote: (loteId) => api.get(`/monitoreos/lote/${loteId}`).then((r) => r.monitoreos),
    // GET /monitoreos/estado/panel → último monitoreo de cada lote
    panelEstado: () => api.get('/monitoreos/estado/panel').then((r) => r.lotes),
    // POST /monitoreos → registrar monitoreo
    crear: (datos) => api.post('/monitoreos', datos),
    // PUT /monitoreos/:id → editar monitoreo
    actualizar: (id, datos) => api.put(`/monitoreos/${id}`, datos),
    // DELETE /monitoreos/:id → eliminar monitoreo
    eliminar: (id) => api.delete(`/monitoreos/${id}`),
};

// Módulo de reportes (backend: routes/reportes.js)
export const reportesService = {
    // GET /reportes/resumen → totales generales
    resumen: () => api.get('/reportes/resumen'),
    // GET /reportes/alertas → actividades vencidas, próximas y lotes críticos
    alertas: () => api.get('/reportes/alertas'),
    // GET /reportes/historial/:loteId → historial de actividades y monitoreos de un lote
    historial: (loteId) => api.get(`/reportes/historial/${loteId}`),
    // GET /reportes/fechas → reporte entre dos fechas
    porFechas: ({ fechaInicio, fechaFin, loteId }) => {
        // Arma los filtros de la dirección
        const params = new URLSearchParams({ fechaInicio, fechaFin });
        // El lote es opcional
        if (loteId) params.set('loteId', loteId);
        return api.get(`/reportes/fechas?${params}`);
    },
    // GET /reportes/pdf/:loteId → descarga el PDF que hace el backend
    descargarPDF: async (loteId, nombreLote) => {
        // Pide el PDF al backend
        const archivo = await api.blob(`/reportes/pdf/${loteId}`);
        // Crea un enlace temporal al archivo
        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement('a');
        enlace.href = url;
        // Nombre del archivo, ej: historial-lote-el-roble.pdf
        enlace.download = `historial-${(nombreLote || `lote-${loteId}`).replace(/\s+/g, '-').toLowerCase()}.pdf`;
        // Hace clic en el enlace para descargar
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        // Borra el enlace temporal
        URL.revokeObjectURL(url);
    },
};
