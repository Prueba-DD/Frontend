import { useCallback, useEffect, useRef, useState } from 'react';
import { getAlertasPredictivas } from '../services/api';

/**
 * FE-27 · Poll periódico de alertas predictivas dentro del radio del usuario.
 * Identifica alertas nuevas (zona_id no presente en `ga_alertas_vistas`),
 * dispara un callback `onNuevaAlerta` por cada una y mantiene el contador
 * de no-vistas.
 *
 * Polling = 3 min. Se pausa cuando la pestaña deja de estar visible y se
 * dispara un fetch inmediato cuando vuelve.
 */

const LS_VISTAS = 'ga_alertas_vistas';
const POLL_MS = 3 * 60 * 1000;
const MAX_HISTORIA = 100;

function leerVistas() {
  try {
    const raw = localStorage.getItem(LS_VISTAS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function guardarVistas(ids) {
  try {
    const recortado = ids.slice(-MAX_HISTORIA);
    localStorage.setItem(LS_VISTAS, JSON.stringify(recortado));
  } catch { /* ignore */ }
}

export function useAlertasZona({
  enabled = false,
  location = null,
  radioKm = 10,
  nivelMin = 'medio',
  onNuevaAlerta = () => {},
} = {}) {
  const [alertas, setAlertas] = useState([]);
  const [vistas, setVistas] = useState(() => new Set(leerVistas()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const callbackRef = useRef(onNuevaAlerta);
  callbackRef.current = onNuevaAlerta;
  // Conjunto de zona_ids ya entregadas al callback en esta sesión, para
  // evitar disparos duplicados entre polls consecutivos.
  const yaNotificadasRef = useRef(new Set());

  const fetchOnce = useCallback(async () => {
    if (!enabled || !location?.lat || !location?.lng) return;
    setLoading(true);
    setError(null);
    try {
      const params = { limite: 20, nivel_min: nivelMin, lat: location.lat, lng: location.lng, radio_km: radioKm };
      const { data } = await getAlertasPredictivas(params);
      const lista = data?.data?.alertas ?? [];
      setAlertas(lista);

      // Detectar nuevas (no vistas y no notificadas aún en esta sesión).
      const vistasActuales = leerVistas();
      const setVistasLocal = new Set(vistasActuales);
      for (const a of lista) {
        const zid = String(a.zona_id ?? a.id);
        if (!setVistasLocal.has(zid) && !yaNotificadasRef.current.has(zid)) {
          yaNotificadasRef.current.add(zid);
          try { callbackRef.current(a); } catch { /* ignore handler */ }
        }
      }
    } catch (err) {
      setError(err?.response?.status === 401 ? 'no_auth' : 'error');
    } finally {
      setLoading(false);
    }
  }, [enabled, location?.lat, location?.lng, radioKm, nivelMin]);

  // Poll + visibility.
  useEffect(() => {
    if (!enabled || !location?.lat || !location?.lng) return undefined;

    fetchOnce();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchOnce();
    }, POLL_MS);

    const onVis = () => {
      if (document.visibilityState === 'visible') fetchOnce();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [enabled, location?.lat, location?.lng, fetchOnce]);

  const marcarVista = useCallback((zonaId) => {
    setVistas((prev) => {
      if (prev.has(String(zonaId))) return prev;
      const next = new Set(prev);
      next.add(String(zonaId));
      guardarVistas(Array.from(next));
      return next;
    });
  }, []);

  const marcarTodasVistas = useCallback(() => {
    setVistas((prev) => {
      const next = new Set(prev);
      for (const a of alertas) next.add(String(a.zona_id ?? a.id));
      guardarVistas(Array.from(next));
      return next;
    });
  }, [alertas]);

  const noVistas = alertas.filter((a) => !vistas.has(String(a.zona_id ?? a.id)));

  return {
    alertas,
    noVistas,
    count: noVistas.length,
    loading,
    error,
    marcarVista,
    marcarTodasVistas,
    refresh: fetchOnce,
  };
}
