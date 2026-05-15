import { useEffect, useRef, useState } from 'react';
import { Bell, X, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * FE-27 · Campana de notificaciones de alertas predictivas en la zona del
 * usuario. Recibe el conjunto de alertas no-vistas y los handlers de
 * marcado. El polling vive en `useAlertasZona` (Dashboard).
 */

const COLOR_NIVEL = {
  bajo:    'bg-gray-500/15 text-gray-300 border-gray-500/40',
  medio:   'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
  alto:    'bg-orange-500/15 text-orange-300 border-orange-500/40',
  critico: 'bg-red-500/15 text-red-300 border-red-500/40',
};

const Tendencia = ({ valor }) => {
  if (valor === 'subiendo') return <TrendingUp size={12} className="text-red-400" />;
  if (valor === 'bajando')  return <TrendingDown size={12} className="text-green-400" />;
  return <Minus size={12} className="text-gray-400" />;
};

export default function CampanaAlertas({
  count = 0,
  alertas = [],
  noVistas = [],
  onMarcarVista = () => {},
  onMarcarTodas = () => {},
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (disabled) return null;

  const verEnMapa = (a) => {
    onMarcarVista(a.zona_id ?? a.id);
    setOpen(false);
    // navegar al dashboard con coords en hash para permitir centrado posterior
    const lat = a?.centro?.lat;
    const lng = a?.centro?.lng;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      navigate(`/dashboard#zona=${lat.toFixed(5)},${lng.toFixed(5)}`);
    } else {
      navigate('/dashboard');
    }
  };

  const lista = noVistas.length > 0 ? noVistas : alertas.slice(0, 5);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={count > 0
          ? `Alertas en tu zona, ${count} sin leer`
          : 'Alertas en tu zona, sin novedades'}
        className="relative p-2 rounded-lg border border-gray-700 bg-gray-900 hover:border-gray-600 transition"
      >
        <Bell size={16} className="text-gray-300" />
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            aria-hidden
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-auto bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
            <p className="text-sm font-semibold text-white">Alertas en tu zona</p>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button
                  type="button"
                  onClick={onMarcarTodas}
                  className="text-[11px] text-gray-400 hover:text-gray-200"
                >
                  Marcar todas como vistas
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="text-gray-500 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {lista.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-400">No hay alertas en tu zona ahora mismo.</p>
              <p className="text-[11px] text-gray-600 mt-1">Te avisaremos si aparece alguna nueva.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-800">
              {lista.map((a) => (
                <li key={a.id} className="px-3 py-2.5 hover:bg-gray-800/40">
                  <button
                    type="button"
                    onClick={() => verEnMapa(a)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide border ${COLOR_NIVEL[a.nivel] ?? COLOR_NIVEL.medio}`}>
                        {a.nivel}
                      </span>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <MapPin size={10} />
                        {Number.isFinite(a.distancia_km) ? `${a.distancia_km} km` : '—'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 truncate">
                      {a.tipo ?? 'Riesgo'} {a.subcategoria ? `· ${a.subcategoria}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <Tendencia valor={a.tendencia} />
                      {a.municipio ?? '—'}
                      {typeof a.score === 'number' ? ` · score ${a.score}` : ''}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
