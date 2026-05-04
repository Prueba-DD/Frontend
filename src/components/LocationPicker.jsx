import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode } from '../utils/geo';

const pickerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;
    background:#22c55e;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 10px #22c55e88;
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    },
  });
  return null;
}

function FlyToCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14, { animate: true });
  }, [center?.[0], center?.[1], map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

async function reverseGeocodeLocal(lat, lng) {
  return reverseGeocode(lat, lng);
}

export default function LocationPicker({ latitud, longitud, onChange, initialCenter }) {
  const [position, setPosition] = useState(() => {
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);
    return !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null;
  });
  const [geocoding, setGeocoding] = useState(false);

  const handlePick = useCallback(
    async (latlng) => {
      setPosition(latlng);
      setGeocoding(true);
      const { municipio, departamento } = await reverseGeocodeLocal(latlng.lat, latlng.lng);
      setGeocoding(false);
      onChange(latlng.lat, latlng.lng, municipio, departamento);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500">
        {geocoding
          ? <span className="text-green-400 animate-pulse">Obteniendo ubicación...</span>
          : position
          ? `Seleccionado: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
          : 'Haz clic en el mapa para fijar la ubicación exacta'}
      </p>
      <div className="h-56 sm:h-80 lg:h-[420px]" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
        <MapContainer
          center={initialCenter ?? [4.5709, -74.2973]}
          zoom={initialCenter ? 14 : 6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickHandler onPick={handlePick} />
          <FlyToCenter center={initialCenter} />
          {position && <Marker position={position} icon={pickerIcon} />}
        </MapContainer>
      </div>
    </div>
  );
}
