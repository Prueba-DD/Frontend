/**
 * NebulaBackground — lava-lamp CSS blobs usando los keyframes globales
 * (lava-rise-1/2/3 definidos en index.css)
 *
 * Props:
 *   dim     (bool) — reduce opacidades al ~40% (paneles auth, About, VerificarEmail)
 *   compact (bool) — blobs más pequeños para paneles estrechos (auth left panel)
 */
export default function NebulaBackground({ dim = false, compact = false }) {
  const o = (v) => dim ? +(v * 0.42).toFixed(3) : v;

  if (compact) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Central */}
        <div className="absolute rounded-full" style={{
          left: 'calc(50% - 240px)', bottom: '-12%',
          width: '480px', height: '380px',
          background: `radial-gradient(ellipse at center, rgba(34,197,94,${o(0.20)}) 0%, rgba(16,185,129,${o(0.09)}) 55%, transparent 72%)`,
          filter: 'blur(60px)',
          animation: 'lava-rise-1 16s ease-in-out infinite',
          willChange: 'transform',
        }} />
        {/* Izquierda */}
        <div className="absolute rounded-full" style={{
          left: '-8%', bottom: '-18%',
          width: '340px', height: '280px',
          background: `radial-gradient(ellipse at center, rgba(16,185,129,${o(0.15)}) 0%, transparent 72%)`,
          filter: 'blur(52px)',
          animation: 'lava-rise-2 20s ease-in-out infinite',
          animationDelay: '-5s',
          willChange: 'transform',
        }} />
        {/* Derecha */}
        <div className="absolute rounded-full" style={{
          right: '-6%', bottom: '-14%',
          width: '300px', height: '260px',
          background: `radial-gradient(ellipse at center, rgba(20,184,166,${o(0.13)}) 0%, transparent 72%)`,
          filter: 'blur(48px)',
          animation: 'lava-rise-3 18s ease-in-out infinite',
          animationDelay: '-10s',
          willChange: 'transform',
        }} />
        {/* Núcleo brillante */}
        <div className="absolute rounded-full" style={{
          left: 'calc(50% - 90px)', bottom: '-6%',
          width: '180px', height: '150px',
          background: `radial-gradient(ellipse at center, rgba(74,222,128,${o(0.21)}) 0%, transparent 68%)`,
          filter: 'blur(32px)',
          animation: 'lava-rise-1 12s ease-in-out infinite',
          animationDelay: '-3s',
          willChange: 'transform',
        }} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Masa central principal */}
      <div className="absolute rounded-full" style={{
        left: 'calc(50% - 380px)', bottom: '-10%',
        width: '760px', height: '600px',
        background: `radial-gradient(ellipse at center, rgba(34,197,94,${o(0.20)}) 0%, rgba(16,185,129,${o(0.09)}) 52%, transparent 72%)`,
        filter: 'blur(68px)',
        animation: 'lava-rise-1 18s ease-in-out infinite',
        willChange: 'transform',
      }} />
      {/* Masa izquierda esmeralda */}
      <div className="absolute rounded-full" style={{
        left: '-8%', bottom: '-15%',
        width: '540px', height: '440px',
        background: `radial-gradient(ellipse at center, rgba(16,185,129,${o(0.17)}) 0%, transparent 74%)`,
        filter: 'blur(58px)',
        animation: 'lava-rise-2 23s ease-in-out infinite',
        animationDelay: '-7s',
        willChange: 'transform',
      }} />
      {/* Masa derecha teal */}
      <div className="absolute rounded-full" style={{
        right: '-6%', bottom: '-12%',
        width: '480px', height: '420px',
        background: `radial-gradient(ellipse at center, rgba(20,184,166,${o(0.15)}) 0%, transparent 74%)`,
        filter: 'blur(56px)',
        animation: 'lava-rise-3 20s ease-in-out infinite',
        animationDelay: '-12s',
        willChange: 'transform',
      }} />
      {/* Núcleo pequeño brillante */}
      <div className="absolute rounded-full" style={{
        left: 'calc(50% - 150px)', bottom: '-5%',
        width: '300px', height: '240px',
        background: `radial-gradient(ellipse at center, rgba(74,222,128,${o(0.21)}) 0%, transparent 68%)`,
        filter: 'blur(34px)',
        animation: 'lava-rise-1 14s ease-in-out infinite',
        animationDelay: '-5s',
        willChange: 'transform',
      }} />
      {/* Gota izquierda */}
      <div className="absolute rounded-full" style={{
        left: '22%', bottom: '-8%',
        width: '200px', height: '180px',
        background: `radial-gradient(ellipse at center, rgba(34,197,94,${o(0.17)}) 0%, transparent 72%)`,
        filter: 'blur(28px)',
        animation: 'lava-rise-2 16s ease-in-out infinite',
        animationDelay: '-3s',
        willChange: 'transform',
      }} />
    </div>
  );
}
