import { getDistanceInMeters } from '../utils.ts/geo-match';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
}

function calculateRouteLength(route: [number, number][]) {
   if (!route || route.length < 2) return 0;
   let len = 0;
   for (let i = 1; i < route.length; i++) {
      len += getDistanceInMeters(route[i-1][0], route[i-1][1], route[i][0], route[i][1]);
   }
   return Math.round(len);
}

export interface ResultModalProps {
  status: 'Win' | 'Lost' | 'Tech Lost';
  distanceSet: number;
  timeTakenMs?: number;
  route?: [number, number][];
  address?: string;
  onClose: () => void;
}

export default function ResultModal({ status, distanceSet, timeTakenMs, route, address, onClose }: ResultModalProps) {
    const isWin = status === 'Win';
    const isTechLost = status === 'Tech Lost';
    const routeLength = calculateRouteLength(route || []);
    
    const titleText = isWin ? 'You Won! 🎉' : isTechLost ? 'Tech Loss (Unreachable) 🛑' : 'You Gave Up 🏳️';
    const titleColor = isWin ? 'var(--primary-active)' : isTechLost ? 'orange' : 'var(--error)';

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '32px' }}>
                <h1 style={{ fontSize: '32px', margin: '0 0 16px 0', color: titleColor }}>
                    {titleText}
                </h1>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '18px', color: 'var(--text)' }}>
                    <div><strong>Target Distance:</strong> {distanceSet}m</div>
                    {address && <div><strong>Destination:</strong> {address}</div>}
                    
                    <hr style={{ width: '100%', borderColor: 'var(--border)', opacity: 0.5, margin: '8px 0' }} />
                    
                    {timeTakenMs !== undefined && (
                      <div><strong>Time elapsed:</strong> {formatTime(timeTakenMs)}</div>
                    )}
                    {route && route.length > 0 && (
                      <div><strong>Distance traveled:</strong> {routeLength}m</div>
                    )}
                    {route && route.length > 0 && (
                      <div><strong>Points recorded:</strong> {route.length}</div>
                    )}
                </div>

                <button 
                  className="gamified-btn" 
                  style={{ marginTop: '24px', width: '100%' }}
                  onClick={onClose}
                >
                  Close
                </button>
            </div>
        </div>
    )
}
