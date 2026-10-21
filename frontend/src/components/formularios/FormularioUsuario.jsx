// Formulario para registrar un usuario o cambiar su rol (GreenControl)

import { useState } from 'react';
// Para mostrar el mensaje de éxito
import { useAvisos } from '../../context/AvisosContexto';
// Llamadas al backend de usuarios
import { authService } from '../../services/greensmart';
import { ROLES } from '../../utils/formatos';
import VentanaModal from '../VentanaModal';
import { Campo, ErrorForm, Opciones, PieForm } from './CamposFormulario';

// Si llega "usuario" se edita; si no, se registra uno nuevo
export default function FormularioUsuario({ usuario, onCerrar, onGuardado }) {
    const { toast } = useAvisos();
    // Valores de los campos
    const [datos, setDatos] = useState({
        nombre: '',
        email: '',
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

        // Revisiones solo al registrar
        if (!usuario) {
            // Nombre, correo y contraseña son obligatorios
            if (!datos.nombre.trim() || !datos.email.trim() || !datos.password) {
                return setError('El nombre, el correo y la contraseña son obligatorios.');
            }
            // Las contraseñas deben ser iguales
            if (datos.password !== datos.confirmar) return setError('Las contraseñas no coinciden.');
        }

        setGuardando(true);
        try {
            if (usuario) {
                // Editar: cambia el rol solo si es diferente
                if (datos.rol !== usuario.rol) await authService.cambiarRol(usuario.id, datos.rol);
                toast('Usuario actualizado', `${usuario.nombre}: ${ROLES[datos.rol]}`);
            } else {
                // Registrar: el backend lo crea como Operario
                const { usuario: nuevo } = await authService.registrar(datos.nombre.trim(), datos.email.trim(), datos.password);
                // Si se eligió otro rol, se le asigna enseguida
                if (datos.rol !== nuevo.rol) await authService.cambiarRol(nuevo.id, datos.rol);
                toast('Usuario registrado', `${nuevo.nombre} · ${ROLES[datos.rol]}`);
            }
            onGuardado();
        } catch (err) {
            // Ej: "Ese email ya está registrado"
            setError(err.message);
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
                    // Editar: nombre y correo bloqueados (el backend aún no permite cambiarlos)
                    <>
                        <div className="info-banner">
                            <b>Próximamente:</b> actualizar nombre y correo estará disponible cuando se habilite en el servidor. Por ahora puedes cambiar el rol.
                        </div>
                        <div className="form-row-2">
                            <Campo etiqueta="Nombre completo">
                                <input className="form-input perfil-input" value={usuario.nombre} readOnly disabled />
                            </Campo>
                            <Campo etiqueta="Correo electrónico">
                                <input className="form-input perfil-input" value={usuario.email} readOnly disabled />
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
                    <select className="form-input select" value={datos.rol} onChange={cambiar('rol')}>
                        <Opciones mapa={ROLES} />
                    </select>
                </Campo>
            </form>
        </VentanaModal>
    );
}
