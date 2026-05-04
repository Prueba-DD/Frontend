import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame, MapPin, Heart, Eye, Clock, ArrowLeft,
  Droplets, Trees, Wind, Trash2, Leaf, Waves, AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getTrendingReportes } from '../services/api';
import { helpers } from '../constants/categorias';
import LikeButton from '../components/LikeButton';

const typeIcons = {
  agua: Droplets, aire: Wind, suelo: Leaf,
  residuos: Trash2,
  deforestacion: Trees, incendios_forestales: Flame,
  avalanchas_fluviotorrenciales: Waves,
  otro: Leaf,
};
const statusClass = {
  pendiente:   'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  en_revision: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  verificado:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  en_proceso:  'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  resuelto:    'bg-green-500/15 text-green-400 border border-green-500/30',
  rechazado:   'bg-red-500/15 text-red-400 border border-red-500/30',
};
const statusLabel = {
  pendiente: 'Pendiente', en_revision: 'En revisión', verificado: 'Verificado',
  en_proceso: 'En proceso', resuelto: 'Resuelto', rechazado: 'Rechazado',
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)   return 'hace instantes';
  if (min < 60)  return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30)    return `hace ${d} d`;
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

export default function Trending() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    getTrendingReportes({ limit: 12 })
      .then(({ data }) => setReportes(data?.data?.reportes ?? []))
      .catch(() => setError('No se pudieron cargar las tendencias.'))
      .finally(() => setLoading(false));
  }, []);

  const updateReporte = (id, patch) => {
    setReportes((list) => list.map((r) => (r.id_reporte === id ? { ...r, ...patch } : r)));
  };

  return (
    <motion.section
      className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <button
        onClick={() => navigate(-1)}
        className="hidden lg:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <header className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30">
            <Flame className="w-5 h-5 text-rose-400" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Tendencias</h1>
        </div>
        <p className="text-sm text-gray-400 max-w-2xl">
          Los reportes con mayor interacción reciente: combinan likes y vistas, y se priorizan los que
          han recibido más atención en los últimos días.
        </p>
      </header>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-56" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="card text-center py-12 text-red-400">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
          {error}
        </div>
      )}

      {!loading && !error && reportes.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-gray-400">Aún no hay reportes con suficiente interacción.</p>
          <Link to="/reports" className="btn-secondary mt-4 inline-flex">
            Explorar reportes
          </Link>
        </div>
      )}

      {!loading && !error && reportes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportes.map((r, i) => {
            const cfg    = helpers.obtenerConfig(r.tipo_contaminacion);
            const color  = cfg?.color ?? '#6B7280';
            const Icon   = typeIcons[r.tipo_contaminacion] ?? Leaf;
            const lugar  = [r.municipio, r.departamento].filter(Boolean).join(', ') || r.direccion || '—';
            return (
              <motion.div
                key={r.id_reporte}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.28 }}
                className="card relative flex flex-col gap-3 hover:border-rose-500/40 transition-colors"
              >
                {/* Rank badge */}
                <span
                  className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-rose-500/30"
                  aria-label={`Posición ${i + 1}`}
                >
                  {i + 1}
                </span>

                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/reports/${r.id_reporte}`}
                      className="text-sm font-semibold text-white hover:text-green-400 transition-colors line-clamp-2"
                    >
                      {r.titulo}
                    </Link>
                    <p className="text-[11px] uppercase tracking-wide font-medium mt-0.5" style={{ color }}>
                      {cfg?.nombre ?? r.tipo_contaminacion}
                    </p>
                  </div>
                </div>

                {r.descripcion && (
                  <p className="text-xs text-gray-400 line-clamp-2">{r.descripcion}</p>
                )}

                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin size={11} className="shrink-0" />
                  <span className="truncate">{lugar}</span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-800/80">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1" title="Vistas">
                      <Eye size={12} />
                      <span className="tabular-nums">{Number(r.vistas) || 0}</span>
                    </span>
                    <span className="inline-flex items-center gap-1" title="Antigüedad">
                      <Clock size={12} />
                      {timeAgo(r.created_at)}
                    </span>
                    <span className={`badge ${statusClass[r.estado]} text-[10px]`}>
                      {statusLabel[r.estado] ?? r.estado}
                    </span>
                  </div>
                  <LikeButton
                    id_reporte={r.id_reporte}
                    liked={!!r.liked_by_me}
                    count={Number(r.votos_relevancia) || 0}
                    ownerId={r.id_usuario}
                    size="sm"
                    onChange={({ liked, count }) =>
                      updateReporte(r.id_reporte, { liked_by_me: liked, votos_relevancia: count })
                    }
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
