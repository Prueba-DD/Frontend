import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, Lock, Smartphone } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmar: '',
    telefono: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (form.nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (form.apellido.trim().length < 2) return 'El apellido debe tener al menos 2 caracteres.';
    if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (form.password !== form.confirmar) return 'Las contraseñas no coinciden.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { showToast(validationError, 'warning'); return; }
    setLoading(true);
    try {
      await register(form.nombre.trim(), form.apellido.trim(), form.email, form.password, form.telefono.trim() || undefined);
      showToast('¡Cuenta creada correctamente!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || 'No se pudo crear la cuenta. Intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Débil', color: 'bg-red-500', width: 'w-1/4' };
    if (p.length < 8) return { label: 'Regular', color: 'bg-yellow-500', width: 'w-2/4' };
    if (p.length < 12) return { label: 'Buena', color: 'bg-green-500', width: 'w-3/4' };
    return { label: 'Fuerte', color: 'bg-green-400', width: 'w-full' };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* ── Panel izquierdo (solo Desktop lg+) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-gray-900 flex-col items-center justify-center p-12 border-r border-gray-800">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-sm">
          <img src="/chrome-512x512.png" alt="GreenAlert" className="w-48 mx-auto mb-6 drop-shadow-2xl" />
          <p className="text-gray-400 text-base leading-relaxed mb-10">
            Sé parte de la comunidad que cuida el medio ambiente. Reporta, comparte y genera cambio desde tu territorio.
          </p>
          <div className="space-y-3 text-left">
            {[
              { Icon: CheckCircle2, text: 'Registro gratuito, sin costo alguno' },
              { Icon: Lock,         text: 'Tus datos protegidos con cifrado' },
              { Icon: Smartphone,   text: 'Accesible desde cualquier dispositivo' },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-gray-300 text-sm bg-gray-800/60 rounded-lg px-4 py-2.5">
                <Icon className="w-4 h-4 text-green-400 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">

          {/* Logo visible solo en mobile/tablet */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/">
              <img src="/chrome-512x512.png" alt="GreenAlert" className="h-20 w-auto object-contain" />
            </Link>
          </div>

          <div className="card p-6 sm:p-8 lg:p-10">
            <div className="mb-7">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Crear cuenta</h2>
              <p className="text-gray-400 text-sm">Completa los datos para registrarte</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre + Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre *</label>
                  <input
                    type="text"
                    required
                    autoComplete="given-name"
                    value={form.nombre}
                    onChange={(e) => set('nombre', e.target.value)}
                    placeholder="Juan"
                    className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Apellido *</label>
                  <input
                    type="text"
                    required
                    autoComplete="family-name"
                    value={form.apellido}
                    onChange={(e) => set('apellido', e.target.value)}
                    placeholder="Pérez"
                    className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition text-xs select-none"
                    tabIndex={-1}
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                {strength && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                    </div>
                    <p className="text-xs text-gray-500">Fortaleza: <span className="text-gray-300">{strength.label}</span></p>
                  </div>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={form.confirmar}
                  onChange={(e) => set('confirmar', e.target.value)}
                  placeholder="Repite tu contraseña"
                  className={`w-full bg-gray-800 border text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition ${
                    form.confirmar && form.confirmar !== form.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40'
                      : 'border-gray-700 focus:border-green-500 focus:ring-green-500/40'
                  }`}
                />
                {form.confirmar && form.confirmar !== form.password && (
                  <p className="mt-1 text-xs text-red-400">Las contraseñas no coinciden</p>
                )}
              </div>

              {/* Teléfono (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Teléfono <span className="text-gray-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.telefono}
                  onChange={(e) => set('telefono', e.target.value)}
                  placeholder="+57 300 000 0000"
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition"
                />
              </div>

              <button
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creando cuenta...
                  </span>
                ) : 'Crear cuenta'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-gray-600">
            <Link to="/" className="hover:text-gray-400 transition-colors">← Volver al inicio</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
