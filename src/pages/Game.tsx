import '../App.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Marker, Popup, Polyline } from 'react-leaflet';
import { isBadLocation } from '../utils.ts/location-filter';
import generateTargetPoint from '../api/random-coordinates';
import { useLocation } from '../hooks/use-location';
import { useGameLoop } from '../hooks/use-game-loop';
import { useGameStore } from '../store/gameStore';
import Map from '../components/Map';
import History from '../components/History';
import ResultModal from '../components/ResultModal';

export default function Game() {
  const { coordinates, accuracy, error, loading, refresh } = useLocation();
  const [distance, setDistance] = useState(1000);
  const [isGenerating, setIsGenerating] = useState(false);

  const target        = useGameStore((s) => s.target);
  const route         = useGameStore((s) => s.route);
  const history       = useGameStore((s) => s.history);
  const isHistoryOpen = useGameStore((s) => s.isHistoryOpen);
  const resultModalData = useGameStore((s) => s.resultModalData);
  const setTarget     = useGameStore((s) => s.setTarget);
  const setRoute      = useGameStore((s) => s.setRoute);
  const loadHistory   = useGameStore((s) => s.loadHistory);
  const setIsHistoryOpen  = useGameStore((s) => s.setIsHistoryOpen);
  const setResultModalData = useGameStore((s) => s.setResultModalData);
  const giveUp        = useGameStore((s) => s.giveUp);

  // Shared route-tracking + win detection
  useGameLoop({ coordinates, accuracy });

  useEffect(() => { loadHistory(); }, [loadHistory]);

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
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${generated.lat}&lon=${generated.lng}&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          if (!isBadLocation(data)) {
            finalAddress = data.display_name || 'Unknown Location';
            finalTargetData = generated;
            break;
          }
        }
      } catch (_) { /* ignore */ }
      finalTargetData = generated;
    }

    if (attempts >= 5) {
      unreachable = true;
      finalAddress = 'Warning: Point might be unreachable (Failed 5 checks)';
    }

    if (finalTargetData) {
      setTarget({ ...finalTargetData, address: finalAddress, createdAt: Date.now(), unreachable });
      setRoute([[coordinates.lat, coordinates.lng]]);
    }

    setIsGenerating(false);
  };

  return (
    <div className="app-container">
      {resultModalData && (
        <ResultModal {...resultModalData} onClose={() => setResultModalData(null)} />
      )}
      {isHistoryOpen && (
        <History history={history} onClose={() => setIsHistoryOpen(false)} />
      )}

      <Link
        to="/"
        className="history-btn"
        style={{ right: '70px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title="Main Menu"
      >🏠</Link>

      <button className="history-btn" onClick={() => setIsHistoryOpen(true)} title="View History">📋</button>
      <button className="location-btn" onClick={refresh} title="Update Geolocation">📍</button>

      <div className="map-layer">
        {coordinates ? (
          <Map coordinates={coordinates} target={target}>
            {route.length > 0 && (
              <Polyline positions={route} pathOptions={{ color: '#4285F4', weight: 6, opacity: 0.8 }} />
            )}
            {target && (
              <Marker position={[target.lat, target.lng]}>
                <Popup>
                  <strong>Target Point</strong><br />
                  Distance: {target.distanceSet}m<br />
                  {target.address && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{target.address}</span>}
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
            GPS: {accuracy && accuracy > 100
              ? `Weak Signal (±${Math.round(accuracy)}m)`
              : `Locked (±${Math.round(accuracy || 0)}m)`}
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
              title={accuracy && accuracy > 100 ? 'Wait for better GPS signal' : ''}
            >
              {accuracy !== null && accuracy > 100 ? 'WEAK GPS' : isGenerating ? 'GENERATING...' : 'GENERATE'}
            </button>
          ) : (
            <button
              className="gamified-btn"
              style={{ background: target.unreachable ? 'orange' : 'var(--error)', color: 'white', border: 'none', boxShadow: 'none' }}
              onClick={giveUp}
            >
              {target.unreachable ? 'Cancel (Unreachable)' : 'Give Up'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
