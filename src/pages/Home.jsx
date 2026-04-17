import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Camera, Users, CheckCircle2, BarChart2, Bell,
  FileText, ArrowDown, ChevronRight, ArrowRight,
  Leaf, Shield, Zap, Mail, Github, AlertTriangle, Globe, Eye,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Reveal, CountUp } from '../utils/animations.jsx';
import { useAuth } from '../context/AuthContext';
import { getStats } from '../services/api';

const FEATURES = [
  {
    Icon: MapPin,
    title: 'Geolocalización precisa',
    desc: 'Ubica cada incidencia en el mapa con coordenadas exactas. Permite que autoridades y comunidades identifiquen el punto exacto del problema.',
    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
  },
  {
    Icon: Camera,
    title: 'Evidencia multimedia',
    desc: 'Adjunta fotos como respaldo visual del reporte. Cada imagen queda vinculada al caso para facilitar la verificación institucional.',
    color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20',
  },
  {
    Icon: CheckCircle2,
    title: 'Moderación y trazabilidad',
    desc: 'Cada reporte es revisado, clasificado por nivel de severidad y sigue un flujo de estado hasta su resolución. Nunca se pierde un caso.',
    color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20',
  },
  {
    Icon: BarChart2,
    title: 'Mapa de alertas en tiempo real',
    desc: 'Visualiza el estado ambiental de tu región en un mapa interactivo. Identifica zonas críticas y patrones de contaminación.',
    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
  },
  {
    Icon: Users,
    title: 'Red ciudadana',
    desc: 'Reportes respaldados por la comunidad. Más votos de relevancia = mayor prioridad para intervención. La acción colectiva escala el impacto.',
    color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20',
  },
  {
    Icon: Bell,
    title: 'Categorías especializadas',
    desc: 'Desde contaminación del agua hasta incendios forestales y deslizamientos. Once categorías cubren el espectro completo de riesgos ambientales.',
    color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20',
  },
];

const STEPS = [
  {
    Icon: FileText, num: '01', title: 'Crea el reporte',
    desc: 'Selecciona la categoría, describe el problema, marca la ubicación y adjunta evidencia fotográfica. Menos de 2 minutos.',
    color: 'text-green-400', accent: '#22c55e',
  },
  {
    Icon: Shield, num: '02', title: 'Se verifica',
    desc: 'Moderadores revisan cada caso, asignan nivel de severidad y lo clasifican para derivarlo a las entidades competentes.',
    color: 'text-blue-400', accent: '#3b82f6',
  },
  {
    Icon: CheckCircle2, num: '03', title: 'Se resuelve',
    desc: 'Las autoridades reciben el caso estructurado. La comunidad hace seguimiento al estado hasta el cierre del reporte.',
    color: 'text-emerald-400', accent: '#10b981',
  },
];

const PROBLEM_ITEMS = [
  { icon: AlertTriangle, text: 'Vertimientos de residuos en fuentes hídricas sin denuncia formal', color: 'text-red-400' },
  { icon: Globe, text: 'Deforestación y pérdida de cobertura vegetal sin registro ciudadano', color: 'text-amber-400' },
  { icon: Eye, text: 'Reportes que llegan a las autoridades sin evidencia ni geolocalización', color: 'text-orange-400' },
];

const MISSION_CARDS = [
  {
    icon: Leaf, color: '#22c55e', title: 'Medio ambiente primero',
    desc: 'Cada ciudadano tiene el poder de proteger su entorno. GreenAlert convierte la preocupación ambiental en acción concreta y documentada.',
  },
  {
    icon: Shield, color: '#3b82f6', title: 'Datos confiables',
    desc: 'Cada reporte pasa por verificación. La transparencia y la precisión son la base de nuestra plataforma y de su credibilidad institucional.',
  },
  {
    icon: Users, color: '#a78bfa', title: 'Red nacional',
    desc: 'Colombia cuenta con más de 1.100 municipios. GreenAlert conecta a sus habitantes para construir una red de vigilancia ambiental colaborativa.',
  },
];

