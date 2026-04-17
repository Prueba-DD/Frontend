import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Navbar from './Navbar';
import VerificacionEmailBanner from './VerificacionEmailBanner';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
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
        <span className="text-green-500 font-semibold">GreenAlert</span> © {new Date().getFullYear()} — Monitoreo Ambiental Ciudadano
      </footer>
    </div>
  );
}
