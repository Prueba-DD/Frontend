import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Clock, RefreshCw, ChevronRight,
  MapPin, AlertTriangle, CheckCircle2, XCircle,
  Loader2, Eye, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getReportes, updateReporte } from '../services/api';
import { useToast } from '../context/ToastContext';
import { helpers } from '../constants/categorias';

// ── Constantes ────────────────────────────────────────────────────────────────

const ESTADOS = [
  { value: 'pendiente',   label: 'Pendiente',    color: 'text-gray-400',   bg: 'bg-gray-500/15 border-gray-500/30' },
  { value: 'en_revision', label: 'En revisión',  color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  { value: 'verificado',  label: 'Verificado',   color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30' },
  { value: 'en_proceso',  label: 'Pendiente',   color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
  { value: 'resuelto',    label: 'En proceso',     color: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-500/30' },
  { value: 'rechazado',   label: 'Resuelto',    color: 'text-green-400',    bg: 'bg-green-500/15 border-green-500/30' },
];

const SEVERIDAD_CLASS = {
  bajo:    'bg-green-500/15 text-green-400 border-green-500/30',
  medio:   'bg-orange-500/15 text-orange-400 border-orange-500/30',
  alto:    'bg-red-500/15 text-red-400 border-red-500/30',
  critico: 'bg-red-600/25 text-rose-200 border-red-500/60',
};
const SEVERIDAD_LABEL = { bajo: 'Baja', medio: 'Media', alto: 'Alta', critico: 'Crítico' };

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// Transiciones de estado permitidas para el moderador
const TRANSICIONES = {
  pendiente:   ['en_revision', 'rechazado'],
  en_revision: ['verificado', 'en_proceso', 'rechazado'],
  verificado:  ['en_proceso', 'resuelto', 'rechazado'],
  en_proceso:  ['resuelto', 'rechazado'],
  resuelto:    [],
  rechazado:   ['pendiente'],
};

function getBadge(estado) {
  const e = ESTADOS.find((x) => x.value === estado);
  return e ?? { label: estado, color: 'text-gray-400', bg: 'bg-gray-500/15 border-gray-500/30' };
}

// ── Tarjeta de reporte ────────────────────────────────────────────────────────

function ReporteCard({ reporte, onEstadoChange, updating }) {
  const categoriaConfig = helpers.obtenerConfig(reporte.tipo_contaminacion);
  const badge = getBadge(reporte.estado);
  const transiciones = TRANSICIONES[reporte.estado] ?? [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="badge border"
              style={{ background: `${categoriaConfig?.color}18`, color: categoriaConfig?.color, borderColor: `${categoriaConfig?.color}40` }}
            >
              {categoriaConfig?.nombre ?? reporte.tipo_contaminacion}
            </span>
            <span className={`badge border ${SEVERIDAD_CLASS[reporte.nivel_severidad]}`}>
              {SEVERIDAD_LABEL[reporte.nivel_severidad] ?? reporte.nivel_severidad}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-100 leading-snug line-clamp-2">{reporte.titulo}</h3>
        </div>
        <span className={`badge border shrink-0 ${badge.bg} ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {reporte.municipio && (
          <span className="flex items-center gap-1">
            <MapPin size={11} className="shrink-0" /> {reporte.municipio}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={11} className="shrink-0" /> {formatDate(reporte.created_at)}
        </span>
        {(reporte.autor_nombre || reporte.autor_apellido) && (
          <span className="flex items-center gap-1 ml-auto">
            <span>Por: {`${reporte.autor_nombre ?? ''} ${reporte.autor_apellido ?? ''}`.trim()}</span>
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-800">
        <Link
          to={`/reports/${reporte.id_reporte}`}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-400 transition-colors"
        >
          <Eye size={13} /> Ver detalle
        </Link>

        {transiciones.length > 0 && (
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <span className="text-xs text-gray-600">Cambiar a:</span>
            {transiciones.map((est) => {
              const b = getBadge(est);
              return (
                <button
                  key={est}
                  disabled={updating === reporte.id_reporte}
                  onClick={() => onEstadoChange(reporte.id_reporte, est)}
                  className={`badge border text-[11px] cursor-pointer hover:opacity-80 active:scale-95 transition disabled:opacity-40 ${b.bg} ${b.color}`}
                >
                  {updating === reporte.id_reporte ? (
                    <Loader2 size={10} className="animate-spin inline" />
                  ) : (
                    <>
                      <ArrowRight size={10} className="inline" /> {b.label}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Moderacion() {
  const { showToast } = useToast();

  const [reportes,  setReportes]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [updating,  setUpdating]  = useState(null); // id del reporte que se está actualizando
  const [filtroEstado, setFiltroEstado] = useState('pendiente');

  const fetchReportes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getReportes({ estado: filtroEstado, limit: 50 });
      setReportes(data.data.reportes ?? []);
    } catch {
      showToast('No se pudieron cargar los reportes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => { fetchReportes(); }, [fetchReportes]);

  const handleEstadoChange = async (id, nuevoEstado) => {
    setUpdating(id);
    try {
      await updateReporte(id, { estado: nuevoEstado });
      showToast(`Estado actualizado a "${getBadge(nuevoEstado).label}".`, 'success');
      // Refrescar lista
      setReportes((prev) => prev.filter((r) => r.id_reporte !== id));
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Error al actualizar el estado.', 'error');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">Panel de Moderación</h1>
            <p className="text-sm text-gray-500">Revisa y gestiona el estado de los reportes.</p>
          </div>
        </div>
        <button
          onClick={fetchReportes}
          disabled={loading}
          className="flex items-center gap-2 btn-secondary text-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap">
        {ESTADOS.map((e) => (
          <button
            key={e.value}
            onClick={() => setFiltroEstado(e.value)}
            className={`badge border text-xs cursor-pointer transition-all ${
              filtroEstado === e.value
                ? `${e.bg} ${e.color} ring-1 ring-current`
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* Lista de reportes */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      ) : reportes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CheckCircle2 className="w-10 h-10 text-gray-700" />
          <p className="text-gray-500 text-sm">
            No hay reportes con estado <span className="text-gray-300">"{getBadge(filtroEstado).label}"</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{reportes.length} reporte(s) encontrado(s)</p>
          <AnimatePresence mode="popLayout">
            {reportes.map((r) => (
              <ReporteCard
                key={r.id_reporte}
                reporte={r}
                onEstadoChange={handleEstadoChange}
                updating={updating}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
