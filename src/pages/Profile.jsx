import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Calendar, ShieldCheck, Pencil, Lock,
  X, Eye, EyeOff, Check, Camera, ChevronDown, ChevronUp,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getPerfil, updatePerfil, changePassword } from '../services/api';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

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

// ── Nav items del sidebar ─────────────────────────────────────────────────────
const NAV = [
  { key: 'perfil',    label: 'Perfil',     icon: User },
  { key: 'seguridad', label: 'Seguridad',  icon: Lock },
  { key: 'actividad', label: 'Actividad',  icon: Activity },
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
  const [editForm,   setEditForm]   = useState({ nombre: '', apellido: '', telefono: '' });
  const [editErrors, setEditErrors] = useState({});

  // ── Cambiar contraseña (acordeón) ─────────────────────────────────────────
  const [pwOpen,   setPwOpen]   = useState(false);
  const [pwForm,   setPwForm]   = useState({ actual: '', nueva: '', confirmar: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw,   setShowPw]   = useState({ actual: false, nueva: false, confirmar: false });

  useEffect(() => {
    getPerfil()
      .then(({ data }) => {
        const u = data.data.usuario;
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
      setPerfil(data.data.usuario);
      setEditing(false);
      setEditErrors({});
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
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-400 transition-colors border border-gray-700 hover:border-green-500/50 rounded-lg px-3 py-1.5"
                    >
                      <Pencil size={12} /> Editar
                    </button>
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

              {pwOpen && (
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
              )}
            </div>
          )}

          {/* ── Pestaña: Actividad ──────────────────────────────────────── */}
          {section === 'actividad' && (
            <div className="card p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                <Activity size={16} className="text-green-400" /> Actividad reciente
              </h2>
              <p className="text-sm text-gray-500 italic">
                Próximamente: historial de reportes enviados, votos y actividad en la plataforma.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
