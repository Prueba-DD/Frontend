import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useGoogleLogin } from '@react-oauth/google';
import {
  MapPin, Users, BarChart2, Bell,
  CheckCircle2, Lock, Smartphone,
  Eye, EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NebulaBackground from '../components/NebulaBackground';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

// ── Contenido del panel izquierdo según modo ─────────────────────────────────
const LEFT_CONTENT = {
  login: {
    subtitle: 'Plataforma ciudadana para el monitoreo y reporte de problemáticas ambientales en tu territorio.',
    grid: true,
    features: [
      { Icon: MapPin,    text: 'Geolocalización precisa' },
      { Icon: Users,     text: 'Participación colectiva' },
      { Icon: BarChart2, text: 'Visualización en mapa' },
      { Icon: Bell,      text: 'Alertas tempranas' },
    ],
  },
  register: {
    subtitle: 'Sé parte de la comunidad que cuida el medio ambiente. Reporta, comparte y genera cambio desde tu territorio.',
    grid: false,
    features: [
      { Icon: CheckCircle2, text: 'Registro gratuito, sin costo alguno' },
      { Icon: Lock,         text: 'Tus datos protegidos con cifrado' },
      { Icon: Smartphone,   text: 'Accesible desde cualquier dispositivo' },
    ],
  },
};

// ── Variantes de animación ────────────────────────────────────────────────────
const leftContentVariants = {
  enter:  { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0,  transition: { duration: 0.32, ease: 'easeOut' } },
  exit:   { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// dir: 1 = avanza hacia register (slide izquierda), -1 = retrocede hacia login (slide derecha)
const formVariants = {
  enter:  (dir) => ({ opacity: 0, x: dir * 36, filter: 'blur(5px)' }),
  center: {
    opacity: 1, x: 0, filter: 'blur(0px)',
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (dir) => ({
    opacity: 0, x: dir * -28, filter: 'blur(5px)',
    transition: { duration: 0.22 },
  }),
};

// ── Spinner reutilizable ─────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
// ── Botones OAuth reutilizables ──────────────────────────────────────────────
function OAuthButtons({ oauthLoading, onGoogle, onFacebook, label = 'continúa' }) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-xs text-gray-500">o {label} con</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onGoogle}
          disabled={!!oauthLoading}
          className="flex items-center justify-center gap-2 h-10 rounded-xl border border-gray-700 bg-gray-800/60 hover:bg-gray-800 text-gray-300 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {oauthLoading === 'google' ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          )}
          Google
        </button>
        <button
          type="button"
          onClick={onFacebook}
          disabled={!!oauthLoading}
          className="flex items-center justify-center gap-2 h-10 rounded-xl border border-gray-700 bg-gray-800/60 hover:bg-gray-800 text-gray-300 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {oauthLoading === 'facebook' ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          )}
          Facebook
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, loginWithFacebook } = useAuth();
  const { showToast } = useToast();

  // Estado de modo + dirección de la transición
  const [mode, setMode] = useState(location.pathname === '/register' ? 'register' : 'login');
  const [dir,  setDir]  = useState(1);

  const switchTo = (newMode) => {
    if (newMode === mode) return;
    setDir(newMode === 'register' ? 1 : -1);
    setMode(newMode);
    navigate(newMode === 'login' ? '/login' : '/register', { replace: true });
  };

  // Sincroniza si el usuario navega con back/forward del browser
  useEffect(() => {
    const next = location.pathname === '/register' ? 'register' : 'login';
    if (next !== mode) {
      setDir(next === 'register' ? 1 : -1);
      setMode(next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ── Estado OAuth ──────────────────────────────────────────────────────────
  const [oauthLoading, setOauthLoading] = useState('');

  const triggerGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setOauthLoading('google');
      try {
        const userData = await loginWithGoogle(tokenResponse.access_token);
        showToast(`¡Bienvenido, ${userData.nombre}!`, 'success', 5000, {
          position: 'top-center',
          subtitle: mode === 'login' ? 'Has iniciado sesión con Google' : 'Cuenta creada con Google',
        });
        navigate(mode === 'login' ? (location.state?.from || '/dashboard') : '/dashboard', { replace: true });
      } catch (err) {
        showToast(err.response?.data?.message || 'Error al continuar con Google.', 'error');
      } finally {
        setOauthLoading('');
      }
    },
    onError: () => showToast('Inicio de sesión con Google cancelado.', 'warning'),
    flow: 'implicit',
  });

  const handleFacebook = () => {
    const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    url.searchParams.set('client_id',     import.meta.env.VITE_FACEBOOK_APP_ID);
    url.searchParams.set('redirect_uri',  `${window.location.origin}/auth/callback/facebook`);
    url.searchParams.set('scope',         'email,public_profile');
    url.searchParams.set('response_type', 'code');
    window.location.href = url.toString();
  };

  // ── Estado del formulario de login ───────────────────────────────────────
  const from = location.state?.from || '/dashboard';
  const [loginForm,    setLoginForm]    = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPw,  setShowLoginPw]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const userData = await login(loginForm.email, loginForm.password);
      showToast(`¡Bienvenido, ${userData.nombre}!`, 'success', 5000, {
        position: 'top-center',
        subtitle: 'Has iniciado sesión correctamente',
      });
      navigate(from, { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || 'Correo o contraseña incorrectos.', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Estado del formulario de registro ────────────────────────────────────
  const [regForm,    setRegForm]    = useState({ nombre: '', apellido: '', email: '', password: '', confirmar: '' });
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPw,  setShowRegPw]  = useState(false);
  const [pwFocused,  setPwFocused]  = useState(false);

  const setReg = (k, v) => setRegForm((f) => ({ ...f, [k]: v }));

  const validateReg = () => {
    if (regForm.nombre.trim().length < 2)       return 'El nombre debe tener al menos 2 caracteres.';
    if (regForm.apellido.trim().length < 2)      return 'El apellido debe tener al menos 2 caracteres.';
    if (regForm.password.length < 8)             return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Z]/.test(regForm.password))         return 'La contraseña debe incluir al menos una mayúscula.';
    if (!/[a-z]/.test(regForm.password))         return 'La contraseña debe incluir al menos una minúscula.';
    if (!/\d/.test(regForm.password))            return 'La contraseña debe incluir al menos un número.';
    if (regForm.password !== regForm.confirmar)  return 'Las contraseñas no coinciden.';
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const err = validateReg();
    if (err) { showToast(err, 'warning'); return; }
    setRegLoading(true);
    try {
      const userData = await register(
        regForm.nombre.trim(), regForm.apellido.trim(),
        regForm.email, regForm.password,
      );
      showToast(`¡Bienvenido, ${userData.nombre}! Revisa tu correo para verificar tu cuenta.`, 'success', 5000, {
        position: 'top-center',
        subtitle: 'Te enviamos un código de verificación',
      });
      navigate('/verificar-email', { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || 'No se pudo crear la cuenta. Intenta de nuevo.', 'error');
    } finally {
      setRegLoading(false);
    }
  };

  const { subtitle, grid, features } = LEFT_CONTENT[mode];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex overflow-hidden">

      {/* ── Panel izquierdo (solo Desktop lg+) ────────────────────────── */}
      <motion.div
        className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-gray-900 flex-col items-center justify-center p-12 border-r border-gray-800 overflow-hidden"
        initial={{ opacity: 0, x: -28 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <NebulaBackground compact dim />

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className="relative z-10 text-center max-w-sm"
            variants={leftContentVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <img
              src="/chrome-512x512.png"
              alt="GreenAlert"
              className="h-36 w-auto object-contain mx-auto mb-4 drop-shadow-2xl"
            />
            <h2 className="text-2xl font-bold mb-1">
              <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                GreenAlert
              </span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-10">{subtitle}</p>

            <div className={grid ? 'grid grid-cols-2 gap-3 text-left' : 'space-y-2.5 text-left'}>
              {features.map(({ Icon, text }) => (
                <div
                  key={text}
                  className={`flex items-center gap-2 bg-gray-800/70 border border-gray-700/50 rounded-xl ${
                    grid ? 'px-3 py-2.5' : 'px-4 py-2.5'
                  }`}
                >
                  <Icon className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-gray-300 text-xs">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── Panel derecho (formularios) ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-4">

          {/* Logo visible solo en mobile/tablet */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/">
              <img src="/chrome-512x512.png" alt="GreenAlert" className="h-16 w-auto object-contain" />
            </Link>
          </div>

          <AnimatePresence mode="wait" custom={dir}>

            {/* ═══════════════════ LOGIN ═══════════════════ */}
            {mode === 'login' && (
              <motion.div
                key="login"
                custom={dir}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40">
                  <div className="mb-7">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                      Bienvenido de{' '}
                      <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                        vuelta
                      </span>
                    </h2>
                    <p className="text-gray-400 text-sm">Ingresa tus credenciales para continuar</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Correo electrónico
                      </label>
                      <input
                        type="email" required autoComplete="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="tu@correo.com"
                        className="w-full bg-gray-800/80 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-300">Contraseña</label>
                        <Link
                          to="/forgot-password"
                          className="text-xs text-green-400 hover:text-green-300 transition-colors"
                        >
                          ¿Olvidaste tu contraseña?
                        </Link>
                      </div>
                      <div className="relative">
                        <input
                          type={showLoginPw ? 'text' : 'password'} required autoComplete="current-password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full bg-gray-800/80 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition"
                        />
                        <button
                          type="button" onClick={() => setShowLoginPw((v) => !v)} tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition p-0.5"
                          aria-label={showLoginPw ? 'Ocultar contraseña' : 'Ver contraseña'}
                        >
                          {showLoginPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit" disabled={loginLoading}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed h-11"
                    >
                      {loginLoading
                        ? <span className="flex items-center justify-center gap-2"><Spinner /> Iniciando sesión...</span>
                        : 'Iniciar sesión'
                      }
                    </button>
                  </form>

                  <OAuthButtons
                    oauthLoading={oauthLoading}
                    onGoogle={() => triggerGoogle()}
                    onFacebook={handleFacebook}
                    label="continúa"
                  />

                  <p className="mt-5 text-center text-sm text-gray-400">
                    ¿No tienes cuenta?{' '}
                    <button
                      onClick={() => switchTo('register')}
                      className="text-green-400 hover:text-green-300 font-medium transition-colors"
                    >
                      Regístrate
                    </button>
                  </p>
                </div>

                <p className="mt-4 text-center text-xs text-gray-600">
                  <Link to="/" className="hover:text-gray-400 transition-colors">← Volver al inicio</Link>
                </p>
              </motion.div>
            )}

            {/* ════════════════ REGISTRO ════════════════ */}
            {mode === 'register' && (
              <motion.div
                key="register"
                custom={dir}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-7 shadow-2xl shadow-black/40">
                  <div className="mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                      Crea tu{' '}
                      <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                        cuenta
                      </span>
                    </h2>
                    <p className="text-gray-400 text-sm">Completa los datos para registrarte</p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Nombre *</label>
                        <input
                          type="text" required autoComplete="given-name"
                          value={regForm.nombre} onChange={(e) => setReg('nombre', e.target.value)}
                          placeholder="Juan"
                          className="w-full bg-gray-800/80 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Apellido *</label>
                        <input
                          type="text" required autoComplete="family-name"
                          value={regForm.apellido} onChange={(e) => setReg('apellido', e.target.value)}
                          placeholder="Pérez"
                          className="w-full bg-gray-800/80 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Correo electrónico *</label>
                      <input
                        type="email" required autoComplete="email"
                        value={regForm.email} onChange={(e) => setReg('email', e.target.value)}
                        placeholder="tu@correo.com"
                        className="w-full bg-gray-800/80 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Contraseña *</label>
                      <div className="relative">
                        <input
                          type={showRegPw ? 'text' : 'password'} required autoComplete="new-password"
                          value={regForm.password} onChange={(e) => setReg('password', e.target.value)}
                          onFocus={() => setPwFocused(true)} onBlur={() => setPwFocused(false)}
                          placeholder="Mínimo 8 caracteres"
                          className="w-full bg-gray-800/80 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition"
                        />
                        <button
                          type="button" onClick={() => setShowRegPw((v) => !v)} tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition p-0.5"
                          aria-label={showRegPw ? 'Ocultar contraseña' : 'Ver contraseña'}
                        >
                          {showRegPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {regForm.password && (
                        <PasswordStrengthIndicator password={regForm.password} focused={pwFocused} />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Confirmar contraseña *</label>
                      <input
                        type={showRegPw ? 'text' : 'password'} required autoComplete="new-password"
                        value={regForm.confirmar} onChange={(e) => setReg('confirmar', e.target.value)}
                        placeholder="Repite tu contraseña"
                        className={`w-full bg-gray-800/80 border text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition ${
                          regForm.confirmar && regForm.confirmar !== regForm.password
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40'
                            : 'border-gray-700 focus:border-green-500 focus:ring-green-500/40'
                        }`}
                      />
                      {regForm.confirmar && regForm.confirmar !== regForm.password && (
                        <p className="mt-1 text-xs text-red-400">Las contraseñas no coinciden</p>
                      )}
                    </div>

                    <button
                      type="submit" disabled={regLoading}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed h-11 mt-1"
                    >
                      {regLoading
                        ? <span className="flex items-center justify-center gap-2"><Spinner /> Creando cuenta...</span>
                        : 'Crear cuenta'
                      }
                    </button>
                  </form>

                  <OAuthButtons
                    oauthLoading={oauthLoading}
                    onGoogle={() => triggerGoogle()}
                    onFacebook={handleFacebook}
                    label="regístrate"
                  />

                  <p className="mt-5 text-center text-sm text-gray-400">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      onClick={() => switchTo('login')}
                      className="text-green-400 hover:text-green-300 font-medium transition-colors"
                    >
                      Inicia sesión
                    </button>
                  </p>
                </div>

                <p className="mt-4 text-center text-xs text-gray-600">
                  <Link to="/" className="hover:text-gray-400 transition-colors">← Volver al inicio</Link>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
