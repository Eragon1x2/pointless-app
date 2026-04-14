import type { HistoryRecord } from '../types';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
}

export default function History({history, onClose}: {history: HistoryRecord[], onClose: () => void}) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="title" style={{ fontSize: '20px', margin: 0, color: 'var(--text)' }}>History</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                
                {history.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No trips recorded yet.
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: '16px', margin: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {history.slice().reverse().map((item, index) => (
                          <li key={index} style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--surface-alt)', fontSize: '16px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>📍 {item.distanceSet}m</span>
                                <span style={{ 
                                  color: item.status === 'Win' 
                                    ? 'var(--primary-active)' 
                                    : item.status === 'Tech Lost' 
                                      ? 'orange' 
                                      : 'var(--error)' 
                                }}>
                                  {item.status}
                                </span>
                              </div>
                              {item.timeTakenMs !== undefined && (
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                                  ⏱️ {formatTime(item.timeTakenMs)}
                                </span>
                              )}
                              {item.address && (
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                                  🗺️ {item.address}
                                </span>
                              )}
                          </li>
                      ))}
                  </ul>
                )}
            </div>
        </div>
    )
}
