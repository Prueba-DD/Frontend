import { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { toggleLikeReporte } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Botón de like con actualización optimista. Si no hay sesión, redirige
 * (visualmente) al toast pidiendo iniciar sesión. La respuesta del servidor
 * sobreescribe el estado local para mantener el contador en sincronía.
 *
 * Props:
 *  - id_reporte: number (requerido)
 *  - liked: boolean inicial
 *  - count: number (votos_relevancia) inicial
 *  - size: 'sm' | 'md' | 'lg' — tamaño visual
 *  - ownerId?: number — id del autor del reporte; si coincide con el usuario en sesión,
 *    el botón aparece deshabilitado (no se puede dar like al propio reporte).
 *  - onChange?: (next: { liked, count }) => void — para que el padre sincronice
 */
export default function LikeButton({
  id_reporte,
  liked: likedProp = false,
  count: countProp = 0,
  size = 'md',
  ownerId,
  onChange,
  className = '',
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [liked, setLiked] = useState(!!likedProp);
  const [count, setCount] = useState(Number(countProp) || 0);
  const [loading, setLoading] = useState(false);

  const isOwner = !!(user && ownerId != null && Number(user.id_usuario) === Number(ownerId));

  const dims = size === 'lg'
    ? { wrap: 'px-4 py-2 text-sm gap-2', icon: 18 }
    : size === 'sm'
      ? { wrap: 'px-2.5 py-1 text-xs gap-1', icon: 14 }
      : { wrap: 'px-3 py-1.5 text-sm gap-1.5', icon: 16 };

  const sync = (next) => {
    setLiked(next.liked);
    setCount(next.count);
    onChange?.(next);
  };

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    if (!user) {
      showToast('Inicia sesión para reaccionar a los reportes.', 'info');
      return;
    }
    if (isOwner) {
      showToast('No puedes reaccionar a tu propio reporte.', 'info');
      return;
    }

    // Optimista
    const prev = { liked, count };
    sync({ liked: !liked, count: liked ? Math.max(0, count - 1) : count + 1 });
    setLoading(true);
    try {
      const { data } = await toggleLikeReporte(id_reporte);
      const payload = data?.data ?? {};
      sync({
        liked: !!payload.liked,
        count: Number(payload.votos_relevancia ?? prev.count),
      });
    } catch (err) {
      // Rollback en error
      sync(prev);
      const msg = err?.response?.data?.message || 'No se pudo registrar tu like.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={loading || isOwner}
      whileTap={isOwner ? undefined : { scale: 0.92 }}
      aria-pressed={liked}
      aria-label={
        isOwner
          ? 'No puedes reaccionar a tu propio reporte'
          : liked ? 'Quitar like del reporte' : 'Dar like al reporte'
      }
      title={
        isOwner
          ? 'No puedes reaccionar a tu propio reporte'
          : liked ? 'Quitar like' : 'Dar like'
      }
      className={[
        'inline-flex items-center font-medium rounded-full border transition-colors select-none',
        liked
          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
          : 'bg-gray-700/40 border-gray-600/60 text-gray-300 hover:bg-gray-700/70 hover:text-rose-300',
        isOwner ? 'opacity-60 cursor-not-allowed hover:bg-gray-700/40 hover:text-gray-300' : '',
        loading ? 'opacity-70 cursor-wait' : (!isOwner ? 'cursor-pointer' : ''),
        dims.wrap,
        className,
      ].join(' ')}
    >
      <Heart
        size={dims.icon}
        className={liked ? 'fill-current' : ''}
        strokeWidth={2.2}
      />
      <span className="tabular-nums">{count}</span>
    </motion.button>
  );
}
