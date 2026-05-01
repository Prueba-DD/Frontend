import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

/**
 * LineChart SVG — serie temporal con área, animación de trazo, hover dots.
 * Diseñado para mostrar reportes por semana/mes (FE-20).
 *
 * @param {Array<{ periodo, total }>} data        — orden cronológico ascendente
 * @param {string} bucket                          — 'week' | 'month' (afecta formato de label)
 * @param {string} color                           — color principal (default verde)
 */
export default function LineChart({ data = [], bucket = 'week', color = '#22c55e' }) {
  const W = 600;
  const H = 200;
  const PAD = { top: 14, right: 14, bottom: 26, left: 32 };

  const [hover, setHover] = useState(null);

  const { points, max, xs, areaPath, linePath } = useMemo(() => {
    if (!data.length) return { points: [], max: 0, xs: [], areaPath: '', linePath: '' };
    const max = Math.max(...data.map(d => Number(d.total) || 0), 1);
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const stepX = data.length === 1 ? 0 : innerW / (data.length - 1);

    const points = data.map((d, i) => {
      const x = PAD.left + stepX * i;
      const y = PAD.top + innerH - (Number(d.total) / max) * innerH;
      return { x, y, ...d };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points.at(-1).x} ${PAD.top + innerH} L ${points[0].x} ${PAD.top + innerH} Z`;

    return { points, max, xs: points.map(p => p.x), areaPath, linePath };
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex-1 flex items-center justify-center py-10 text-sm text-gray-600">
        Sin datos para el rango seleccionado
      </div>
    );
  }

  // Etiquetas X: si hay > 8, mostramos solo cada N para evitar solapamiento
  const stepLabel = Math.ceil(data.length / 8);

  // Formatea el label del eje X según bucket
  const fmtLabel = (periodo) => {
    if (!periodo) return '';
    if (bucket === 'month') {
      // 'YYYY-MM' → 'mmm yy'
      const [y, m] = periodo.split('-');
      const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
      return `${meses[Number(m) - 1] ?? m} ${y?.slice(2)}`;
    }
    // 'YYYY-Www' → 'Sww'
    const w = periodo.split('-W')[1];
    return `S${w}`;
  };

  // Y-axis ticks (4 niveles: 0, 1/3, 2/3, max)
  const yTicks = [0, max / 3, (max * 2) / 3, max].map(v => Math.round(v));

  return (
    <div className="w-full" role="img" aria-label="Gráfico temporal de reportes">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y grid + labels */}
        {yTicks.map((t, i) => {
          const y = PAD.top + (H - PAD.top - PAD.bottom) - (t / max) * (H - PAD.top - PAD.bottom);
          return (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#1f2937" strokeWidth="0.6" strokeDasharray="2 3" />
              <text x={PAD.left - 6} y={y + 3} fontSize="9" fill="#6b7280" textAnchor="end">{t}</text>
            </g>
          );
        })}

        {/* Área */}
        <motion.path
          d={areaPath}
          fill="url(#lineFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        />

        {/* Línea */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Dots + hover targets */}
        {points.map((p, i) => (
          <g key={i}>
            <motion.circle
              cx={p.x} cy={p.y} r="3"
              fill="#0a0a0a" stroke={color} strokeWidth="1.8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.04 }}
            />
            {/* invisible larger hit area */}
            <circle
              cx={p.x} cy={p.y} r="10"
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}

        {/* X labels */}
        {points.map((p, i) => (
          (i % stepLabel === 0 || i === points.length - 1) && (
            <text key={i} x={p.x} y={H - 8} fontSize="9" fill="#6b7280" textAnchor="middle">
              {fmtLabel(p.periodo)}
            </text>
          )
        ))}

        {/* Tooltip */}
        {hover !== null && points[hover] && (
          <g style={{ pointerEvents: 'none' }}>
            <line
              x1={points[hover].x} x2={points[hover].x}
              y1={PAD.top} y2={H - PAD.bottom}
              stroke={color} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.4"
            />
            <rect
              x={Math.min(points[hover].x + 6, W - 70)}
              y={Math.max(points[hover].y - 26, PAD.top)}
              width="64" height="22" rx="4"
              fill="#0f172a" stroke={color} strokeWidth="0.8"
            />
            <text
              x={Math.min(points[hover].x + 38, W - 38)}
              y={Math.max(points[hover].y - 13, PAD.top + 13)}
              fontSize="9" fill="#9ca3af" textAnchor="middle"
            >
              {fmtLabel(points[hover].periodo)}
            </text>
            <text
              x={Math.min(points[hover].x + 38, W - 38)}
              y={Math.max(points[hover].y - 4, PAD.top + 22)}
              fontSize="11" fontWeight="700" fill={color} textAnchor="middle"
            >
              {points[hover].total} {points[hover].total === 1 ? 'reporte' : 'reportes'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
