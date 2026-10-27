// Calendario del mes con las actividades en el día que están programadas

import { useState } from 'react';
import { estaVencida, etiqueta, hoyColombia, TIPOS_ACTIVIDAD } from '../utils/formatos';

// Nombres de los días (la semana empieza el lunes)
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Convierte año, mes y día en "AAAA-MM-DD"
const aTexto = (anio, mes, dia) => `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

export default function Calendario({ actividades, onClickActividad }) {
    // Hoy como "AAAA-MM-DD"
    const hoy = hoyColombia();
    // Mes que se está viendo (empieza en el mes actual)
    const [mes, setMes] = useState({ anio: Number(hoy.slice(0, 4)), mes: Number(hoy.slice(5, 7)) - 1 });

    // Cambia de mes: -1 = anterior, +1 = siguiente
    const mover = (n) => {
        const fecha = new Date(Date.UTC(mes.anio, mes.mes + n, 1));
        setMes({ anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() });
    };

    // Cuántos días tiene el mes
    const diasDelMes = new Date(Date.UTC(mes.anio, mes.mes + 1, 0)).getUTCDate();
    // Casillas vacías antes del día 1 (lunes = 0)
    const vacias = (new Date(Date.UTC(mes.anio, mes.mes, 1)).getUTCDay() + 6) % 7;

    // Agrupa las actividades por día: { "2026-10-27": [ ... ] }
    const porDia = {};
    actividades.forEach((a) => {
        const dia = a.fechaProgramada.slice(0, 10);
        (porDia[dia] = porDia[dia] || []).push(a);
    });

    // Lista de casillas: null = vacía, número = día del mes
    const casillas = [...Array(vacias).fill(null), ...Array.from({ length: diasDelMes }, (_, i) => i + 1)];

    return (
        <div className="cal">
            {/* Mes y botones para cambiar */}
            <div className="cal-head">
                <button className="btn btn-ghost btn-auto btn-sm" onClick={() => mover(-1)} aria-label="Mes anterior">←</button>
                <div className="card-title">{MESES[mes.mes]} {mes.anio}</div>
                <button className="btn btn-ghost btn-auto btn-sm" onClick={() => mover(1)} aria-label="Mes siguiente">→</button>
            </div>

            {/* Cuadrícula: siempre se puede desplazar si la pantalla es pequeña */}
            <div className="cal-scroll">
                <div className="cal-grid">
                    {/* Nombres de los días */}
                    {DIAS.map((d) => <div key={d} className="cal-dia-nombre">{d}</div>)}

                    {/* Un cuadro por cada día */}
                    {casillas.map((dia, i) => {
                        // Casilla vacía antes del día 1
                        if (!dia) return <div key={`v${i}`} className="cal-dia vacio" />;
                        const texto = aTexto(mes.anio, mes.mes, dia);
                        const lista = porDia[texto] || [];
                        return (
                            <div key={texto} className={`cal-dia ${texto === hoy ? 'hoy' : ''}`}>
                                <div className="cal-numero">{dia}</div>
                                {/* Actividades de ese día; el color depende del estado */}
                                {lista.map((a) => (
                                    <button
                                        key={a.id}
                                        className={`cal-act ${estaVencida(a) ? 'vencida' : a.estado.toLowerCase()}`}
                                        title={`${etiqueta(TIPOS_ACTIVIDAD, a.tipo)} · ${a.lote?.nombre || ''}${a.asignadoA ? ` · ${a.asignadoA.nombre}` : ''}`}
                                        onClick={() => onClickActividad(a)}
                                    >
                                        {etiqueta(TIPOS_ACTIVIDAD, a.tipo)} · {a.lote?.nombre}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Explicación de los colores */}
            <div className="cal-leyenda">
                <span><i className="cal-punto pendiente" /> Pendiente</span>
                <span><i className="cal-punto en_proceso" /> En proceso</span>
                <span><i className="cal-punto completada" /> Completada</span>
                <span><i className="cal-punto cancelada" /> Cancelada</span>
                <span><i className="cal-punto vencida" /> Vencida</span>
            </div>
        </div>
    );
}
