import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Droplets, Trees, Flame, Wind, Trash2, Leaf,
  Waves, ArrowLeft, MapPin, Calendar, Eye,
  User, ShieldCheck, ImageOff, Sparkles,
  Pencil, X, Check, AlertTriangle, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getReporteById, updateReporte, deleteReporte } from '../services/api';
import { helpers } from '../constants/categorias';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LikeButton from '../components/LikeButton';
import MediaLightbox from '../components/MediaLightbox';

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
const severityClass = {
  bajo:    'bg-green-500/15 text-green-400 border border-green-500/30',
  medio:   'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  alto:    'bg-red-500/15 text-red-400 border border-red-500/30',
  critico: 'bg-red-600/25 text-rose-200 border border-red-500/60',
};
const severityLabel = { bajo: 'Baja', medio: 'Media', alto: 'Alta', critico: 'Crítico' };

const rolLabel = {
  ciudadano: 'Ciudadano', moderador: 'Moderador', admin: 'Administrador',
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

function ImageCard({ ev, onOpen }) {
  const [err, setErr] = useState(false);
  const isImage = ev.mime_type?.startsWith('image/') || ev.tipo_archivo === 'imagen';
  if (!isImage) return null;
  const handleKey = (e) => {
    if (!err && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onOpen?.();
    }
  };
  return (
    <button
      type="button"
      onClick={!err ? onOpen : undefined}
      onKeyDown={handleKey}
      disabled={err}
      aria-label={`Ampliar evidencia ${ev.nombre_original ?? ''}`.trim()}
      className={[
        'group relative aspect-video rounded-lg overflow-hidden bg-gray-800 border border-gray-700 text-left',
        err ? 'cursor-default' : 'cursor-zoom-in hover:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/60',
        'transition-colors',
      ].join(' ')}
    >
      {err ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-600">
          <ImageOff size={28} />
          <span className="text-xs">{ev.nombre_original ?? 'Imagen'}</span>
        </div>
      ) : (
        <>
          <img
            src={ev.url_archivo}
            alt={ev.nombre_original ?? 'Evidencia'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setErr(true)}
            loading="lazy"
          />
          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </>
      )}
    </button>
  );
}

