// Componente principal: reúne todo lo que la app comparte

// Permite cambiar de página sin recargar
import { BrowserRouter } from 'react-router-dom';
// Guarda quién inició sesión
import { ProveedorSesion } from './context/SesionContexto';
// Guarda si la app está en modo claro u oscuro
import { ProveedorTema } from './context/TemaContexto';
// Muestra mensajes y ventanas de confirmación
import { ProveedorAvisos } from './context/AvisosContexto';
// Lista de páginas
import Rutas from './routes/Rutas';

export default function App() {
    return (
        // Activa el cambio de páginas
        <BrowserRouter>
            {/* Modo claro / oscuro para toda la app */}
            <ProveedorTema>
                {/* Mensajes disponibles en todas las pantallas */}
                <ProveedorAvisos>
                    {/* Sesión del usuario */}
                    <ProveedorSesion>
                        {/* Página que corresponde a la dirección actual */}
                        <Rutas />
                    </ProveedorSesion>
                </ProveedorAvisos>
            </ProveedorTema>
        </BrowserRouter>
    );
}
