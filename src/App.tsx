import './App.css'
import { useLocation } from './hooks/use-location'
import { useEffect, useState } from 'react'
import generateTargetPoint from './api/random-coordinates'
import Map from './components/Map';
import { Marker, Popup, Polyline } from 'react-leaflet';
import { getDistanceInMeters } from './utils.ts/geo-match';
import History from './components/History';
import ResultModal from './components/ResultModal';
import type { ResultModalProps } from './components/ResultModal';
import type { HistoryRecord, TargetPoint } from './types';

function App() {
  const { coordinates, error, loading, refresh } = useLocation();
  const [distance, setDistance] = useState(1000);
  const [target, setTarget] = useState<TargetPoint | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [resultModalData, setResultModalData] = useState<Omit<ResultModalProps, 'onClose'> | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('history');
    if (savedHistory) {
      setTimeout(() => setHistory(JSON.parse(savedHistory)), 0);
    }
  }, []) // ПУСТОЙ массив зависимостей, чтобы сработало 1 раз при старте!

  const appendHistory = (status: 'Win' | 'Lost', dist: number, address?: string, timeTakenMs?: number, savedRoute?: [number, number][]) => {
    const newRecord: HistoryRecord = { distanceSet: dist, date: new Date().toISOString(), status, address, timeTakenMs, route: savedRoute };
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

    // Route tracking optimization: only add point if moved > 3 meters
    setRoute(prev => {
        const lastPoint = prev[prev.length - 1];
        if (!lastPoint) return [[coordinates.lat, coordinates.lng]];
        const distCurrentToLast = getDistanceInMeters(coordinates.lat, coordinates.lng, lastPoint[0], lastPoint[1]);
        if (distCurrentToLast > 3) {
            return [...prev, [coordinates.lat, coordinates.lng]];
        }
        return prev;
    });

    const dist = getDistanceInMeters(coordinates.lat, coordinates.lng, target.lat, target.lng);
    if (dist <= 10) {
       setTimeout(() => {
         const timeTakenMs = target.createdAt ? Date.now() - target.createdAt : undefined;
         appendHistory('Win', target.distanceSet, target.address, timeTakenMs, route);
         setResultModalData({ status: 'Win', distanceSet: target.distanceSet, timeTakenMs, route, address: target.address });
         setTarget(null);
         setRoute([]);
       }, 0);
       console.log("you win! Points reached within 10 meters.");
    }
  }, [coordinates, target]);

  const handleGenerate = async () => {
    if (!coordinates) return;
    const generated = generateTargetPoint(coordinates.lat, coordinates.lng, 0, distance);
    const newTarget = { ...generated, distanceSet: distance, address: 'Loading address...', createdAt: Date.now() };
    setTarget(newTarget);
    setRoute([[coordinates.lat, coordinates.lng]]); // start route tracking!

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
      {resultModalData && <ResultModal {...resultModalData} onClose={() => setResultModalData(null)} />}
      {isHistoryOpen && <History history={history} onClose={() => setIsHistoryOpen(false)} />}

      <button className="history-btn" onClick={() => setIsHistoryOpen(true)} title="View History">
        📋
      </button>

      <button className="location-btn" onClick={refresh} title="Update Geolocation">
        📍
      </button>

      <div className="map-layer">
        {coordinates ? (
          <Map coordinates={{ lat: coordinates.lat, lng: coordinates.lng }}>
            {route.length > 0 && (
              <Polyline positions={route} pathOptions={{ color: '#4285F4', weight: 6, opacity: 0.8 }} />
            )}
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
               const timeTakenMs = target.createdAt ? Date.now() - target.createdAt : undefined;
               appendHistory('Lost', target.distanceSet, target.address, timeTakenMs, route);
               setResultModalData({ status: 'Lost', distanceSet: target.distanceSet, timeTakenMs, route, address: target.address });
               setTarget(null);
               setRoute([]);
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
