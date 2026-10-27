// Conexión con el backend: todas las peticiones pasan por aquí

// Dirección del backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Nombres para guardar la sesión en el navegador
const TOKEN_KEY = 'gs-token';
const USER_KEY = 'gs-user';

// Guardar, leer y borrar la sesión en el navegador
export const sesion = {
    // Lee el token
    getToken: () => localStorage.getItem(TOKEN_KEY),
    // Lee el usuario
    getUsuario: () => {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY));
        } catch {
            return null;
        }
    },
    // Guarda token y usuario al iniciar sesión
    guardar: (token, usuario) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    },
    // Borra todo al cerrar sesión
    limpiar: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
};

// Qué hacer si la sesión vence (lo define SesionContexto)
let alExpirarSesion = () => {};
export const onSesionExpirada = (fn) => {
    alExpirarSesion = fn;
};

// Hace una petición al backend
const request = async (ruta, { method = 'GET', body, blob = false } = {}) => {
    const headers = {};
    // Envía el token para que el backend sepa quién es
    const token = sesion.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    // Avisa que los datos van en formato JSON
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    let res;
    try {
        // Llama al backend
        res = await fetch(`${API_URL}${ruta}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        // No hubo respuesta: el backend está apagado
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
    }

    // 401 = sesión vencida: se cierra
    if (res.status === 401 && token) {
        alExpirarSesion();
    }

    // Si hubo error, usamos el mensaje que manda el backend
    if (!res.ok) {
        const datos = await res.json().catch(() => ({}));
        const error = new Error(datos.error || `Error ${res.status}`);
        // Guarda el código (ej: 404) por si una pantalla lo necesita
        error.status = res.status;
        // true si el backend no tiene esa ruta (respondió sin mensaje propio)
        error.rutaNoExiste = res.status === 404 && !datos.error;
        throw error;
    }

    // Devuelve un archivo (PDF) o los datos
    return blob ? res.blob() : res.json();
};

// Atajos para cada tipo de petición
export const api = {
    // Consultar
    get: (ruta) => request(ruta),
    // Crear
    post: (ruta, body) => request(ruta, { method: 'POST', body }),
    // Editar
    put: (ruta, body) => request(ruta, { method: 'PUT', body }),
    // Editar una parte
    patch: (ruta, body) => request(ruta, { method: 'PATCH', body }),
    // Eliminar
    delete: (ruta) => request(ruta, { method: 'DELETE' }),
    // Descargar archivo
    blob: (ruta) => request(ruta, { blob: true }),
};
