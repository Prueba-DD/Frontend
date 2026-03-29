import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MapPin, Users, BarChart2, Bell } from 'lucide-react';

const features = [
  { Icon: MapPin,   text: 'Geolocalización precisa' },
  { Icon: Users,    text: 'Participación colectiva' },
  { Icon: BarChart2, text: 'Visualización en mapa' },
  { Icon: Bell,     text: 'Alertas tempranas' },
];

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await login(form.email, form.password);
      showToast(`Bienvenido, ${userData.nombre}`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || 'Correo o contraseña incorrectos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* ── Panel izquierdo (solo Desktop lg+) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-gray-900 flex-col items-center justify-center p-12 border-r border-gray-800">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute left-1/4 bottom-16 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 text-center max-w-sm">
          <img src="/chrome-512x512.png" alt="GreenAlert" className="w-48 mx-auto mb-6 drop-shadow-2xl" />
          <p className="text-gray-400 text-base leading-relaxed mb-10">
            Plataforma ciudadana para el monitoreo y reporte de problemáticas ambientales en tu territorio.
          </p>
          <div className="grid grid-cols-2 gap-3 text-left">
            {features.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-2.5">
                <Icon className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-gray-300 text-sm">{text}</span>
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
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Bienvenido de vuelta</h2>
              <p className="text-gray-400 text-sm">Ingresa tus credenciales para continuar</p>
            </div>

            {/* Eliminado: error inline — ahora usa toast */}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-300">Contraseña</label>
                  <span className="text-xs text-green-400 hover:text-green-300 cursor-pointer select-none">
                    ¿Olvidaste tu contraseña?
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="••••••••"
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : 'Iniciar sesión'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-green-400 hover:text-green-300 font-medium transition-colors">
                Regístrate gratis
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
