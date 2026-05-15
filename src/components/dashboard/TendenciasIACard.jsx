import { useEffect, useState } from 'react';
import { Brain, Sparkles, TrendingUp, Gauge } from 'lucide-react';
import BarChart from '../charts/BarChart.jsx';
import LineChart from '../charts/LineChart.jsx';
import { getStatsIA } from '../../services/api';
import { helpers } from '../../constants/categorias';

/**
 * FE-27 · Sección "Tendencias IA" del dashboard (admin/moderador).
 * Muestra agregados de la clasificación IA: KPIs, top etiquetas, distribución
 * de confianza y evolución temporal (procesados vs aceptados).
 */
const KpiCard = ({ icon: Icon, label, value, hint, color = 'text-violet-400' }) => (
  <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
    <div className="flex items-center justify-between mb-1">
      <p className="text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
      <Icon size={14} className={color} />
    </div>
    <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
    {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
  </div>
);

const Section = ({ title, children, hint }) => (
  <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
    </div>
    {children}
  </div>
);

const EmptyIA = () => (
  <div className="card p-8 flex flex-col items-center text-center gap-2">
    <Sparkles size={28} className="text-violet-400" />
    <h2 className="font-semibold text-white">Tendencias IA</h2>
    <p className="text-sm text-gray-500 max-w-md">
      Aún no hay reportes procesados por IA. Cuando los ciudadanos suban evidencia y la
      clasificación automática esté disponible, verás aquí las tendencias y patrones detectados.
    </p>
  </div>
);

export default function TendenciasIACard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    getStatsIA({ dias: 30 })
      .then(({ data }) => { if (alive) setData(data?.data?.data ?? null); })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={16} className="text-violet-400" />
          <h2 className="font-semibold text-white">Tendencias IA</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-800/40 animate-pulse" />
          ))}
        </div>
        <div className="h-40 rounded-xl bg-gray-800/40 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={16} className="text-violet-400" />
          <h2 className="font-semibold text-white">Tendencias IA</h2>
        </div>
        <p className="text-sm text-red-400">No se pudieron cargar las tendencias IA.</p>
      </div>
    );
  }

  if (!data || data.total_procesados === 0) return <EmptyIA />;

  const { total_procesados, accuracy, confianza, top_etiquetas, timeline } = data;

  const topData = (top_etiquetas ?? []).slice(0, 6).map((e) => ({
    label: e.nombre || helpers.obtenerNombre?.(e.label) || e.label,
    value: e.count,
    color: '#a78bfa',
  }));

  const confData = [
    { label: 'Baja (0-49)',    value: confianza?.distribucion?.baja  ?? 0, color: '#ef4444' },
    { label: 'Media (50-74)',  value: confianza?.distribucion?.media ?? 0, color: '#f59e0b' },
    { label: 'Alta (75-100)',  value: confianza?.distribucion?.alta  ?? 0, color: '#22c55e' },
  ];

  const tlData = (timeline ?? []).map((d) => ({
    periodo: d.fecha,
    total: d.procesados,
  }));

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} className="text-violet-400" />
        <h2 className="font-semibold text-white">Tendencias IA</h2>
        <span className="text-[11px] text-gray-500 ml-1">· últimos 30 días</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <KpiCard
          icon={Sparkles}
          label="Procesados por IA"
          value={total_procesados}
          hint="Reportes con clasificación automática"
        />
        <KpiCard
          icon={TrendingUp}
          label="Aceptación"
          value={`${accuracy?.porcentaje ?? 0}%`}
          hint={`${accuracy?.aceptadas ?? 0} aceptadas · ${accuracy?.modificadas ?? 0} modificadas`}
          color="text-green-400"
        />
        <KpiCard
          icon={Gauge}
          label="Confianza promedio"
          value={`${confianza?.promedio ?? 0}%`}
          hint="Score top-1 entregado por el modelo"
          color="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Section title="Top etiquetas detectadas" hint="Etiqueta principal sugerida por la IA">
          <BarChart data={topData} maxBars={6} />
        </Section>
        <Section title="Distribución de confianza" hint="Por nivel del score top-1">
          <BarChart data={confData} maxBars={3} />
        </Section>
      </div>

      <Section title="Procesados por día (30 d)" hint="Volumen de reportes pasados por la IA">
        {tlData.length > 0 ? (
          <LineChart data={tlData} bucket="month" color="#a78bfa" />
        ) : (
          <p className="text-sm text-gray-500 py-6 text-center">Sin datos en este rango.</p>
        )}
      </Section>
    </div>
  );
}
