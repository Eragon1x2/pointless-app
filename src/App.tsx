import './App.css'
import { useLocation } from './hooks/use-location'
import { useEffect, useState } from 'react'
import generateTargetPoint from './api/random-coordinates'
import Map from './components/Map';

function App() {
  const { coordinates, error, loading } = useLocation();
  const [distance, setDistance] = useState(0);
  const [target, setTarget] = useState<{ lat: number; lng: number; distanceSet: number } | null>(null);

  useEffect(() => {
    if (coordinates) {
      setTarget({ lat: coordinates.lat, lng: coordinates.lng, distanceSet: 0 });
    }
  }, [coordinates])
  return (
    <>
      {loading && <p>Loading location...</p>}
      {error && <p>Error: {error}</p>}
      {coordinates && (
        <p>
          Latitude: {coordinates.lat}, Longitude: {coordinates.lng}
        </p>
      )}
      <input type="range" min="0" max="10000" value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
      <button disabled={!coordinates} onClick={() => { if (coordinates) setTarget(generateTargetPoint(coordinates.lat, coordinates.lng, 0, distance)); }}>Generate</button>
      {target && (
        <Map coordinates={{ lat: target.lat, lng: target.lng }} />
      )}
  </>
  )

}

export default App
