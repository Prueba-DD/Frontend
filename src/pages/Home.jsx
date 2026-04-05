import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Camera, Users, CheckCircle2, BarChart2, Bell } from 'lucide-react';
import { getStats } from '../services/api';

const features = [
  {
    Icon: MapPin,
    title: 'Geolocalización',
    desc: 'Ubica y mapea problemáticas ambientales con precisión geográfica en tu territorio.',
  },
  {
    Icon: Camera,
    title: 'Evidencia Multimedia',
    desc: 'Adjunta fotos, videos o documentos a cada reporte para respaldarlo con pruebas.',
  },
  {
    Icon: Users,
    title: 'Participación Colectiva',
    desc: 'La comunidad puede reportar, apoyar y comentar incidencias ambientales.',
  },
  {
    Icon: CheckCircle2,
    title: 'Validación de Reportes',
    desc: 'Sistema de gestión para verificar y dar seguimiento institucional a cada caso.',
  },
  {
    Icon: BarChart2,
    title: 'Visualización',
    desc: 'Mapa interactivo e indicadores del estado ambiental de tu región.',
  },
  {
    Icon: Bell,
    title: 'Alertas Tempranas',
    desc: 'Recibe notificaciones cuando surjan problemas ambientales cerca de tu zona.',
  },
];

export default function Home() {
  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    getStats()
      .then(({ data }) => setStatsData(data.data.stats))
      .catch(() => {});
  }, []);

  const statsDisplay = [
    { label: 'Reportes registrados',   value: statsData?.total_reportes },
    { label: 'Municipios reportados',      value: statsData?.municipios_activos },
    { label: 'Casos con seguimiento',   value: statsData?.con_seguimiento },
    { label: 'Ciudadanos participando', value: statsData?.total_usuarios },
  ];
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[400px] bg-green-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto">
          <span className="badge bg-green-500/10 text-green-400 border border-green-500/30 mb-6">
            <img src="/chrome-192x192.png" alt="" className="h-5 w-5 object-contain" />
            Plataforma de monitoreo ambiental ciudadano
          </span>

          <h1 className="mt-4 text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Cuida tu entorno.<br />
            <span className="text-green-400">Actúa juntos.</span>
          </h1>

          <p className="mt-6 text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            GreenAlert conecta a tu comunidad para reportar, mapear y dar seguimiento a
            problemas ambientales. Cada reporte cuenta.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/reports/new" className="btn-primary text-base">
              Hacer un reporte
            </Link>
            <Link to="/dashboard" className="btn-secondary text-base">
              Ver dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 sm:px-6 border-y border-gray-800 bg-gray-900/40">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {statsDisplay.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-green-400">
                {statsData == null
                  ? <span className="inline-block w-10 h-8 bg-green-900/30 rounded animate-pulse" />
                  : (s.value ?? 0)}
              </div>
              <div className="text-sm text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">¿Qué puedes hacer con GreenAlert?</h2>
            <p className="mt-3 text-gray-400">Una plataforma completa para la acción ambiental colectiva.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="card hover:border-green-800 transition-colors duration-200 group">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                  <f.Icon className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-16 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto card border-green-900 bg-green-950/30">
          <h2 className="text-2xl font-bold text-white">¿Ves un problema ambiental cerca de ti?</h2>
          <p className="mt-3 text-gray-400">No lo ignores. Repórtalo en segundos y activa a tu comunidad.</p>
          <Link to="/reports/new" className="btn-primary inline-block mt-6">
            Crear primer reporte
          </Link>
        </div>
      </section>
    </div>
  );
}
