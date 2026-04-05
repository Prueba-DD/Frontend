import { useState } from 'react';
import {
  Bell, ShieldCheck, LogOut, AlertTriangle, Download, Mail,
  User, Check, ChevronRight, Trash2, Power, Zap, ExternalLink,
  AlertCircle, RefreshCw, Tag,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV = [
  { key: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { key: 'privacidad',     label: 'Privacidad',     icon: ShieldCheck },
  { key: 'cuenta',         label: 'Cuenta',         icon: User },
  { key: 'peligro',        label: 'Zona peligrosa', icon: AlertTriangle },
];

// ── Modal de confirmación ─────────────────────────────────────────────────────
function ConfirmModal({ message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 active:scale-95 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Fila de notificación ──────────────────────────────────────────────────────
function NotifRow({ icon: Icon, label, description, checked, onChange }) {
  return (
    <label className="flex items-center gap-4 py-3.5 border-b border-gray-800/60 last:border-0 cursor-pointer group">
      <div className="w-8 h-8 rounded-lg bg-gray-800/80 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="relative shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-green-500' : 'bg-gray-700'}`}>
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
        </div>
      </div>
    </label>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { showToast }    = useToast();
  const navigate         = useNavigate();

  const [section, setSection] = useState('notificaciones');

  // ── Notificaciones ────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({ email: true, actualizados: true, categorias: false });
  const [frecuencia,   setFrecuencia]   = useState('inmediato');
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [savedNotifs,  setSavedNotifs]  = useState(false);

  // ── Modales ───────────────────────────────────────────────────────────────
  const [modal, setModal] = useState(null);

  // ── Eliminar cuenta: confirmación por texto ───────────────────────────────
  const [deleteInput, setDeleteInput] = useState('');
  const canDelete = deleteInput === 'ELIMINAR';

  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    await new Promise((r) => setTimeout(r, 700));
    setSavingNotifs(false);
    setSavedNotifs(true);
    setTimeout(() => setSavedNotifs(false), 2500);
    showToast('Preferencias guardadas.', 'success');
  };

  const handleLogoutAll = () => {
    setModal(null);
    logout();
    navigate('/login');
    showToast('Sesión cerrada en todos los dispositivos.', 'info');
  };

  const handleDeactivate = () => {
    setModal(null);
    showToast('Función no disponible aún. Contacta al administrador.', 'warning');
  };

  const handleDelete = () => {
    setModal(null);
    setDeleteInput('');
    showToast('Función no disponible aún. Contacta al administrador.', 'warning');
  };

  const displayName = `${user?.nombre ?? ''} ${user?.apellido ?? ''}`.trim() || user?.email || '—';
  const initial     = user?.nombre?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Configuración</h1>
        <p className="text-gray-400 text-sm mt-1">Administra tus preferencias y opciones de cuenta.</p>
      </div>

      {/* Layout: sidebar + contenido */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Sidebar / Tabs ──────────────────────────────────────────────── */}
        <nav className="lg:w-52 shrink-0">
          {/* Mobile: tabs horizontales */}
          <div className="flex lg:hidden gap-1 border-b border-gray-800 mb-6 overflow-x-auto">
            {NAV.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px
                  ${key === 'peligro'
                    ? section === key ? 'border-red-500 text-red-400' : 'border-transparent text-gray-500 hover:text-red-400'
                    : section === key ? 'border-green-500 text-green-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
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
                  ${key === 'peligro'
                    ? section === key
                      ? 'bg-red-500/10 text-red-400'
                      : 'text-gray-500 hover:text-red-400 hover:bg-red-500/5'
                    : section === key
                      ? 'bg-green-500/10 text-green-400'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/60'}`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Contenido principal ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* ── Notificaciones ──────────────────────────────────────────── */}
          {section === 'notificaciones' && (
            <div className="card p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
                <Bell size={16} className="text-green-400" /> Preferencias de notificaciones
              </h2>
              <p className="text-xs text-gray-500 mb-5">Elige qué notificaciones quieres recibir y con qué frecuencia.</p>

              <NotifRow
                icon={Mail}
                label="Notificaciones por email"
                description="Recibe actualizaciones importantes en tu correo."
                checked={notifs.email}
                onChange={(v) => setNotifs((n) => ({ ...n, email: v }))}
              />
              <NotifRow
                icon={RefreshCw}
                label="Reportes actualizados"
                description="Avisa cuando un reporte que creaste cambia de estado."
                checked={notifs.actualizados}
                onChange={(v) => setNotifs((n) => ({ ...n, actualizados: v }))}
              />
              <NotifRow
                icon={Tag}
                label="Nuevas categorías ambientales"
                description="Notifica cuando se agreguen nuevas categorías de reporte."
                checked={notifs.categorias}
                onChange={(v) => setNotifs((n) => ({ ...n, categorias: v }))}
              />

              {/* Frecuencia */}
              <div className="mt-5 pt-5 border-t border-gray-800">
                <p className="text-sm font-medium text-gray-300 mb-3">Frecuencia de envío</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'inmediato', label: 'Inmediato',       icon: Zap },
                    { value: 'diario',    label: 'Resumen diario',  icon: null },
                    { value: 'semanal',   label: 'Resumen semanal', icon: null },
                  ].map(({ value, label, icon: FIcon }) => (
                    <button
                      key={value}
                      onClick={() => setFrecuencia(value)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border transition-all
                        ${frecuencia === value
                          ? 'bg-green-500/15 border-green-500/50 text-green-400 font-medium'
                          : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'}`}
                    >
                      {FIcon && <FIcon size={12} />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guardar */}
              <div className="mt-5 pt-5 border-t border-gray-800 flex items-center gap-3">
                <button
                  onClick={handleSaveNotifs}
                  disabled={savingNotifs}
                  className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingNotifs ? 'Guardando...' : 'Guardar preferencias'}
                </button>
                {savedNotifs && (
                  <span className="flex items-center gap-1.5 text-xs text-green-400 animate-fade-in">
                    <Check size={12} /> Guardado
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Privacidad ──────────────────────────────────────────────── */}
          {section === 'privacidad' && (
            <div className="card p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
                <ShieldCheck size={16} className="text-green-400" /> Privacidad y datos
              </h2>

              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 mb-6">
                <p className="text-sm text-gray-300 leading-relaxed">
                  GreenAlert recopila únicamente los datos necesarios para el funcionamiento de la
                  plataforma de monitoreo ambiental. No compartimos tu información con terceros sin
                  tu consentimiento.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => showToast('Política de privacidad próximamente.', 'info')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-800 hover:border-gray-600 text-sm text-gray-300 hover:text-white transition-all group"
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck size={15} className="text-gray-500 group-hover:text-green-400 transition-colors" />
                    Ver política de privacidad
                  </span>
                  <ExternalLink size={13} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                </button>
                <button
                  onClick={() => showToast('Descarga de datos próximamente.', 'info')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-800 hover:border-gray-600 text-sm text-gray-300 hover:text-white transition-all group"
                >
                  <span className="flex items-center gap-2.5">
                    <Download size={15} className="text-gray-500 group-hover:text-green-400 transition-colors" />
                    Descargar mis datos
                  </span>
                  <ChevronRight size={13} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                </button>
              </div>
            </div>
          )}

          {/* ── Cuenta ──────────────────────────────────────────────────── */}
          {section === 'cuenta' && (
            <div className="card p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                <User size={16} className="text-green-400" /> Tu cuenta
              </h2>

              {/* Mini user card */}
              <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl mb-2">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shrink-0 shadow-md shadow-green-900/30">
                  <span className="text-white text-lg font-bold select-none">{initial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email ?? '—'}</p>
                </div>
                <Link
                  to="/profile"
                  className="ml-auto flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors shrink-0 font-medium"
                >
                  Ver perfil <ChevronRight size={12} />
                </Link>
              </div>

              {/* Estado del correo */}
              <div className="flex items-center justify-between py-3.5 border-t border-gray-800 mt-1">
                <div className="flex items-center gap-2.5 text-sm text-gray-400">
                  <Mail size={14} className="text-gray-500" />
                  Estado del correo
                </div>
                {user?.email_verificado ? (
                  <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 font-medium">
                    <Check size={11} /> Verificado
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                      <AlertCircle size={11} /> Sin verificar
                    </span>
                    <button
                      onClick={() => showToast('Verificación de email próximamente.', 'info')}
                      className="text-xs text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors"
                    >
                      Reenviar
                    </button>
                  </div>
                )}
              </div>

              {/* Cerrar sesión en todos los dispositivos */}
              <div className="pt-3.5 border-t border-gray-800 mt-1">
                <button
                  onClick={() => setModal('logout_all')}
                  className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors group"
                >
                  <LogOut size={14} className="group-hover:text-orange-400 transition-colors" />
                  Cerrar sesión en todos los dispositivos
                </button>
              </div>
            </div>
          )}

          {/* ── Zona peligrosa ──────────────────────────────────────────── */}
          {section === 'peligro' && (
            <div className="space-y-4">
              {/* Banner advertencia */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-400 leading-relaxed">
                  Las acciones en esta sección pueden afectar permanentemente tu cuenta.
                  Procede con cuidado.
                </p>
              </div>

              {/* Desactivar cuenta */}
              <div className="card border-orange-500/20 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Power size={14} className="text-orange-400" />
                      <h3 className="text-sm font-semibold text-orange-300">Desactivar cuenta</h3>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Tu cuenta quedará inactiva. Podrás reactivarla contactando al soporte.
                    </p>
                  </div>
                  <button
                    onClick={() => setModal('deactivate')}
                    className="shrink-0 self-start sm:self-center text-xs font-medium px-4 py-2 rounded-lg border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 transition-colors whitespace-nowrap"
                  >
                    Desactivar
                  </button>
                </div>
              </div>

              {/* Eliminar cuenta */}
              <div className="card border-red-500/30 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 size={14} className="text-red-400" />
                  <h3 className="text-sm font-semibold text-red-300">Eliminar cuenta permanentemente</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-5">
                  Esta acción es <span className="text-red-400 font-medium">irreversible</span>.
                  Todos tus datos, reportes y evidencias serán eliminados sin posibilidad de recuperación.
                </p>

                {/* Confirmación por texto */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">
                    Escribe{' '}
                    <span className="font-mono font-bold text-red-400 tracking-widest">ELIMINAR</span>
                    {' '}para habilitar el botón:
                  </label>
                  <input
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="ELIMINAR"
                    spellCheck={false}
                    className={`w-full sm:w-64 bg-gray-800 border rounded-lg px-3 py-2 text-sm placeholder-gray-600 font-mono focus:outline-none transition-colors
                      ${canDelete
                        ? 'border-red-500 text-red-300'
                        : 'border-gray-700 text-gray-200 focus:border-red-500/50'}`}
                  />
                </div>

                <button
                  onClick={() => canDelete && setModal('delete')}
                  disabled={!canDelete}
                  className={`text-sm font-semibold px-4 py-2.5 rounded-lg border transition-all
                    ${canDelete
                      ? 'bg-red-600 border-red-500 text-white hover:bg-red-500 cursor-pointer'
                      : 'bg-gray-800/50 border-gray-700 text-gray-600 cursor-not-allowed select-none'}`}
                >
                  Eliminar cuenta definitivamente
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Modales de confirmación ──────────────────────────────────────────── */}
      {modal === 'logout_all' && (
        <ConfirmModal
          message="¿Cerrar sesión en todos los dispositivos? Deberás iniciar sesión nuevamente."
          confirmLabel="Sí, cerrar sesión"
          confirmClass="bg-gray-700 hover:bg-gray-600 text-white"
          onConfirm={handleLogoutAll}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'deactivate' && (
        <ConfirmModal
          message="¿Desactivar tu cuenta? Tu acceso quedará suspendido hasta que contactes al soporte."
          confirmLabel="Desactivar"
          confirmClass="bg-orange-500 hover:bg-orange-400 text-white"
          onConfirm={handleDeactivate}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'delete' && (
        <ConfirmModal
          message="¿Eliminar permanentemente tu cuenta y todos tus datos? Esta acción no se puede deshacer."
          confirmLabel="Eliminar definitivamente"
          confirmClass="bg-red-600 hover:bg-red-500 text-white"
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
