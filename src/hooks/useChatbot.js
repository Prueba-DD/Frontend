// FE-28 · Hook para el chat conversacional (AUREL).
// Mantiene sessionId, historial, loading, estadoAmbiental, faqs y errores.
import { useCallback, useEffect, useRef, useState } from 'react';
import { sendChatMessage, getChatFaqs } from '../services/api';

const STORAGE_KEY = 'ga_chat_session';
const MAX_MENSAJES_PERSIST = 50; // FIFO
const HISTORIAL_PARA_API   = 6;  // últimos turnos enviados como contexto

function generarSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `ses-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cargar() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.sessionId) return null;
    return { sessionId: parsed.sessionId, mensajes: Array.isArray(parsed.mensajes) ? parsed.mensajes : [] };
  } catch { return null; }
}

function guardar(sessionId, mensajes) {
  try {
    const trimmed = mensajes.slice(-MAX_MENSAJES_PERSIST);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, mensajes: trimmed, updatedAt: Date.now() }));
  } catch { /* sessionStorage lleno o bloqueado: lo ignoramos */ }
}

/**
 * @param {object} [options]
 * @param {{lat:number,lng:number,radio_km?:number}|null} [options.ubicacion]
 */
export function useChatbot({ ubicacion = null } = {}) {
  const inicial = cargar();
  const [sessionId, setSessionId] = useState(inicial?.sessionId || generarSessionId());
  const [mensajes,  setMensajes]  = useState(inicial?.mensajes  || []);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [estadoAmbiental, setEstadoAmbiental] = useState('optimo');
  const [faqs,      setFaqs]      = useState(null);
  const [cargandoFaqs, setCargandoFaqs] = useState(false);
  const enviandoRef = useRef(false);

  // Persistir cuando cambie historial.
  useEffect(() => { guardar(sessionId, mensajes); }, [sessionId, mensajes]);

  const enviar = useCallback(async (texto) => {
    const limpio = String(texto || '').trim();
    if (!limpio || enviandoRef.current) return;
    enviandoRef.current = true;

    const userMsg = { role: 'user', content: limpio, ts: Date.now() };
    setMensajes((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const historial = [...mensajes, userMsg]
        .slice(-HISTORIAL_PARA_API * 2)
        .map((m) => ({ role: m.role, content: m.content }));

      const payload = { mensaje: limpio, sessionId, historial };
      if (ubicacion && Number.isFinite(ubicacion.lat) && Number.isFinite(ubicacion.lng)) {
        payload.ubicacion = { lat: ubicacion.lat, lng: ubicacion.lng, radio_km: ubicacion.radio_km ?? 10 };
      }

      const { data } = await sendChatMessage(payload);
      const d = data?.data || data;
      const bot = {
        role: 'assistant',
        content: d?.respuesta || 'No tengo una respuesta en este momento.',
        sugerencias: Array.isArray(d?.sugerencias) ? d.sugerencias : [],
        cards: Array.isArray(d?.cards) ? d.cards : [],
        fuente: d?.fuente || 'offline',
        intent: d?.intent || 'fallback',
        latencia_ms: d?.latencia_ms ?? null,
        ts: Date.now(),
      };
      if (d?.estadoAmbiental) setEstadoAmbiental(d.estadoAmbiental);
      setMensajes((prev) => [...prev, bot]);
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 429
        ? 'Estás enviando mensajes muy rápido. Espera un momento.'
        : 'No pude contactar al asistente. Intenta de nuevo.';
      setError(msg);
      setMensajes((prev) => [...prev, { role: 'assistant', content: msg, fuente: 'error', ts: Date.now() }]);
    } finally {
      setLoading(false);
      enviandoRef.current = false;
    }
  }, [mensajes, sessionId, ubicacion]);

  const limpiar = useCallback(() => {
    setMensajes([]);
    setError(null);
    setEstadoAmbiental('optimo');
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    setSessionId(generarSessionId());
  }, []);

  const cargarFaqs = useCallback(async () => {
    if (faqs || cargandoFaqs) return;
    setCargandoFaqs(true);
    try {
      const { data } = await getChatFaqs();
      const grupos = data?.data?.grupos ?? data?.grupos ?? [];
      setFaqs(grupos);
    } catch {
      setFaqs([]);
    } finally {
      setCargandoFaqs(false);
    }
  }, [faqs, cargandoFaqs]);

  return { sessionId, mensajes, loading, error, estadoAmbiental, faqs, cargandoFaqs, enviar, limpiar, cargarFaqs };
}
