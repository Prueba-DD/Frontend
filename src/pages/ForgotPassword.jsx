import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Leaf } from 'lucide-react';
import { motion } from 'motion/react';
import { forgotPassword } from '../services/api';

const panelVariants = {
  hidden: (x) => ({ opacity: 0, x }),
  show:   { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [countdown, setCountdown] = useState(10);

  // Redirigir al login después de enviar el correo
  useEffect(() => {
    if (!sent) return;
    if (countdown <= 0) { navigate('/login', { replace: true }); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [sent, countdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return; }
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      // Siempre mostrar mensaje neutro para no revelar si el correo existe
      setSent(true);
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
          <p className="text-gray-400 text-sm leading-relaxed">
            Recupera el acceso a tu cuenta y continúa protegiendo el medio ambiente desde tu comunidad.
          </p>
        </div>
      </motion.div>

      {/* ── Panel derecho: formulario ── */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10"
        custom={32}
        variants={panelVariants}
        initial="hidden"
        animate="show"
      >
        <div className="w-full max-w-sm">

          {/* Logo móvil */}
          <div className="flex items-center gap-2 mb-8 lg:hidden justify-center">
            <img src="/chrome-192x192.png" alt="GreenAlert" className="h-9 w-9 object-contain" />
            <span className="font-bold text-white text-lg">
              Green<span className="text-green-400">Alert</span>
            </span>
          </div>

          {!sent ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">¿Olvidaste tu contraseña?</h1>
                <p className="text-sm text-gray-400">
                  Ingresa tu email y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="tu@email.com"
                      autoFocus
                      className={`w-full bg-gray-800 border rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500
                        focus:outline-none transition-colors
                        ${error ? 'border-red-500' : 'border-gray-700 focus:border-green-500'}`}
                    />
                  </div>
                  {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Revisa tu correo</h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <p className="text-xs text-gray-600 mb-6">
                Recuerda revisar la carpeta de spam si no lo encuentras.
              </p>
              <p className="text-xs text-gray-500">
                Redirigiendo al inicio de sesión en {countdown}s...
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 transition-colors mt-3"
              >
                Ir ahora <ArrowLeft size={14} className="rotate-180" />
              </Link>
            </motion.div>
          )}

          {/* Volver al login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-400 transition-colors"
            >
              <ArrowLeft size={14} /> Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
