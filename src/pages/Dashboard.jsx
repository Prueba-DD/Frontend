import { useEffect, useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkHealth, getStats, getReportes } from '../services/api';
import {
  ClipboardList, Search, CheckCircle2, Users,
  MapPin, TrendingUp, ArrowRight,
} from 'lucide-react';
import { helpers } from '../constants/categorias';

const ReportsMap = lazy(() => import('../components/ReportsMap'));

const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

const severityClass = {
  bajo:    'bg-green-500/15 text-green-400 border border-green-500/30',
  medio:   'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  alto:    'bg-red-500/15 text-red-400 border border-red-500/30',
  critico: 'bg-red-600/25 text-rose-200 border border-red-500/60',
};
const severityLabel = { bajo:'Baja', medio:'Media', alto:'Alta', critico:'Crítico' };

const estadoClass = {
  pendiente:   'bg-gray-700/60 text-gray-300',
  en_revision: 'bg-blue-500/15 text-blue-400',
  verificado:  'bg-purple-500/15 text-purple-400',
  en_proceso:  'bg-yellow-500/15 text-yellow-400',
  resuelto:    'bg-green-500/15 text-green-400',
  rechazado:   'bg-red-500/15 text-red-400',
};
const estadoLabel = {
  pendiente:'Pendiente', en_revision:'En revisión', verificado:'Verificado',
  en_proceso:'En proceso', resuelto:'Resuelto', rechazado:'Rechazado',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [health,  setHealth]  = useState({ status: 'cargando', database: '...', timestamp: null });
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState(null);
  const [activity,setActivity]= useState([]);
  const [now,     setNow]     = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const { data } = await checkHealth();
      setHealth(data);
    } catch {
      setHealth({ status: 'error', message: 'No se pudo conectar al servidor', database: 'desconectada' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    getStats()
      .then(({ data }) => setStats(data.data.stats))
      .catch(() => {});
    getReportes({ limit: 50 })
      .then(({ data }) => setActivity(data.data.reportes ?? []))
      .catch(() => {});
  }, []);

  const isOk = health.status === 'ok';

  // Fecha y hora
  const fechaDia = `${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`;
  const horaStr  = now.toLocaleTimeString('es-CO');

  // Breakdown por categoría desde los reportes cargados
  const categoryCount = activity.reduce((acc, r) => {
    acc[r.tipo_contaminacion] = (acc[r.tipo_contaminacion] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const totalActivity = activity.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm">Resumen del estado del sistema y actividad reciente.</p>
      </div>

      {/* ── Health check ─────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className={`card flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          loading ? 'border-gray-700' : isOk ? 'border-green-700 bg-green-950/20' : 'border-red-700 bg-red-950/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shrink-0 ${
              loading ? 'bg-gray-500 animate-pulse' : isOk ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            <div>
              <p className="text-sm font-medium text-gray-300">Estado del servidor</p>
              {loading ? (
                <p className="text-xs text-gray-500 mt-0.5">Verificando conexión...</p>
              ) : (
                <p className={`text-xs mt-0.5 ${isOk ? 'text-green-400' : 'text-red-400'}`}>
                  {isOk
                    ? `Servidor OK • Base de datos ${health.database}`
                    : health.message || 'Error de conexión'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-medium text-gray-300">{fechaDia}</p>
              <p className="text-xs text-gray-500 mt-0.5 tabular-nums">{horaStr}</p>
            </div>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="text-xs text-green-400 hover:text-green-300 border border-green-500/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? 'Verificando...' : 'Verificar ahora'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats 6 tarjetas ──────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
        {[
          { label: 'Este mes',          Icon: ClipboardList, value: stats?.reportes_este_mes,  accent: 'text-green-400',   bg: 'bg-green-500/10'  },
          { label: 'Total reportes',    Icon: TrendingUp,    value: stats?.total_reportes,     accent: 'text-blue-400',    bg: 'bg-blue-500/10'   },
          { label: 'En revisión',       Icon: Search,        value: stats?.en_revision,        accent: 'text-yellow-400',  bg: 'bg-yellow-500/10' },
          { label: 'Resueltos',         Icon: CheckCircle2,  value: stats?.resueltos,          accent: 'text-emerald-400', bg: 'bg-emerald-500/10'},
          { label: 'Municipios reportados',        Icon: MapPin,        value: stats?.municipios_activos, accent: 'text-purple-400',  bg: 'bg-purple-500/10' },
          { label: 'Usuarios registrados',  Icon: Users,         value: stats?.total_usuarios,     accent: 'text-orange-400',  bg: 'bg-orange-500/10' },
        ].map((s) => (
          <div key={s.label} className="card flex flex-col gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.Icon className={`w-[18px] h-[18px] ${s.accent}`} />
            </div>
            <div>
              <div className={`text-2xl lg:text-3xl font-extrabold ${s.accent}`}>
                {stats == null
                  ? <span className="inline-block w-8 h-5 bg-gray-800 rounded animate-pulse" />
                  : (s.value ?? 0)}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">{s.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Por categoría ─────────────────────────────────────────────── */}
      {topCategories.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-white mb-4">Reportes por Categoría</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
            {topCategories.map(([cat, count]) => {
              const cfg   = helpers.obtenerConfig(cat);
              const color = cfg?.color ?? '#6B7280';
              const pct   = totalActivity > 0 ? Math.round((count / totalActivity) * 100) : 0;
              return (
                <div key={cat} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-xs text-gray-500">{pct}%</span>
                  </div>
                  <div className="text-xl font-bold" style={{ color }}>{count}</div>
                  <p className="text-xs text-gray-400 leading-tight">{cfg?.nombre ?? cat}</p>
                  <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Actividad reciente ───────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Actividad Reciente</h2>
          <Link to="/reports" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3 text-gray-400 font-medium">Categoría</th>
                  <th className="text-left px-5 py-3 text-gray-400 font-medium hidden sm:table-cell">Ubicación</th>
                  <th className="text-left px-5 py-3 text-gray-400 font-medium hidden lg:table-cell">Estado</th>
                  <th className="text-left px-5 py-3 text-gray-400 font-medium hidden md:table-cell">Fecha</th>
                  <th className="text-left px-5 py-3 text-gray-400 font-medium">Severidad</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                      <p className="text-sm">No hay actividad registrada aún.</p>
                      <p className="text-xs mt-1 text-gray-600">Los reportes aparecerán aquí en tiempo real.</p>
                    </td>
                  </tr>
                ) : (
                  activity.slice(0, 10).map((r, i) => {
                    const cfg   = helpers.obtenerConfig(r.tipo_contaminacion);
                    const color = cfg?.color ?? '#6B7280';
                    return (
                      <tr
                        key={r.id_reporte}
                        onClick={() => navigate(`/reports/${r.id_reporte}`)}
                        className={`border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors cursor-pointer ${
                          i === Math.min(activity.length, 10) - 1 ? 'border-0' : ''
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                            <span className="text-gray-200 font-medium text-xs sm:text-sm">
                              {cfg?.nombre ?? r.tipo_contaminacion}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 pl-[18px] mt-0.5 truncate max-w-[160px] sm:max-w-[220px]">
                            {r.titulo}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 hidden sm:table-cell text-xs sm:text-sm">
                          {[r.municipio, r.departamento].filter(Boolean).join(', ') || r.direccion || '—'}
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <span className={`badge ${estadoClass[r.estado] ?? 'bg-gray-700 text-gray-300'}`}>
                            {estadoLabel[r.estado] ?? r.estado}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell tabular-nums text-xs">
                          {new Date(r.created_at).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`badge ${severityClass[r.nivel_severidad]}`}>
                            {severityLabel[r.nivel_severidad] ?? r.nivel_severidad}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-gray-600">
                          <ArrowRight size={14} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Mapa ──────────────────────────────────────────────────────── */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-white">Mapa de Reportes</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />Crítico</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Alta</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />Media</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />Baja</span>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-gray-800 h-72 sm:h-[420px] lg:h-[560px]">
          <Suspense fallback={
            <div className="h-full flex items-center justify-center bg-gray-900 text-gray-500 text-sm">Cargando mapa...</div>
          }>
            <ReportsMap reports={activity} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
