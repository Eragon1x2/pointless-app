import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
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

export default function Map({coordinates, children}: {coordinates: {lat: number, lng: number}, children: React.ReactNode}) {
  return (
    <MapContainer center={[coordinates.lat, coordinates.lng]} zoom={15} scrollWheelZoom={true} zoomControl={false}>
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
    </MapContainer>
  )
}
