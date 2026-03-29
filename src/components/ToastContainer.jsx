import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const CONFIG = {
  success: {
    icon: CheckCircle2,
    border: 'border-green-500/40',
    iconColor: 'text-green-400',
    bar: 'bg-green-500',
  },
  error: {
    icon: AlertCircle,
    border: 'border-red-500/40',
    iconColor: 'text-red-400',
    bar: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-orange-500/40',
    iconColor: 'text-orange-400',
    bar: 'bg-orange-500',
  },
  info: {
    icon: Info,
    border: 'border-blue-500/40',
    iconColor: 'text-blue-400',
    bar: 'bg-blue-500',
  },
};

function Toast({ toast }) {
  const { removeToast } = useToast();
  const cfg = CONFIG[toast.type] ?? CONFIG.info;
  const Icon = cfg.icon;

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0,  scale: 1   }}
      exit={{    opacity: 0, x: 80, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`relative flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)]
        bg-gray-900 border ${cfg.border} rounded-xl shadow-xl shadow-black/40
        px-4 py-3 overflow-hidden`}
    >
      {/* Barra de progreso inferior */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: toast.duration / 1000, ease: 'linear' }}
      />

      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />

      <span className="flex-1 text-sm text-gray-200 leading-snug">
        {toast.message}
      </span>

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

export default function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
