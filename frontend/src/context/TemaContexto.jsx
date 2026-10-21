// Controla el modo claro, oscuro o el del sistema

import { createContext, useContext, useEffect, useState } from 'react';

// Espacio compartido para el tema
const TemaContexto = createContext(null);
// Nombre con el que se guarda la elección en el navegador
const THEME_KEY = 'gs-theme';
// Pregunta al computador si está en modo oscuro
const consultaOscuro = '(prefers-color-scheme: dark)';

// Lee la elección guardada (si no hay, modo claro)
const leerPreferencia = () => {
    try {
        return localStorage.getItem(THEME_KEY) || 'light';
    } catch {
        return 'light';
    }
};

export function ProveedorTema({ children }) {
    // Lo que eligió el usuario: claro, oscuro o sistema
    const [preferencia, setPreferencia] = useState(leerPreferencia);
    // Si el computador está en modo oscuro
    const [sistemaOscuro, setSistemaOscuro] = useState(() => window.matchMedia(consultaOscuro).matches);

    // Detecta si el computador cambia de modo
    useEffect(() => {
        const media = window.matchMedia(consultaOscuro);
        const cambio = (e) => setSistemaOscuro(e.matches);
        media.addEventListener('change', cambio);
        return () => media.removeEventListener('change', cambio);
    }, []);

    // Tema que se ve en pantalla
    const tema = preferencia === 'system' ? (sistemaOscuro ? 'dark' : 'light') : preferencia;

    // Aplica el tema: el CSS cambia los colores con data-theme="dark"
    useEffect(() => {
        if (tema === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
    }, [tema]);

    // Cambia el tema y lo guarda para la próxima vez
    const elegirTema = (valor) => {
        setPreferencia(valor);
        try {
            localStorage.setItem(THEME_KEY, valor);
        } catch {
            // Si no se puede guardar, solo dura mientras la página esté abierta
        }
    };

    return (
        <TemaContexto.Provider value={{ preferencia, tema, elegirTema }}>
            {children}
        </TemaContexto.Provider>
    );
}

// Para usar el tema en cualquier pantalla
export const useTema = () => useContext(TemaContexto);
