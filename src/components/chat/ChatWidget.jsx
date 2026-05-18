// FE-28 · Widget flotante de AUREL — mascota conversacional de Green Alert.
// Incluye: avatar con estado ambiental, vista FAQ con búsqueda, cards enriquecidas.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Send, Trash2, Loader2, HelpCircle, ArrowLeft, Search } from 'lucide-react';
import { useChatbot } from '../../hooks/useChatbot';
import { useUbicacionUsuario } from '../../hooks/useUbicacionUsuario';
import { useAuth } from '../../context/AuthContext';
import ChatBubble from './ChatBubble';
import AurelAvatar from './AurelAvatar';

const EJEMPLOS = [
  '¿Cómo creo un reporte?',
  'Alertas cerca de mi zona',
  '¿Qué puede hacer AUREL?',
];

const ESTADO_LABEL = {
  optimo:       'Ambiente óptimo',
  moderado:     'Alerta moderada',
  alerta:       'Alerta activa',
  critico:      'Estado crítico',
  recuperacion: 'En recuperación',
};

const FAB_GLOW = {
  optimo:       'shadow-green-900/40',
  moderado:     'shadow-teal-800/40',
  alerta:       'shadow-amber-900/40',
  critico:      'shadow-orange-900/50',
  recuperacion: 'shadow-purple-900/40',
};

