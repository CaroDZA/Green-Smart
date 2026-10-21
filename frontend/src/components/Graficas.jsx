// Gráficas de dona y de barras, dibujadas a mano con SVG

import { useState } from 'react';

// Cuadrito con información que sale al pasar el mouse
function useTooltip() {
    // Posición y texto del cuadrito (null = oculto)
    const [tip, setTip] = useState(null);
    // Lo muestra al lado del mouse
    const mostrar = (e, contenido) => setTip({ x: e.clientX + 12, y: e.clientY + 12, contenido });
    // Lo oculta
    const ocultar = () => setTip(null);
    // El cuadrito
    const nodo = tip && (
        <div className="chart-tooltip" style={{ left: tip.x, top: tip.y }}>{tip.contenido}</div>
    );
    return { mostrar, ocultar, nodo };
}

// ---------- DONA ----------
// datos: lista de { etiqueta, valor, color }
export function Dona({ datos, centro, subCentro }) {
    const { mostrar, ocultar, nodo } = useTooltip();
    // Suma de todos los valores
    const total = datos.reduce((s, d) => s + d.valor, 0);
    // Centro, radio y grosor del anillo
    const cx = 100, cy = 100, r = 70, sw = 22;
    // Largo del borde del círculo
    const C = 2 * Math.PI * r;
    // Espacio pequeño entre las partes
    const gap = datos.filter((d) => d.valor > 0).length > 1 ? 2 : 0;
    // Cuánto del círculo ya se dibujó
    let acumulado = 0;

    return (
        <div className="donut-wrap">
            <svg viewBox="0 0 200 200" width="170" height="170" className="chart-svg" role="img" aria-label={subCentro}>
                {/* Anillo gris de fondo */}
                <circle cx={cx} cy={cy} r={r} stroke="var(--bg-hover)" strokeWidth={sw} fill="none" />
                {/* Un pedazo del anillo por cada dato */}
                {total > 0 && datos.map((d) => {
                    // Los valores en 0 no se dibujan
                    if (!d.valor) return null;
                    // Porción del total (0.5 = la mitad)
                    const frac = d.valor / total;
                    // Largo del pedazo
                    const largo = Math.max(frac * C - gap, 0.5);
                    // Dónde empieza el pedazo
                    const offset = -acumulado * C;
                    acumulado += frac;
                    return (
                        <circle
                            key={d.etiqueta}
                            cx={cx} cy={cy} r={r}
                            stroke={d.color} strokeWidth={sw} fill="none"
                            // Dibuja solo el pedazo que corresponde
                            strokeDasharray={`${largo} ${C - largo}`}
                            strokeDashoffset={offset}
                            // Empieza arriba
                            transform={`rotate(-90 ${cx} ${cy})`}
                            // Al pasar el mouse muestra nombre, valor y porcentaje
                            onMouseMove={(e) => mostrar(e, <><b>{d.etiqueta}</b>: {d.valor} ({Math.round(frac * 100)}%)</>)}
                            onMouseLeave={ocultar}
                        />
                    );
                })}
                {/* Número grande del centro */}
                <text x="100" y="100" textAnchor="middle" fill="var(--text-primary)" fontSize="26" fontWeight="600">{centro ?? total}</text>
                {/* Texto pequeño debajo del número */}
                <text x="100" y="118" textAnchor="middle" fill="var(--text-muted)" fontSize="9" letterSpacing="1.5">
                    {(subCentro || 'TOTAL').toUpperCase()}
                </text>
            </svg>
            {/* Leyenda: color, nombre y valor */}
            <div className="chart-legend">
                {datos.map((d) => (
                    <div className="chart-legend-row" key={d.etiqueta}>
                        <span className="sw" style={{ background: d.color }} />
                        <span className="lbl">{d.etiqueta}</span>
                        <span className="val">{d.valor}</span>
                    </div>
                ))}
            </div>
            {nodo}
        </div>
    );
}

// ---------- BARRAS ----------
// datos: lista de { etiqueta, valor }
export function Barras({ datos, unidad = '' }) {
    const { mostrar, ocultar, nodo } = useTooltip();
    // Tamaño del dibujo y márgenes
    const w = 580, h = 240, padL = 34, padR = 12, padT = 18, padB = 34;
    // Valor más alto
    const maxDato = Math.max(...datos.map((d) => d.valor), 1);
    // Cada cuánto va una línea guía
    const paso = Math.max(1, Math.ceil(maxDato / 4));
    // Cuántas líneas guía hay
    const lineas = Math.ceil(maxDato / paso);
    // Valor del tope de la gráfica
    const max = paso * lineas;
    // Alto disponible para las barras
    const alto = h - padT - padB;
    // Ancho del espacio de cada barra
    const bw = (w - padL - padR) / Math.max(datos.length, 1);
    // Convierte un valor en altura dentro del dibujo
    const y = (v) => h - padB - (v / max) * alto;

    return (
        <>
            <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="240" className="chart-svg" role="img">
                {/* Color verde degradado de las barras */}
                <defs>
                    <linearGradient id="gsBarra" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--green-500)" />
                        <stop offset="100%" stopColor="var(--green-700)" />
                    </linearGradient>
                </defs>
                {/* Líneas guía horizontales con su número */}
                {Array.from({ length: lineas + 1 }, (_, i) => (
                    <g key={i}>
                        <line x1={padL} x2={w - padR} y1={y(i * paso)} y2={y(i * paso)} stroke="var(--border-soft)" />
                        <text x={padL - 6} y={y(i * paso) + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">{i * paso}</text>
                    </g>
                ))}
                {/* Una barra por cada dato */}
                {datos.map((d, i) => {
                    // Ancho de la barra
                    const bbw = Math.min(bw * 0.62, 46);
                    // Posición de la barra
                    const x = padL + i * bw + (bw - bbw) / 2;
                    // Alto de la barra
                    const bh = (d.valor / max) * alto;
                    // Redondeo de las esquinas de arriba
                    const r = Math.min(4, bh);
                    // Forma de la barra con esquinas redondeadas arriba
                    const path = `M${x},${h - padB} V${h - padB - bh + r} Q${x},${h - padB - bh} ${x + r},${h - padB - bh} H${x + bbw - r} Q${x + bbw},${h - padB - bh} ${x + bbw},${h - padB - bh + r} V${h - padB} Z`;
                    return (
                        <g
                            key={d.etiqueta}
                            // Al pasar el mouse muestra nombre y valor
                            onMouseMove={(e) => mostrar(e, <><b>{d.etiqueta}</b>: {d.valor} {unidad}</>)}
                            onMouseLeave={ocultar}
                        >
                            {/* Zona invisible para que sea fácil pasar el mouse */}
                            <rect x={padL + i * bw} y={padT} width={bw} height={alto} fill="transparent" />
                            {/* La barra */}
                            {bh > 0 && <path d={path} fill="url(#gsBarra)" />}
                            {/* Número encima de la barra */}
                            {d.valor > 0 && (
                                <text x={x + bbw / 2} y={h - padB - bh - 6} fill="var(--text-secondary)" fontSize="10" fontWeight="600" textAnchor="middle">{d.valor}</text>
                            )}
                            {/* Nombre debajo de la barra */}
                            <text x={x + bbw / 2} y={h - 14} fill="var(--text-muted)" fontSize="10" textAnchor="middle">{d.etiqueta}</text>
                        </g>
                    );
                })}
            </svg>
            {nodo}
        </>
    );
}
