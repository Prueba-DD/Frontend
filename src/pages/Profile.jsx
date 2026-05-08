import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, Phone, Calendar, ShieldCheck, Pencil, Lock,
  X, Eye, EyeOff, Check, Camera, ChevronDown, ChevronUp,
  FileText, Loader2, MapPin, Clock, ChevronLeft, ChevronRight,
  AlertTriangle, Plus, Leaf, Flame, Waves, Droplets, Wind,
  Volume2, Sun, Mountain, Trash2, HelpCircle, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getPerfil, updatePerfil, updateAvatar, changePassword, getMisReportes, deleteReporte } from '../services/api';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { helpers } from '../constants/categorias';

const rolLabel = { ciudadano: 'Ciudadano', moderador: 'Moderador', admin: 'Administrador' };
const rolColor  = {
  ciudadano:  'bg-green-500/15 text-green-400 border-green-500/30',
  moderador:  'bg-blue-500/15  text-blue-400  border-blue-500/30',
  admin:      'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

// ── Barra de completitud ──────────────────────────────────────────────────────
function ProfileCompletion({ perfil }) {
  const fields = [
    !!perfil?.nombre,
    !!perfil?.apellido,
    !!perfil?.email,
    !!perfil?.telefono,
  ];
  const done = fields.filter(Boolean).length;
  const pct  = Math.round((done / fields.length) * 100);
  const color = pct < 50 ? 'bg-red-500' : pct < 100 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
        <span>Completitud del perfil</span>
        <span className={pct === 100 ? 'text-green-400 font-medium' : 'text-gray-400'}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct < 100 && (
        <p className="text-xs text-gray-500 mt-1.5">
          {!perfil?.telefono && 'Agrega tu teléfono para completar tu perfil.'}
        </p>
      )}
    </div>
  );
}

