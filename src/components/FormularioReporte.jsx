import { useState, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Paperclip, AlertCircle, Info,
  Trees, Flame, AlertTriangle, Waves,
  Droplet, Wind, Leaf, Volume2, Trash2, Lightbulb, HelpCircle,
} from 'lucide-react';
import { createReporte } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  CONFIGURACION_CATEGORIAS,
  TIPOS_CONTAMINACION,
  NIVELES_SEVERIDAD,
  helpers,
} from '../constants/categorias';

const LocationPicker = lazy(() => import('./LocationPicker'));

// ── Mapeo de nombre de ícono (string) → componente Lucide ─────────────────────
const ICONO_MAP = {
  trees:          Trees,
  flame:          Flame,
  alertTriangle:  AlertTriangle,
  waves:          Waves,
  droplet:        Droplet,
  wind:           Wind,
  leaf:           Leaf,
  volume2:        Volume2,
  trash2:         Trash2,
  lightbulb:      Lightbulb,
  helpCircle:     HelpCircle,
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

// ── Componente principal ──────────────────────────────────────────────────────
export default function FormularioReporte() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step,       setStep]      = useState(0);
  const [submitting, setSubmitting]= useState(false);

  const [form, setForm] = useState({
    tipo_contaminacion: '',
    nivel_severidad:    '',
    otro_especifica:    '',
    titulo:             '',
    descripcion:        '',
    direccion:          '',
    municipio:          '',
    departamento:       '',
    latitud:            '',
    longitud:           '',
    file:               null,
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // Derivados del estado del formulario
  const catConfig   = form.tipo_contaminacion ? helpers.obtenerConfig(form.tipo_contaminacion) : null;
  const esRiesgo    = CATEGORIAS_RIESGO.has(form.tipo_contaminacion);
  const severidades = catConfig?.severidadesPermitidas ?? Object.values(NIVELES_SEVERIDAD);
  const sugerencias = catConfig?.sugerencias ?? [];
  const placeholderTitulo = catConfig?.ejemploTitulo      || 'Ej: Vertimiento de aceite en el río';
  const placeholderDesc   = catConfig?.ejemploDescripcion || 'Describe qué está pasando, desde cuándo, y cualquier detalle relevante...';

  // Al elegir categoría → asigna severidad por defecto y limpia otro_especifica si ya no aplica
  const selectCategoria = (value) => {
    const cfg = helpers.obtenerConfig(value);
    setForm(p => ({
      ...p,
      tipo_contaminacion: value,
      nivel_severidad:    cfg?.severidadPorDefecto ?? '',
      otro_especifica:    value === TIPOS_CONTAMINACION.OTRO ? p.otro_especifica : '',
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canNext()) return;
    setSubmitting(true);
    try {
      const descripcionFinal = form.tipo_contaminacion === TIPOS_CONTAMINACION.OTRO && form.otro_especifica
        ? `[Tipo: ${form.otro_especifica}] ${form.descripcion}`
        : form.descripcion;

      // Usar FormData si hay archivo adjunto, JSON si no
      let payload;
      if (form.file) {
        payload = new FormData();
        payload.append('tipo_contaminacion', form.tipo_contaminacion);
        payload.append('nivel_severidad',    form.nivel_severidad);
        payload.append('titulo',             form.titulo);
        payload.append('descripcion',        descripcionFinal || '');
        payload.append('direccion',          form.direccion);
        if (form.municipio)    payload.append('municipio',    form.municipio);
        if (form.departamento) payload.append('departamento', form.departamento);
        if (form.latitud  !== '') payload.append('latitud',  String(parseFloat(form.latitud)));
        if (form.longitud !== '') payload.append('longitud', String(parseFloat(form.longitud)));
        payload.append('file', form.file);
      } else {
        payload = {
          tipo_contaminacion: form.tipo_contaminacion,
          nivel_severidad:    form.nivel_severidad,
          titulo:             form.titulo,
          descripcion:        descripcionFinal,
          direccion:          form.direccion,
          municipio:          form.municipio    || undefined,
          departamento:       form.departamento || undefined,
          latitud:            form.latitud  !== '' ? parseFloat(form.latitud)  : undefined,
          longitud:           form.longitud !== '' ? parseFloat(form.longitud) : undefined,
        };
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
        <div className="card">

          {/* ── Paso 0: Categoría ──────────────────────────────────────────── */}
          {step === 0 && (
            <div className="flex flex-col gap-6">
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
                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => selectCategoria(value)}
                        className={`text-left px-4 py-3 rounded-lg border transition-all ${
                          selected ? 'ring-1' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }`}
                        style={selected ? { borderColor: color, backgroundColor: color + '18', ringColor: color } : {}}
                      >
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
                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => selectCategoria(value)}
                        className={`text-left px-4 py-3 rounded-lg border transition-all ${
                          selected ? 'ring-1' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }`}
                        style={selected ? { borderColor: color, backgroundColor: color + '18' } : {}}
                      >
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
              <h2 className="font-semibold text-white">¿Dónde ocurre?</h2>

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
                  ['Severidad',    SEVERIDAD_LABELS[form.nivel_severidad]],
                  ['Título',       form.titulo],
                  ['Municipio',    form.municipio],
                  ['Departamento', form.departamento],
                  ['Dirección',    form.direccion],
                  ['Coordenadas',  form.latitud && form.longitud ? `${form.latitud}, ${form.longitud}` : '—'],
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

              {/* Evidencia */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Evidencia adjunta (opcional)</label>
                <label className="border-2 border-dashed border-gray-700 hover:border-green-600 rounded-xl p-6 text-center cursor-pointer transition-colors group block">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,video/*,.pdf"
                    onChange={(e) => set('file', e.target.files[0])}
                  />
                  <div className="flex flex-col items-center">
                    <Paperclip className="w-7 h-7 text-gray-500 group-hover:text-green-400 transition-colors mb-2" />
                    {form.file ? (
                      <p className="text-sm text-green-400 font-medium">{form.file.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-400 group-hover:text-gray-300">
                          Haz clic para seleccionar archivo
                        </p>
                        <p className="text-xs text-gray-600 mt-1">JPG, PNG, MP4, PDF — máx. 50MB</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Navegación entre pasos */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            ← Anterior
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              Siguiente →
            </button>
          ) : (
            <div className="flex flex-col items-stretch sm:items-end gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto px-8"
              >
                {submitting ? 'Enviando...' : '✓ Enviar Reporte'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
