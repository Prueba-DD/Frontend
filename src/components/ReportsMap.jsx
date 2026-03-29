import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

const severityColors = {
  critico: '#fb7185',
  alto:    '#ef4444',
  medio:   '#fb923c',
  bajo:    '#4ade80',
};

const severityStyle = {
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
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [parseFloat(p.latitud), parseFloat(p.longitud)]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [points, map]);
  return null;
}

export default function ReportsMap({ reports = [] }) {
  const withCoords = reports.filter((r) => r.latitud && r.longitud);

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

      {withCoords.map((r) => {
        const cfg   = helpers.obtenerConfig(r.tipo_contaminacion);
        const color = cfg?.color ?? severityColors[r.nivel_severidad] ?? '#94a3b8';
        const svSt  = severityStyle[r.nivel_severidad] ?? { background: '#1f2937', color: '#9ca3af' };
        const lugar = [r.municipio, r.departamento].filter(Boolean).join(', ') || r.direccion || '';

        return (
          <Marker
            key={r.id_reporte}
            position={[parseFloat(r.latitud), parseFloat(r.longitud)]}
            icon={createIcon(severityColors[r.nivel_severidad] || '#94a3b8')}
          >
            <Popup minWidth={220}>
              <div style={{ fontFamily: 'Inter, system-ui, sans-serif', minWidth: '210px' }}>

                {/* Category */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: color, fontWeight: 600 }}>
                    {cfg?.nombre ?? r.tipo_contaminacion}
                  </span>
                </div>

                {/* Title */}
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 6px', lineHeight: 1.35 }}>
                  {r.titulo}
                </p>

                {/* Location */}
                {lugar && (
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px' }}>
                    📍 {lugar}
                  </p>
                )}

                {/* Badges */}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{ ...svSt, padding: '2px 8px', borderRadius: 9999, fontSize: '11px', fontWeight: 600 }}>
                    {severityLabel[r.nivel_severidad] ?? r.nivel_severidad}
                  </span>
                  {r.estado && (
                    <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 9999, fontSize: '11px' }}>
                      {estadoLabel[r.estado] ?? r.estado}
                    </span>
                  )}
                </div>

                {/* Date */}
                <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 10px' }}>
                  {new Date(r.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>

                {/* Link */}
                <a
                  href={`/reports/${r.id_reporte}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}
                >
                  Ver reporte →
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
