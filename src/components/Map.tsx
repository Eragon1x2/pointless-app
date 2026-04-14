import { MapContainer, TileLayer, Marker, Popup, useMap, ScaleControl } from 'react-leaflet'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Исправление для иконок Leaflet при сборке Vite/Webpack
// @ts-expect-error Leaflet private API usage
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const UserLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="user-dot"></div><div class="user-pulse"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

function MapController({ userLoc, targetLoc }: { userLoc: {lat: number, lng: number}, targetLoc?: {lat: number, lng: number} | null }) {
  const map = useMap();
  const prevTarget = useRef(targetLoc);

  useEffect(() => {
    // Only pan when target changes
    if (targetLoc !== prevTarget.current) {
        if (targetLoc) {
            const bounds = L.latLngBounds([userLoc.lat, userLoc.lng], [targetLoc.lat, targetLoc.lng]);
            map.flyToBounds(bounds, { padding: [60, 60], duration: 1.5, maxZoom: 16 });
        } else {
            map.flyTo([userLoc.lat, userLoc.lng], 16, { duration: 1.5 });
        }
        prevTarget.current = targetLoc;
    }
  }, [targetLoc, map, userLoc.lat, userLoc.lng]); 

  return null;
}

export default function Map({coordinates, target, children}: {coordinates: {lat: number, lng: number}, target?: {lat: number, lng: number} | null, children: React.ReactNode}) {
  return (
    <MapContainer center={[coordinates.lat, coordinates.lng]} zoom={16} scrollWheelZoom={true} zoomControl={false}>
      <MapController userLoc={coordinates} targetLoc={target} />
      <TileLayer
        detectRetina={true}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Пользовательская точка как в Google Maps */}
      <Marker position={[coordinates.lat, coordinates.lng]} icon={UserLocationIcon}>
        <Popup>
          <strong>You are here</strong>
        </Popup>
      </Marker>

      {/* Остальные дочерние элементы карты (генерация точек) */}
      {children}
      <ScaleControl position="bottomleft" imperial={false} />
    </MapContainer>
  )
}
