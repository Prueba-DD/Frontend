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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Panel de Administración</h1>
          <p className="text-sm text-gray-500">Vista general del sistema GreenAlert.</p>
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
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Usuarios</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total',        value: stats.usuarios?.total,        icon: Users,        color: 'text-gray-300' },
                { label: 'Ciudadanos',   value: stats.usuarios?.ciudadanos,   icon: Users,        color: 'text-green-400' },
                { label: 'Moderadores',  value: stats.usuarios?.moderadores,  icon: ShieldCheck,  color: 'text-blue-400' },
                { label: 'Admins',       value: stats.usuarios?.admins,       icon: Shield,       color: 'text-yellow-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={15} className={color} />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>
                    <CountUp target={value ?? 0} />
                  </p>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              {[
                { label: 'Activos',         value: stats.usuarios?.activos,          color: 'text-green-400' },
                { label: 'Inactivos',       value: stats.usuarios?.inactivos,         color: 'text-red-400' },
                { label: 'Nuevos este mes', value: stats.usuarios?.nuevos_este_mes,   color: 'text-sky-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card flex flex-col gap-1">
                  <span className="text-xs text-gray-500">{label}</span>
                  <p className={`text-xl font-bold ${color}`}>
                    <CountUp target={value ?? 0} />
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Stats de reportes */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Reportes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total',          value: stats.reportes?.total_reportes,    icon: FileText,       color: 'text-gray-300' },
                { label: 'Este mes',       value: stats.reportes?.reportes_este_mes, icon: TrendingUp,     color: 'text-sky-400' },
                { label: 'En seguimiento', value: stats.reportes?.con_seguimiento,   icon: Clock,          color: 'text-yellow-400' },
                { label: 'Resueltos',      value: stats.reportes?.resueltos,         icon: CheckCircle2,   color: 'text-green-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={15} className={color} />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>
                    <CountUp target={value ?? 0} />
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Accesos rápidos */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Acciones rápidas</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                to="/admin/usuarios"
                className="card flex items-center justify-between group hover:border-yellow-500/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <Users size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-100">Gestión de usuarios</p>
                    <p className="text-xs text-gray-500">Cambiar roles, activar/desactivar cuentas</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-600 group-hover:text-yellow-400 transition-colors" />
              </Link>

              <Link
                to="/moderacion"
                className="card flex items-center justify-between group hover:border-blue-500/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <ShieldCheck size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-100">Moderación de reportes</p>
                    <p className="text-xs text-gray-500">Revisar y gestionar el estado de reportes</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