export default function Home() {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    getStats()
      .then(({ data }) => setStatsData(data.data.stats))
      .catch(() => {});
  }, []);

  const statsDisplay = [
    { label: 'Reportes registrados',  value: statsData?.total_reportes,    suffix: '+' },
    { label: 'Municipios reportados', value: statsData?.municipios_activos, suffix: '' },
    { label: 'Casos con seguimiento', value: statsData?.con_seguimiento,    suffix: '+' },
    { label: 'Ciudadanos activos',    value: statsData?.total_usuarios,     suffix: '+' },
  ];

  return (
    <div className="flex flex-col">

      {/* HERO */}
      <section className="relative overflow-hidden pt-12 pb-24 sm:pt-16 sm:pb-32 px-4 sm:px-6 text-center">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute left-1/2 -top-20 -translate-x-1/2 w-[900px] h-[600px] bg-green-500/8 rounded-full blur-3xl" />
          <div className="absolute -left-20 bottom-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-3xl" />
          <div className="absolute -right-20 top-1/2 w-[350px] h-[350px] bg-teal-500/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Plataforma activa de monitoreo ambiental ciudadano
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            El medio ambiente<br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              necesita tu voz.
            </span>
          </h1>

          <motion.p
            className="mt-7 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            GreenAlert es la plataforma que convierte la preocupación ambiental en datos estructurados.
            Reporta, mapea y da seguimiento a problemas ambientales en tu municipio —
            y haz que lleguen a quienes pueden actuar.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {user ? (
              <>
                <Link to="/dashboard" className="btn-primary text-base inline-flex items-center gap-2 justify-center px-6 py-3">
                  Ir a mi panel <ChevronRight size={16} />
                </Link>
                <Link to="/reports" className="btn-secondary text-base px-6 py-3 inline-flex items-center gap-2 justify-center">
                  Ver mapa de reportes <ArrowRight size={15} />
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-base inline-flex items-center gap-2 justify-center px-6 py-3">
                  Crear cuenta gratis <ChevronRight size={16} />
                </Link>
                <Link to="/reports" className="btn-secondary text-base px-6 py-3 inline-flex items-center gap-2 justify-center">
                  Ver reportes públicos <ArrowRight size={15} />
                </Link>
              </>
            )}
          </motion.div>

          {!user && (
            <motion.p
              className="mt-5 text-xs text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Gratuito · Verificado por moderadores · Con seguimiento hasta la resolución
            </motion.p>
          )}
        </motion.div>

        <motion.div
          className="mt-20 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}>
            <ArrowDown size={17} className="text-gray-700" />
          </motion.div>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="py-14 px-4 sm:px-6 border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {statsDisplay.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.07}>
              <div className="text-4xl sm:text-5xl font-extrabold text-green-400 tabular-nums">
                <CountUp target={s.value} />{s.suffix}
              </div>
              <div className="text-sm text-gray-500 mt-2 leading-snug">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* EL CONTEXTO */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-12">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber-500/80 mb-3">El contexto</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-snug">
              Los problemas ambientales existen.<br />
              <span className="text-gray-400 font-normal">Lo que falta es documentarlos y escalarlos.</span>
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-5">
            {PROBLEM_ITEMS.map(({ icon: Icon, text, color }, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="flex flex-col gap-4 p-5 rounded-xl border border-gray-800 bg-gray-900/60 h-full">
                  <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <div className="mt-8 p-5 rounded-xl border border-green-900/40 bg-green-950/20 flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/25 flex items-center justify-center shrink-0 mt-0.5">
                <Leaf className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="text-green-400 font-semibold">GreenAlert resuelve esto.</span>{' '}
                Centraliza los reportes ciudadanos, los estructura con geolocalización y evidencia,
                y los entrega a los actores institucionales con la trazabilidad necesaria para actuar.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CAPACIDADES */}
      <section className="py-24 px-4 sm:px-6 border-t border-gray-800/60 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-green-500/70 mb-3">Capacidades</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Todo lo que necesitas para reportar</h2>
            <p className="mt-3 text-gray-400 max-w-xl mx-auto">
              Una plataforma diseñada para que cada reporte tenga el mayor impacto posible.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.07}>
                <motion.div
                  className={`h-full rounded-xl border ${f.border} bg-gray-900 p-5 flex flex-col gap-3 group cursor-default transition-all duration-200`}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className={`w-10 h-10 rounded-lg ${f.bg} border ${f.border} flex items-center justify-center`}>
                    <f.Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-white text-sm">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* EL PROCESO */}
      <section className="py-24 px-4 sm:px-6 border-t border-gray-800/60">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-green-500/70 mb-3">El proceso</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">De la observación a la resolución</h2>
            <p className="mt-3 text-gray-400 max-w-lg mx-auto">
              Tres pasos claros que transforman un problema ambiental en un caso gestionado.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px"
              style={{ background: 'linear-gradient(to right, transparent, #16a34a55, transparent)' }}
            />
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 0.12}>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="relative">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center border"
                      style={{ background: s.accent + '12', borderColor: s.accent + '35' }}
                    >
                      <s.Icon className={`w-8 h-8 ${s.color}`} />
                    </div>
                    <span
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center text-gray-950"
                      style={{ background: s.accent }}
                    >
                      {s.num.slice(1)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-gray-400 leading-relaxed max-w-[210px]">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE NOSOTROS — anchor: #nosotros */}
      <section id="nosotros" className="py-24 px-4 sm:px-6 border-t border-gray-800/60">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-sm font-medium mb-4">
              <Leaf className="w-4 h-4" />
              Sobre GreenAlert
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Nuestra misión</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Democratizar el acceso a la información ambiental y empoderar a cada colombiano
              para actuar frente al deterioro ecológico.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-6">
            {MISSION_CARDS.map(({ icon: Icon, color, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <div className="card h-full flex flex-col gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color + '18', border: `1.5px solid ${color}40` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1.5">{title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO — anchor: #contacto */}
      <section id="contacto" className="py-20 sm:py-24 px-4 sm:px-6 border-t border-gray-800/60 bg-gray-900/40">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-10 sm:p-14">
              <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-green-500/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl" />
              </div>

              <div className="grid sm:grid-cols-2 gap-10 items-center">
                <div className="flex flex-col gap-5">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/25 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                      ¿Tienes ideas o<br />encontraste un error?
                    </h2>
                    <p className="mt-3 text-gray-400 leading-relaxed">
                      GreenAlert es un proyecto de código abierto. Tu feedback
                      y contribuciones son bienvenidos — cada mejora cuenta.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="mailto:contacto@greenalert.co"
                      className="btn-primary flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Contactar
                    </a>
                    <a
                      href="https://github.com/Prueba-DD"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center justify-center gap-2"
                    >
                      <Github className="w-4 h-4" />
                      Ver en GitHub
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-5 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Correo</p>
                      <p className="text-sm text-white font-medium">contacto@greenalert.co</p>
                      <p className="text-xs text-gray-500 mt-0.5">Respondemos en menos de 48 h</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-5 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <Github className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Repositorio</p>
                      <p className="text-sm text-white font-medium">github.com/Prueba-DD</p>
                      <p className="text-xs text-gray-500 mt-0.5">Issues, PRs y discusiones abiertas</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-5 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Leaf className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Licencia</p>
                      <p className="text-sm text-white font-medium">MIT — Código abierto</p>
                      <p className="text-xs text-gray-500 mt-0.5">Libre para usar, modificar y distribuir</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
