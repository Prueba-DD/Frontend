import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getNotificaciones,
  getNotificacionesContador,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  eliminarNotificacion as apiEliminarNotificacion,
} from '../services/api';

/**
 * FE-29 · Hook de notificaciones in-app.
 *
 * - Polling del contador cada 30 s mientras la pestaña esté visible.
 * - Carga la lista bajo demanda (al abrir el panel).
 * - Acciones: marcarLeida, marcarTodas, eliminar.
 *
 * No realiza peticiones si `enabled = false` (p. ej. usuario no logueado).
 */
const POLL_MS = 30 * 1000;
const DEDUPE_MS = 10 * 1000;

export function useNotificaciones({ enabled = true } = {}) {
  const [noLeidas, setNoLeidas]       = useState(0);
  const [items, setItems]             = useState([]);
  const [cargandoLista, setCargando]  = useState(false);
  const [error, setError]             = useState(null);
  const ultimaListaRef = useRef(0);

  // Refresca solo el contador (ligero).
  const refrescarContador = useCallback(async () => {
    if (!enabled) return;
    try {
      const { data } = await getNotificacionesContador();
      setNoLeidas(Number(data?.data?.no_leidas ?? 0));
      setError(null);
    } catch (err) {
      if (err?.response?.status === 401) setError('no_auth');
      else setError('error');
    }
  }, [enabled]);

  // Carga la lista (con dedupe de 10 s salvo `force`).
  const cargarLista = useCallback(async ({ force = false } = {}) => {
    if (!enabled) return;
    const ahora = Date.now();
    if (!force && ahora - ultimaListaRef.current < DEDUPE_MS) return;
    ultimaListaRef.current = ahora;
    setCargando(true);
    try {
      const { data } = await getNotificaciones({ limit: 20 });
      setItems(data?.data?.items ?? []);
      setNoLeidas(Number(data?.data?.meta?.no_leidas ?? 0));
      setError(null);
    } catch (err) {
      if (err?.response?.status === 401) setError('no_auth');
      else setError('error');
    } finally {
      setCargando(false);
    }
  }, [enabled]);

  const marcarLeida = useCallback(async (uuid) => {
    try {
      await marcarNotificacionLeida(uuid);
      setItems((prev) => prev.map((n) =>
        n.uuid === uuid ? { ...n, leida: true, leida_at: new Date().toISOString() } : n));
      setNoLeidas((n) => Math.max(0, n - 1));
    } catch { /* silencioso: no rompe UI */ }
  }, []);

  const marcarTodas = useCallback(async () => {
    try {
      await marcarTodasNotificacionesLeidas();
      setItems((prev) => prev.map((n) => n.leida ? n : { ...n, leida: true }));
      setNoLeidas(0);
    } catch { /* silencioso */ }
  }, []);

  const eliminar = useCallback(async (uuid) => {
    try {
      await apiEliminarNotificacion(uuid);
      setItems((prev) => {
        const target = prev.find((n) => n.uuid === uuid);
        if (target && !target.leida) setNoLeidas((n) => Math.max(0, n - 1));
        return prev.filter((n) => n.uuid !== uuid);
      });
    } catch { /* silencioso */ }
  }, []);

  // Polling visibility-aware.
  useEffect(() => {
    if (!enabled) return undefined;
    refrescarContador();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refrescarContador();
    }, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') refrescarContador();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [enabled, refrescarContador]);

  return {
    noLeidas,
    items,
    cargandoLista,
    error,
    cargarLista,
    marcarLeida,
    marcarTodas,
    eliminar,
    refrescarContador,
  };
}

export default useNotificaciones;