// ── Campo inline editable ─────────────────────────────────────────────────────
function InlineField({ label, value, editing, editValue, onChange, placeholder, error, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-800/60 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-gray-500 mt-1 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        {editing ? (
          <>
            <input
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500
                focus:outline-none transition-colors
                ${error ? 'border-red-500' : 'border-gray-700 focus:border-green-500'}`}
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </>
        ) : (
          <p className="text-sm text-gray-200 truncate">{value || <span className="text-gray-600 italic">No registrado</span>}</p>
        )}
      </div>
    </div>
  );
}

// ── Campo de contraseña ───────────────────────────────────────────────────────
function PwField({ label, value, onChange, show, onToggleShow, error, placeholder = '••••••••' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-200
            placeholder-gray-500 focus:outline-none transition-colors
            ${error ? 'border-red-500' : 'border-gray-700 focus:border-green-500'}`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// ── Stepper de estado de reporte ─────────────────────────────────────────────
const ESTADO_STEPS = [
  { key: 'pendiente',   label: 'Enviado'    },
  { key: 'en_revision', label: 'Revisión'   },
  { key: 'verificado',  label: 'Verificado' },
  { key: 'en_proceso',  label: 'En proceso' },
  { key: 'resuelto',    label: 'Resuelto'   },
];

// ── Configuración por severidad ───────────────────────────────────────────────
const SEVERITY_CFG = {
  bajo:    { label: 'Baja',    bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30' },
  medio:   { label: 'Media',   bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  alto:    { label: 'Alta',    bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30' },
  critico: { label: 'Crítico', bg: 'bg-red-600/25',    text: 'text-rose-200',   border: 'border-red-500/60' },
};

// ── Ícono por tipo de categoría ───────────────────────────────────────────────
const TIPO_ICON_MAP = {
  deforestacion:                 Leaf,
  incendios_forestales:          Flame,
  deslizamientos:                AlertTriangle,
  avalanchas_fluviotorrenciales: Waves,
  agua:                          Droplets,
  aire:                          Wind,
  ruido:                         Volume2,
  suelo:                         Mountain,
  residuos:                      Trash2,
  luminica:                      Sun,
};

function CategoryIcon({ tipo, color, size = 22 }) {
  const Icon = TIPO_ICON_MAP[tipo] ?? HelpCircle;
  return <Icon size={size} style={{ color }} />;
}
function ReporteStepper({ estado }) {
  if (estado === 'rechazado') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600/20 border border-red-500/50">
          <X size={11} className="text-red-400" />
        </div>
        <span className="text-xs text-red-400 font-medium">Rechazado</span>
      </div>
    );
  }
  const activeIdx = ESTADO_STEPS.findIndex((s) => s.key === estado);
  return (
    <div className="flex items-center gap-0" title={`Estado: ${ESTADO_STEPS[activeIdx]?.label ?? estado}`}>
      {ESTADO_STEPS.map((step, i) => {
        const isDone    = i < activeIdx;
        const isActive  = i === activeIdx;
        return (
          <div key={step.key} className="flex items-center gap-0 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-0.5" title={step.label}>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                isDone    ? 'bg-green-500 border-green-500' :
                isActive  ? 'bg-green-600/25 border-green-500' :
                            'bg-gray-800 border-gray-700'
              }`}>
                {isDone && <Check size={8} className="text-white" />}
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
              </div>
              {/* Label: oculto en xs, visible a partir de sm */}
              <span className={`hidden sm:block text-[9px] leading-tight whitespace-nowrap ${
                isActive ? 'text-green-400 font-medium' : isDone ? 'text-gray-400' : 'text-gray-600'
              }`}>{step.label}</span>
            </div>
            {i < ESTADO_STEPS.length - 1 && (
              <div className={`flex-1 h-px mt-[-8px] sm:mt-[-14px] mx-0.5 ${isDone ? 'bg-green-500' : 'bg-gray-700'}`} />
            )}
          </div>
        );
      })}
      {/* En mobile: muestra solo el label del paso activo */}
      {activeIdx >= 0 && (
        <span className="sm:hidden ml-2 text-[10px] text-green-400 font-medium whitespace-nowrap">
          {ESTADO_STEPS[activeIdx].label}
        </span>
      )}
    </div>
  );
}

// ── Nav items del sidebar ─────────────────────────────────────────────────────
const NAV = [
  { key: 'perfil',       label: 'Perfil',         icon: User },
  { key: 'seguridad',    label: 'Seguridad',       icon: Lock },
  { key: 'mis-reportes', label: 'Mis Reportes',    icon: FileText },
];

export default function Profile() {
  const { user }       = useAuth();
  const { showToast }  = useToast();
  const [section, setSection] = useState('perfil');

  // ── Datos ─────────────────────────────────────────────────────────────────
  const [perfil,      setPerfil]      = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // ── Edición inline ────────────────────────────────────────────────────────
  const [editing,    setEditing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [editForm,   setEditForm]   = useState({ nombre: '', apellido: '', telefono: '' });
  const [editErrors, setEditErrors] = useState({});

  // ── Cambiar contraseña (acordeón) ─────────────────────────────────────────
  const [pwOpen,   setPwOpen]   = useState(false);
  const [pwForm,   setPwForm]   = useState({ actual: '', nueva: '', confirmar: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw,   setShowPw]   = useState({ actual: false, nueva: false, confirmar: false });

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Solo se permiten imágenes JPEG, PNG o WebP.', 'warning');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen no puede superar 2 MB.', 'warning');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    setAvatarUploading(true);
    try {
      const { data } = await updateAvatar(formData);
      setPerfil(data.data.user);
      showToast('Foto de perfil actualizada.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al subir la foto.', 'error');
    } finally {
      setAvatarUploading(false);
      // Reset para permitir volver a seleccionar el mismo archivo
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // ── Mis Reportes ──────────────────────────────────────────────────────────
  const PAGE_SIZE = 10;
  const [misReportes,    setMisReportes]    = useState([]);
  const [misRptTotal,    setMisRptTotal]    = useState(0);
  const [misRptPage,     setMisRptPage]     = useState(0);
  const [misRptLoading,  setMisRptLoading]  = useState(false);
  const [confirmElim,    setConfirmElim]    = useState(null);
  const [eliminando,     setEliminando]     = useState(false);
  const [rptFiltros,     setRptFiltros]     = useState({ estado: '', severidad: '' });

  const fetchMisReportes = useCallback(async (page = 0, filtros = rptFiltros) => {
    setMisRptLoading(true);
    try {
      const params = { limit: PAGE_SIZE, offset: page * PAGE_SIZE };
      if (filtros.estado)    params.estado           = filtros.estado;
      if (filtros.severidad) params.nivel_severidad  = filtros.severidad;
      const { data } = await getMisReportes(params);
      setMisReportes(data.data.reportes ?? []);
      setMisRptTotal(data.data.total ?? 0);
      setMisRptPage(page);
    } catch {
      showToast('No se pudieron cargar los reportes.', 'error');
    } finally {
      setMisRptLoading(false);
    }
  }, [showToast, rptFiltros]);

  useEffect(() => {
    if (section === 'mis-reportes') fetchMisReportes(0);
  }, [section, fetchMisReportes]);

  const handleEliminar = async () => {
    if (!confirmElim) return;
    setEliminando(true);
    try {
      await deleteReporte(confirmElim);
      showToast('Reporte eliminado.', 'success');
      setConfirmElim(null);
      fetchMisReportes(misRptPage);
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Error al eliminar.', 'error');
    } finally {
      setEliminando(false);
    }
  };

  useEffect(() => {
    getPerfil()
      .then(({ data }) => {
        const u = data.data.user;
        setPerfil(u);
        setEditForm({ nombre: u.nombre ?? '', apellido: u.apellido ?? '', telefono: u.telefono ?? '' });
      })
      .catch(() => {
        // fallback al usuario del contexto mientras el backend no tenga el endpoint
        if (user) {
          setPerfil(user);
          setEditForm({ nombre: user.nombre ?? '', apellido: user.apellido ?? '', telefono: user.telefono ?? '' });
        }
      })
      .finally(() => setLoadingData(false));
  }, []);

  // ── Guardar perfil ────────────────────────────────────────────────────────
  const validateEdit = () => {
    const errs = {};
    if (!editForm.nombre.trim() || editForm.nombre.trim().length < 2)
      errs.nombre = 'Mínimo 2 caracteres.';
    if (!editForm.apellido.trim() || editForm.apellido.trim().length < 2)
      errs.apellido = 'Mínimo 2 caracteres.';
    if (editForm.telefono && !/^[\d\s+\-().]{6,20}$/.test(editForm.telefono.trim()))
      errs.telefono = 'Número inválido.';
    return errs;
  };

  const handleSavePerfil = async (e) => {
    e.preventDefault();
    const errs = validateEdit();
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setSaving(true);
    try {
      const { data } = await updatePerfil({
        nombre:   editForm.nombre.trim(),
        apellido: editForm.apellido.trim(),
        telefono: editForm.telefono.trim() || null,
      });
      setPerfil(data.data.user);
      setEditing(false);
      setEditErrors({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      showToast('Perfil actualizado correctamente.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al actualizar el perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditErrors({});
    setEditForm({ nombre: perfil?.nombre ?? '', apellido: perfil?.apellido ?? '', telefono: perfil?.telefono ?? '' });
  };

  // ── Cambiar contraseña ────────────────────────────────────────────────────
  const validatePw = () => {
    const errs = {};
    if (!pwForm.actual)            errs.actual    = 'Ingresa tu contraseña actual.';
    if (pwForm.nueva.length < 8)   errs.nueva     = 'Mínimo 8 caracteres.';
    if (pwForm.nueva !== pwForm.confirmar) errs.confirmar = 'Las contraseñas no coinciden.';
    return errs;
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    const errs = validatePw();
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwSaving(true);
    try {
      await changePassword(pwForm.actual, pwForm.nueva, pwForm.confirmar);
      setPwForm({ actual: '', nueva: '', confirmar: '' });
      setPwErrors({});
      setPwOpen(false);
      showToast('Contraseña actualizada correctamente.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al cambiar la contraseña.', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center text-gray-500">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Cargando perfil...</p>
      </div>
    );
  }

  const displayName = `${perfil?.nombre ?? ''} ${perfil?.apellido ?? ''}`.trim() || '—';
  const initial     = perfil?.nombre?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <div className="card mb-8 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-900/30">
              {perfil?.avatar_url ? (
                <img src={perfil.avatar_url} alt={displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-3xl sm:text-4xl font-bold select-none">{initial}</span>
              )}
            </div>
            {/* Overlay cámara — abre selector de archivo */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              aria-label="Cambiar foto de perfil"
              className="absolute inset-0 rounded-full bg-black/55 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
            >
              {avatarUploading
                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                : <><Camera className="w-5 h-5 text-white" /><span className="text-[10px] text-white/80 mt-0.5 leading-none">Cambiar</span></>
              }
            </button>
            {/* Input oculto para selección de archivo */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{displayName}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${rolColor[perfil?.rol] ?? rolColor.ciudadano}`}>
                {(perfil?.rol === 'moderador' || perfil?.rol === 'admin') && (
                  <ShieldCheck className="inline w-3 h-3 mr-1 -mt-0.5" />
                )}
                {rolLabel[perfil?.rol] ?? perfil?.rol}
              </span>
            </div>
            <p className="text-sm text-gray-400 truncate">{perfil?.email ?? '—'}</p>
            <p className="text-xs text-gray-600 mt-1">Miembro desde {formatDate(perfil?.created_at)}</p>

            {/* Barra completitud */}
            <ProfileCompletion perfil={perfil} />
          </div>
        </div>
      </div>

      {/* ── Layout: sidebar + contenido ────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar / Tabs */}
        <nav className="lg:w-52 shrink-0">
          {/* Mobile: tabs horizontales */}
          <div className="flex lg:hidden gap-1 border-b border-gray-800 mb-6 overflow-x-auto">
            {NAV.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px
                  ${section === key
                    ? 'border-green-500 text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Desktop: sidebar vertical */}
          <div className="hidden lg:flex flex-col gap-1">
            {NAV.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors
                  ${section === key
                    ? 'bg-green-500/10 text-green-400'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/60'}`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── Pestaña: Perfil ─────────────────────────────────────────── */}
          {section === 'perfil' && (
            <>
              {/* Información personal (campos inline) */}
              <div className="card p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <User size={16} className="text-green-400" /> Información personal
                  </h2>
                  <AnimatePresence mode="wait">
                    {saved ? (
                      <motion.div
                        key="saved"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-1.5 text-xs text-green-400"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <motion.path
                            d="M2.5 7L5.5 10L11.5 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                          />
                        </svg>
                        Guardado
                      </motion.div>
                    ) : !editing ? (
                      <motion.button
                        key="edit"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-400 transition-colors border border-gray-700 hover:border-green-500/50 rounded-lg px-3 py-1.5"
                      >
                        <Pencil size={12} /> Editar
                      </motion.button>
                    ) : null}
                  </AnimatePresence>
                </div>

                <div>
                  <InlineField
                    label="Nombre"
                    icon={User}
                    value={perfil?.nombre}
                    editing={editing}
                    editValue={editForm.nombre}
                    onChange={(v) => { setEditForm((f) => ({ ...f, nombre: v })); setEditErrors((e) => ({ ...e, nombre: '' })); }}
                    placeholder="Juan"
                    error={editErrors.nombre}
                  />
                  <InlineField
                    label="Apellido"
                    icon={User}
                    value={perfil?.apellido}
                    editing={editing}
                    editValue={editForm.apellido}
                    onChange={(v) => { setEditForm((f) => ({ ...f, apellido: v })); setEditErrors((e) => ({ ...e, apellido: '' })); }}
                    placeholder="García"
                    error={editErrors.apellido}
                  />
                  <InlineField
                    label="Teléfono"
                    icon={Phone}
                    value={perfil?.telefono}
                    editing={editing}
                    editValue={editForm.telefono}
                    onChange={(v) => { setEditForm((f) => ({ ...f, telefono: v })); setEditErrors((e) => ({ ...e, telefono: '' })); }}
                    placeholder="+57 300 1234567"
                    error={editErrors.telefono}
                  />
                  {/* Campos de solo lectura */}
                  <div className="flex items-start gap-3 py-3 border-b border-gray-800/60">
                    <Mail className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Correo electrónico</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-gray-400 truncate">{perfil?.email ?? '—'}</p>
                        <span
                          title="El correo electrónico es el identificador único de tu cuenta y no puede modificarse. Si necesitas cambiarlo, contacta al soporte."
                          className="inline-flex items-center gap-1 text-[11px] text-gray-600 border border-gray-700/60 rounded-full px-2 py-0.5 cursor-help hover:text-gray-400 hover:border-gray-600 transition-colors"
                        >
                          <HelpCircle size={10} /> no editable
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-3">
                    <Calendar className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Miembro desde</p>
                      <p className="text-sm text-gray-400">{formatDate(perfil?.created_at)}</p>
                    </div>
                  </div>

                  {/* Botones Guardar/Cancelar al pie del formulario cuando se edita */}
                  {editing && (
                    <div className="flex gap-2 pt-4 border-t border-gray-800 mt-1">
                      <button
                        onClick={handleSavePerfil}
                        disabled={saving}
                        className="flex items-center gap-1.5 text-sm bg-green-500 hover:bg-green-400 text-gray-950 font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                      >
                        {saving ? <><Loader2 size={13} className="animate-spin" /> Guardando...</> : <><Check size={13} /> Guardar cambios</>}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg px-4 py-2 transition-colors"
                      >
                        <X size={13} /> Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Pestaña: Seguridad ──────────────────────────────────────── */}
          {section === 'seguridad' && (
            <>
            <div className="card p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
                <Lock size={16} className="text-green-400" /> Cambiar contraseña
              </h2>

              {perfil?.es_oauth ? (
                /* Aviso para usuarios OAuth */
                <div className="flex items-start gap-3 rounded-xl border border-blue-500/25 bg-blue-500/8 p-4">
                  <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-300 mb-0.5">Cuenta vinculada con proveedor externo</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Tu cuenta fue creada mediante Google o Facebook. La autenticación se gestiona desde tu proveedor.
                      No es posible establecer una contraseña directamente en GreenAlert.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePw} className="space-y-4">
                  <PwField
                    label="Contraseña actual *"
                    value={pwForm.actual}
                    onChange={(v) => { setPwForm((f) => ({ ...f, actual: v })); setPwErrors((e) => ({ ...e, actual: '' })); }}
                    show={showPw.actual}
                    onToggleShow={() => setShowPw((s) => ({ ...s, actual: !s.actual }))}
                    error={pwErrors.actual}
                  />
                  <PwField
                    label="Nueva contraseña *"
                    value={pwForm.nueva}
                    onChange={(v) => { setPwForm((f) => ({ ...f, nueva: v })); setPwErrors((e) => ({ ...e, nueva: '' })); }}
                    show={showPw.nueva}
                    onToggleShow={() => setShowPw((s) => ({ ...s, nueva: !s.nueva }))}
                    error={pwErrors.nueva}
                  />
                  {pwForm.nueva && <PasswordStrengthIndicator password={pwForm.nueva} />}
                  <PwField
                    label="Confirmar nueva contraseña *"
                    value={pwForm.confirmar}
                    onChange={(v) => { setPwForm((f) => ({ ...f, confirmar: v })); setPwErrors((e) => ({ ...e, confirmar: '' })); }}
                    show={showPw.confirmar}
                    onToggleShow={() => setShowPw((s) => ({ ...s, confirmar: !s.confirmar }))}
                    error={pwErrors.confirmar}
                  />
                  {pwForm.nueva && pwForm.confirmar && pwForm.nueva === pwForm.confirmar && (
                    <p className="text-xs text-green-400 flex items-center gap-1"><Check size={12} /> Las contraseñas coinciden</p>
                  )}
                  <button
                    type="submit"
                    disabled={pwSaving}
                    className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pwSaving ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
                </form>
              )}
            </div>

            {/* ── Cuentas conectadas ─── */}
            <div className="card p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-green-400" /> Cuentas conectadas
              </h2>
              <div className="space-y-3">
                {/* Google */}
                <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-gray-700 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">Google</p>
                      <p className="text-xs text-gray-500">Inicio de sesión con Google</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                    perfil?.es_oauth
                      ? 'bg-green-500/10 text-green-400 border-green-500/25'
                      : 'bg-gray-800 text-gray-500 border-gray-700'
                  }`}>
                    {perfil?.es_oauth ? 'Conectado' : 'No conectado'}
                  </span>
                </div>

                {/* Correo / Contraseña */}
                <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-gray-700 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">Correo y contraseña</p>
                      <p className="text-xs text-gray-500">Autenticación local de GreenAlert</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                    !perfil?.es_oauth
                      ? 'bg-green-500/10 text-green-400 border-green-500/25'
                      : 'bg-gray-800 text-gray-500 border-gray-700'
                  }`}>
                    {!perfil?.es_oauth ? 'Activo' : 'No configurado'}
                  </span>
                </div>
              </div>
            </div>
            </>
          )}
          {/* ── Pestaña: Mis Reportes ─────────────────────────────── */}
          {section === 'mis-reportes' && (
            <div className="space-y-4">
              <div className="card p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <FileText size={16} className="text-green-400" /> Mis Reportes
                    {misRptTotal > 0 && <span className="text-xs text-gray-500 font-normal">({misRptTotal})</span>}
                  </h2>
                  <Link to="/reports/new" className="flex items-center gap-1.5 text-xs btn-primary py-1.5 px-3">
                    <Plus size={12} /> Nuevo
                  </Link>
                </div>

                {/* ── Filtros ── */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <select
                    value={rptFiltros.estado}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRptFiltros((f) => ({ ...f, estado: val }));
                      fetchMisReportes(0, { ...rptFiltros, estado: val });
                    }}
                    className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-green-500 transition-colors cursor-pointer"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Enviado</option>
                    <option value="en_revision">En revisión</option>
                    <option value="verificado">Verificado</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                  <select
                    value={rptFiltros.severidad}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRptFiltros((f) => ({ ...f, severidad: val }));
                      fetchMisReportes(0, { ...rptFiltros, severidad: val });
                    }}
                    className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-green-500 transition-colors cursor-pointer"
                  >
                    <option value="">Toda severidad</option>
                    <option value="bajo">Baja</option>
                    <option value="medio">Media</option>
                    <option value="alto">Alta</option>
                    <option value="critico">Crítico</option>
                  </select>
                  {(rptFiltros.estado || rptFiltros.severidad) && (
                    <button
                      onClick={() => {
                        setRptFiltros({ estado: '', severidad: '' });
                        fetchMisReportes(0, { estado: '', severidad: '' });
                      }}
                      className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 px-2 transition-colors"
                    >
                      <X size={11} /> Limpiar
                    </button>
                  )}
                </div>

                {misRptLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                  </div>
                ) : misReportes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <FileText className="w-10 h-10 text-gray-700" />
                    <p className="text-gray-500 text-sm">
                      {rptFiltros.estado || rptFiltros.severidad ? 'Sin reportes con esos filtros.' : 'Aún no has enviado reportes.'}
                    </p>
                    {!rptFiltros.estado && !rptFiltros.severidad && (
                      <Link to="/reports/new" className="btn-primary text-xs py-1.5 px-4">
                        Crear primer reporte
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {misReportes.map((r, idx) => {
                      const cfg      = helpers.obtenerConfig(r.tipo_contaminacion);
                      const sevCfg   = SEVERITY_CFG[r.nivel_severidad] ?? SEVERITY_CFG.bajo;
                      const esPendiente = r.estado === 'pendiente';
                      const accentColor = cfg?.color ?? '#22c55e';
                      return (
                        <motion.div
                          key={r.id_reporte}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.24, delay: idx * 0.04, ease: 'easeOut' }}
                          className="group relative overflow-hidden rounded-xl border border-gray-800/80 hover:border-gray-700 bg-gray-900/50 hover:bg-gray-800/30 transition-all duration-200"
                        >
                          {/* Accent bar izquierda — color de categoría */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-[3px]"
                            style={{ background: accentColor }}
                          />

                          <div className="pl-5 pr-4 pt-4 pb-0">

                            {/* ─── Fila principal: contenido + caja de ícono ─── */}
                            <div className="flex gap-3">

                              {/* Contenido izquierdo */}
                              <div className="flex-1 min-w-0">
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                  <span
                                    className="badge border text-[11px] font-medium"
                                    style={{ background: `${accentColor}18`, color: accentColor, borderColor: `${accentColor}40` }}
                                  >
                                    {cfg?.nombre ?? r.tipo_contaminacion}
                                  </span>
                                  <span className={`badge border text-[11px] font-medium ${sevCfg.bg} ${sevCfg.text} ${sevCfg.border}`}>
                                    {sevCfg.label}
                                  </span>
                                </div>

                                {/* Título */}
                                <h3 className="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug mb-1.5 group-hover:text-white transition-colors">
                                  {r.titulo}
                                </h3>

                                {/* Descripción (si disponible) */}
                                {r.descripcion && (
                                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">
                                    {r.descripcion}
                                  </p>
                                )}

                                {/* Meta */}
                                <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                                  {r.municipio && (
                                    <span className="flex items-center gap-1">
                                      <MapPin size={10} className="shrink-0" />{r.municipio}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock size={10} className="shrink-0" />
                                    {new Date(r.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>

                              {/* Caja de ícono de categoría (solo sm+) */}
                              <div
                                className="hidden sm:flex shrink-0 self-start mt-0.5 w-14 h-14 rounded-xl items-center justify-center border"
                                style={{
                                  background: `${accentColor}0d`,
                                  borderColor: `${accentColor}28`,
                                }}
                              >
                                <CategoryIcon tipo={r.tipo_contaminacion} color={accentColor} size={24} />
                              </div>
                            </div>

                            {/* ─── Franja inferior: stepper + acciones ─── */}
                            <div className="flex items-center gap-3 py-2.5 border-t border-gray-800/60 -mx-4 px-4">
                              {/* Stepper (se estira) */}
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <ReporteStepper estado={r.estado} />
                              </div>

                              {/* Acciones — íconos compactos */}
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Link
                                  to={`/reports/${r.id_reporte}`}
                                  className="p-1.5 rounded-lg text-gray-600 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                                  title="Ver detalle"
                                >
                                  <ExternalLink size={14} />
                                </Link>
                                {esPendiente && (
                                  <>
                                    <Link
                                      to={`/reports/${r.id_reporte}`}
                                      className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                      title="Editar"
                                    >
                                      <Pencil size={14} />
                                    </Link>
                                    <button
                                      onClick={() => setConfirmElim(r.id_reporte)}
                                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                      title="Eliminar"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Paginación */}
                    {misRptTotal > PAGE_SIZE && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-gray-500">
                          {misRptPage * PAGE_SIZE + 1}–{Math.min((misRptPage + 1) * PAGE_SIZE, misRptTotal)} de {misRptTotal}
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={misRptPage === 0}
                            onClick={() => fetchMisReportes(misRptPage - 1)}
                            className="flex items-center gap-1 text-xs btn-secondary py-1.5 px-3 disabled:opacity-40"
                          >
                            <ChevronLeft size={13} /> Anterior
                          </button>
                          <button
                            disabled={(misRptPage + 1) * PAGE_SIZE >= misRptTotal}
                            onClick={() => fetchMisReportes(misRptPage + 1)}
                            className="flex items-center gap-1 text-xs btn-secondary py-1.5 px-3 disabled:opacity-40"
                          >
                            Siguiente <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal de confirmación de eliminación */}
              <AnimatePresence>
                {confirmElim && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget && !eliminando) setConfirmElim(null); }}
                  >
                    <motion.div
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="modal-elim-title"
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
                          <p id="modal-elim-title" className="text-sm font-semibold text-white mb-1">¿Eliminar reporte?</p>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            Esta acción es permanente y no se puede deshacer. El reporte y toda su información serán borrados.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => setConfirmElim(null)}
                          disabled={eliminando}
                          className="btn-secondary text-sm"
                          autoFocus
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleEliminar}
                          disabled={eliminando}
                          className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {eliminando ? <><Loader2 size={13} className="animate-spin" /> Eliminando...</> : 'Eliminar'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
