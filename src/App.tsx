import './App.css'
import { useLocation } from './hooks/use-location'
import { useEffect, useState } from 'react'
import generateTargetPoint from './api/random-coordinates'
import Map from './components/Map';
import { Marker, Popup } from 'react-leaflet';
import { getDistanceInMeters } from './utils.ts/geo-match';

function App() {
  const { coordinates, error, loading } = useLocation();
  const [distance, setDistance] = useState(1000);
  const [target, setTarget] = useState<{ lat: number; lng: number; distanceSet: number } | null>(null);

  useEffect(() => {
    if (!target || !coordinates) return;

    // Считаем метры по формуле гаверсинуса (расстояние на сфере)
   const distance = getDistanceInMeters(coordinates.lat, coordinates.lng, target.lat, target.lng);
    if (distance <= 10) {
      console.log("you win! Points reached within 10 meters.");
      // Тут можно вызывать состояние победы, модалку и т.д.
    }
  }, [coordinates, target])

  return (
    <div className="app-container">
      <div className="map-layer">
        {coordinates ? (
          <Map coordinates={{ lat: coordinates.lat, lng: coordinates.lng }}>
            {target && (
              <Marker position={[target.lat, target.lng]}>
                <Popup>
                  <strong>Target Point</strong><br/>
                  Distance: {target.distanceSet}m
                </Popup>
              </Marker>
            )}
          </Map>
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#e0e5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#53594d', fontWeight: 'bold' }}>Loading GPS...</p>
          </div>
        )}
      </div>

      <div className="ui-layer">
        {loading && <div className="status-badge loading">GPS: Locating...</div>}
        {error && <div className="status-badge error">GPS Error: {error}</div>}
        {coordinates && !loading && !error && <div className="status-badge success">GPS: Locked</div>}

        <div className="ui-panel">
          <h1 className="title">Pointless</h1>
          <div className="input-group">
            <label className="input-label">Distance (meters)</label>
            <input
              type="number"
              className="gamified-input"
              min="0"
              max="10000"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
            />
          </div>
          <button
            className="gamified-btn"
            disabled={!coordinates || distance <= 0}
            onClick={() => {
              if (coordinates) {
                setTarget(Object.assign(generateTargetPoint(coordinates.lat, coordinates.lng, 0, distance), {distanceSet: distance}));
              }
            }}
          >
            GENERATE
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
