import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // showToast(message, type?, duration?, options?)
  // options: { position?: 'bottom-right' | 'top-center', subtitle?: string }
  // Si ya existe un toast con el mismo message+type+position, se reinicia su timer en lugar de apilarlo.
  const showToast = useCallback((message, type = 'info', duration = 3000, options = {}) => {
    const position = options.position ?? 'bottom-right';
    const subtitle  = options.subtitle ?? null;
    setToasts((prev) => {
      const exists = prev.find(
        (t) => t.message === message && t.type === type && t.position === position,
      );
      if (exists) {
        // Reasignar id reinicia el useEffect de countdown en el componente hijo
        return prev.map((t) =>
          t.id === exists.id ? { ...t, id: crypto.randomUUID(), duration } : t,
        );
      }
      return [...prev, { id: crypto.randomUUID(), message, type, duration, position, subtitle }];
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
