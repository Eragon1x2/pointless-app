import '../App.css';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Marker, Popup, Polyline } from 'react-leaflet';
import { getDistanceInMeters } from '../utils.ts/geo-match';
import { useLocation } from '../hooks/use-location';
import { useGameLoop } from '../hooks/use-game-loop';
import { useGameStore } from '../store/gameStore';
import Map from '../components/Map';
import History from '../components/History';
import ResultModal from '../components/ResultModal';
import MapClickHandler from '../components/MapClickHandler';
import type { TargetPoint } from '../types';

export default function CustomGame() {
  const { coordinates, accuracy, error, loading, refresh } = useLocation();

  const target         = useGameStore((s) => s.target);
  const route          = useGameStore((s) => s.route);
  const history        = useGameStore((s) => s.history);
  const isHistoryOpen  = useGameStore((s) => s.isHistoryOpen);
  const resultModalData = useGameStore((s) => s.resultModalData);
  const setTarget      = useGameStore((s) => s.setTarget);
  const setRoute       = useGameStore((s) => s.setRoute);
  const loadHistory    = useGameStore((s) => s.loadHistory);
  const setIsHistoryOpen   = useGameStore((s) => s.setIsHistoryOpen);
  const setResultModalData  = useGameStore((s) => s.setResultModalData);
  const giveUp         = useGameStore((s) => s.giveUp);

  useGameLoop({ coordinates, accuracy });

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleMapClick = async (lat: number, lng: number) => {
    if (!coordinates) return;

    const distanceToTarget = Math.round(
      getDistanceInMeters(coordinates.lat, coordinates.lng, lat, lng)
    );

    const newTarget: TargetPoint = {
      lat,
      lng,
      distanceSet: distanceToTarget,
      address: 'Loading address...',
      createdAt: Date.now(),
    };

    setTarget(newTarget);
    setRoute([[coordinates.lat, coordinates.lng]]);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        setTarget({ ...newTarget, address: data.display_name || 'Custom Location' });
      } else {
        setTarget({ ...newTarget, address: 'Address unavailable' });
      }
    } catch (_) {
      setTarget({ ...newTarget, address: 'Address unavailable' });
    }
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
            {!target && <MapClickHandler onMapClick={handleMapClick} />}
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
          <h1 className="title">Custom Mode</h1>
          {!target ? (
            <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '18px', color: 'var(--text-muted)' }}>
              Tap anywhere on the map to place your target destination.
            </div>
          ) : (
            <button
              className="gamified-btn"
              style={{ background: 'var(--error)', color: 'white', border: 'none', boxShadow: 'none' }}
              onClick={giveUp}
            >
              Give Up
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
