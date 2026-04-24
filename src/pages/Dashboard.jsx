import { useEffect, useState, useRef, lazy, Suspense, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkHealth, getStats, getReportes } from '../services/api';
import {
  ClipboardList, Search, CheckCircle2, Users,
  MapPin, TrendingUp, ArrowRight, Activity, Clock, Filter, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CountUp } from '../utils/animations.jsx';
import { useAuth } from '../context/AuthContext';
import { helpers, CONFIGURACION_CATEGORIAS } from '../constants/categorias';

const ReportsMap = lazy(() => import('../components/ReportsMap'));

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

// Isolated so the ticker ONLY re-renders this tiny component, not the whole page
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const dia  = `${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`;
  const hora = now.toLocaleTimeString('es-CO');
  return (
    <p className="text-sm text-gray-500 flex items-center gap-1.5">
      <Clock size={13} className="shrink-0" />
      {dia} · <span className="tabular-nums">{hora}</span>
    </p>
  );
}



// Animated SVG donut chart
const DONUT_R = 50;
const DONUT_C = 2 * Math.PI * DONUT_R;

function DonutChart({ segments, total }) {
  let cumDeg = -90;
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-label="Distribución por categoría">
      <circle cx={60} cy={60} r={DONUT_R} fill="none" stroke="#1f2937" strokeWidth={14} />
      {segments.map((s, i) => {
        const frac    = s.count / total;
        const dashLen = Math.max(0, frac * DONUT_C - 2);
        const dashGap = DONUT_C - dashLen;
        const rot     = cumDeg;
        cumDeg += frac * 360;
        return (
          <g key={s.key} transform={`rotate(${rot}, 60, 60)`}>
            <motion.circle
              cx={60} cy={60} r={DONUT_R}
              fill="none" stroke={s.color} strokeWidth={14} strokeLinecap="butt"
              initial={{ strokeDasharray: `0 ${DONUT_C}` }}
              animate={{ strokeDasharray: `${dashLen} ${dashGap}` }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: 'easeOut' }}
            />
          </g>
        );
      })}
      <text x={60} y={55} textAnchor="middle" fontSize="20" fontWeight="800" fill="white">{total}</text>
      <text x={60} y={69} textAnchor="middle" fontSize="8.5" fill="#6b7280">reportes</text>
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [health,     setHealth]     = useState({ status: 'cargando', database: '...', timestamp: null });
  const [loading,    setLoading]    = useState(true);
  const [stats,      setStats]      = useState(null);
  const [activity,   setActivity]   = useState([]);
  const [actLoading, setActLoading] = useState(true);
  const [mapFilters, setMapFilters] = useState({ categoria: '', estado: '', soloMios: false, dateFrom: '', dateTo: '' });

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
      .then(({ data }) => { setActivity(data.data.reportes ?? []); setActLoading(false); })
      .catch(() => setActLoading(false));
  }, []);

  const isOk    = health.status === 'ok';
  const isAdmin = user?.rol === 'admin' || user?.rol === 'moderador';

  // ── KPI rol y métricas personales (deben ir antes de donutSource) ─────────
  const rol = user?.rol;
  // Number() coercion guards against string/int mismatch between MySQL and localStorage
  const misReportes   = activity.filter(r => Number(r.id_usuario) === Number(user?.id_usuario));
  const misPendientes = misReportes.filter(r => r.estado === 'pendiente' || r.estado === 'en_revision').length;
  const misResueltos  = misReportes.filter(r => r.estado === 'resuelto').length;
  const misCriticos   = misReportes.filter(r => r.nivel_severidad === 'critico' || r.nivel_severidad === 'alto').length;

  // FE-17: filtros del mapa (client-side, tiempo real)
  const mapReports = useMemo(() => {
    let list = activity;
    if (mapFilters.soloMios) list = list.filter(r => Number(r.id_usuario) === Number(user?.id_usuario));
    if (mapFilters.categoria) list = list.filter(r => r.tipo_contaminacion === mapFilters.categoria);
    if (mapFilters.estado) list = list.filter(r => r.estado === mapFilters.estado);
    if (mapFilters.dateFrom) list = list.filter(r => new Date(r.created_at) >= new Date(mapFilters.dateFrom));
    if (mapFilters.dateTo) list = list.filter(r => new Date(r.created_at) <= new Date(mapFilters.dateTo + 'T23:59:59'));
    return list;
  }, [activity, mapFilters, user]);

  const hasMapFilters = mapFilters.categoria || mapFilters.estado || mapFilters.soloMios || mapFilters.dateFrom || mapFilters.dateTo;
  const resetMapFilters = () => setMapFilters({ categoria: '', estado: '', soloMios: false, dateFrom: '', dateTo: '' });

  const MAP_ESTADO_LABEL = { pendiente: 'Pendiente', en_revision: 'En revisión', en_proceso: 'En proceso', verificado: 'Verificado', resuelto: 'Resuelto', rechazado: 'Rechazado' };
  const mapSelectCls = 'bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500 transition-colors';

  // Donut chart data — siempre muestra la distribución comunitaria
  const donutSource = activity;
  const catCount = donutSource.reduce((acc, r) => {
    acc[r.tipo_contaminacion] = (acc[r.tipo_contaminacion] || 0) + 1;
    return acc;
  }, {});
  const donutData = Object.entries(catCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([key, count]) => {
      const cfg = helpers.obtenerConfig(key);
      return { key, count, color: cfg?.color ?? '#6b7280', nombre: cfg?.nombre ?? key };
    });
  const donutTotal = donutData.reduce((s, d) => s + d.count, 0);

  // ── KPI cards según rol ──────────────────────────────────────────────────

  const statsCards = rol === 'ciudadano' ? [
    // Comunidad — el ciudadano ve el contexto global de la plataforma
    { label: 'Total reportes',  Icon: TrendingUp,    value: stats?.total_reportes,     accent: 'text-blue-400',    border: 'border-t-blue-500',    bg: 'bg-blue-500/15',    glow: '#3b82f6', tooltip: 'Total de reportes registrados en la plataforma' },
    { label: 'Municipios',      Icon: MapPin,        value: stats?.municipios_activos, accent: 'text-violet-400',  border: 'border-t-violet-500',  bg: 'bg-violet-500/15',  glow: '#8b5cf6', tooltip: 'Municipios con al menos un reporte activo' },
    { label: 'Este mes',        Icon: ClipboardList, value: stats?.reportes_este_mes,  accent: 'text-emerald-400', border: 'border-t-emerald-500', bg: 'bg-emerald-500/15', glow: '#10b981', tooltip: 'Reportes enviados este mes por toda la comunidad' },
    { label: 'En revisión',     Icon: Search,        value: stats?.en_revision,        accent: 'text-amber-400',   border: 'border-t-amber-500',   bg: 'bg-amber-500/15',   glow: '#f59e0b', tooltip: 'Reportes pendientes de revisión por moderadores' },
    { label: 'Resueltos',       Icon: CheckCircle2,  value: stats?.resueltos,          accent: 'text-green-400',   border: 'border-t-green-500',   bg: 'bg-green-500/15',   glow: '#22c55e', tooltip: 'Reportes que ya fueron atendidos exitosamente' },
    { label: 'Ciudadanos',      Icon: Users,         value: stats?.total_usuarios,     accent: 'text-orange-400',  border: 'border-t-orange-500',  bg: 'bg-orange-500/15',  glow: '#f97316', tooltip: 'Ciudadanos registrados en GreenAlert' },
  ] : rol === 'moderador' ? [
    // Cola de trabajo del moderador
    { label: 'En revisión',     Icon: Search,        value: stats?.en_revision,        accent: 'text-amber-400',   border: 'border-t-amber-500',   bg: 'bg-amber-500/15',   glow: '#f59e0b', tooltip: 'Pendientes de revisión en la plataforma' },
    { label: 'Total reportes',  Icon: TrendingUp,    value: stats?.total_reportes,     accent: 'text-blue-400',    border: 'border-t-blue-500',    bg: 'bg-blue-500/15',    glow: '#3b82f6', tooltip: 'Volumen total de reportes' },
    { label: 'Resueltos',       Icon: CheckCircle2,  value: stats?.resueltos,          accent: 'text-green-400',   border: 'border-t-green-500',   bg: 'bg-green-500/15',   glow: '#22c55e', tooltip: 'Reportes gestionados exitosamente' },
    { label: 'Municipios',      Icon: MapPin,        value: stats?.municipios_activos, accent: 'text-violet-400',  border: 'border-t-violet-500',  bg: 'bg-violet-500/15',  glow: '#8b5cf6', tooltip: 'Municipios activos en la plataforma' },
    { label: 'Este mes',        Icon: ClipboardList, value: stats?.reportes_este_mes,  accent: 'text-emerald-400', border: 'border-t-emerald-500', bg: 'bg-emerald-500/15', glow: '#10b981', tooltip: 'Nuevos reportes en el mes actual' },
    { label: 'Usuarios',        Icon: Users,         value: stats?.total_usuarios,     accent: 'text-orange-400',  border: 'border-t-orange-500',  bg: 'bg-orange-500/15',  glow: '#f97316', tooltip: 'Ciudadanos registrados' },
  ] : [
    // Admin — visión completa del sistema
    { label: 'Total reportes',  Icon: TrendingUp,    value: stats?.total_reportes,     accent: 'text-blue-400',    border: 'border-t-blue-500',    bg: 'bg-blue-500/15',    glow: '#3b82f6', tooltip: 'Total de reportes en la plataforma' },
    { label: 'Municipios',      Icon: MapPin,        value: stats?.municipios_activos, accent: 'text-violet-400',  border: 'border-t-violet-500',  bg: 'bg-violet-500/15',  glow: '#8b5cf6', tooltip: 'Municipios con reportes activos' },
    { label: 'Este mes',        Icon: ClipboardList, value: stats?.reportes_este_mes,  accent: 'text-emerald-400', border: 'border-t-emerald-500', bg: 'bg-emerald-500/15', glow: '#10b981', tooltip: 'Nuevos reportes este mes' },
    { label: 'En revisión',     Icon: Search,        value: stats?.en_revision,        accent: 'text-amber-400',   border: 'border-t-amber-500',   bg: 'bg-amber-500/15',   glow: '#f59e0b', tooltip: 'Esperando revisión' },
    { label: 'Resueltos',       Icon: CheckCircle2,  value: stats?.resueltos,          accent: 'text-green-400',   border: 'border-t-green-500',   bg: 'bg-green-500/15',   glow: '#22c55e', tooltip: 'Reportes cerrados exitosamente' },
    { label: 'Usuarios',        Icon: Users,         value: stats?.total_usuarios,     accent: 'text-orange-400',  border: 'border-t-orange-500',  bg: 'bg-orange-500/15',  glow: '#f97316', tooltip: 'Total de usuarios registrados' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="space-y-1">
          <LiveClock />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {greeting()}, <span className="text-green-400">{user?.nombre ?? 'ciudadano'}</span>
          </h1>
          <p className="text-gray-500 text-sm">
            {rol === 'ciudadano'
              ? 'Tu contribución al monitoreo ambiental ciudadano.'
              : rol === 'moderador'
              ? 'Panel de moderación — gestiona la cola de reportes pendientes.'
              : 'Panel de administración — vista completa del sistema.'}
          </p>
        </div>
        {/* Server status card */}
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border shrink-0 transition-colors ${
          loading
            ? 'border-gray-700 bg-gray-900/60'
            : isOk
            ? 'border-green-800/60 bg-green-950/20'
            : 'border-red-800/60 bg-red-950/20'
        }`}>
          <div className="relative shrink-0">
            <Activity
              size={18}
              className={loading ? 'text-gray-600' : isOk ? 'text-green-400' : 'text-red-400'}
            />
            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-gray-900 ${
              loading ? 'bg-gray-500 animate-pulse' : isOk ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-semibold leading-tight ${
              loading ? 'text-gray-400' : isOk ? 'text-green-400' : 'text-red-400'
            }`}>
              {loading ? 'Verificando…' : isOk ? 'Servicio OK' : 'Servicio caído'}
            </span>
            <span className="text-[10px] text-gray-500 leading-tight">
              {loading ? '—' : isOk ? `${health.database}` : health.message ?? 'Sin conexión'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Health banner (solo admin/moderador) ───────────────────────── */}
      {isAdmin && (
        <motion.div
          className={`mb-6 flex items-center justify-between gap-4 px-4 py-3 rounded-xl border text-sm ${
            loading
              ? 'border-gray-700 bg-gray-900/40'
              : isOk
              ? 'border-green-800/50 bg-green-950/20'
              : 'border-red-700 bg-red-950/20'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              loading ? 'bg-gray-500 animate-pulse' : isOk ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            <span className={loading ? 'text-gray-500' : isOk ? 'text-green-400' : 'text-red-400'}>
              {loading
                ? 'Verificando conexión…'
                : isOk
                ? `Servidor OK · Base de datos ${health.database}`
                : health.message || 'Error de conexión'}
            </span>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40 shrink-0"
          >
            {loading ? 'Verificando…' : 'Actualizar'}
          </button>
        </motion.div>
      )}

      {/* ── KPI Cards — comunidad ───────────────────────────────────── */}
      <section className="mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statsCards.map((s, i) => (
            <motion.div
              key={s.label}
              title={s.tooltip}
              className={`relative overflow-hidden bg-gray-900 border border-gray-800 ${s.border} border-t-[3px] rounded-2xl p-4 flex flex-col gap-3 cursor-default`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
            >
              <div
                className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl opacity-20 pointer-events-none"
                style={{ background: s.glow }}
              />
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <s.Icon className={`w-[18px] h-[18px] ${s.accent}`} />
              </div>
              <div>
                <CountUp target={s.value} className={`text-2xl sm:text-3xl font-extrabold block ${s.accent}`} />
                <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Tu contribución (solo ciudadano) ────────────────────────── */}
      {rol === 'ciudadano' && (
        <motion.div
          className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 px-5 py-4 bg-gray-900/50 border border-gray-800/60 rounded-2xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4 }}
        >
          <div className="shrink-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tu contribución</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Tus reportes en la plataforma</p>
          </div>
          <div className="w-px h-8 bg-gray-800 shrink-0 hidden sm:block" />
          <div className="flex flex-wrap gap-6 sm:gap-8">
            {[
              { label: 'Reportes enviados', value: misReportes.length, accent: 'text-blue-400',  tooltip: 'Total de reportes que has creado' },
              { label: 'Sin resolver',      value: misPendientes,      accent: 'text-amber-400', tooltip: 'Tus reportes aún en proceso de atención (pendientes o en revisión)' },
              { label: 'Resueltos',         value: misResueltos,       accent: 'text-green-400', tooltip: 'Tus reportes que ya fueron atendidos y cerrados' },
            ].map(m => (
              <div key={m.label} title={m.tooltip} className="flex flex-col cursor-default">
                <CountUp target={m.value} className={`text-xl font-extrabold ${m.accent}`} />
                <span className="text-[10px] text-gray-500 mt-0.5">{m.label}</span>
              </div>
            ))}
          </div>
          <Link to="/reports" className="ml-auto text-xs text-gray-500 hover:text-green-400 flex items-center gap-1 transition-colors shrink-0">
            Ver mis reportes <ArrowRight size={10} />
          </Link>
        </motion.div>
      )}

      {/* ── Donut chart + Activity feed ─────────────────────────────────── */}
      <section className="mb-8 grid lg:grid-cols-[55%_1fr] gap-5">

        {/* Donut */}
        <div className="card flex flex-col gap-5">
          <div>
            <h2 className="font-semibold text-white">Distribución por categoría</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {`${donutTotal} reportes · distribución de la comunidad`}
            </p>
          </div>
          {donutData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-10 text-sm text-gray-600">Sin datos aún</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-44 h-44 shrink-0">
                <DonutChart segments={donutData} total={donutTotal} />
              </div>
              <div className="flex-1 space-y-3 w-full">
                {donutData.map((s, i) => {
                  const pct = Math.round((s.count / donutTotal) * 100);
                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-gray-400 flex-1 truncate">{s.nombre}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: s.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, delay: 0.12 * i, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="text-xs font-bold tabular-nums w-4 text-right" style={{ color: s.color }}>{s.count}</span>
                        <span className="text-[10px] text-gray-600 w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Actividad reciente</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {rol === 'ciudadano' ? 'Tus últimos reportes' : 'Últimos reportes enviados'}
              </p>
            </div>
            <Link to="/reports" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors shrink-0">
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto scrollbar-dark" style={{ maxHeight: '340px' }}>
            {actLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg border-l-4 border-l-gray-700 bg-gray-800/30 animate-pulse">
                  <div className="h-3 bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-gray-700 rounded w-1/2" />
                </div>
              ))
            ) : activity.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10 text-center">
                <ClipboardList className="w-9 h-9 text-gray-700" />
                <p className="text-sm text-gray-500">No hay reportes aún</p>
              </div>
            ) : (
              (rol === 'ciudadano' ? misReportes : activity).slice(0, 8).map((r, i) => {
                const cfg   = helpers.obtenerConfig(r.tipo_contaminacion);
                const color = cfg?.color ?? '#6b7280';
                const estText    = { pendiente:'text-gray-400', en_revision:'text-blue-400', verificado:'text-purple-400', en_proceso:'text-yellow-400', resuelto:'text-green-400', rechazado:'text-red-400' };
                const estLabel   = { pendiente:'Pendiente', en_revision:'En revisión', verificado:'Verificado', en_proceso:'En proceso', resuelto:'Resuelto', rechazado:'Rechazado' };
                const estTooltip = {
                  pendiente:   'En espera de revisión por un moderador',
                  en_revision: 'Un moderador está analizando este reporte',
                  verificado:  'El problema fue confirmado como válido por un moderador',
                  en_proceso:  'Las autoridades están actuando sobre este reporte',
                  resuelto:    'El problema ha sido atendido y el caso está cerrado',
                  rechazado:   'El reporte no cumplió los criterios de validación',
                };
                const sevBorder = { bajo:'border-l-green-400', medio:'border-l-orange-400', alto:'border-l-red-400', critico:'border-l-rose-400' };
                const sevText   = { bajo:'text-green-400', medio:'text-orange-400', alto:'text-red-400', critico:'text-rose-400' };
                const sevLabel  = { bajo:'Baja', medio:'Media', alto:'Alta', critico:'Crítico' };
                const lugar = [r.municipio, r.departamento].filter(Boolean).join(', ') || r.direccion || '';
                return (
                  <motion.button
                    key={r.id_reporte}
                    onClick={() => navigate(`/reports/${r.id_reporte}`)}
                    className={`w-full text-left p-3 rounded-lg border-l-4 ${sevBorder[r.nivel_severidad] ?? 'border-l-gray-600'} bg-gray-800/30 hover:bg-gray-800/60 transition-colors`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.3 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-xs font-semibold text-gray-200 truncate">{cfg?.nombre ?? r.tipo_contaminacion}</span>
                      </div>
                      <span className={`text-[10px] font-medium shrink-0 ${sevText[r.nivel_severidad] ?? 'text-gray-500'}`}>
                        {sevLabel[r.nivel_severidad]}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 pl-3.5 truncate">{r.titulo}</p>
                    <div className="flex items-center justify-between mt-1 pl-3.5">
                      <span className="text-[10px] text-gray-600 truncate">{lugar}</span>
                      <span
                        className={`text-[10px] font-medium ml-2 shrink-0 cursor-help ${estText[r.estado] ?? 'text-gray-400'}`}
                        title={estTooltip[r.estado]}
                      >
                        {estLabel[r.estado] ?? r.estado}
                      </span>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>
      </section>
      <section>
        {/* ── Header + leyenda ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-white">Mapa de reportes</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {mapReports.length} reporte{mapReports.length !== 1 ? 's' : ''} visible{mapReports.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Pendiente</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />En proceso</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Resuelto</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />Rechazado</span>
          </div>
        </div>

        {/* ── FE-17: Panel de filtros ── */}
        <motion.div
          className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 mb-4 space-y-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
        >
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5 text-gray-500 shrink-0 mr-0.5">
              <Filter size={13} />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Filtros</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5 flex-1">
              <select
                value={mapFilters.categoria}
                onChange={e => setMapFilters(f => ({ ...f, categoria: e.target.value }))}
                className={mapSelectCls}
              >
                <option value="">Todas las categorías</option>
                {Object.entries(CONFIGURACION_CATEGORIAS).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.nombre}</option>
                ))}
              </select>
              <select
                value={mapFilters.estado}
                onChange={e => setMapFilters(f => ({ ...f, estado: e.target.value }))}
                className={mapSelectCls}
              >
                <option value="">Todos los estados</option>
                {Object.entries(MAP_ESTADO_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                type="date"
                value={mapFilters.dateFrom}
                onChange={e => setMapFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className={mapSelectCls}
                title="Desde"
              />
              <input
                type="date"
                value={mapFilters.dateTo}
                onChange={e => setMapFilters(f => ({ ...f, dateTo: e.target.value }))}
                className={mapSelectCls}
                title="Hasta"
              />
            </div>
            {rol === 'ciudadano' && (
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={mapFilters.soloMios}
                  onChange={e => setMapFilters(f => ({ ...f, soloMios: e.target.checked }))}
                  className="w-4 h-4 accent-green-500 rounded"
                />
                Solo los míos
              </label>
            )}
          </div>

          {/* Badges de filtros activos */}
          <AnimatePresence>
            {hasMapFilters && (
              <motion.div
                className="flex flex-wrap gap-2 items-center"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {mapFilters.categoria && (
                  <button
                    onClick={() => setMapFilters(f => ({ ...f, categoria: '' }))}
                    className="badge bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                  >
                    {CONFIGURACION_CATEGORIAS[mapFilters.categoria]?.nombre ?? mapFilters.categoria}
                    <X size={11} />
                  </button>
                )}
                {mapFilters.estado && (
                  <button
                    onClick={() => setMapFilters(f => ({ ...f, estado: '' }))}
                    className="badge bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                  >
                    {MAP_ESTADO_LABEL[mapFilters.estado] ?? mapFilters.estado}
                    <X size={11} />
                  </button>
                )}
                {mapFilters.dateFrom && (
                  <button
                    onClick={() => setMapFilters(f => ({ ...f, dateFrom: '' }))}
                    className="badge bg-gray-500/10 text-gray-400 border border-gray-700 hover:bg-gray-500/20 transition-colors"
                  >
                    Desde: {mapFilters.dateFrom} <X size={11} />
                  </button>
                )}
                {mapFilters.dateTo && (
                  <button
                    onClick={() => setMapFilters(f => ({ ...f, dateTo: '' }))}
                    className="badge bg-gray-500/10 text-gray-400 border border-gray-700 hover:bg-gray-500/20 transition-colors"
                  >
                    Hasta: {mapFilters.dateTo} <X size={11} />
                  </button>
                )}
                {mapFilters.soloMios && (
                  <button
                    onClick={() => setMapFilters(f => ({ ...f, soloMios: false }))}
                    className="badge bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
                  >
                    Solo los míos <X size={11} />
                  </button>
                )}
                <button
                  onClick={resetMapFilters}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors ml-1"
                >
                  Limpiar todo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="rounded-xl overflow-hidden border border-gray-800 h-72 sm:h-[420px] lg:h-[560px]">
          <Suspense fallback={
            <div className="h-full flex items-center justify-center bg-gray-900 text-gray-500 text-sm">Cargando mapa…</div>
          }>
            <ReportsMap reports={mapReports} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}