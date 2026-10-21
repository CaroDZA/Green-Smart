// Guarda el usuario que inició sesión y lo comparte con toda la app

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
// Funciones para guardar la sesión en el navegador
import { onSesionExpirada, sesion } from '../services/api';
// Llamadas al backend de usuarios
import { authService } from '../services/greensmart';
// Calcula qué puede hacer cada rol
import { permisos } from '../utils/formatos';

// Espacio compartido para la sesión
const SesionContexto = createContext(null);

export function ProveedorSesion({ children }) {
    // Si ya había sesión guardada, recuperamos el usuario
    const [usuario, setUsuario] = useState(() => (sesion.getToken() ? sesion.getUsuario() : null));

    // Cierra la sesión: borra lo guardado
    const cerrarSesion = useCallback(() => {
        sesion.limpiar();
        setUsuario(null);
    }, []);

    // Si la sesión vence, se cierra sola
    useEffect(() => {
        onSesionExpirada(cerrarSesion);
    }, [cerrarSesion]);

    // Inicia sesión con correo y contraseña
    const iniciarSesion = async (email, password) => {
        // Pide al backend el token y los datos del usuario
        const { token, usuario } = await authService.login(email, password);
        // Los guarda en el navegador
        sesion.guardar(token, usuario);
        // Cambia del login a la app
        setUsuario(usuario);
    };

    // Datos que se comparten con las demás pantallas
    const valor = useMemo(
        () => ({ usuario, puede: permisos(usuario?.rol), iniciarSesion, cerrarSesion }),
        [usuario, cerrarSesion],
    );

    return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

// Para usar la sesión en cualquier pantalla
export const useSesion = () => useContext(SesionContexto);
