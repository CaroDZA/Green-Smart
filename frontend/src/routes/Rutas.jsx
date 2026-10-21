// Decide qué página mostrar según la dirección (ej: /lotes)

import { Navigate, Route, Routes } from 'react-router-dom';
// Menú lateral y barra superior
import PlantillaPrincipal from '../components/PlantillaPrincipal';
// Para saber si hay sesión iniciada
import { useSesion } from '../context/SesionContexto';
// Páginas
import Actividades from '../pages/Actividades';
import Dashboard from '../pages/Dashboard';
import Etapas from '../pages/Etapas';
import Login from '../pages/Login';
import Lotes from '../pages/Lotes';
import Monitoreos from '../pages/Monitoreos';
import Reportes from '../pages/Reportes';
import GreenControl from '../pages/GreenControl';

export default function Rutas() {
    // Usuario actual y lo que puede hacer
    const { usuario, puede } = useSesion();

    // Sin sesión: siempre se muestra el login
    if (!usuario) {
        return (
            <Routes>
                <Route path="*" element={<Login />} />
            </Routes>
        );
    }

    // Con sesión: páginas dentro del menú lateral
    return (
        <Routes>
            <Route element={<PlantillaPrincipal />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/lotes" element={<Lotes />} />
                <Route path="/etapas" element={<Etapas />} />
                <Route path="/actividades" element={<Actividades />} />
                <Route path="/monitoreos" element={<Monitoreos />} />
                {/* GreenControl solo para el administrador */}
                {puede.gestionarUsuarios && <Route path="/greencontrol" element={<GreenControl />} />}
                {/* Cualquier otra dirección va al dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
}
