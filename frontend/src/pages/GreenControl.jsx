import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Cargando, ErrorCarga, Etiqueta, Vacio } from '../components/Mensajes';
import FormularioUsuario from '../components/formularios/FormularioUsuario';
import { IconoEditar, IconoMas } from '../components/Iconos';
import { useSesion } from '../context/SesionContexto';
import { useCarga } from '../hooks/useCarga';
import { authService } from '../services/greensmart';
import { fmtFecha, iniciales, ROLES } from '../utils/formatos';

// GreenControl: gestión del personal y sus roles (solo administrador de finca)
export default function GreenControl() {
    const { usuario: yo } = useSesion();
    const { busqueda } = useOutletContext();
    const [formulario, setFormulario] = useState(null);
    const { datos: usuarios, cargando, error, recargar } = useCarga(() => authService.listarUsuarios());

    const texto = busqueda.trim().toLowerCase();
    const visibles = (usuarios || []).filter((u) => !texto || `${u.nombre} ${u.email} ${ROLES[u.rol]}`.toLowerCase().includes(texto));

    return (
        <section>
            <div className="view-head">
                <div>
                    <div className="view-title">GreenControl</div>
                    <div className="view-sub">Gestión del personal de la finca y sus roles</div>
                </div>
                <button className="btn btn-primary btn-auto" onClick={() => setFormulario({})}>
                    <IconoMas size={16} /> Registrar usuario
                </button>
            </div>
            <div className="card">
                <div className="card-head">
                    <div className="card-title">Personal {usuarios && `(${visibles.length})`}</div>
                </div>
                {cargando && !usuarios && <Cargando />}
                {error && <ErrorCarga error={error} onReintentar={recargar} />}
                {usuarios && (visibles.length ? (
                    <div className="table-wrap">
                        <table className="tbl">
                            <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Registrado</th><th /></tr></thead>
                            <tbody>
                                {visibles.map((u) => (
                                    <tr key={u.id}>
                                        <td>
                                            <span className="row-thumb" style={{ borderRadius: '50%', fontSize: 11, fontWeight: 600, color: 'var(--green-700)' }}>
                                                {iniciales(u.nombre)}
                                            </span>
                                            <b>{u.nombre}</b> {u.id === yo.id && <span className="muted">(tú)</span>}
                                        </td>
                                        <td>{u.email}</td>
                                        <td><Etiqueta clase={u.rol.toLowerCase()}>{ROLES[u.rol]}</Etiqueta></td>
                                        <td className="nowrap">{fmtFecha(u.createdAt)}</td>
                                        <td className="cell-actions">
                                            <button
                                                className="action-btn edit-btn"
                                                title={u.id === yo.id ? 'No puedes cambiar tu propio rol' : 'Editar usuario'}
                                                aria-label="Editar usuario"
                                                disabled={u.id === yo.id}
                                                onClick={() => setFormulario({ usuario: u })}
                                            >
                                                <IconoEditar />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Vacio titulo="Sin usuarios" />
                ))}
            </div>

            {formulario && (
                <FormularioUsuario
                    usuario={formulario.usuario}
                    onCerrar={() => setFormulario(null)}
                    onGuardado={() => { setFormulario(null); recargar(); }}
                />
            )}
        </section>
    );
}