export default function ChatWidget() {
  const [abierto, setAbierto]   = useState(false);
  const [view, setView]         = useState('chat'); // 'chat' | 'faq'
  const [borrador, setBorrador] = useState('');
  const [faqSearch, setFaqSearch] = useState('');
  const [faqAbiertos, setFaqAbiertos] = useState({});
  const { user } = useAuth();

  // Sólo pedimos ubicación si el usuario aceptó alertas (no la forzamos aquí).
  const alertasOn = (() => { try { return localStorage.getItem('ga_alertas_zona_enabled') === '1'; } catch { return false; } })();
  const radioKm   = (() => { try { return Number(localStorage.getItem('ga_alertas_radio_km')) || 10; } catch { return 10; } })();
  const { location } = useUbicacionUsuario({ user, enabled: alertasOn });

  const ubicacion = useMemo(() => (
    location && Number.isFinite(location.lat) && Number.isFinite(location.lng)
      ? { lat: location.lat, lng: location.lng, radio_km: radioKm }
      : null
  ), [location, radioKm]);

  const {
    mensajes, loading, error,
    estadoAmbiental, faqs, cargandoFaqs,
    enviar, limpiar, cargarFaqs,
  } = useChatbot({ ubicacion });

  const listaRef    = useRef(null);
  const textareaRef = useRef(null);
  const faqInputRef = useRef(null);

  // Cargar FAQs al abrir la vista FAQ.
  useEffect(() => {
    if (view === 'faq') {
      cargarFaqs();
      setTimeout(() => faqInputRef.current?.focus(), 50);
    }
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autoscroll cuando entran mensajes o se abre el panel.
  useEffect(() => {
    if (!abierto || view !== 'chat') return;
    const el = listaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [mensajes, abierto, loading, view]);

  // Autosize del textarea.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [borrador]);

  const submit = (textoOpcional) => {
    const t = (textoOpcional ?? borrador).trim();
    if (!t || loading) return;
    setBorrador('');
    enviar(t);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Inyectar pregunta FAQ → cerrar FAQ, ir al chat, enviar.
  const inyectarFaq = (prompt) => {
    setView('chat');
    setFaqSearch('');
    setTimeout(() => enviar(prompt), 80);
  };

  // FAQs filtradas.
  const gruposFiltrados = useMemo(() => {
    if (!faqs) return [];
    const q = faqSearch.toLowerCase().trim();
    if (!q) return faqs;
    return faqs
      .map((g) => ({ ...g, preguntas: g.preguntas.filter((p) => p.pregunta.toLowerCase().includes(q)) }))
      .filter((g) => g.preguntas.length > 0);
  }, [faqs, faqSearch]);

  const toggleGrupo = (nombre) => setFaqAbiertos((prev) => ({ ...prev, [nombre]: !prev[nombre] }));

  return (
    <>
      {/* ── FAB ─────────────────────────────────────────────────────── */}
      <button
        type="button"
        aria-label={abierto ? 'Cerrar chat de AUREL' : 'Abrir chat de AUREL'}
        onClick={() => setAbierto((v) => !v)}
        className={`fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 rounded-full items-center justify-center transition-all hover:scale-105 active:scale-95 ${
          abierto
            ? `w-11 h-11 sm:w-12 sm:h-12 bg-green-600 hover:bg-green-500 text-white shadow-lg ${FAB_GLOW[estadoAmbiental] ?? FAB_GLOW.optimo} hidden sm:flex`
            : 'w-32 h-32 sm:w-36 sm:h-36 bg-transparent shadow-none flex'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {abierto ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={16} />
            </motion.span>
          ) : (
            // motion.div gestiona entrada/salida (scale+opacity) — capa separada
            // del div.aurel-float que anima el float (translateY+rotate) via CSS,
            // evitando colisión de transforms entre Framer Motion y CSS animation.
            <motion.div
              key="aurel"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full h-full"
            >
              <div className="aurel-float w-full h-full">
                <img
                  src="/aurel.png"
                  alt="AUREL"
                  draggable={false}
                  className="w-full h-full object-contain select-none"
                  style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed z-40 flex flex-col overflow-hidden bg-gray-900/97 backdrop-blur border border-gray-700 shadow-2xl inset-x-2 bottom-2 top-2 rounded-2xl sm:inset-x-auto sm:top-auto sm:bottom-24 sm:right-5 sm:w-[360px] sm:h-[min(520px,calc(100vh-9rem))] sm:rounded-2xl"
            role="dialog"
            aria-label="Chat con AUREL"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-800 bg-gray-900/90">
              <div className="flex items-center gap-2">
                {view === 'faq' ? (
                  <button
                    type="button"
                    onClick={() => setView('chat')}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                    title="Volver al chat"
                  >
                    <ArrowLeft size={16} />
                  </button>
                ) : (
                  <AurelAvatar size="sm" estado={estadoAmbiental} />
                )}
                <div>
                  <div className="text-sm font-semibold text-gray-100">
                    {view === 'faq' ? 'Preguntas frecuentes' : 'AUREL'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {view === 'faq' ? 'Toca una pregunta para enviarla' : (ESTADO_LABEL[estadoAmbiental] ?? 'La viva del planeta')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {view === 'chat' && (
                  <button
                    type="button"
                    onClick={() => setView('faq')}
                    title="Preguntas frecuentes"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                  >
                    <HelpCircle size={15} />
                  </button>
                )}
                {view === 'chat' && mensajes.length > 0 && (
                  <button
                    type="button"
                    onClick={limpiar}
                    title="Limpiar conversación"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  title="Cerrar"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Vista Chat ── */}
            {view === 'chat' && (
              <>
                <div ref={listaRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-dark">
                  {mensajes.length === 0 && (
                    <div className="text-center py-2">
                      <div className="flex justify-center mb-2">
                        <AurelAvatar size="lg" estado={estadoAmbiental} showDot={false} />
                      </div>
                      <p className="text-xs font-semibold text-gray-200 mb-0.5">Soy AUREL</p>
                      <p className="text-[11px] text-gray-400 mb-3 px-6 leading-snug">Pregúntame sobre reportes, alertas en tu zona o cómo usar la plataforma.</p>
                      <div className="flex flex-col items-center gap-2">
                        {EJEMPLOS.map((ej) => (
                          <button
                            key={ej}
                            type="button"
                            onClick={() => submit(ej)}
                            className="text-xs px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
                          >
                            {ej}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setView('faq')}
                          className="text-xs px-3 py-1.5 rounded-full bg-green-600/15 hover:bg-green-600/25 text-green-300 border border-green-600/30 transition-colors"
                        >
                          Ver preguntas frecuentes
                        </button>
                      </div>
                    </div>
                  )}

                  {mensajes.map((m, i) => (
                    <ChatBubble
                      key={i}
                      role={m.role}
                      content={m.content}
                      sugerencias={m.sugerencias}
                      cards={m.cards}
                      fuente={m.fuente}
                      estadoAmbiental={estadoAmbiental}
                      onPrompt={(p) => enviar(p)}
                    />
                  ))}

                  {loading && (
                    <div className="flex items-center gap-2">
                      <AurelAvatar size="xs" estado={estadoAmbiental} />
                      <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-gray-800/90 border border-gray-700 text-gray-400 flex items-center gap-2">
                        <Loader2 size={13} className="animate-spin" />
                        <span className="text-xs">Pensando…</span>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="px-3 py-1.5 text-[11px] text-red-300 bg-red-900/20 border-t border-red-900/40">
                    {error}
                  </div>
                )}

                {/* Input */}
                <div className="px-3 pb-3 pt-2 border-t border-gray-800">
                  <div className="flex items-end gap-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700 focus-within:border-green-500/60 transition-colors">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={borrador}
                      onChange={(e) => setBorrador(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Escribe un mensaje…"
                      disabled={loading}
                      className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 resize-none outline-none max-h-28 leading-relaxed disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => submit()}
                      disabled={!borrador.trim() || loading}
                      className="p-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Vista FAQ ── */}
            {view === 'faq' && (
              <div className="flex-1 overflow-y-auto flex flex-col">
                <div className="px-3 pt-3 pb-2">
                  <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700 focus-within:border-green-500/60 transition-colors">
                    <Search size={14} className="text-gray-500 flex-shrink-0" />
                    <input
                      ref={faqInputRef}
                      type="text"
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      placeholder="Buscar pregunta…"
                      className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none"
                    />
                    {faqSearch && (
                      <button type="button" onClick={() => setFaqSearch('')} className="text-gray-500 hover:text-gray-300">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 scrollbar-dark">
                  {cargandoFaqs && (
                    <div className="flex justify-center py-8">
                      <Loader2 size={20} className="animate-spin text-green-400" />
                    </div>
                  )}

                  {!cargandoFaqs && gruposFiltrados.length === 0 && (
                    <p className="text-center text-xs text-gray-500 py-8">
                      {faqSearch ? 'No se encontraron preguntas.' : 'No hay preguntas frecuentes cargadas.'}
                    </p>
                  )}

                  {!cargandoFaqs && gruposFiltrados.map((grupo) => {
                    const estaAbierto = faqAbiertos[grupo.grupo] ?? true;
                    return (
                      <div key={grupo.grupo} className="border border-gray-700 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleGrupo(grupo.grupo)}
                          className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-800 hover:bg-gray-750 text-left transition-colors"
                        >
                          <span className="text-xs font-semibold text-gray-300">{grupo.grupo}</span>
                          <span className={`text-gray-500 text-xs transition-transform duration-200 ${estaAbierto ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                        {estaAbierto && (
                          <div className="divide-y divide-gray-800/60">
                            {grupo.preguntas.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => inyectarFaq(p.prompt)}
                                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-green-500/10 hover:text-green-300 transition-colors"
                              >
                                {p.pregunta}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
