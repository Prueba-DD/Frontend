import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, FileText, ShieldCheck,
  TrendingUp, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, Loader2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getAdminStats } from '../services/api';
import { CountUp } from '../utils/animations.jsx';

const rolColor = {
  ciudadano: 'text-green-400',
  moderador:  'text-blue-400',
  admin:      'text-yellow-400',
};

export default function AdminPanel() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getAdminStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => setError('No se pudieron cargar las estadísticas.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      {/* Encabezado */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Panel de Administración</h1>
          <p className="text-sm text-gray-400 mt-0.5">Vista general del sistema GreenAlert</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
        </div>
      ) : stats && (
        <>
          {/* Stats de usuarios */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="block w-1 h-5 rounded-full bg-green-400" />
              <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Usuarios</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total',       value: stats.usuarios?.total,       icon: Users,       color: 'text-gray-200',   accent: '#6B7280', ibg: 'bg-gray-500/10' },
                { label: 'Ciudadanos',  value: stats.usuarios?.ciudadanos,  icon: Users,       color: 'text-green-400',  accent: '#22C55E', ibg: 'bg-green-500/10' },
                { label: 'Moderadores', value: stats.usuarios?.moderadores, icon: ShieldCheck, color: 'text-blue-400',   accent: '#3B82F6', ibg: 'bg-blue-500/10' },
                { label: 'Admins',      value: stats.usuarios?.admins,      icon: Shield,      color: 'text-yellow-400', accent: '#EAB308', ibg: 'bg-yellow-500/10' },
              ].map(({ label, value, icon: Icon, color, accent, ibg }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
                  style={{ borderTop: `2px solid ${accent}` }}
                >
                  <div className="p-4 flex flex-col gap-3">
                    <div className={`w-8 h-8 rounded-lg ${ibg} flex items-center justify-center`}>
                      <Icon size={15} className={color} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${color}`}><CountUp target={value ?? 0} /></p>
                      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Activos',         value: stats.usuarios?.activos,         color: 'text-green-400', dot: 'bg-green-400' },
                { label: 'Inactivos',       value: stats.usuarios?.inactivos,       color: 'text-red-400',   dot: 'bg-red-400' },
                { label: 'Nuevos este mes', value: stats.usuarios?.nuevos_este_mes, color: 'text-sky-400',   dot: 'bg-sky-400' },
              ].map(({ label, value, color, dot }) => (
                <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                  <div>
                    <p className={`text-xl font-bold ${color}`}><CountUp target={value ?? 0} /></p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Stats de reportes */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="block w-1 h-5 rounded-full bg-blue-400" />
              <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Reportes</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total',          value: stats.reportes?.total_reportes,    icon: FileText,     color: 'text-gray-200',   accent: '#6B7280', ibg: 'bg-gray-500/10' },
                { label: 'Este mes',       value: stats.reportes?.reportes_este_mes, icon: TrendingUp,   color: 'text-sky-400',    accent: '#38BDF8', ibg: 'bg-sky-500/10' },
                { label: 'En seguimiento', value: stats.reportes?.con_seguimiento,   icon: Clock,        color: 'text-yellow-400', accent: '#EAB308', ibg: 'bg-yellow-500/10' },
                { label: 'Resueltos',      value: stats.reportes?.resueltos,         icon: CheckCircle2, color: 'text-green-400',  accent: '#22C55E', ibg: 'bg-green-500/10' },
              ].map(({ label, value, icon: Icon, color, accent, ibg }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 + 0.2 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
                  style={{ borderTop: `2px solid ${accent}` }}
                >
                  <div className="p-4 flex flex-col gap-3">
                    <div className={`w-8 h-8 rounded-lg ${ibg} flex items-center justify-center`}>
                      <Icon size={15} className={color} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${color}`}><CountUp target={value ?? 0} /></p>
                      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Accesos rápidos */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="block w-1 h-5 rounded-full bg-purple-400" />
              <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Acciones rápidas</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                to="/admin/usuarios"
                className="group bg-gray-900 border border-gray-800 hover:border-yellow-500/50 rounded-xl p-5 flex items-center gap-4 transition-all duration-300 hover:bg-yellow-500/5"
              >
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0 group-hover:bg-yellow-500/20 transition-colors">
                  <Users size={22} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-100">Gestión de usuarios</p>
                  <p className="text-xs text-gray-500 mt-0.5">Cambiar roles, activar/desactivar cuentas</p>
                </div>
                <ArrowRight size={16} className="text-gray-600 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all shrink-0" />
              </Link>

              <Link
                to="/moderacion"
                className="group bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-xl p-5 flex items-center gap-4 transition-all duration-300 hover:bg-blue-500/5"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                  <ShieldCheck size={22} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-100">Moderación de reportes</p>
                  <p className="text-xs text-gray-500 mt-0.5">Revisar y gestionar el estado de reportes</p>
                </div>
                <ArrowRight size={16} className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
