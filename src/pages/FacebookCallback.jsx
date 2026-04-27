import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'motion/react';

export default function FacebookCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithFacebook } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code  = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      showToast('Inicio de sesión con Facebook cancelado.', 'warning');
      navigate('/login', { replace: true });
      return;
    }

    loginWithFacebook(code)
      .then((userData) => {
        showToast(`¡Bienvenido, ${userData.nombre}!`, 'success', 5000, {
          position: 'top-center',
          subtitle: 'Has iniciado sesión con Facebook',
        });
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        showToast(err.response?.data?.message || 'Error al iniciar sesión con Facebook.', 'error');
        navigate('/login', { replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4 text-gray-400"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <svg className="w-8 h-8 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm">Completando inicio de sesión con Facebook...</p>
      </motion.div>
    </div>
  );
}
