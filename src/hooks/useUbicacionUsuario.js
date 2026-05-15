import { useCallback, useEffect, useState } from 'react';
import { getMisReportes } from '../services/api';

/**
 * FE-27 · Obtiene la ubicación del usuario para filtrar alertas predictivas
 * por radio. Estrategia (en orden):
 *   1. `localStorage.ga_user_location` si tiene < 24 h.
 *   2. `navigator.geolocation` si el usuario lo permite.
 *   3. Centroide de los últimos reportes del usuario (fallback).
 *
 * No bloquea ni lanza errores hacia arriba: en caso de fallar devuelve
 * `{ location: null, ... }` y el consumidor decide cómo degradar.
 */

const LS_KEY = 'ga_user_location';
const TTL_MS = 24 * 60 * 60 * 1000;

function leerCache() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.lat || !parsed?.lng || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function guardarCache(lat, lng, fuente) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ lat, lng, fuente, ts: Date.now() }));
  } catch { /* quota / privado */ }
}

export function borrarUbicacionGuardada() {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

function pedirGeolocation() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        fuente: 'geolocation',
      }),
      () => resolve(null),
      { timeout: 7000, maximumAge: 60_000, enableHighAccuracy: false }
    );
  });
}

async function fallbackCentroide(user) {
  if (!user?.id_usuario) return null;
  try {
    const { data } = await getMisReportes({ limit: 5 });
    const reportes = data?.data?.reportes ?? [];
    const conCoord = reportes
      .map((r) => ({ lat: Number(r.latitud), lng: Number(r.longitud) }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    if (conCoord.length === 0) return null;
    const lat = conCoord.reduce((s, p) => s + p.lat, 0) / conCoord.length;
    const lng = conCoord.reduce((s, p) => s + p.lng, 0) / conCoord.length;
    return { lat, lng, fuente: 'fallback_reportes' };
  } catch {
    return null;
  }
}

/**
 * @param {object} options
 * @param {object|null} options.user usuario autenticado (puede ser null).
 * @param {boolean} options.enabled si false, no hace nada (toggle de Settings).
 */
export function useUbicacionUsuario({ user, enabled = true } = {}) {
  const [location, setLocation] = useState(() => leerCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (!enabled) return null;
    setLoading(true);
    setError(null);
    try {
      if (!force) {
        const cached = leerCache();
        if (cached) { setLocation(cached); return cached; }
      }

      const fromGeo = await pedirGeolocation();
      if (fromGeo) {
        guardarCache(fromGeo.lat, fromGeo.lng, fromGeo.fuente);
        setLocation(fromGeo);
        return fromGeo;
      }

      const fromUser = await fallbackCentroide(user);
      if (fromUser) {
        guardarCache(fromUser.lat, fromUser.lng, fromUser.fuente);
        setLocation(fromUser);
        return fromUser;
      }

      setError('No fue posible determinar tu ubicación.');
      setLocation(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, user]);

  // Carga automática la primera vez si está habilitado y no hay cache.
  useEffect(() => {
    if (!enabled) return;
    if (location) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const clear = useCallback(() => {
    borrarUbicacionGuardada();
    setLocation(null);
  }, []);

  return { location, loading, error, refresh, clear };
}
