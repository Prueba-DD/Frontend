/**
 * Utilidades de geolocalización compartidas.
 */

/**
 * Geocodificación inversa usando Nominatim (OpenStreetMap).
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ municipio: string, departamento: string }>}
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
      { headers: { 'Accept-Language': 'es' } }
    );
    const data = await res.json();
    const addr = data.address ?? {};
    const municipio    = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
    const departamento = addr.state || '';
    return { municipio, departamento };
  } catch {
    return { municipio: '', departamento: '' };
  }
}
