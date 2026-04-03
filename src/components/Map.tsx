import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function  Map({coordinates, children}: {coordinates: {lat: number, lng: number}, children: React.ReactNode}) {
     return (
     <MapContainer center={[coordinates.lat, coordinates.lng]} className='map' zoom={13} scrollWheelZoom={false}>
               <TileLayer
                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
               />
               <Marker position={[coordinates.lat, coordinates.lng]}>
                 <Popup>
                   A pretty CSS3 popup. <br /> Easily customizable.
                 </Popup>
               </Marker>
               {children}
             </MapContainer>
             )
}
