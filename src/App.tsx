import './App.css'
import { useLocation } from './hooks/use-location'
import { useEffect, useState } from 'react'
import generateTargetPoint from './api/random-coordinates'
import Map from './components/Map';
import { Marker, Popup } from 'react-leaflet';
import { getDistanceInMeters } from './utils.ts/geo-match';
import History from './components/History';
import type { HistoryRecord, TargetPoint } from './types';

function App() {
  const { coordinates, error, loading } = useLocation();
  const [distance, setDistance] = useState(1000);
  const [target, setTarget] = useState<TargetPoint | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('history');
    if (savedHistory) {
      setTimeout(() => setHistory(JSON.parse(savedHistory)), 0);
    }
  }, []) // ПУСТОЙ массив зависимостей, чтобы сработало 1 раз при старте!

  const appendHistory = (status: 'Win' | 'Lost', dist: number, address?: string) => {
    const newRecord: HistoryRecord = { distanceSet: dist, date: new Date().toISOString(), status, address };
    setHistory(prevHistory => {
      const newHistory = [...prevHistory, newRecord];
      localStorage.setItem('history', JSON.stringify(newHistory));
      return newHistory;
    });
  }

  useEffect(() => {
    if (!target || !coordinates) return;

    // Ждем пока адрес загрузится с API, чтобы в историю не попало 'Loading address...'
    // при моментальном совпадении координат!
    if (target.address === 'Loading address...') return;

    const dist = getDistanceInMeters(coordinates.lat, coordinates.lng, target.lat, target.lng);
    if (dist <= 10) {
       setTimeout(() => {
         appendHistory('Win', target.distanceSet, target.address);
         setTarget(null);
       }, 0);
       console.log("you win! Points reached within 10 meters.");
    }
  }, [coordinates, target])

  const handleGenerate = async () => {
    if (!coordinates) return;
    const generated = generateTargetPoint(coordinates.lat, coordinates.lng, 0, distance);
    const newTarget = { ...generated, distanceSet: distance, address: 'Loading address...' };
    setTarget(newTarget);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${generated.lat}&lon=${generated.lng}&format=json`);
      if (res.ok) {
        const data = await res.json();
        const address = data.display_name || 'Unknown Location';
        setTarget(prev => prev ? { ...prev, address } : null);
      } else {
        setTarget(prev => prev ? { ...prev, address: 'Address unavailable' } : null);
      }
    } catch (e) {
      setTarget(prev => prev ? { ...prev, address: 'Address unavailable' } : null);
    }
  };

  return (
    <div className="app-container">
      {isHistoryOpen && <History history={history} onClose={() => setIsHistoryOpen(false)} />}

      <button className="history-btn" onClick={() => setIsHistoryOpen(true)} title="View History">
        📋
      </button>

      <div className="map-layer">
        {coordinates ? (
          <Map coordinates={{ lat: coordinates.lat, lng: coordinates.lng }}>
            {target && (
              <Marker position={[target.lat, target.lng]}>
                <Popup>
                  <strong>Target Point</strong><br/>
                  Distance: {target.distanceSet}m<br/>
                  {target.address && <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>{target.address}</span>}
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
        {!target ? (
            <button
            className="gamified-btn"
            disabled={!coordinates || distance <= 0}
            onClick={handleGenerate}
          >
            GENERATE
          </button>
        ) : (
          <button className="gamified-btn" style={{ background: 'var(--error)', color: 'white', border: 'none', boxShadow: 'none' }} onClick={() => {
               appendHistory('Lost', target.distanceSet, target.address);
               setTarget(null);
          }}>
          Give Up
          </button>
        )}
        </div>
      </div>
    </div>
  )
}

export default App
