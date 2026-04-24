import { memo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { helpers } from '../constants/categorias';

const createIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:16px;height:16px;
      background:${color};
      border:2.5px solid rgba(255,255,255,0.9);
      border-radius:50%;
      box-shadow:0 0 8px ${color}bb;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  });

// FE-16: colores por ESTADO (no por severidad)
const estadoColors = {
  pendiente:   '#ef4444',
  en_revision: '#fb923c',
  en_proceso:  '#fb923c',
  verificado:  '#4ade80',
  resuelto:    '#4ade80',
  rechazado:   '#6b7280',
};

const estadoBadgeStyle = {
  pendiente:   { background: '#450a0a', color: '#fca5a5' },
  en_revision: { background: '#431407', color: '#fdba74' },
  en_proceso:  { background: '#431407', color: '#fdba74' },
  verificado:  { background: '#052e16', color: '#86efac' },
  resuelto:    { background: '#052e16', color: '#86efac' },
  rechazado:   { background: '#1f2937', color: '#9ca3af' },
};

const severityBadgeStyle = {
  critico: { background: '#4c0519', color: '#fda4af' },
  alto:    { background: '#450a0a', color: '#fca5a5' },
  medio:   { background: '#431407', color: '#fdba74' },
  bajo:    { background: '#052e16', color: '#86efac' },
};

const severityLabel = { bajo: 'Baja', medio: 'Media', alto: 'Alta', critico: 'Crítico' };

const estadoLabel = {
  pendiente: 'Pendiente', en_revision: 'En revisión', verificado: 'Verificado',
  en_proceso: 'En proceso', resuelto: 'Resuelto', rechazado: 'Rechazado',
};

function FitBounds({ points }) {
  const map = useMap();
  const hasFit = useRef(false);
  useEffect(() => {
    if (hasFit.current || points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [parseFloat(p.latitud), parseFloat(p.longitud)]));
    map.fitBounds(bounds, { padding: [60, 60] });
    hasFit.current = true;
  }, [points, map]);
  return null;
}

export default memo(function ReportsMap({ reports = [] }) {
  const navigate = useNavigate();
  const withCoords = reports.filter((r) => r.latitud && r.longitud);

  if (withCoords.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-900/60 rounded-xl border border-gray-800 gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-sm text-gray-500">No hay reportes con ubicación disponible</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[4.5709, -74.2973]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <FitBounds points={withCoords} />

      <MarkerClusterGroup chunkedLoading>
        {withCoords.map((r) => {
        const cfg       = helpers.obtenerConfig(r.tipo_contaminacion);
        const catColor  = cfg?.color ?? '#94a3b8';
        const markerColor = estadoColors[r.estado] ?? '#94a3b8';
        const estSt     = estadoBadgeStyle[r.estado] ?? { background: '#1f2937', color: '#9ca3af' };
        const svSt      = severityBadgeStyle[r.nivel_severidad] ?? { background: '#1f2937', color: '#9ca3af' };
        const lugar = [r.municipio, r.departamento].filter(Boolean).join(', ') || r.direccion || '';

        return (
          <Marker
            key={r.id_reporte}
            position={[parseFloat(r.latitud), parseFloat(r.longitud)]}
            icon={createIcon(markerColor)}
          >
            <Popup minWidth={220}>
              <div style={{ fontFamily: 'Inter, system-ui, sans-serif', minWidth: '210px' }}>

                {/* Category */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: catColor, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: catColor, fontWeight: 600 }}>
                    {cfg?.nombre ?? r.tipo_contaminacion}
                  </span>
                </div>

                {/* Title */}
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 6px', lineHeight: 1.35 }}>
                  {r.titulo}
                </p>

                {/* Photo */}
                {r.foto_url && (
                  <img
                    src={r.foto_url}
                    alt="Evidencia"
                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}

                {/* Location */}
                {lugar && (
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px' }}>
                    📍 {lugar}
                  </p>
                )}

                {/* Badges: estado (primario) + severidad (secundario) */}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{ ...estSt, padding: '2px 8px', borderRadius: 9999, fontSize: '11px', fontWeight: 600 }}>
                    {estadoLabel[r.estado] ?? r.estado}
                  </span>
                  <span style={{ ...svSt, padding: '2px 8px', borderRadius: 9999, fontSize: '11px' }}>
                    {severityLabel[r.nivel_severidad] ?? r.nivel_severidad}
                  </span>
                </div>

                {/* Date */}
                <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 10px' }}>
                  {new Date(r.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>

                {/* SPA-safe navigation */}
                <button
                  onClick={() => navigate(`/reports/${r.id_reporte}`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Ver reporte →
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
      </MarkerClusterGroup>
    </MapContainer>
  );
});
