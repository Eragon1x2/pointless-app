import '../App.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Marker, Popup, Polyline, Circle } from 'react-leaflet';
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

  // "Preview" point — user picked but hasn't confirmed yet
  const [pendingTarget, setPendingTarget] = useState<{ lat: number; lng: number; distanceSet: number; address: string } | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const target          = useGameStore((s) => s.target);
  const route           = useGameStore((s) => s.route);
  const history         = useGameStore((s) => s.history);
  const isHistoryOpen   = useGameStore((s) => s.isHistoryOpen);
  const resultModalData = useGameStore((s) => s.resultModalData);
  const setTarget       = useGameStore((s) => s.setTarget);
  const setRoute        = useGameStore((s) => s.setRoute);
  const loadHistory     = useGameStore((s) => s.loadHistory);
  const setIsHistoryOpen    = useGameStore((s) => s.setIsHistoryOpen);
  const setResultModalData  = useGameStore((s) => s.setResultModalData);
  const giveUp          = useGameStore((s) => s.giveUp);

  // Route tracking + win detection only active after game is confirmed
  useGameLoop({ coordinates, accuracy });

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Tap on map → update preview point (can tap multiple times)
  const handleMapClick = async (lat: number, lng: number) => {
    if (!coordinates || target) return; // don't allow repositioning once game started

    const distanceSet = Math.round(getDistanceInMeters(coordinates.lat, coordinates.lng, lat, lng));
    setPendingTarget({ lat, lng, distanceSet, address: 'Loading address...' });
    setIsLoadingAddress(true);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      if (res.ok) {
        const data = await res.json();
        setPendingTarget({ lat, lng, distanceSet, address: data.display_name || 'Custom Location' });
      } else {
        setPendingTarget({ lat, lng, distanceSet, address: 'Address unavailable' });
      }
    } catch (_) {
      setPendingTarget({ lat, lng, distanceSet, address: 'Address unavailable' });
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Confirm → move pendingTarget into the game store and start tracking
  const handleConfirm = () => {
    if (!pendingTarget || !coordinates) return;

    const newTarget: TargetPoint = {
      ...pendingTarget,
      createdAt: Date.now(),
    };

    setTarget(newTarget);
    setRoute([[coordinates.lat, coordinates.lng]]);
    setPendingTarget(null);
  };

  // Cancel preview
  const handleCancelPending = () => {
    setPendingTarget(null);
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
          <Map coordinates={coordinates} target={target ?? (pendingTarget as any)}>
            {/* Allow tapping only before the game starts */}
            {!target && <MapClickHandler onMapClick={handleMapClick} />}

            {/* Active route line */}
            {route.length > 0 && (
              <Polyline positions={route} pathOptions={{ color: '#4285F4', weight: 6, opacity: 0.8 }} />
            )}

            {/* Preview marker (dashed circle style) */}
            {!target && pendingTarget && (
              <>
                <Circle
                  center={[pendingTarget.lat, pendingTarget.lng]}
                  radius={15}
                  pathOptions={{ color: '#e08a3d', fillColor: '#e08a3d', fillOpacity: 0.3, dashArray: '6 4' }}
                />
                <Marker position={[pendingTarget.lat, pendingTarget.lng]}>
                  <Popup>
                    <strong>Preview Point</strong><br />
                    {pendingTarget.distanceSet}m away<br />
                    <span style={{ fontSize: '12px', color: '#888' }}>{pendingTarget.address}</span>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Confirmed active marker */}
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

          {/* Phase 1: no target yet, no preview → hint */}
          {!target && !pendingTarget && (
            <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '18px', color: 'var(--text-muted)' }}>
              Tap anywhere on the map to place your destination.
            </div>
          )}

          {/* Phase 2: preview selected, waiting for confirmation */}
          {!target && pendingTarget && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
                {isLoadingAddress ? '🔍 Loading address...' : `📍 ${pendingTarget.distanceSet}m away`}
              </div>
              <button className="gamified-btn" onClick={handleConfirm} disabled={isLoadingAddress}>
                START HERE
              </button>
              <button
                className="gamified-btn"
                style={{ background: 'var(--surface-alt)', color: 'var(--text)', border: '2px solid var(--border)', boxShadow: 'none' }}
                onClick={handleCancelPending}
              >
                Change Point
              </button>
            </div>
          )}

          {/* Phase 3: game in progress */}
          {target && (
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
