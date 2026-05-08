import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { motion } from 'motion/react';
import { X, ZoomIn, RotateCw, Check, Loader2, AlertTriangle } from 'lucide-react';

/**
 * Crea una imagen recortada en formato JPEG (Blob) a partir de la imagen
 * original, las coordenadas devueltas por react-easy-crop y la rotación.
 *
 * Salida: 512x512 px, JPEG calidad 0.9 (≈80–120 KB en móviles típicos).
 */
async function getCroppedImageBlob(imageSrc, pixelCrop, rotation = 0, outputSize = 512) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Lienzo intermedio para aplicar la rotación sobre la imagen completa
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(radians);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Extrae el área recortada
  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

  // Lienzo de salida cuadrado (avatar)
  canvas.width = outputSize;
  canvas.height = outputSize;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Dibuja el área recortada escalada a outputSize x outputSize
  const tmp = document.createElement('canvas');
  tmp.width = pixelCrop.width;
  tmp.height = pixelCrop.height;
  tmp.getContext('2d').putImageData(data, 0, 0);
  ctx.drawImage(tmp, 0, 0, pixelCrop.width, pixelCrop.height, 0, 0, outputSize, outputSize);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.'))),
      'image/jpeg',
      0.9,
    );
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen seleccionada.'));
    img.src = src;
  });
}

/**
 * Modal de recorte de avatar.
 *
 * Props:
 *  - imageSrc: dataURL/objectURL de la imagen seleccionada por el usuario.
 *  - onCancel(): cerrar sin recortar.
 *  - onConfirm(blob): se invoca con el Blob JPEG recortado listo para subir.
 *  - uploading: si true, deshabilita controles y muestra spinner en "Subir".
 */
export default function AvatarCropperModal({ imageSrc, onCancel, onConfirm, uploading = false }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  // Cierra con Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !uploading && !processing) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, uploading, processing]);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setError('');
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, rotation, 512);
      await onConfirm(blob);
    } catch (err) {
      setError(err.message || 'No se pudo procesar la imagen.');
    } finally {
      setProcessing(false);
    }
  };

  const busy = processing || uploading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cropper-title"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-800">
          <div>
            <p id="cropper-title" className="text-sm font-semibold text-white mb-0.5">Ajustar foto de perfil</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Arrastra para reposicionar y usa el zoom para encuadrar tu foto.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !busy && onCancel()}
            className="p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors shrink-0 disabled:opacity-50"
            disabled={busy}
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cropper area */}
        <div className="relative bg-black w-full" style={{ height: 320 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            restrictPosition
          />
        </div>

        {/* Controles */}
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-400">
              <ZoomIn size={13} /> Zoom
              <span className="ml-auto text-[10px] text-gray-600 tabular-nums">{zoom.toFixed(2)}×</span>
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-green-500 disabled:opacity-50"
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-400">
              <RotateCw size={13} /> Rotación
              <span className="ml-auto text-[10px] text-gray-600 tabular-nums">{rotation}°</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1 accent-green-500 disabled:opacity-50"
                disabled={busy}
              />
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                disabled={busy}
                className="px-2 py-1 text-[11px] rounded-md border border-gray-700 hover:border-gray-600 hover:bg-gray-800 text-gray-400 transition-colors disabled:opacity-50"
                title="Rotar 90°"
              >
                +90°
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-300 leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-5 pt-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-secondary text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !croppedAreaPixels}
            className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            {busy
              ? <><Loader2 size={13} className="animate-spin" /> {uploading ? 'Subiendo…' : 'Procesando…'}</>
              : <><Check size={13} /> Aplicar</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