function VideoCard({ ev }) {
  const isVideo = ev.mime_type?.startsWith('video/') || ev.tipo_archivo === 'video';
  if (!isVideo) return null;
  return (
    <div className="rounded-lg overflow-hidden bg-gray-800 border border-gray-700 col-span-full">
      <video
        src={ev.url_archivo}
        controls
        preload="metadata"
        className="w-full max-h-72 object-contain"
      />
      <p className="text-xs text-gray-500 px-3 py-1.5 truncate">{ev.nombre_original ?? 'Video'}</p>
    </div>
  );
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [report,    setReport]    = useState(null);
  const [autor,     setAutor]     = useState(null);
  const [evidencias,setEvidencias]= useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // Edición inline (solo dueño + estado pendiente)
  const [editMode,    setEditMode]    = useState(false);
  const [editForm,    setEditForm]    = useState(null);
  const [editError,   setEditError]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  // Visor de evidencias
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    const storedUser = (() => { try { return JSON.parse(localStorage.getItem('ga_user')); } catch { return null; } })();
    const uid = storedUser?.id_usuario ?? 'anon';
    const seenKey = 'ga_seen_reports';
    const seen = (() => { try { return JSON.parse(localStorage.getItem(seenKey) || '{}'); } catch { return {}; } })();
    const alreadySeen = Array.isArray(seen[uid]) && seen[uid].includes(Number(id));

    getReporteById(id, alreadySeen)
      .then(({ data }) => {
        setReport(data.data.reporte);
        setAutor(data.data.autor ?? null);
        setEvidencias(data.data.evidencias ?? []);
        if (!alreadySeen) {
          seen[uid] = [...(seen[uid] ?? []), Number(id)];
          localStorage.setItem(seenKey, JSON.stringify(seen));
        }
      })
      .catch(() => setError('No se pudo cargar el reporte.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center text-gray-500">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Cargando reporte...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-red-400 mb-4">{error || 'Reporte no encontrado.'}</p>
        <button onClick={() => navigate('/reports')} className="btn-secondary text-sm">
          Volver a Reportes
        </button>
      </div>
    );
  }

  const cfg      = helpers.obtenerConfig(report.tipo_contaminacion);
  const catColor = cfg?.color ?? '#6B7280';
  const catNombre= cfg?.nombre ?? report.tipo_contaminacion;
  const Icon     = typeIcons[report.tipo_contaminacion] ?? Leaf;
  const location = [report.municipio, report.departamento].filter(Boolean).join(', ') || report.direccion;
  const imageEvidencias = evidencias.filter(
    (e) => e.mime_type?.startsWith('image/') || e.tipo_archivo === 'imagen'
  );
  const videoEvidencias = evidencias.filter(
    (e) => e.mime_type?.startsWith('video/') || e.tipo_archivo === 'video'
  );
  const hasMedia = imageEvidencias.length > 0 || videoEvidencias.length > 0;
  // Lightbox: solo navega entre imágenes (los videos tienen su propio reproductor inline).
  const mediaItems = imageEvidencias;

  // Permisos: solo el dueño puede editar/eliminar y solo si está pendiente
  const isOwner    = user && report.id_usuario === user.id_usuario;
  const canManage  = isOwner && report.estado === 'pendiente';

  const startEdit = () => {
    setEditForm({
      titulo:       report.titulo       ?? '',
      descripcion:  report.descripcion  ?? '',
      direccion:    report.direccion    ?? '',
      municipio:    report.municipio    ?? '',
      departamento: report.departamento ?? '',
    });
    setEditError('');
    setEditMode(true);
  };

  const cancelEdit = () => {
    if (saving) return;
    setEditMode(false);
    setEditForm(null);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    const titulo      = editForm.titulo.trim();
    const descripcion = editForm.descripcion.trim();
    if (titulo.length < 3) {
      setEditError('El título debe tener al menos 3 caracteres.');
      return;
    }
    if (titulo.length > 150) {
      setEditError('El título no puede superar 150 caracteres.');
      return;
    }
    if (descripcion.length > 2000) {
      setEditError('La descripción no puede superar 2000 caracteres.');
      return;
    }
    setEditError('');
    setSaving(true);
    try {
      const { data } = await updateReporte(id, {
        titulo,
        descripcion,
        direccion:    editForm.direccion.trim(),
        municipio:    editForm.municipio.trim(),
        departamento: editForm.departamento.trim(),
      });
      setReport(data.data.reporte ?? { ...report, titulo, descripcion, direccion: editForm.direccion.trim(), municipio: editForm.municipio.trim(), departamento: editForm.departamento.trim() });
      setEditMode(false);
      setEditForm(null);
      showToast('Reporte actualizado.', 'success');
    } catch (err) {
      setEditError(err.response?.data?.message ?? 'No se pudo actualizar el reporte.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteReporte(id);
      showToast('Reporte eliminado.', 'success');
      navigate('/profile');
    } catch (err) {
      showToast(err.response?.data?.message ?? 'No se pudo eliminar el reporte.', 'error');
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 sm:px-6 py-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {/* Sticky back — mobile only */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/60 flex items-center lg:hidden mb-4">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>

      {/* Desktop back */}
      <button
        onClick={() => navigate('/reports')}
        className="hidden lg:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Reportes
      </button>

      <div className="card overflow-hidden flex flex-col gap-0 !p-0">
        {/* Color banner */}
        <div className="h-1.5 w-full shrink-0" style={{ background: catColor }} />

        <div className="flex flex-col gap-6 p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: catColor + '20', border: `1.5px solid ${catColor}55` }}
              >
                <Icon className="w-5 h-5" style={{ color: catColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: catColor }}>
                  {catNombre}
                </p>
                {editMode ? (
                  <>
                    <input
                      type="text"
                      value={editForm.titulo}
                      onChange={(e) => setEditForm((s) => ({ ...s, titulo: e.target.value }))}
                      maxLength={150}
                      autoFocus
                      className="w-full bg-gray-800 border border-blue-500/50 rounded-lg px-3 py-2 text-lg sm:text-xl font-bold text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <p className="text-[10px] text-gray-600 mt-1 text-right">{editForm.titulo.length}/150</p>
                  </>
                ) : (
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-snug">{report.titulo}</h1>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {report.subcategoria && (
                <span className="badge border border-gray-600 bg-gray-700/40 text-gray-300">
                  {report.subcategoria}
                </span>
              )}
              <span className={`badge ${severityClass[report.nivel_severidad]}`}>
                {severityLabel[report.nivel_severidad] ?? report.nivel_severidad}
              </span>
              <span className={`badge ${statusClass[report.estado]}`}>
                {statusLabel[report.estado] ?? report.estado}
              </span>
            </div>
          </div>

          {/* Métricas de interacción: likes y vistas */}
          <div className="flex items-center gap-3 flex-wrap -mt-2">
            <LikeButton
              id_reporte={report.id_reporte}
              liked={!!report.liked_by_me}
              count={Number(report.votos_relevancia) || 0}
              ownerId={report.id_usuario}
              size="md"
              onChange={({ liked, count }) =>
                setReport((r) => (r ? { ...r, liked_by_me: liked, votos_relevancia: count } : r))
              }
            />
            <span
              className="inline-flex items-center gap-1.5 text-xs text-gray-400"
              title="Vistas del reporte"
            >
              <Eye size={14} />
              <span className="tabular-nums">{Number(report.vistas) || 0}</span>
              <span>{(Number(report.vistas) || 0) === 1 ? 'vista' : 'vistas'}</span>
            </span>
          </div>

          {/* Acciones del propietario (editar / eliminar) */}
          {canManage && !editMode && (
            <div className="flex items-center gap-2 -mt-2">
              <span className="text-[11px] text-gray-500 mr-auto flex items-center gap-1">
                <Pencil size={11} /> Puedes editar o eliminar este reporte mientras esté en estado pendiente.
              </span>
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition-colors"
              >
                <Pencil size={13} /> Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDel(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors"
              >
                <Trash2 size={13} /> Eliminar
              </button>
            </div>
          )}

          {/* Description */}
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Descripción</label>
                <textarea
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm((s) => ({ ...s, descripcion: e.target.value }))}
                  maxLength={2000}
                  rows={5}
                  placeholder="Describe el problema ambiental con el mayor detalle posible…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-y"
                />
                <p className="text-[10px] text-gray-600 mt-1 text-right">{editForm.descripcion.length}/2000</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Dirección</label>
                <input
                  type="text"
                  value={editForm.direccion}
                  onChange={(e) => setEditForm((s) => ({ ...s, direccion: e.target.value }))}
                  maxLength={255}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Municipio</label>
                  <input
                    type="text"
                    value={editForm.municipio}
                    onChange={(e) => setEditForm((s) => ({ ...s, municipio: e.target.value }))}
                    maxLength={100}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Departamento</label>
                  <input
                    type="text"
                    value={editForm.departamento}
                    onChange={(e) => setEditForm((s) => ({ ...s, departamento: e.target.value }))}
                    maxLength={100}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <p className="text-[11px] text-gray-500 flex items-start gap-1.5">
                <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                La categoría, severidad y coordenadas no son modificables desde aquí.
              </p>

              {editError && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-300 leading-relaxed">{editError}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="btn-secondary text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving || !editForm.titulo.trim()}
                  className="text-sm font-semibold px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? <><Loader2 size={13} className="animate-spin" /> Guardando…</> : <><Check size={13} /> Guardar cambios</>}
                </button>
              </div>
            </div>
          ) : report.descripcion ? (
            <p className="text-gray-300 leading-relaxed text-base text-justify">
              {report.descripcion}
            </p>
          ) : (
            <p className="text-gray-500 italic text-sm">Sin descripción proporcionada.</p>
          )}

          {/* FE-25 · Análisis con IA (solo si el reporte fue procesado por IA) */}
          {report.ia_procesado && Array.isArray(report.ia_etiquetas) && report.ia_etiquetas.length > 0 && (() => {
            const principal       = report.ia_etiquetas[0];
            const categoriaFinal  = report.tipo_contaminacion;
            const coincide        = principal?.label === categoriaFinal;
            const confianza       = report.ia_confianza ?? principal?.score ?? 0;
            return (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">
                    Análisis con IA
                  </p>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">
                    Confianza {confianza}%
                  </span>
                </div>

                <p className="text-sm text-gray-300 mb-3">
                  La IA sugirió la categoría{' '}
                  <span className="font-semibold text-white">{principal?.nombre ?? principal?.label}</span>{' '}
                  {coincide ? (
                    <span className="text-emerald-300">— coincide con la categoría final del reporte.</span>
                  ) : (
                    <span className="text-amber-300">— el usuario eligió una categoría distinta.</span>
                  )}
                </p>

                <ul className="space-y-2">
                  {report.ia_etiquetas.slice(0, 5).map((e, idx) => {
                    const score = Math.max(0, Math.min(100, Number(e.score) || 0));
                    const esTop = idx === 0;
                    return (
                      <li key={`${e.label}-${idx}`} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className={esTop ? 'text-white font-medium' : 'text-gray-400'}>
                            {e.nombre ?? e.label}
                          </span>
                          <span className="font-mono text-gray-500">{score}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${esTop ? 'bg-purple-400' : 'bg-purple-500/40'}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })()}

          {/* Evidence gallery */}
          {hasMedia && (
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">
                Evidencias ({evidencias.length})
              </p>
              <div className={`grid gap-3 ${
                imageEvidencias.length === 1 && videoEvidencias.length === 0
                  ? 'grid-cols-1 max-w-sm'
                  : 'grid-cols-2 sm:grid-cols-3'
              }`}>
                {videoEvidencias.map((ev) => (
                  <VideoCard key={ev.id_evidencia} ev={ev} />
                ))}
                {imageEvidencias.map((ev) => {
                  const idx = mediaItems.findIndex((m) => m.id_evidencia === ev.id_evidencia);
                  return (
                    <ImageCard
                      key={ev.id_evidencia}
                      ev={ev}
                      onOpen={() => setLightboxIndex(idx)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* OpenStreetMap iframe */}
          {report.latitud && report.longitud && (() => {
            const lat = parseFloat(report.latitud);
            const lon = parseFloat(report.longitud);
            const delta = 0.01;
            const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
            return (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Ubicación en el mapa
                </p>
                <div className="rounded-xl overflow-hidden border border-gray-700 h-64">
                  <iframe
                    title="Ubicación del reporte"
                    width="100%"
                    height="100%"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
                    className="block"
                  />
                </div>
              </div>
            );
          })()}

          {/* Meta grid */}
          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-800 text-sm">
            {location && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-green-400 shrink-0" />
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Ubicación</p>
                  <p className="text-gray-200">{location}</p>
                  {report.direccion && location !== report.direccion && (
                    <p className="text-gray-500 text-xs mt-0.5">{report.direccion}</p>
                  )}
                </div>
              </div>
            )}

            {report.latitud && report.longitud && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-600 shrink-0" />
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Coordenadas</p>
                  <p className="text-gray-400 font-mono text-xs">
                    {parseFloat(report.latitud).toFixed(6)}, {parseFloat(report.longitud).toFixed(6)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-0.5 text-green-400 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Registrado</p>
                <p className="text-gray-200">{formatDate(report.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Autor */}
          {autor && (
            <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
              <div className="w-9 h-9 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center overflow-hidden shrink-0">
                {autor.avatar_url
                  ? <img src={autor.avatar_url} alt={autor.nombre} className="w-full h-full object-cover" />
                  : <User className="w-4 h-4 text-green-400" />}
              </div>
              <div>
                <p className="text-sm text-gray-200 font-medium">
                  {autor.nombre} {autor.apellido}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  {(autor.rol === 'moderador' || autor.rol === 'admin') && (
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                  )}
                  {rolLabel[autor.rol] ?? autor.rol}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmación de eliminación */}
      <AnimatePresence>
        {confirmDel && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !deleting) setConfirmDel(false); }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">¿Eliminar reporte?</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Esta acción es permanente y no se puede deshacer. El reporte y sus evidencias serán borrados.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDel(false)}
                  disabled={deleting}
                  className="btn-secondary text-sm"
                  autoFocus
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deleting ? <><Loader2 size={13} className="animate-spin" /> Eliminando…</> : <><Trash2 size={13} /> Eliminar</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox para evidencias de imagen */}
      <MediaLightbox
        items={mediaItems}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </motion.div>
  );
}
