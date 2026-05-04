import { useState, useRef, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Paperclip, AlertCircle, Info,
  Trees, Flame, Waves,
  Droplet, Wind, Leaf, Trash2, HelpCircle,
  X, Video, Locate,
  Camera, Sparkles, AlertTriangle, Loader2, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { createReporte, analizarImagenIA } from '../services/api';
import { useToast } from '../context/ToastContext';
import { reverseGeocode } from '../utils/geo';
import {
  CONFIGURACION_CATEGORIAS,
  TIPOS_CONTAMINACION,
  NIVELES_SEVERIDAD,
  helpers,
} from '../constants/categorias';

const LocationPicker = lazy(() => import('./LocationPicker'));

// ── Mapeo de nombre de ícono (string) → componente Lucide ─────────────────────
const ICONO_MAP = {
  trees:      Trees,
  flame:      Flame,
  waves:      Waves,
  droplet:    Droplet,
  wind:       Wind,
  leaf:       Leaf,
  trash2:     Trash2,
  helpCircle: HelpCircle,
};

// Categorías que son riesgo ambiental (coordenadas y municipio obligatorios)
const CATEGORIAS_RIESGO = new Set(helpers.obtenerCategoriasRiesgo());

const SEVERIDAD_LABELS = {
  [NIVELES_SEVERIDAD.BAJO]:    'Baja',
  [NIVELES_SEVERIDAD.MEDIO]:   'Media',
  [NIVELES_SEVERIDAD.ALTO]:    'Alta',
  [NIVELES_SEVERIDAD.CRITICO]: 'Crítico',
};

const SEVERIDAD_ACTIVE = {
  [NIVELES_SEVERIDAD.BAJO]:    'border-green-500  bg-green-500/10  text-green-400',
  [NIVELES_SEVERIDAD.MEDIO]:   'border-orange-500 bg-orange-500/10 text-orange-400',
  [NIVELES_SEVERIDAD.ALTO]:    'border-red-500    bg-red-500/10    text-red-400',
  [NIVELES_SEVERIDAD.CRITICO]: 'border-red-400    bg-red-500/15    text-red-300',
};

const STEPS = ['Categoría', 'Detalle', 'Ubicación', 'Confirmación'];

// Listas pre-computadas para el picker
const TODA_CONFIG = Object.entries(CONFIGURACION_CATEGORIAS).map(([value, cfg]) => ({ value, ...cfg }));
const CATS_RIESGO        = TODA_CONFIG.filter(c => CATEGORIAS_RIESGO.has(c.value));
const CATS_CONTAMINACION = TODA_CONFIG.filter(c => !CATEGORIAS_RIESGO.has(c.value));

const COMPRESSION_OPTIONS = {
  maxSizeMB:        1,
  maxWidthOrHeight: 1920,
  useWebWorker:     true,
  fileType:         'image/webp',
};

const MAX_FILES  = 10;
const MAX_BYTES  = 10 * 1024 * 1024; // 10 MB
const IMG_MIME   = new Set(['image/jpeg','image/jpg','image/png','image/webp','image/gif']);
const VIDEO_MIME = new Set(['video/mp4','video/quicktime']);

// ── Componente principal ──────────────────────────────────────────────────────
export default function FormularioReporte() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step,        setStep]       = useState(0);
  const [submitting,  setSubmitting]  = useState(false);
  const [compressing, setCompressing] = useState(false);

  const [form, setForm] = useState({
    tipo_contaminacion: '',
    nivel_severidad:    '',
    subcategoria:       '',
    otro_especifica:    '',
    titulo:             '',
    descripcion:        '',
    direccion:          '',
    municipio:          '',
    departamento:       '',
    latitud:            '',
    longitud:           '',
    files:              [], // [{ id, raw, compressed, preview, isVideo }]
  });

  const [gettingGPS, setGettingGPS] = useState(false);

  // Clasificación de imagen con IA antes de elegir categoría.
  // iaAnalisis = { estado: 'idle'|'analizando'|'sugerencia'|'aceptada'|'error',
  //                categoria, nombre, confianza, etiquetas, mensajeError }
  const [iaAnalisis, setIaAnalisis] = useState({ estado: 'idle' });
  const iaInputRef = useRef(null);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const stepDir = useRef(1);
  const goNext = () => { stepDir.current = 1;  setStep(s => s + 1); };
  const goPrev = () => { stepDir.current = -1; setStep(s => s - 1); };

  // Derivados del estado del formulario
  const catConfig   = form.tipo_contaminacion ? helpers.obtenerConfig(form.tipo_contaminacion) : null;
  const esRiesgo    = CATEGORIAS_RIESGO.has(form.tipo_contaminacion);
  const severidades = catConfig?.severidadesPermitidas ?? Object.values(NIVELES_SEVERIDAD);
  const sugerencias = catConfig?.sugerencias ?? [];
  const subcategoriasDisponibles = helpers.obtenerSubcategorias(form.tipo_contaminacion);
  const placeholderTitulo = catConfig?.ejemploTitulo      || 'Ej: Vertimiento de aceite en el río';
  const placeholderDesc   = catConfig?.ejemploDescripcion || 'Describe qué está pasando, desde cuándo, y cualquier detalle relevante...';

  // Al elegir categoría → limpia severidad, subcategoría y otro_especifica
  const selectCategoria = (value) => {
    setForm(p => ({
      ...p,
      tipo_contaminacion: value,
      nivel_severidad:    '',
      subcategoria:       '',
      otro_especifica:    value === TIPOS_CONTAMINACION.OTRO ? p.otro_especifica : '',
    }));
  };

  // ── Análisis IA de la imagen ─────────────────────────────────────────
  const handleImagenIA = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    if (!IMG_MIME.has(file.type)) {
      showToast('Solo se aceptan imágenes (JPG, PNG, WEBP).', 'error');
      return;
    }
    if (file.size > MAX_BYTES) {
      showToast('La imagen es muy pesada (máximo 10 MB).', 'error');
      return;
    }

    setIaAnalisis({ estado: 'analizando' });

    try {
      // Comprimir agresivo antes de enviar: HF Inference API limita el
      // payload JSON a ~3 MB y la imagen se serializa en base64 (+33 %).
      // Con 512 px y 0.4 MB nos quedamos cómodos por debajo del límite.
      const comprimida = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: 'image/jpeg',
      }).catch(() => file);

      const { data } = await analizarImagenIA(comprimida);
      const result = data?.data ?? data;

      if (!result?.categoria) {
        throw new Error('Respuesta de IA inválida');
      }

      setIaAnalisis({
        estado:    'sugerencia',
        categoria: result.categoria,
        nombre:    result.nombre,
        confianza: result.confianza,
        etiquetas: result.etiquetas || [],
      });
    } catch (err) {
      const msg = err?.response?.data?.message || 'No se pudo analizar la imagen.';
      setIaAnalisis({ estado: 'error', mensajeError: msg });
      showToast(msg, 'error');
    }
  };

  const handleAceptarIA = () => {
    if (iaAnalisis.estado !== 'sugerencia') return;
    selectCategoria(iaAnalisis.categoria);
    setIaAnalisis(prev => ({ ...prev, estado: 'aceptada' }));
    showToast(`Categoría "${iaAnalisis.nombre}" aplicada por IA.`, 'success');
  };

  const handleIgnorarIA = () => {
    setIaAnalisis({ estado: 'idle' });
  };

  // GPS automático
  const handleGPS = () => {
    if (!navigator.geolocation) {
      showToast('Tu navegador no soporta geolocalización.', 'error');
      return;
    }
    setGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        set('latitud',  lat);
        set('longitud', lng);
        const { municipio, departamento } = await reverseGeocode(lat, lng);
        if (municipio)    set('municipio',    municipio);
        if (departamento) set('departamento', departamento);
        setGettingGPS(false);
        showToast('Ubicación obtenida correctamente.', 'success', 2500);
      },
      () => {
        showToast('No se pudo obtener la ubicación. Verifica los permisos del navegador.', 'error');
        setGettingGPS(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // Errores de validación por paso
  const erroresUbicacion = () => {
    const errs = [];
    if (form.direccion.trim().length < 3) errs.push('La dirección es requerida (mínimo 3 caracteres)');
    if (!form.municipio.trim())           errs.push('El municipio es requerido');
    if (esRiesgo) {
      if (!form.latitud)  errs.push('La latitud es requerida para esta categoría');
      if (!form.longitud) errs.push('La longitud es requerida para esta categoría');
    }
    return errs;
  };

  const canNext = () => {
    if (step === 0) return !!form.tipo_contaminacion && !!form.nivel_severidad;
    if (step === 1) return form.titulo.length >= 5 && form.descripcion.length >= 10;
    if (step === 2) return erroresUbicacion().length === 0;
    return true;
  };

  // ── Gestión de archivos múltiples ────────────────────────────────────────
  const fileInputRef = useRef(null);

  const addFiles = async (rawList) => {
    const current = form.files;
    const errors  = [];

    // Filtrar válidos
    const valid = [];
    let newVideos = rawList.filter(f => VIDEO_MIME.has(f.type)).length;
    const existingVideos = current.filter(f => f.isVideo).length;

    for (const raw of rawList) {
      if (!IMG_MIME.has(raw.type) && !VIDEO_MIME.has(raw.type)) {
        errors.push(`«Archivo ${raw.name}»: tipo no permitido.`); continue;
      }
      if (raw.size > MAX_BYTES) {
        errors.push(`«${raw.name}» supera 10 MB.`); continue;
      }
      if (current.length + valid.length >= MAX_FILES) {
        errors.push('Máximo 10 archivos por reporte.'); break;
      }
      if (VIDEO_MIME.has(raw.type)) {
        if (existingVideos + newVideos > 1) {
          errors.push('Solo se permite 1 video por reporte.'); newVideos--; continue;
        }
        // Validar duración
        try {
          await new Promise((resolve, reject) => {
            const el = document.createElement('video');
            el.preload = 'metadata';
            el.onloadedmetadata = () => { URL.revokeObjectURL(el.src); el.duration > 30 ? reject() : resolve(); };
            el.onerror = reject;
            el.src = URL.createObjectURL(raw);
          });
        } catch {
          errors.push(`«${raw.name}»: el video supera 30 segundos.`); newVideos--; continue;
        }
      }
      valid.push(raw);
    }

    if (errors.length) { showToast(errors[0], 'error'); }
    if (!valid.length) return;

    setCompressing(true);
    const newItems = await Promise.all(valid.map(async (raw) => {
      const isVideo = VIDEO_MIME.has(raw.type);
      let compressed = raw;
      if (!isVideo) {
        try { compressed = await imageCompression(raw, COMPRESSION_OPTIONS); } catch { compressed = raw; }
      }
      return {
        id:         crypto.randomUUID(),
        raw,
        compressed,
        preview:    isVideo ? null : URL.createObjectURL(compressed),
        isVideo,
      };
    }));
    setCompressing(false);

    set('files', [...current, ...newItems]);
  };

  const removeFile = (id) => {
    setForm(p => {
      const item = p.files.find(f => f.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return { ...p, files: p.files.filter(f => f.id !== id) };
    });
  };

  const handleFileInput = (e) => {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (chosen.length) addFiles(chosen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canNext()) return;
    setSubmitting(true);
    try {
      const descripcionFinal = form.tipo_contaminacion === TIPOS_CONTAMINACION.OTRO && form.otro_especifica
        ? `[Tipo: ${form.otro_especifica}] ${form.descripcion}`
        : form.descripcion;

      // Siempre FormData (backend espera 'files')
      const payload = new FormData();
      payload.append('tipo_contaminacion', form.tipo_contaminacion);
      payload.append('nivel_severidad',    form.nivel_severidad);
      if (form.subcategoria) payload.append('subcategoria', form.subcategoria);
      payload.append('titulo',             form.titulo);
      payload.append('descripcion',        descripcionFinal || '');
      payload.append('direccion',          form.direccion);
      if (form.municipio)    payload.append('municipio',    form.municipio);
      if (form.departamento) payload.append('departamento', form.departamento);
      if (form.latitud  !== '') payload.append('latitud',  String(parseFloat(form.latitud)));
      if (form.longitud !== '') payload.append('longitud', String(parseFloat(form.longitud)));
      for (const item of form.files) {
        payload.append('files', item.compressed, item.raw.name);
      }

      const res = await createReporte(payload);
      const idReporte = res.data.data.reporte.id_reporte;
      showToast('¡Reporte enviado correctamente!', 'success', 4000);
      navigate(`/reports/${idReporte}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al enviar el reporte. Intenta de nuevo.', 'error');
    } finally {
      setSubmitting(false);
    }
  };



  // ── Ícono de categoría helper ─────────────────────────────────────────────
  const CatIcon = ({ tipo, size = 18, style }) => {
    const cfg  = helpers.obtenerConfig(tipo);
    const Comp = ICONO_MAP[cfg?.icono] ?? HelpCircle;
    return <Comp size={size} style={style} />;
  };

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

      {/* Cabecera */}
      <div className="mb-8">
        <Link to="/reports" className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1.5 mb-4">
          ← Volver a reportes
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Nuevo Reporte Ambiental</h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">Completa los datos del problema que deseas reportar.</p>
      </div>

      {/* Indicador de pasos */}
      <div className="flex items-center w-full mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 sm:gap-2">
            <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm font-bold transition-colors shrink-0 ${
              i < step   ? 'bg-green-500 text-gray-950'
              : i === step ? 'bg-green-500/20 border border-green-500 text-green-400'
              : 'bg-gray-800 text-gray-500'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs sm:text-sm whitespace-nowrap hidden sm:block ${
              i === step ? 'text-green-400 font-medium' : 'text-gray-500'
            }`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 min-w-[0.5rem] sm:min-w-[1rem] lg:min-w-[2rem] mx-1 sm:mx-2 ${
                i < step ? 'bg-green-500' : 'bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card overflow-hidden">
          <AnimatePresence mode="wait" custom={stepDir.current}>
            <motion.div
              key={step}
              custom={stepDir.current}
              variants={{
                enter:  (d) => ({ opacity: 0, x: d * 28 }),
                center: { opacity: 1, x: 0 },
                exit:   (d) => ({ opacity: 0, x: d * -28 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >

          {/* ── Paso 0: Categoría ──────────────────────────────────────────── */}
          {step === 0 && (
            <div className="flex flex-col gap-6">
              {/* FE-24 · Análisis IA: dropzone para sugerir categoría desde una foto */}
              <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Sparkles size={20} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      ¿No sabes qué categoría elegir?
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        IA
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Sube una foto del problema y la IA te sugerirá la categoría más probable.
                    </p>

                    <input
                      ref={iaInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImagenIA}
                      className="hidden"
                    />

                    {/* Estados del análisis IA */}
                    {iaAnalisis.estado === 'idle' && (
                      <>
                        <button
                          type="button"
                          onClick={() => iaInputRef.current?.click()}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-sm font-medium transition-colors"
                        >
                          <Camera size={16} /> Analizar imagen
                        </button>
                        <p className="text-[11px] text-gray-500 mt-1.5">
                          Formatos aceptados: JPG, PNG o WEBP · máximo 10 MB.
                        </p>
                      </>
                    )}

                    {iaAnalisis.estado === 'analizando' && (
                      <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-200 text-sm">
                        <Loader2 size={16} className="animate-spin" />
                        Analizando imagen…
                      </div>
                    )}

                    {iaAnalisis.estado === 'sugerencia' && (
                      <div className="mt-3 rounded-lg bg-gray-900/60 border border-purple-500/30 p-3">
                        <p className="text-xs text-gray-400 mb-2">Sugerencia de la IA:</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-white">{iaAnalisis.nombre}</p>
                            <p className="text-xs text-purple-300 mt-0.5">
                              Confianza: <span className="font-bold">{iaAnalisis.confianza}%</span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleAceptarIA}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium transition-colors"
                            >
                              <Check size={14} /> Aceptar
                            </button>
                            <button
                              type="button"
                              onClick={handleIgnorarIA}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium transition-colors"
                            >
                              Ignorar
                            </button>
                          </div>
                        </div>
                        {iaAnalisis.confianza < 50 && (
                          <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Confianza baja: revisa la sugerencia antes de aceptarla.
                          </p>
                        )}
                      </div>
                    )}

                    {iaAnalisis.estado === 'aceptada' && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-medium">
                        <Check size={14} />
                        Categoría aplicada por IA ({iaAnalisis.confianza}%)
                        <button
                          type="button"
                          onClick={handleIgnorarIA}
                          className="ml-1 text-gray-400 hover:text-gray-200"
                          aria-label="Limpiar sugerencia"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    {iaAnalisis.estado === 'error' && (
                      <div className="mt-3">
                        <p className="text-xs text-red-400 flex items-center gap-1.5 mb-2">
                          <AlertTriangle size={12} /> {iaAnalisis.mensajeError}
                        </p>
                        <button
                          type="button"
                          onClick={() => iaInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-medium transition-colors"
                        >
                          <Camera size={14} /> Reintentar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <h2 className="font-semibold text-white">¿Qué tipo de problema ambiental es?</h2>

              {/* Sección riesgo ambiental */}
              <div>
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <AlertCircle size={13} /> Riesgo Ambiental
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {CATS_RIESGO.map(({ value, nombre, descripcion, icono, color }) => {
                    const Ic       = ICONO_MAP[icono] ?? HelpCircle;
                    const selected = form.tipo_contaminacion === value;
                    const fromIA   = selected && iaAnalisis.estado === 'aceptada' && iaAnalisis.categoria === value;
                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => selectCategoria(value)}
                        className={`relative text-left px-4 py-3 rounded-lg border transition-all ${
                          selected ? 'ring-1' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }`}
                        style={selected ? { borderColor: color, backgroundColor: color + '18', ringColor: color } : {}}
                      >
                        {fromIA && (
                          <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-purple-500/30 text-purple-200 border border-purple-500/40">
                            <Sparkles size={9} /> IA
                          </span>
                        )}
                        <div className="flex items-center gap-2.5 mb-1">
                          <Ic size={18} style={{ color: selected ? color : '#9CA3AF' }} />
                          <span className="text-sm font-medium" style={selected ? { color } : { color: '#D1D5DB' }}>
                            {nombre}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 pl-7">{descripcion}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sección contaminación */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Contaminación ambiental
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {CATS_CONTAMINACION.map(({ value, nombre, icono, color }) => {
                    const Ic       = ICONO_MAP[icono] ?? HelpCircle;
                    const selected = form.tipo_contaminacion === value;
                    const fromIA   = selected && iaAnalisis.estado === 'aceptada' && iaAnalisis.categoria === value;
                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => selectCategoria(value)}
                        className={`relative text-left px-4 py-3 rounded-lg border transition-all ${
                          selected ? 'ring-1' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }`}
                        style={selected ? { borderColor: color, backgroundColor: color + '18' } : {}}
                      >
                        {fromIA && (
                          <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-purple-500/30 text-purple-200 border border-purple-500/40">
                            <Sparkles size={9} /> IA
                          </span>
                        )}
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Ic size={16} style={{ color: selected ? color : '#9CA3AF' }} />
                          <span style={selected ? { color } : { color: '#D1D5DB' }}>{nombre}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Campo extra cuando se elige "Otro" */}
                {form.tipo_contaminacion === TIPOS_CONTAMINACION.OTRO && (
                  <div className="mt-3">
                    <label className="text-sm text-gray-400 mb-1.5 block">
                      Especifica el tipo de problema <span className="text-gray-600">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Tala ilegal, contaminación por minería..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                      value={form.otro_especifica}
                      onChange={(e) => set('otro_especifica', e.target.value)}
                      maxLength={80}
                    />
                  </div>
                )}
              </div>

              {/* Subcategoría (aparece al elegir categoría si hay opciones disponibles) */}
              {form.tipo_contaminacion && subcategoriasDisponibles.length > 0 && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Subcategoría <span className="text-gray-600">(opcional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {subcategoriasDisponibles.map(sub => (
                      <button
                        type="button"
                        key={sub}
                        onClick={() => set('subcategoria', form.subcategoria === sub ? '' : sub)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                          form.subcategoria === sub
                            ? 'border-green-500 bg-green-500/15 text-green-400'
                            : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de severidad (aparece al elegir categoría) */}
              {form.tipo_contaminacion && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 flex items-center gap-1.5 flex-wrap">
                    Nivel de severidad
                    {catConfig && (
                      <span className="text-xs text-gray-600">
                        — permitido para {catConfig.nombre}: {severidades.map(s => SEVERIDAD_LABELS[s]).join(', ')}
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {severidades.map(sev => (
                      <button
                        type="button"
                        key={sev}
                        onClick={() => set('nivel_severidad', sev)}
                        className={`py-2.5 text-sm rounded-lg border transition-colors ${
                          form.nivel_severidad === sev
                            ? SEVERIDAD_ACTIVE[sev]
                            : 'border-gray-700 text-gray-500 hover:border-gray-600'
                        }`}
                      >
                        {SEVERIDAD_LABELS[sev]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Paso 1: Detalle ────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-semibold text-white text-lg sm:text-xl flex items-center gap-2">
                {catConfig && (
                  <CatIcon tipo={form.tipo_contaminacion} size={20} style={{ color: catConfig.color }} />
                )}
                Describe el problema
              </h2>

              {/* En LG+: sugerencias a la izquierda, campos a la derecha */}
              <div className={sugerencias.length > 0
                ? 'flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_2fr] lg:gap-8 lg:items-start'
                : 'flex flex-col gap-5'
              }>

                {/* Sugerencias contextuales */}
                {sugerencias.length > 0 && (
                  <div className="rounded-xl border border-blue-900/50 bg-blue-900/10 p-4 lg:sticky lg:top-20">
                    <p className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 mb-3">
                      <Info size={13} /> Sugerencias para
                      <span style={{ color: catConfig.color }}>{catConfig.nombre}</span>
                    </p>
                    <ul className="space-y-2">
                      {sugerencias.map((s, i) => (
                        <li key={i} className="text-xs sm:text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5 shrink-0 text-base leading-none">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Campos */}
                <div className="flex flex-col gap-5">
                  {/* Título */}
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 flex items-center justify-between">
                      <span>Título corto *</span>
                      <span className="text-xs text-gray-600">{form.titulo.length}/80</span>
                    </label>
                    <input
                      type="text"
                      placeholder={placeholderTitulo}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                      value={form.titulo}
                      onChange={(e) => set('titulo', e.target.value)}
                      maxLength={80}
                    />
                    {form.titulo.length > 0 && form.titulo.length < 5 && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> Mínimo 5 caracteres
                      </p>
                    )}
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Descripción detallada *</label>
                    <textarea
                      rows={6}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none lg:rows-8"
                      placeholder={placeholderDesc}
                      value={form.descripcion}
                      onChange={(e) => set('descripcion', e.target.value)}
                    />
                    {form.descripcion.length > 0 && form.descripcion.length < 10 && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> Mínimo 10 caracteres
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Paso 2: Ubicación ──────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">¿Dónde ocurre?</h2>
                <button
                  type="button"
                  onClick={handleGPS}
                  disabled={gettingGPS}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-700 bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gettingGPS
                    ? <><div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /> Obteniendo...</>
                    : <><Locate size={13} /> Usar mi ubicación</>}
                </button>
              </div>

              {esRiesgo && (
                <div className="rounded-lg border border-orange-900/50 bg-orange-900/10 p-3 flex items-start gap-2">
                  <AlertCircle size={14} className="text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-300">
                    Para la categoría <strong>{catConfig?.nombre}</strong> las coordenadas GPS y el municipio
                    son obligatorios.
                  </p>
                </div>
              )}

              {/* Dirección */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Dirección o lugar de referencia *</label>
                <input
                  type="text"
                  placeholder="Ej: Río Bogotá, cerca al puente de La Virgen"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                  value={form.direccion}
                  onChange={(e) => set('direccion', e.target.value)}
                />
              </div>

              {/* Municipio / Departamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Municipio *</label>
                  <input
                    type="text"
                    placeholder="Ej: Bogotá"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                    value={form.municipio}
                    onChange={(e) => set('municipio', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Departamento</label>
                  <input
                    type="text"
                    placeholder="Ej: Cundinamarca"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                    value={form.departamento}
                    onChange={(e) => set('departamento', e.target.value)}
                  />
                </div>
              </div>

              {/* Coordenadas */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">
                  Coordenadas GPS {esRiesgo ? <span className="text-orange-400">*</span> : <span className="text-gray-600">(opcional — usa el mapa)</span>}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitud. Ej: 4.7110"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                    value={form.latitud}
                    onChange={(e) => set('latitud', e.target.value)}
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitud. Ej: -74.0721"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                    value={form.longitud}
                    onChange={(e) => set('longitud', e.target.value)}
                  />
                </div>
              </div>

              {/* Mapa interactivo */}
              <Suspense fallback={
                <div className="h-64 rounded-lg bg-gray-800/50 border border-gray-700 flex items-center justify-center text-gray-500 text-sm">
                  Cargando mapa...
                </div>
              }>
                <LocationPicker
                  latitud={form.latitud}
                  longitud={form.longitud}
                  initialCenter={
                    form.latitud !== '' && form.longitud !== ''
                      ? [parseFloat(form.latitud), parseFloat(form.longitud)]
                      : null
                  }
                  onChange={(lat, lng, municipio, departamento) => {
                    set('latitud', lat);
                    set('longitud', lng);
                    if (municipio)    set('municipio',    municipio);
                    if (departamento) set('departamento', departamento);
                  }}
                />
              </Suspense>

              {/* Errores de validación (se muestran después de primer intento) */}
              {(form.direccion || form.municipio || form.latitud) && erroresUbicacion().length > 0 && (
                <div className="space-y-1">
                  {erroresUbicacion().map((err, i) => (
                    <p key={i} className="text-xs text-red-400 flex items-center gap-1.5">
                      <AlertCircle size={12} /> {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Paso 3: Confirmación ───────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-semibold text-white">Revisa y envía tu reporte</h2>

              {/* Resumen */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-sm space-y-2.5">
                <p className="font-medium text-gray-300 mb-3">Resumen</p>
                {[
                  ['Categoría',    helpers.obtenerNombre(form.tipo_contaminacion)],
                  ...(form.tipo_contaminacion === TIPOS_CONTAMINACION.OTRO && form.otro_especifica
                    ? [['Especifica', form.otro_especifica]] : []),
                  ...(form.subcategoria ? [['Subcategoría', form.subcategoria]] : []),
                  ['Severidad',    SEVERIDAD_LABELS[form.nivel_severidad]],
                  ['Título',       form.titulo],
                  ['Municipio',    form.municipio],
                  ['Departamento', form.departamento],
                  ['Dirección',    form.direccion],
                  ['Coordenadas',  form.latitud && form.longitud ? `${form.latitud}, ${form.longitud}` : '—'],
                  ['Evidencias',   form.files.length ? `${form.files.length} archivo(s)` : 'Sin adjuntos'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-gray-400">
                    <span>{k}</span>
                    <span className="text-white truncate max-w-[60%] text-right">{v || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Recordatorio de sugerencias */}
              {sugerencias.length > 0 && (
                <div className="rounded-lg border border-blue-900/50 bg-blue-900/10 p-3.5">
                  <p className="text-xs font-semibold text-blue-400 mb-1.5">
                    Verifica que tu descripción incluya:
                  </p>
                  <ul className="space-y-1">
                    {sugerencias.map((s, i) => (
                      <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Evidencia múltiple */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">
                    Evidencias <span className="text-gray-600">(opcional — hasta 10 fotos + 1 video)</span>
                  </label>
                  {form.files.length > 0 && (
                    <span className="text-xs text-gray-500">{form.files.length} / {MAX_FILES}</span>
                  )}
                </div>

                {/* Grid de previews */}
                {form.files.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                    {form.files.map((item) => (
                      <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                        {item.isVideo ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-500 px-1">
                            <Video size={22} className="text-blue-400" />
                            <span className="text-xs text-center truncate w-full px-1 text-gray-400">{item.raw.name}</span>
                          </div>
                        ) : (
                          <img src={item.preview} alt={item.raw.name} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(item.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-900/80 text-gray-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón de añadir */}
                {form.files.length < MAX_FILES && (
                  <label className="border-2 border-dashed border-gray-700 hover:border-green-600 rounded-xl p-5 text-center cursor-pointer transition-colors group block">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime"
                      onChange={handleFileInput}
                    />
                    <div className="flex flex-col items-center">
                      {compressing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-2" />
                          <p className="text-sm text-green-400">Comprimiendo imágenes...</p>
                        </>
                      ) : (
                        <>
                          <Paperclip className="w-6 h-6 text-gray-500 group-hover:text-green-400 transition-colors mb-1.5" />
                          <p className="text-sm text-gray-400 group-hover:text-gray-300">
                            {form.files.length === 0 ? 'Seleccionar archivos' : 'Añadir más'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">JPG, PNG, WebP, MP4 — máx. 10 MB c/u</p>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navegación entre pasos */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            ← Anterior
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canNext()}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              Siguiente →
            </button>
          ) : (
            <div className="flex flex-col items-stretch sm:items-end gap-2">
              <button
                type="submit"
                disabled={submitting || compressing}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto px-8"
              >
                {submitting ? 'Enviando...' : compressing ? 'Comprimiendo...' : '✓ Enviar Reporte'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
