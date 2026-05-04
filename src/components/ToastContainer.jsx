import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, LogOut, Leaf } from 'lucide-react';
import { useToast } from '../context/ToastContext';

/* ── Configuración por tipo ───────────────────────────────────────────────── */
const CONFIG = {
  success: {
    icon: CheckCircle2,
    border:    'border-green-500/40',
    bg:        'bg-green-500/8',
    iconColor: 'text-green-400',
    bar:       'bg-green-500',
    label:     'text-green-400',
  },
  error: {
    icon: AlertCircle,
    border:    'border-red-500/40',
    bg:        '',
    iconColor: 'text-red-400',
    bar:       'bg-red-500',
    label:     'text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    border:    'border-orange-500/40',
    bg:        '',
    iconColor: 'text-orange-400',
    bar:       'bg-orange-500',
    label:     'text-orange-400',
  },
  info: {
    icon: Info,
    border:    'border-blue-500/40',
    bg:        '',
    iconColor: 'text-blue-400',
    bar:       'bg-blue-500',
    label:     'text-blue-400',
  },
};

/* ── Toast compacto (bottom-right) ────────────────────────────────────────── */
function ToastCompact({ toast }) {
  const { removeToast } = useToast();
  const cfg  = CONFIG[toast.type] ?? CONFIG.info;
  const Icon = cfg.icon;

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 64, scale: 0.94 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 64, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className={`relative flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)]
        bg-gray-900 border ${cfg.border} rounded-xl shadow-2xl shadow-black/50
        px-4 py-3 overflow-hidden`}
    >
      <motion.div
        className={`absolute bottom-0 left-0 h-[2px] ${cfg.bar} origin-left`}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: toast.duration / 1000, ease: 'linear' }}
      />
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />
      <span className="flex-1 text-sm text-gray-200 leading-snug">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors mt-0.5"
        aria-label="Cerrar"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

/* ── Toast de autenticación (top-center) ──────────────────────────────────── */
const AUTH_CONFIG = {
  success: { Icon: Leaf,          iconColor: 'text-green-400',  iconBg: 'bg-green-500/12 border-green-500/30',  barColor: 'bg-green-500'  },
  info:    { Icon: LogOut,        iconColor: 'text-blue-400',   iconBg: 'bg-blue-500/12 border-blue-500/30',    barColor: 'bg-blue-500'   },
  error:   { Icon: AlertCircle,   iconColor: 'text-red-400',    iconBg: 'bg-red-500/12 border-red-500/30',      barColor: 'bg-red-500'    },
  warning: { Icon: AlertTriangle, iconColor: 'text-orange-400', iconBg: 'bg-orange-500/12 border-orange-500/30', barColor: 'bg-orange-500' },
};

function ToastAuth({ toast }) {
  const { removeToast } = useToast();
  const { Icon, iconColor, iconBg, barColor } = AUTH_CONFIG[toast.type] ?? AUTH_CONFIG.info;

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -28, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,   scale: 1    }}
      exit={{    opacity: 0, y: -20, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className="relative flex items-center gap-4 min-w-[280px] max-w-[22rem]
        bg-gray-900/95 border border-gray-700/70 backdrop-blur-xl
        rounded-2xl shadow-2xl shadow-black/60 px-5 py-4 overflow-hidden"
    >
      {/* Progress bar at top */}
      <motion.div
        className={`absolute top-0 left-0 h-[2px] ${barColor} origin-left`}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: toast.duration / 1000, ease: 'linear' }}
      />

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{toast.message}</p>
        {toast.subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{toast.subtitle}</p>
        )}
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors ml-1"
        aria-label="Cerrar"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

/* ── Contenedor principal ─────────────────────────────────────────────────── */
export default function ToastContainer() {
  const { toasts } = useToast();

  const bottomRight = toasts.filter((t) => t.position !== 'top-center');
  const topCenter   = toasts.filter((t) => t.position === 'top-center');

  return (
    <>
      {/* Bottom-right: notificaciones normales */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {bottomRight.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastCompact toast={t} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top-center: notificaciones de autenticación */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          {topCenter.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastAuth toast={t} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

