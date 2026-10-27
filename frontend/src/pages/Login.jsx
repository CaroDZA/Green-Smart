// Página de inicio de sesión

import { useState } from 'react';
import logo from '../assets/logo.png';
import { ErrorForm } from '../components/formularios/CamposFormulario';
import { IconoLuna, IconoSol } from '../components/Iconos';
import VentanaApariencia from '../components/VentanaApariencia';
import { useSesion } from '../context/SesionContexto';
import { useTema } from '../context/TemaContexto';

// Campo de contraseña con botón de ojo para verla
function CampoPassword({ value, onChange, autoComplete }) {
    // true = se ve la contraseña
    const [visible, setVisible] = useState(false);
    return (
        <div className="pwd-field">
            <input
                // Texto visible o puntos
                type={visible ? 'text' : 'password'}
                className="form-input"
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                required
            />
            {/* Botón del ojo: muestra u oculta */}
            <button
                type="button"
                className={`pwd-toggle ${visible ? 'showing' : ''}`}
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title="Mostrar/ocultar contraseña"
            >
                {/* Ojo abierto */}
                <svg className="eye-on" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                {/* Ojo tachado */}
                <svg className="eye-off" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            </button>
        </div>
    );
}

// Pantalla "Restablecer contraseña"
// En el backend solo el administrador puede poner una contraseña nueva
function RestablecerPassword({ onVolver }) {
    return (
        <div>
            {/* Volver al login */}
            <button type="button" className="back-link" onClick={onVolver}>← Volver al inicio de sesión</button>
            {/* Explica qué hacer */}
            <div className="info-banner">
                Pídele al <b>administrador de la finca</b> que te asigne una contraseña nueva desde <b>SmartControl</b>.
                Después inicia sesión con ella.
            </div>
            <button type="button" className="btn btn-primary" onClick={onVolver}>Entendido</button>
        </div>
    );
}

// Página de login (RF-01). Las cuentas se crean en SmartControl
export default function Login() {
    const { iniciarSesion } = useSesion();
    const { tema } = useTema();
    // Ventana de apariencia abierta
    const [temaAbierto, setTemaAbierto] = useState(false);
    // true = se muestra "Restablecer contraseña"
    const [recuperando, setRecuperando] = useState(false);
    // Correo y contraseña escritos
    const [datos, setDatos] = useState({ email: '', password: '' });
    // Mensaje de error
    const [error, setError] = useState('');
    // true mientras espera al backend
    const [enviando, setEnviando] = useState(false);

    // Guarda lo que se escribe en un campo
    const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

    // Al presionar "Iniciar sesión"
    const enviar = async (e) => {
        e.preventDefault();
        setError('');
        setEnviando(true);
        try {
            // Si es correcto, la app pasa sola al dashboard
            await iniciarSesion(datos.email.trim(), datos.password);
        } catch (err) {
            // Ej: "Email o contraseña incorrectos"
            setError(err.message);
            setEnviando(false);
        }
    };

    return (
        <div className="login-screen">
            {/* Botón de modo oscuro (arriba a la derecha) */}
            <button className="icon-btn login-theme-btn" onClick={() => setTemaAbierto(true)} aria-label="Cambiar apariencia" title="Apariencia">
                {tema === 'dark' ? <IconoSol /> : <IconoLuna />}
            </button>

            <div className="login-card">
                {/* Logo y títulos */}
                <div className="login-logo">
                    <img src={logo} alt="GreenSmart" />
                    <div className="login-title">{recuperando ? 'Restablecer contraseña' : 'Bienvenido'}</div>
                    <div className="login-sub">
                        {recuperando ? '¿Olvidaste tu contraseña?' : 'Inicia sesión en tu cuenta GreenSmart'}
                    </div>
                </div>

                {/* Muestra "Restablecer" o el formulario de login */}
                {recuperando ? (
                    <RestablecerPassword onVolver={() => setRecuperando(false)} />
                ) : (
                <form onSubmit={enviar}>
                    <ErrorForm mensaje={error} />
                    <div className="form-group">
                        <label className="form-label">Correo electrónico</label>
                        <input type="email" className="form-input" value={datos.email} onChange={cambiar('email')} autoComplete="email" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <CampoPassword value={datos.password} onChange={cambiar('password')} autoComplete="current-password" />
                    </div>
                    {/* Enlace "¿Olvidaste tu contraseña?" */}
                    <div className="form-row" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="link-btn" onClick={() => { setError(''); setRecuperando(true); }}>
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={enviando}>
                        {enviando ? 'Un momento…' : 'Iniciar sesión'}
                    </button>
                </form>
                )}

                {/* Usuarios de prueba (solo se ve mientras programamos) */}
                {import.meta.env.DEV && !recuperando && (
                    <div className="login-foot">
                        Demo (seed): <strong>admin@greensmart.com</strong>, <strong>coordinador@greensmart.com</strong> u <strong>operario@greensmart.com</strong> · contraseña 123456 (o la de SEED_PASSWORD)
                    </div>
                )}
            </div>

            {/* Ventana de apariencia */}
            {temaAbierto && <VentanaApariencia onCerrar={() => setTemaAbierto(false)} />}
        </div>
    );
}
