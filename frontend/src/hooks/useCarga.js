// Trae datos del backend al abrir una pantalla

import { useCallback, useEffect, useState } from 'react';

export function useCarga(funcion, dependencias = []) {
    // Datos que llegaron del backend
    const [datos, setDatos] = useState(null);
    // true mientras espera la respuesta
    const [cargando, setCargando] = useState(true);
    // Error si algo falló
    const [error, setError] = useState(null);

    // Función que pide los datos (cambia si cambian las dependencias)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const cargar = useCallback(funcion, dependencias);

    // Vuelve a pedir los datos (después de guardar o eliminar)
    const recargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            setDatos(await cargar());
        } catch (e) {
            setError(e);
        } finally {
            setCargando(false);
        }
    }, [cargar]);

    // Pide los datos al abrir la pantalla
    useEffect(() => {
        // Evita guardar datos si ya salimos de la pantalla
        let activo = true;
        setCargando(true);
        setError(null);
        cargar()
            .then((r) => activo && setDatos(r))
            .catch((e) => activo && setError(e))
            .finally(() => activo && setCargando(false));
        return () => {
            activo = false;
        };
    }, [cargar]);

    return { datos, cargando, error, recargar, setDatos };
}
