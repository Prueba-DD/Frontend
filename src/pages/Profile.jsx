import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, Phone, Calendar, ShieldCheck, Pencil, Lock,
  X, Eye, EyeOff, Check, Camera, ChevronDown, ChevronUp,
  FileText, Loader2, MapPin, Clock, ChevronLeft, ChevronRight,
  AlertTriangle, Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getPerfil, updatePerfil, changePassword, getMisReportes, deleteReporte } from '../services/api';
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
    <div className="flex items-center gap-0">
      {ESTADO_STEPS.map((step, i) => {
        const isDone    = i < activeIdx;
        const isActive  = i === activeIdx;
        return (
          <div key={step.key} className="flex items-center gap-0 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-0.5">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                isDone    ? 'bg-green-500 border-green-500' :
                isActive  ? 'bg-green-600/25 border-green-500' :
                            'bg-gray-800 border-gray-700'
              }`}>
                {isDone && <Check size={8} className="text-white" />}
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
              </div>
              <span className={`text-[9px] leading-tight whitespace-nowrap ${
                isActive ? 'text-green-400 font-medium' : isDone ? 'text-gray-400' : 'text-gray-600'
              }`}>{step.label}</span>
            </div>
            {i < ESTADO_STEPS.length - 1 && (
              <div className={`flex-1 h-px mt-[-8px] mx-0.5 ${isDone ? 'bg-green-500' : 'bg-gray-700'}`} />
            )}
          </div>
        );
      })}
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

  // ── Mis Reportes ──────────────────────────────────────────────────────────
  const PAGE_SIZE = 10;
  const [misReportes,    setMisReportes]    = useState([]);
  const [misRptTotal,    setMisRptTotal]    = useState(0);
  const [misRptPage,     setMisRptPage]     = useState(0);
  const [misRptLoading,  setMisRptLoading]  = useState(false);
  const [confirmElim,    setConfirmElim]    = useState(null); // id a eliminar
  const [eliminando,     setEliminando]     = useState(false);

  const fetchMisReportes = useCallback(async (page = 0) => {
    setMisRptLoading(true);
    try {
      const { data } = await getMisReportes({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
      setMisReportes(data.data.reportes ?? []);
      setMisRptTotal(data.data.total ?? 0);
      setMisRptPage(page);
    } catch {
      showToast('No se pudieron cargar los reportes.', 'error');
    } finally {
      setMisRptLoading(false);
    }
  }, [showToast]);

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
            {/* Overlay cámara — preparado para upload futuro */}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </div>
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
                  {!editing ? (
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
                    ) : (
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
                    )}
                  </AnimatePresence>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSavePerfil}
                        disabled={saving}
                        className="flex items-center gap-1.5 text-xs bg-green-500 hover:bg-green-400 text-gray-950 font-medium rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                      >
                        {saving ? '...' : <><Check size={12} /> Guardar</>}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        <X size={12} /> Cancelar
                      </button>
                    </div>
                  )}
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
                  <div className="flex items-start gap-3 py-3">
                    <Mail className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Correo electrónico</p>
                      <p className="text-sm text-gray-400">{perfil?.email ?? '—'} <span className="text-xs text-gray-600 ml-1">(no editable)</span></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-3">
                    <Calendar className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Miembro desde</p>
                      <p className="text-sm text-gray-400">{formatDate(perfil?.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Pestaña: Seguridad ──────────────────────────────────────── */}
          {section === 'seguridad' && (
            <div className="card p-5 sm:p-6">
              {/* Acordeón cambiar contraseña */}
              <button
                onClick={() => setPwOpen((o) => !o)}
                className="w-full flex items-center justify-between"
              >
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Lock size={16} className="text-green-400" /> Cambiar contraseña
                </h2>
                {pwOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              <AnimatePresence>
                {pwOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <form onSubmit={handleChangePw} className="mt-5 space-y-4 border-t border-gray-800 pt-5">
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── Pestaña: Actividad ──────────────────────────────────────── */}
          {/* ── Pestaña: Mis Reportes ─────────────────────────────── */}
          {section === 'mis-reportes' && (
            <div className="space-y-4">
              <div className="card p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <FileText size={16} className="text-green-400" /> Mis Reportes
                  </h2>
                  <Link to="/reports/new" className="flex items-center gap-1.5 text-xs btn-primary py-1.5 px-3">
                    <Plus size={12} /> Nuevo
                  </Link>
                </div>

                {misRptLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                  </div>
                ) : misReportes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <FileText className="w-10 h-10 text-gray-700" />
                    <p className="text-gray-500 text-sm">Aún no has enviado reportes.</p>
                    <Link to="/reports/new" className="btn-primary text-xs py-1.5 px-4">
                      Crear primer reporte
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {misReportes.map((r) => {
                      const cfg = helpers.obtenerConfig(r.tipo_contaminacion);
                      const esPendiente = r.estado === 'pendiente';
                      return (
                        <div key={r.id_reporte} className="border border-gray-800 rounded-xl p-4 space-y-3">
                          {/* Cabecera */}
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span
                                  className="badge border text-[11px]"
                                  style={{ background: `${cfg?.color}18`, color: cfg?.color, borderColor: `${cfg?.color}40` }}
                                >
                                  {cfg?.nombre ?? r.tipo_contaminacion}
                                </span>
                                <span className={`badge border text-[11px] ${
                                  r.nivel_severidad === 'critico' ? 'bg-red-600/25 text-rose-200 border-red-500/60' :
                                  r.nivel_severidad === 'alto'    ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                                  r.nivel_severidad === 'medio'   ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                                                                     'bg-green-500/15 text-green-400 border-green-500/30'
                                }`}>
                                  {{ bajo:'Baja', medio:'Media', alto:'Alta', critico:'Crítico' }[r.nivel_severidad] ?? r.nivel_severidad}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-100 line-clamp-1">{r.titulo}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                {r.municipio && <span className="flex items-center gap-1"><MapPin size={11} />{r.municipio}</span>}
                                <span className="flex items-center gap-1"><Clock size={11} />{new Date(r.created_at).toLocaleDateString('es-CO', { year:'numeric', month:'short', day:'numeric' })}</span>
                              </div>
                            </div>
                          </div>

                          {/* Stepper de estado */}
                          <ReporteStepper estado={r.estado} />

                          {/* Acciones (solo en pendiente) */}
                          {esPendiente && (
                            <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
                              <Link
                                to={`/reports/${r.id_reporte}`}
                                className="text-xs text-gray-400 hover:text-green-400 transition-colors border border-gray-700 hover:border-green-500/50 rounded-lg px-3 py-1.5"
                              >
                                Editar
                              </Link>
                              <button
                                onClick={() => setConfirmElim(r.id_reporte)}
                                className="text-xs text-gray-400 hover:text-red-400 transition-colors border border-gray-700 hover:border-red-500/50 rounded-lg px-3 py-1.5"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
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
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-2xl"
                    >
                      <div className="flex items-start gap-3 mb-5">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-300 leading-relaxed">
                          ¿Eliminar este reporte? Esta acción no se puede deshacer.
                        </p>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => setConfirmElim(null)}
                          disabled={eliminando}
                          className="btn-secondary text-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleEliminar}
                          disabled={eliminando}
                          className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all active:scale-95 disabled:opacity-50"
                        >
                          {eliminando ? 'Eliminando...' : 'Eliminar'}
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
