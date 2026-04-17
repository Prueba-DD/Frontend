import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, Lock, Smartphone, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

// Animaciones compartidas con Login
const panelVariants = {
  hidden: (x) => ({ opacity: 0, x }),
  show:   { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   (i) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.28 + i * 0.07, duration: 0.32, ease: 'easeOut' },
  }),
};

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '',
    password: '', confirmar: '', telefono: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (form.nombre.trim().length < 2)          return 'El nombre debe tener al menos 2 caracteres.';
    if (form.apellido.trim().length < 2)         return 'El apellido debe tener al menos 2 caracteres.';
    if (form.password.length < 8)                return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Z]/.test(form.password))            return 'La contraseña debe incluir al menos una letra mayúscula.';
    if (!/[a-z]/.test(form.password))            return 'La contraseña debe incluir al menos una letra minúscula.';
    if (!/\d/.test(form.password))               return 'La contraseña debe incluir al menos un número.';
    if (form.password !== form.confirmar)         return 'Las contraseñas no coinciden.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { showToast(err, 'warning'); return; }
    setLoading(true);
    try {
      const userData = await register(
        form.nombre.trim(), form.apellido.trim(),
        form.email, form.password,
        form.telefono.trim() || undefined,
      );
      showToast(`¡Bienvenido, ${userData.nombre}! Revisa tu correo para verificar tu cuenta.`, 'success', 5000, {
        position: 'top-center',
        subtitle: 'Te enviamos un código de verificación',
      });
      navigate('/verificar-email', { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || 'No se pudo crear la cuenta. Intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex overflow-hidden">

      {/* ── Panel izquierdo (solo Desktop lg+) ── */}
      <motion.div
        className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-gray-900 flex-col items-center justify-center p-12 border-r border-gray-800"
        custom={-32}
        variants={panelVariants}
        initial="hidden"
        animate="show"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-sm">
          <img src="/chrome-512x512.png" alt="GreenAlert" className="h-36 w-auto object-contain mx-auto mb-4 drop-shadow-2xl" />
          <h2 className="text-2xl font-bold mb-1">
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              GreenAlert
            </span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-10">
            Sé parte de la comunidad que cuida el medio ambiente. Reporta, comparte y genera cambio desde tu territorio.
          </p>
          <div className="space-y-2.5 text-left">
            {[
              { Icon: CheckCircle2, text: 'Registro gratuito, sin costo alguno' },
              { Icon: Lock,         text: 'Tus datos protegidos con cifrado' },
              { Icon: Smartphone,   text: 'Accesible desde cualquier dispositivo' },
            ].map(({ Icon, text }, i) => (
              <motion.div
                key={text}
                custom={i}
                variants={fieldVariants}
                initial="hidden"
                animate="show"
                className="flex items-center gap-3 text-gray-300 text-sm bg-gray-800/70 border border-gray-700/50 rounded-xl px-4 py-2.5"
              >
                <Icon className="w-4 h-4 text-green-400 shrink-0" />
                <span>{text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Panel derecho (formulario) ── */}
      <motion.div
        className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto"
        custom={32}
        variants={panelVariants}
        initial="hidden"
        animate="show"
      >
        <div className="w-full max-w-md py-4">

          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-6">
            <Link to="/">
              <img src="/chrome-512x512.png" alt="GreenAlert" className="h-16 w-auto object-contain" />
            </Link>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-7 shadow-2xl shadow-black/40">

            <motion.div className="mb-6" custom={0} variants={fieldVariants} initial="hidden" animate="show">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Crea tu{' '}
                <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                  cuenta
                </span>
              </h2>
              <p className="text-gray-400 text-sm">Completa los datos para registrarte</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-3.5">

              {/* Nombre + Apellido */}
              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show"
                className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Nombre *</label>
                  <input type="text" required autoComplete="given-name"
                    value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
                    placeholder="Juan"
                    className="w-full bg-gray-800/80 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Apellido *</label>
                  <input type="text" required autoComplete="family-name"
                    value={form.apellido} onChange={(e) => set('apellido', e.target.value)}
                    placeholder="Pérez"
                    className="w-full bg-gray-800/80 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition" />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
                <label className="block text-xs font-medium text-gray-400 mb-1">Correo electrónico *</label>
                <input type="email" required autoComplete="email"
                  value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-gray-800/80 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition" />
              </motion.div>

              {/* Contraseña */}
              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
                <label className="block text-xs font-medium text-gray-400 mb-1">Contraseña *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required autoComplete="new-password"
                    value={form.password} onChange={(e) => set('password', e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-gray-800/80 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition p-0.5"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && <PasswordStrengthIndicator password={form.password} />}
              </motion.div>

              {/* Confirmar contraseña */}
              <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="show">
                <label className="block text-xs font-medium text-gray-400 mb-1">Confirmar contraseña *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required autoComplete="new-password"
                  value={form.confirmar} onChange={(e) => set('confirmar', e.target.value)}
                  placeholder="Repite tu contraseña"
                  className={`w-full bg-gray-800/80 border text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition ${
                    form.confirmar && form.confirmar !== form.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40'
                      : 'border-gray-700 focus:border-green-500 focus:ring-green-500/40'
                  }`}
                />
                {form.confirmar && form.confirmar !== form.password && (
                  <p className="mt-1 text-xs text-red-400">Las contraseñas no coinciden</p>
                )}
              </motion.div>

              {/* Teléfono (opcional) */}
              <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="show">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Teléfono <span className="text-gray-600 font-normal">(opcional)</span>
                </label>
                <input type="tel" autoComplete="tel"
                  value={form.telefono} onChange={(e) => set('telefono', e.target.value)}
                  placeholder="+57 300 000 0000"
                  className="w-full bg-gray-800/80 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/40 transition" />
              </motion.div>

              <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="show">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed h-11 mt-1"
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
              </motion.div>
            </form>

            <motion.p custom={7} variants={fieldVariants} initial="hidden" animate="show"
              className="mt-5 text-center text-sm text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
                Inicia sesión
              </Link>
            </motion.p>
          </div>

          <p className="mt-4 text-center text-xs text-gray-600">
            <Link to="/" className="hover:text-gray-400 transition-colors">← Volver al inicio</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
