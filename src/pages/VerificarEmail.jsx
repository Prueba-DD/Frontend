import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { enviarVerificacionOtp, verificarEmailOtp } from '../services/api';
import NebulaBackground from '../components/NebulaBackground';

const COOLDOWN = 60;

export default function VerificarEmail() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  // Empieza con cooldown activo porque el OTP ya fue enviado al registrarse
  const [cooldown, setCooldown] = useState(COOLDOWN);
  const [error, setError] = useState('');
  const inputs = useRef([]);

  // Si ya verificó, redirigir
  useEffect(() => {
    if (user?.email_verificado) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  // Countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Auto-focus el primer input al montar
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError('');
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) { setError('Ingresa los 6 dígitos del código.'); return; }
    setLoading(true);
    setError('');
    try {
      await verificarEmailOtp(code);
      await refreshUser();
      showToast('Correo verificado correctamente', 'success', 4000, { position: 'top-center' });
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || 'Código incorrecto o expirado.');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await enviarVerificacionOtp();
      setCooldown(COOLDOWN);
      setDigits(['', '', '', '', '', '']);
      setError('');
      showToast('Nuevo código enviado — revisa tu correo', 'success', 3500, { position: 'top-center' });
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (e) {
      showToast(e.response?.data?.message || 'No se pudo reenviar el código.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden">
      <NebulaBackground dim />
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 sm:p-10 flex flex-col items-center gap-6 text-center">

          <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/25 flex items-center justify-center">
            <Mail className="w-7 h-7 text-green-400" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">Verifica tu correo</h1>
            <p className="mt-2 text-gray-400 text-sm leading-relaxed">
              Enviamos un código de 6 dígitos a<br />
              <span className="text-white font-medium">{user?.email}</span>
            </p>
          </div>

          {/* 6 inputs individuales */}
          <div className="flex gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl font-bold bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm -mt-2">{error}</p>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || digits.join('').length < 6}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <CheckCircle2 className="w-4 h-4" />}
            Verificar correo
          </button>

          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {cooldown > 0 ? `Reenviar código en ${cooldown}s` : 'Reenviar código'}
          </button>

          <p className="text-xs text-gray-600">
            El código expira en 10 minutos
          </p>
        </div>
      </motion.div>
    </div>
  );
}
