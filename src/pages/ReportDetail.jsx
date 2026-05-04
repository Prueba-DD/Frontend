import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Droplets, Trees, Flame, Wind, Trash2, Leaf,
  Waves, ArrowLeft, MapPin, Calendar, Eye,
  User, ShieldCheck, ImageOff, Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getReporteById } from '../services/api';
import { helpers } from '../constants/categorias';

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

function ImageCard({ ev }) {
  const [err, setErr] = useState(false);
  const isImage = ev.mime_type?.startsWith('image/') || ev.tipo_archivo === 'imagen';
  if (!isImage) return null;
  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
      {err ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-600">
          <ImageOff size={28} />
          <span className="text-xs">{ev.nombre_original ?? 'Imagen'}</span>
        </div>
      ) : (
        <img
          src={ev.url_archivo}
          alt={ev.nombre_original ?? 'Evidencia'}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      )}
    </div>
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
  const [report,    setReport]    = useState(null);
  const [autor,     setAutor]     = useState(null);
  const [evidencias,setEvidencias]= useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

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
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: catColor + '20', border: `1.5px solid ${catColor}55` }}
              >
                <Icon className="w-5 h-5" style={{ color: catColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: catColor }}>
                  {catNombre}
                </p>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-snug">{report.titulo}</h1>
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

          {/* Description */}
          {report.descripcion ? (
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
                {imageEvidencias.map((ev) => (
                  <ImageCard key={ev.id_evidencia} ev={ev} />
                ))}
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

            <div className="flex items-center gap-1.5 text-gray-400">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-gray-300">{report.vistas ?? 0}</span>
              <span className="text-xs text-gray-500">vistas</span>
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
    </motion.div>
  );
}
