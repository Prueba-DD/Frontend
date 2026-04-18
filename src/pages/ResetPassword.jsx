import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { resetPasswordToken } from '../services/api';
import { useToast } from '../context/ToastContext';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import NebulaBackground from '../components/NebulaBackground';

const panelVariants = {
  hidden: (x) => ({ opacity: 0, x }),
  show:   { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

function PwInput({ label, value, onChange, error, placeholder = '••••••••' }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-gray-800 border rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-200
            placeholder-gray-500 focus:outline-none transition-colors
            ${error ? 'border-red-500' : 'border-gray-700 focus:border-green-500'}`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
        >
          {show ? 'Ocultar' : 'Ver'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { showToast }  = useToast();
  const token          = searchParams.get('token') ?? '';

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors,          setErrors]          = useState({});
  const [loading,         setLoading]         = useState(false);

  const validate = () => {
    const errs = {};
    if (newPassword.length < 8)               errs.newPassword     = 'Mínimo 8 caracteres.';
    else if (!/[A-Za-z]/.test(newPassword))   errs.newPassword     = 'Debe incluir al menos una letra.';
    else if (!/[0-9]/.test(newPassword))      errs.newPassword     = 'Debe incluir al menos un número.';
    if (newPassword !== confirmPassword)       errs.confirmPassword = 'Las contraseñas no coinciden.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast('Enlace de recuperación inválido.', 'error');
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await resetPasswordToken(token, newPassword, confirmPassword);
      showToast('Contraseña actualizada correctamente.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message ?? 'El enlace es inválido o ha expirado.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Token ausente — enlace malformado
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Enlace inválido</h2>
          <p className="text-sm text-gray-400 mb-6">
            El enlace de recuperación es inválido o ha expirado.
          </p>
          <Link to="/forgot-password" className="btn-primary text-sm">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

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
        <NebulaBackground compact dim />
        <div className="relative z-10 text-center max-w-sm">
          <img src="/chrome-512x512.png" alt="GreenAlert" className="h-36 w-auto object-contain mx-auto mb-4 drop-shadow-2xl" />
          <h2 className="text-2xl font-bold mb-1">
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              GreenAlert
            </span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Elige una contraseña segura para proteger tu cuenta.
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

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Nueva contraseña</h1>
            <p className="text-sm text-gray-400">
              Elige una contraseña segura de al menos 8 caracteres.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <PwInput
              label="Nueva contraseña"
              value={newPassword}
              onChange={(v) => { setNewPassword(v); setErrors((e) => ({ ...e, newPassword: '' })); }}
              error={errors.newPassword}
            />

            {newPassword && (
              <PasswordStrengthIndicator password={newPassword} />
            )}

            <PwInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
              error={errors.confirmPassword}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : 'Restablecer contraseña'}
            </button>
          </form>

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
