import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  RefreshCcw,
  MessageSquare,
  AlertTriangle,
  Info,
  Trash2,
} from 'lucide-react';
import { useNotificaciones } from '../../hooks/useNotificaciones';

/**
 * FE-29 · Campana de notificaciones in-app (badge contador + panel).
 *
 * Se monta en el Navbar solo cuando hay sesión (controlado desde el padre).
 * El polling y las acciones viven en `useNotificaciones`.
 */

const ICONO_TIPO = {
  reporte_estado:     RefreshCcw,
  reporte_comentario: MessageSquare,
  reporte_creado:     Info,
  alerta_zona:        AlertTriangle,
  sistema:            Info,
};

const COLOR_TIPO = {
  reporte_estado:     'text-blue-300',
  reporte_comentario: 'text-purple-300',
  reporte_creado:     'text-gray-300',
  alerta_zona:        'text-orange-300',
  sistema:            'text-gray-300',
};

function tiempoRelativo(iso) {
  if (!iso) return '';
  const fecha = new Date(iso);
  const diff = (Date.now() - fecha.getTime()) / 1000;
  if (diff < 60)         return 'hace un momento';
  if (diff < 3600)       return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400)      return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7)  return `hace ${Math.floor(diff / 86400)} d`;
  return fecha.toLocaleDateString();
}

export default function CampanaNotificaciones({ enabled = true }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const {
    noLeidas,
    items,
    cargandoLista,
    cargarLista,
    marcarLeida,
    marcarTodas,
    eliminar,
  } = useNotificaciones({ enabled });

  // Cerrar al click fuera y con Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!enabled) return null;

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next) cargarLista({ force: true });
      return next;
    });
  };

  const onItemClick = async (n) => {
    if (!n.leida) await marcarLeida(n.uuid);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const badge = noLeidas > 99 ? '99+' : noLeidas;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label={noLeidas > 0
          ? `Notificaciones, ${noLeidas} sin leer`
          : 'Notificaciones'}
        className="relative p-2 rounded-lg border border-gray-700 bg-gray-900 hover:border-gray-600 transition"
      >
        <Bell size={16} className="text-gray-300" />
        {noLeidas > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            aria-hidden
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(360px,calc(100vw-1.5rem))] max-h-[480px] overflow-hidden bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 shrink-0">
            <p className="text-sm font-semibold text-white">Notificaciones</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={marcarTodas}
                disabled={noLeidas === 0}
                className="text-[11px] text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Marcar todas como leídas
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="p-1 text-gray-400 hover:text-gray-200"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="overflow-y-auto">
            {cargandoLista && items.length === 0 && (
              <div className="p-3 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-md bg-gray-800/60 animate-pulse" />
                ))}
              </div>
            )}

            {!cargandoLista && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell size={28} className="opacity-40 mb-2" />
                <p className="text-sm">Sin notificaciones por ahora</p>
              </div>
            )}

            {items.length > 0 && (
              <ul className="divide-y divide-gray-800">
                {items.map((n) => {
                  const Icon = ICONO_TIPO[n.tipo] ?? Info;
                  const color = COLOR_TIPO[n.tipo] ?? 'text-gray-300';
                  return (
                    <li
                      key={n.uuid}
                      className={`group flex items-start gap-2 px-3 py-2 transition cursor-pointer ${
                        n.leida ? 'bg-transparent' : 'bg-green-500/5'
                      } hover:bg-gray-800/60`}
                      onClick={() => onItemClick(n)}
                    >
                      {/* Indicador no leída */}
                      <span
                        className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                          n.leida ? 'bg-transparent' : 'bg-green-400'
                        }`}
                        aria-hidden
                      />
                      <Icon size={16} className={`${color} mt-0.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.leida ? 'text-gray-300' : 'text-white font-medium'} truncate`}>
                          {n.titulo}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {n.mensaje}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {tiempoRelativo(n.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); eliminar(n.uuid); }}
                        aria-label="Eliminar notificación"
                        className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
