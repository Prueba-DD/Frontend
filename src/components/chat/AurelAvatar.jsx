// FE-28 · Avatar de AUREL — se muestra el PNG tal cual, sin contenedor circular.
// El indicador de estado ambiental aparece como un pequeño punto debajo.

const TAMAÑOS = {
  xs: 'w-9 h-9',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-28 h-28',
};

const ESTADO_COLOR = {
  optimo:       'bg-green-500',
  moderado:     'bg-teal-400',
  alerta:       'bg-amber-400',
  critico:      'bg-orange-500',
  recuperacion: 'bg-purple-400',
};

const DOT = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

/**
 * @param {{ size?: 'xs'|'sm'|'md'|'lg', estado?: string, showDot?: boolean, className?: string }} props
 */
export default function AurelAvatar({ size = 'sm', estado = 'optimo', showDot = true, className = '' }) {
  const wrap     = TAMAÑOS[size] ?? TAMAÑOS.sm;
  const dotSize  = DOT[size] ?? DOT.sm;
  const dotColor = ESTADO_COLOR[estado] ?? ESTADO_COLOR.optimo;

  return (
    <div className={`relative ${wrap} flex-shrink-0 ${className}`}>
      <img
        src="/aurel.png"
        alt="AUREL"
        className="w-full h-full object-contain select-none"
        draggable={false}
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}
      />
      {showDot && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${dotSize} ${dotColor} rounded-full ring-2 ring-gray-900`}
          aria-label={`Estado ambiental: ${estado}`}
        />
      )}
    </div>
  );
}
