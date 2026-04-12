import { Leaf, Shield, Users, Zap, MapPin, Bell, BarChart2, Mail, Github } from 'lucide-react';
import { motion } from 'motion/react';
import { Reveal, CountUp } from '../utils/animations.jsx';

const MISSION_CARDS = [
  {
    icon: Leaf,
    color: '#22c55e',
    title: 'Medio ambiente primero',
    desc: 'Creemos que cada ciudadano tiene el poder de proteger su entorno. GreenAlert convierte la preocupación ambiental en acción concreta.',
  },
  {
    icon: Shield,
    color: '#3b82f6',
    title: 'Datos confiables',
    desc: 'Cada reporte pasa por un proceso de verificación. La transparencia y la precisión son la base de nuestra plataforma.',
  },
  {
    icon: Users,
    color: '#a78bfa',
    title: 'Comunidad activa',
    desc: 'Colombia cuenta con más de 1,100 municipios. GreenAlert conecta a sus habitantes para construir una red de vigilancia ambiental colectiva.',
  },
];

const HOW_STEPS = [
  {
    num: '01',
    icon: MapPin,
    color: '#22c55e',
    title: 'Reporta un problema',
    desc: 'Selecciona la categoría, describe la situación y señala la ubicación en el mapa. El proceso toma menos de 2 minutos.',
  },
  {
    num: '02',
    icon: Bell,
    color: '#f59e0b',
    title: 'Verificamos y clasificamos',
    desc: 'Nuestros moderadores revisan el reporte, asignan nivel de severidad y lo derivan a las autoridades competentes.',
  },
  {
    num: '03',
    icon: BarChart2,
    color: '#3b82f6',
    title: 'Monitorea el impacto',
    desc: 'Sigue el estado de tus reportes en tiempo real y consulta el mapa de alertas para ver la actividad en tu región.',
  },
];

const STATS = [
  { value: 1100, suffix: '+', label: 'Municipios cubiertos' },
  { value: 11, suffix: '', label: 'Categorías de reporte' },
  { value: 4, suffix: ' niveles', label: 'De severidad' },
];

export default function About() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        {/* Glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-green-500/6 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-sm font-medium mb-6">
              <Leaf className="w-4 h-4" />
              Plataforma ambiental ciudadana
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Sobre{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                GreenAlert
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Una herramienta ciudadana para reportar, monitorear y gestionar
              problemas ambientales en Colombia. Transparente, colaborativa y de código abierto.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <Reveal>
        <section className="py-12 border-y border-gray-800/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              {STATS.map(({ value, suffix, label }) => (
                <div key={label}>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white">
                    <CountUp target={value} />{suffix}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Mission ──────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Nuestra misión</h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Democratizar el acceso a la información ambiental y empoderar a cada colombiano
                para actuar frente al deterioro ecológico.
              </p>
            </div>
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

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 border-t border-gray-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">¿Cómo funciona?</h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Tres pasos simples para que tu reporte llegue a quienes pueden actuar.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-8">
            {HOW_STEPS.map(({ num, icon: Icon, color, title, desc }, i) => (
              <Reveal key={num} delay={i * 0.12}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-4xl font-extrabold leading-none"
                      style={{ color: color + '55' }}
                    >
                      {num}
                    </span>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: color + '18', border: `1.5px solid ${color}40` }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
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

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 border-t border-gray-800/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="card text-center flex flex-col items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/25 flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">¿Tienes ideas o encontraste un error?</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  GreenAlert es un proyecto de código abierto. Tu feedback y contribuciones son bienvenidos.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <a
                  href="mailto: aun no hay correo" // Aqui va el correo de contacto de GreenAlert - moderadores, equipo, etc
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
          </Reveal>
        </div>
      </section>

    </div>
  );
}

