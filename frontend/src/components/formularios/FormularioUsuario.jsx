// Formulario para registrar un usuario o editar sus datos, rol y contraseña (SmartControl)

import { useState } from 'react';
// Para mostrar el mensaje de éxito
import { useAvisos } from '../../context/AvisosContexto';
// Para saber quién inició sesión
import { useSesion } from '../../context/SesionContexto';
// Llamadas al backend de usuarios
import { authService } from '../../services/greensmart';
import { correoValido, PASSWORD_MIN, ROLES } from '../../utils/formatos';
import VentanaModal from '../VentanaModal';
import { Campo, ErrorForm, Opciones, PieForm } from './CamposFormulario';

// Si llega "usuario" se edita; si no, se registra uno nuevo
export default function FormularioUsuario({ usuario, onCerrar, onGuardado }) {
    const { toast } = useAvisos();
    const { usuario: yo } = useSesion();
    // true si estoy editando mi propio usuario (no puedo cambiar mi rol)
    const esYo = usuario?.id === yo.id;
    // Valores de los campos
    const [datos, setDatos] = useState({
        nombre: usuario?.nombre || '',
        email: usuario?.email || '',
        password: '',
        confirmar: '',
        rol: usuario?.rol || 'OPERARIO',
    });
    // Mensaje de error
    const [error, setError] = useState('');
    // true mientras se guarda
    const [guardando, setGuardando] = useState(false);

    // Guarda lo que se escribe en un campo
    const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

    // Al presionar Guardar
    const enviar = async (e) => {
        e.preventDefault();
        setError('');

        // Nombre y correo siempre son obligatorios
        if (!datos.nombre.trim() || !datos.email.trim()) return setError('El nombre y el correo son obligatorios.');
        // El correo debe tener forma de correo
        if (!correoValido(datos.email.trim())) return setError('Escribe un correo válido, por ejemplo nombre@correo.com.');
        // Al registrar también se necesita la contraseña
        if (!usuario && !datos.password) return setError('La contraseña es obligatoria.');
        // Si se escribió una contraseña, debe tener el mínimo de caracteres
        if (datos.password && datos.password.length < PASSWORD_MIN) return setError(`La contraseña debe tener mínimo ${PASSWORD_MIN} caracteres.`);
        // Las contraseñas deben ser iguales
        if (datos.password !== datos.confirmar) return setError('Las contraseñas no coinciden.');

        setGuardando(true);
        try {
            if (usuario) {
                // Editar: cambia nombre y correo solo si son diferentes
                if (datos.nombre.trim() !== usuario.nombre || datos.email.trim() !== usuario.email) {
                    await authService.actualizarDatos(usuario.id, datos.nombre.trim(), datos.email.trim());
                }
                // Cambia el rol solo si es diferente
                if (datos.rol !== usuario.rol) await authService.cambiarRol(usuario.id, datos.rol);
                // Cambia la contraseña solo si se escribió una nueva
                if (datos.password) await authService.restablecerPassword(usuario.id, datos.password);
                toast('Usuario actualizado', `${datos.nombre.trim()}: ${ROLES[datos.rol]}`);
            } else {
                // Registrar: el backend lo crea como Operario
                const { usuario: nuevo } = await authService.registrar(datos.nombre.trim(), datos.email.trim(), datos.password);
                // Si se eligió otro rol, se le asigna enseguida
                if (datos.rol !== nuevo.rol) await authService.cambiarRol(nuevo.id, datos.rol);
                toast('Usuario registrado', `${nuevo.nombre} · ${ROLES[datos.rol]}`);
            }
            onGuardado();
        } catch (err) {
            // Si el backend aún no tiene la ruta para cambiar nombre y correo, se explica
            if (err.rutaNoExiste) setError('El backend todavía no tiene la ruta para cambiar nombre y correo (PUT /auth/usuarios/:id).');
            // Ej: "Ese email ya está registrado"
            else setError(err.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <VentanaModal
            titulo={usuario ? 'Editar usuario' : 'Registrar usuario'}
            subtitulo={usuario ? usuario.email : 'Crea una cuenta para el personal de la finca'}
            onCerrar={onCerrar}
            pie={<PieForm formId="formUsuario" onCerrar={onCerrar} guardando={guardando} texto={usuario ? 'Guardar cambios' : 'Registrar usuario'} />}
        >
            <form id="formUsuario" onSubmit={enviar} noValidate>
                <ErrorForm mensaje={error} />
                {usuario ? (
                    // Editar: nombre, correo y contraseña nueva
                    <>
                        <div className="form-row-2">
                            <Campo etiqueta="Nombre completo" requerido>
                                <input className="form-input" value={datos.nombre} onChange={cambiar('nombre')} />
                            </Campo>
                            <Campo etiqueta="Correo electrónico" requerido>
                                <input type="email" className="form-input" value={datos.email} onChange={cambiar('email')} />
                            </Campo>
                        </div>
                        {/* Contraseña nueva: si se deja vacía no se cambia */}
                        <div className="form-row-2">
                            <Campo etiqueta="Nueva contraseña (opcional)">
                                <input type="password" className="form-input" value={datos.password} onChange={cambiar('password')} autoComplete="new-password" placeholder="Mínimo 6 caracteres" />
                            </Campo>
                            <Campo etiqueta="Confirmar contraseña">
                                <input type="password" className="form-input" value={datos.confirmar} onChange={cambiar('confirmar')} autoComplete="new-password" />
                            </Campo>
                        </div>
                    </>
                ) : (
                    // Registrar: nombre, correo y contraseña
                    <>
                        <Campo etiqueta="Nombre completo" requerido>
                            <input className="form-input" value={datos.nombre} onChange={cambiar('nombre')} placeholder="Juan Gonzalez" autoFocus />
                        </Campo>
                        <Campo etiqueta="Correo electrónico" requerido>
                            <input type="email" className="form-input" value={datos.email} onChange={cambiar('email')} placeholder="usuario@greensmart.com" />
                        </Campo>
                        <div className="form-row-2">
                            <Campo etiqueta="Contraseña" requerido>
                                <input type="password" className="form-input" value={datos.password} onChange={cambiar('password')} autoComplete="new-password" />
                            </Campo>
                            <Campo etiqueta="Confirmar contraseña" requerido>
                                <input type="password" className="form-input" value={datos.confirmar} onChange={cambiar('confirmar')} autoComplete="new-password" />
                            </Campo>
                        </div>
                    </>
                )}
                <Campo etiqueta="Rol" requerido>
                    {/* Bloqueado si es mi propio usuario */}
                    <select className="form-input select" value={datos.rol} onChange={cambiar('rol')} disabled={esYo} title={esYo ? 'No puedes cambiar tu propio rol' : undefined}>
                        <Opciones mapa={ROLES} />
                    </select>
                </Campo>
            </form>
        </VentanaModal>
    );
}
