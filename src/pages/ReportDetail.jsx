import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Droplets, Trees, Flame, Wind, Trash2, Leaf, Lightbulb,
  AlertTriangle, Waves, ArrowLeft, MapPin, Calendar, Eye,
  User, ShieldCheck, ImageOff,
} from 'lucide-react';
import { getReporteById } from '../services/api';
import { helpers } from '../constants/categorias';

const typeIcons = {
  agua: Droplets, aire: Wind, suelo: Trees,
  ruido: Flame, residuos: Trash2, luminica: Lightbulb,
  deforestacion: Trees, incendios_forestales: Flame,
  deslizamientos: AlertTriangle, avalanchas_fluviotorrenciales: Waves,
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <button
        onClick={() => navigate('/reports')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Reportes
      </button>

      <div className="card flex flex-col gap-6">
        {/* Header: category + badges */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: catColor }}>
            <Icon className="w-5 h-5 shrink-0" />
            <span>{catNombre}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${severityClass[report.nivel_severidad]}`}>
              {severityLabel[report.nivel_severidad] ?? report.nivel_severidad}
            </span>
            <span className={`badge ${statusClass[report.estado]}`}>
              {statusLabel[report.estado] ?? report.estado}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="border-b border-gray-800 pb-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">{report.titulo}</h1>
        </div>

        {/* Layout tipo Wikipedia: descripción izquierda + imágenes derecha */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start">
          {/* Izquierda: descripción */}
          <div className="order-2 lg:order-none">
            {report.descripcion ? (
              <p className="text-gray-300 leading-relaxed text-base">{report.descripcion}</p>
            ) : (
              <p className="text-gray-500 italic text-sm">Sin descripción proporcionada.</p>
            )}
          </div>

          {/* Derecha: evidencias (en móvil aparecen primero) */}
          {imageEvidencias.length > 0 && (
            <div className="order-first lg:order-none rounded-xl border border-gray-700 bg-gray-800/40 p-4 space-y-3">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                Evidencias ({imageEvidencias.length})
              </p>
              <div className="space-y-3">
                {imageEvidencias.map((ev) => (
                  <ImageCard key={ev.id_evidencia} ev={ev} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-800 text-sm">

          {/* Location */}
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

          {/* Coordinates */}
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

          {/* Date */}
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-0.5 text-green-400 shrink-0" />
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Registrado</p>
              <p className="text-gray-200">{formatDate(report.created_at)}</p>
            </div>
          </div>

          {/* Views */}
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
  );
}
