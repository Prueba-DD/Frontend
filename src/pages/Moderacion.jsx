import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Clock, RefreshCw,
  MapPin, CheckCircle2,
  Loader2, Eye, ArrowRight, Filter, X, MessageSquare, Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getReportes, updateReporte, getReporteById } from '../services/api';
import { useToast } from '../context/ToastContext';
import { helpers, CONFIGURACION_CATEGORIAS, TIPOS_CONTAMINACION } from '../constants/categorias';

// ── Constantes ────────────────────────────────────────────────────────────────

const ESTADOS = [
  { value: 'pendiente',   label: 'Pendiente',   color: 'text-gray-400',   bg: 'bg-gray-500/15 border-gray-500/30' },
  { value: 'en_revision', label: 'En revisión', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  { value: 'verificado',  label: 'Verificado',  color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30' },
  { value: 'en_proceso',  label: 'En proceso',  color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  { value: 'resuelto',    label: 'Resuelto',    color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30' },
  { value: 'rechazado',   label: 'Rechazado',   color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30' },
];

const CATEGORIAS_OPCIONES = Object.entries(CONFIGURACION_CATEGORIAS).map(([value, cfg]) => ({
  value,
  label: cfg.nombre,
  color: cfg.color,
}));

const SEVERIDAD_OPCIONES = [
  { value: 'bajo',    label: 'Baja' },
  { value: 'medio',   label: 'Media' },
  { value: 'alto',    label: 'Alta' },
  { value: 'critico', label: 'Crítico' },
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
  const [showEv, setShowEv]   = useState(false);
  const [evidencias, setEv]   = useState(null); // null=not loaded, []=empty
  const [evLoading, setEvLoad]= useState(false);
  const [lightbox, setLightbox] = useState(null);

  const loadEvidencias = async () => {
    if (evidencias !== null) { setShowEv((v) => !v); return; }
    setShowEv(true);
    setEvLoad(true);
    try {
      const { data } = await getReporteById(reporte.id_reporte, true);
      setEv(data.data.evidencias ?? []);
    } catch {
      setEv([]);
    } finally {
      setEvLoad(false);
    }
  };

  return (
    <>
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

        {/* Evidencias expandibles */}
        <div className="border-t border-gray-800 pt-2">
          <button
            onClick={loadEvidencias}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors"
          >
            {evLoading
              ? <Loader2 size={12} className="animate-spin" />
              : <ImageIcon size={12} />}
            {showEv ? 'Ocultar evidencias' : 'Ver evidencias'}
          </button>

          <AnimatePresence>
            {showEv && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {evLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  </div>
                ) : evidencias?.length === 0 ? (
                  <p className="text-xs text-gray-600 italic mt-2">Sin evidencias adjuntas.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {evidencias?.map((ev) => (
                      <button
                        key={ev.id_evidencia}
                        onClick={() => setLightbox(ev)}
                        className="w-16 h-16 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <img
                          src={`/uploads/${ev.url_archivo}`}
                          alt={ev.descripcion ?? 'Evidencia'}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = ''; e.currentTarget.style.background='#374151'; }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-gray-300 hover:text-white hover:border-gray-400 transition-all z-10"
              >
                <X size={14} />
              </button>
              <img
                src={`/uploads/${lightbox.url_archivo}`}
                alt={lightbox.descripcion ?? 'Evidencia'}
                className="w-full rounded-xl border border-gray-700 shadow-2xl max-h-[80vh] object-contain bg-gray-950"
              />
              {lightbox.descripcion && (
                <p className="text-xs text-gray-400 text-center mt-2">{lightbox.descripcion}</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Moderacion() {
  const { showToast } = useToast();

  const [reportes,       setReportes]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [updating,       setUpdating]       = useState(null);
  const [filtroEstado,   setFiltroEstado]   = useState('pendiente');
  const [filtroTipo,     setFiltroTipo]     = useState('');
  const [filtroSeveridad,setFiltroSeveridad]= useState('');
  const [rechazoModal,   setRechazoModal]   = useState(null); // { id, nuevoEstado }
  const [rechazoComent,  setRechazoComent]  = useState('');

  const hayFiltrosExtra = filtroTipo !== '' || filtroSeveridad !== '';

  const limpiarFiltros = () => {
    setFiltroTipo('');
    setFiltroSeveridad('');
  };

  const fetchReportes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { estado: filtroEstado, limit: 50 };
      if (filtroTipo)      params.tipo_contaminacion = filtroTipo;
      if (filtroSeveridad) params.nivel_severidad    = filtroSeveridad;
      const { data } = await getReportes(params);
      setReportes(data.data.reportes ?? []);
    } catch {
      showToast('No se pudieron cargar los reportes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroTipo, filtroSeveridad]);

  useEffect(() => { fetchReportes(); }, [fetchReportes]);

  const handleEstadoChange = async (id, nuevoEstado) => {
    if (nuevoEstado === 'rechazado') {
      setRechazoComent('');
      setRechazoModal({ id, nuevoEstado });
      return;
    }
    setUpdating(id);
    try {
      await updateReporte(id, { estado: nuevoEstado });
      showToast(`Estado actualizado a "${getBadge(nuevoEstado).label}".`, 'success');
      setReportes((prev) => prev.filter((r) => r.id_reporte !== id));
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Error al actualizar el estado.', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleConfirmarRechazo = async () => {
    if (!rechazoComent.trim()) return;
    const { id, nuevoEstado } = rechazoModal;
    setUpdating(id);
    try {
      await updateReporte(id, { estado: nuevoEstado, comentario_moderacion: rechazoComent.trim() });
      showToast('Reporte rechazado correctamente.', 'success');
      setReportes((prev) => prev.filter((r) => r.id_reporte !== id));
      setRechazoModal(null);
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Error al rechazar el reporte.', 'error');
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

      {/* Filtros adicionales: categoría y severidad */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
          <Filter size={13} /> Filtrar:
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS_OPCIONES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          value={filtroSeveridad}
          onChange={(e) => setFiltroSeveridad(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
        >
          <option value="">Todas las severidades</option>
          {SEVERIDAD_OPCIONES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {hayFiltrosExtra && (
          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors border border-gray-700 hover:border-red-500/50 rounded-lg px-2.5 py-1.5"
          >
            <X size={12} /> Limpiar
          </button>
        )}
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

      {/* Modal de rechazo con comentario obligatorio */}
      <AnimatePresence>
        {rechazoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <MessageSquare className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-100 mb-1">Rechazar reporte</h3>
                  <p className="text-xs text-gray-400">Debes justificar el rechazo con un comentario.</p>
                </div>
              </div>
              <textarea
                value={rechazoComent}
                onChange={(e) => setRechazoComent(e.target.value)}
                placeholder="Ej: El reporte está duplicado, fuera de área, no tiene evidencia suficiente..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 focus:border-red-500 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none resize-none transition-colors mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setRechazoModal(null)}
                  disabled={updating === rechazoModal.id}
                  className="btn-secondary text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarRechazo}
                  disabled={!rechazoComent.trim() || updating === rechazoModal.id}
                  className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all active:scale-95 disabled:opacity-40"
                >
                  {updating === rechazoModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar rechazo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
