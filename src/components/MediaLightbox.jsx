import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ImageOff, Download } from 'lucide-react';

/**
 * Lightbox accesible para visualizar evidencias en grande.
 *
 * Props:
 *  - items: Array<{ url_archivo, nombre_original, mime_type, tipo_archivo }>
 *  - index: índice activo (controlado por el padre); null/undefined → cerrado
 *  - onClose: () => void
 *  - onChange: (nuevoIndex) => void — para navegación con flechas
 */
export default function MediaLightbox({ items = [], index, onClose, onChange }) {
  const open = typeof index === 'number' && index >= 0 && index < items.length;
  const current = open ? items[index] : null;
  const [imgError, setImgError] = useState(false);

  const isVideo = (it) =>
    it?.mime_type?.startsWith('video/') || it?.tipo_archivo === 'video';

  const goPrev = useCallback(() => {
    if (!open) return;
    const next = index === 0 ? items.length - 1 : index - 1;
    setImgError(false);
    onChange?.(next);
  }, [open, index, items.length, onChange]);

  const goNext = useCallback(() => {
    if (!open) return;
    const next = index === items.length - 1 ? 0 : index + 1;
    setImgError(false);
    onChange?.(next);
  }, [open, index, items.length, onChange]);

  // Reset error al cambiar de item
  useEffect(() => { setImgError(false); }, [index]);

  // Atajos de teclado: Esc cierra, flechas navegan
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    // Bloquea scroll del body
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, goPrev, goNext]);

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Visor de evidencias"
          onClick={onClose}
        >
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Cerrar visor"
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>

          {/* Descargar */}
          {current.url_archivo && !isVideo(current) && (
            <a
              href={current.url_archivo}
              download={current.nombre_original ?? undefined}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-16 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Abrir en pestaña nueva"
              title="Abrir original"
            >
              <Download size={18} />
            </a>
          )}

          {/* Anterior / Siguiente (solo si hay más de uno) */}
          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Evidencia anterior"
                title="Anterior (←)"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Evidencia siguiente"
                title="Siguiente (→)"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Contenido (no propaga click para no cerrar) */}
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-[92vw] max-h-[88vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo(current) ? (
              <video
                src={current.url_archivo}
                controls
                autoPlay
                className="max-w-[92vw] max-h-[80vh] rounded-lg shadow-2xl bg-black"
              />
            ) : imgError ? (
              <div className="w-72 h-48 flex flex-col items-center justify-center gap-3 text-gray-400 bg-gray-900 rounded-lg">
                <ImageOff size={36} />
                <span className="text-sm">No se pudo cargar la imagen</span>
              </div>
            ) : (
              <img
                src={current.url_archivo}
                alt={current.nombre_original ?? 'Evidencia'}
                className="max-w-[92vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
                onError={() => setImgError(true)}
              />
            )}

            {/* Pie con nombre + contador */}
            <div className="mt-3 flex items-center justify-between gap-4 w-full text-xs text-gray-300">
              <span className="truncate">
                {current.nombre_original ?? (isVideo(current) ? 'Video' : 'Imagen')}
              </span>
              {items.length > 1 && (
                <span className="text-gray-400 tabular-nums shrink-0">
                  {index + 1} / {items.length}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
