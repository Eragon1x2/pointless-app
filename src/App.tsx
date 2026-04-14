import './App.css'
import { useLocation } from './hooks/use-location'
import { useEffect, useState } from 'react'
import generateTargetPoint from './api/random-coordinates'
import Map from './components/Map';
import { Marker, Popup, Polyline } from 'react-leaflet';
import { getDistanceInMeters } from './utils.ts/geo-match';
import History from './components/History';
import ResultModal from './components/ResultModal';
import { isBadLocation } from './utils.ts/location-filter';
import type { ResultModalProps } from './components/ResultModal';
import type { HistoryRecord, TargetPoint } from './types';

function App() {
  const { coordinates, accuracy, error, loading, refresh } = useLocation();
  const [distance, setDistance] = useState(1000);
  const [target, setTarget] = useState<TargetPoint | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultModalData, setResultModalData] = useState<Omit<ResultModalProps, 'onClose'> | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('history');
    if (savedHistory) {
      setTimeout(() => setHistory(JSON.parse(savedHistory)), 0);
    }
  }, []) // ПУСТОЙ массив зависимостей, чтобы сработало 1 раз при старте!

  const appendHistory = (status: 'Win' | 'Lost' | 'Tech Lost', dist: number, address?: string, timeTakenMs?: number, savedRoute?: [number, number][]) => {
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

    // Ignore GPS bounces: don't track points with bad accuracy
    if (accuracy && accuracy > 25) return;

    // Route tracking optimization: only add point if moved > 10 meters to smooth the line
    setRoute(prev => {
        const lastPoint = prev[prev.length - 1];
        if (!lastPoint) return [[coordinates.lat, coordinates.lng]];
        const distCurrentToLast = getDistanceInMeters(coordinates.lat, coordinates.lng, lastPoint[0], lastPoint[1]);
        if (distCurrentToLast > 10) {
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
    setIsGenerating(true);
    
    let attempts = 0;
    let finalTargetData = null;
    let finalAddress = 'Unknown Location';
    let unreachable = false;

    while (attempts < 5) {
        attempts++;
        const generated = generateTargetPoint(coordinates.lat, coordinates.lng, 0, distance);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${generated.lat}&lon=${generated.lng}&format=json`);
            if (res.ok) {
                const data = await res.json();
                if (!isBadLocation(data)) {
                    finalAddress = data.display_name || 'Unknown Location';
                    finalTargetData = generated;
                    break;
                }
            }
        } catch(e) {}
        finalTargetData = generated; // Remember last one if all fail
    }

    if (attempts >= 5) {
        unreachable = true;
        finalAddress = "Warning: Point might be unreachable (Failed 5 checks)";
    }

    if (finalTargetData) {
        const newTarget = { ...finalTargetData, address: finalAddress, createdAt: Date.now(), unreachable };
        setTarget(newTarget);
        setRoute([[coordinates.lat, coordinates.lng]]);
    }
    
    setIsGenerating(false);
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
          <Map coordinates={{ lat: coordinates.lat, lng: coordinates.lng }} target={target}>
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
        {coordinates && !loading && !error && (
            <div className={`status-badge ${accuracy && accuracy > 100 ? 'error' : 'success'}`}>
                GPS: {accuracy && accuracy > 100 ? `Weak Signal (±${Math.round(accuracy)}m)` : `Locked (±${Math.round(accuracy || 0)}m)`}
            </div>
        )}

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
            disabled={!coordinates || distance <= 0 || (accuracy !== null && accuracy > 100) || isGenerating}
            onClick={handleGenerate}
            title={accuracy && accuracy > 100 ? "Wait for better GPS signal" : ""}
          >
            {accuracy !== null && accuracy > 100 ? "WEAK GPS" : isGenerating ? "GENERATING..." : "GENERATE"}
          </button>
        ) : (
          <button className="gamified-btn" style={{ background: target.unreachable ? 'orange' : 'var(--error)', color: 'white', border: 'none', boxShadow: 'none' }} onClick={() => {
               const timeTakenMs = target.createdAt ? Date.now() - target.createdAt : undefined;
               const status = target.unreachable ? 'Tech Lost' : 'Lost';
               appendHistory(status, target.distanceSet, target.address, timeTakenMs, route);
               setResultModalData({ status, distanceSet: target.distanceSet, timeTakenMs, route, address: target.address });
               setTarget(null);
               setRoute([]);
          }}>
          {target.unreachable ? 'Cancel (Unreachable)' : 'Give Up'}
          </button>
        )}
        </div>
      </div>
    </div>
  )
}

export default App
