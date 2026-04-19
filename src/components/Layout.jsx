import { Outlet, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import Navbar from './Navbar';
import VerificacionEmailBanner from './VerificacionEmailBanner';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fondo lava permanente — muy tenue para no competir con el contenido */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{
          left: 'calc(50% - 400px)', bottom: '-20%',
          width: '800px', height: '620px',
          background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.07) 0%, rgba(16,185,129,0.03) 52%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'lava-rise-1 22s ease-in-out infinite',
          willChange: 'transform',
        }} />
        <div className="absolute rounded-full" style={{
          left: '-12%', bottom: '-25%',
          width: '520px', height: '420px',
          background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.055) 0%, transparent 70%)',
          filter: 'blur(72px)',
          animation: 'lava-rise-2 28s ease-in-out infinite',
          animationDelay: '-10s',
          willChange: 'transform',
        }} />
        <div className="absolute rounded-full" style={{
          right: '-10%', bottom: '-20%',
          width: '480px', height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(20,184,166,0.05) 0%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'lava-rise-3 25s ease-in-out infinite',
          animationDelay: '-15s',
          willChange: 'transform',
        }} />
      </div>
      <ScrollToTop />
      <Navbar />
      <VerificacionEmailBanner />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
        <div className="mb-2">
          <span className="text-green-500 font-semibold">GreenAlert</span> © {new Date().getFullYear()} — Monitoreo Ambiental Ciudadano
        </div>
        <div className="flex items-center justify-center gap-3 text-xs">
          <Link to="/privacidad" className="hover:text-green-400 transition-colors">Política de Privacidad</Link>
          <span className="text-gray-700">·</span>
          <Link to="/terminos" className="hover:text-green-400 transition-colors">Términos y Condiciones</Link>
        </div>
      </footer>
    </div>
  );
}
