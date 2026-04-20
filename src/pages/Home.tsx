import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import History from '../components/History';
import type { HistoryRecord } from '../types';
import '../App.css'; // Leverage existing global styles

export default function Home() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Read history dynamically when the modal opens
  useEffect(() => {
    if (isHistoryOpen) {
      const savedHistory = localStorage.getItem('history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    }
  }, [isHistoryOpen]);

  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {isHistoryOpen && <History history={history} onClose={() => setIsHistoryOpen(false)} />}
      
      <div className="ui-panel" style={{ textAlign: 'center', width: '90%', maxWidth: '500px', padding: '48px 32px', borderRadius: '32px', boxShadow: '0 12px 36px rgba(0,0,0,0.1)' }}>
        <h1 className="home-title">Pointless</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '48px', fontSize: '20px', fontWeight: '500' }}>Wander aimlessly.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Link to="/game" style={{ textDecoration: 'none' }}>
            <button className="gamified-btn" style={{ width: '100%', padding: '24px', fontSize: '24px', borderRadius: '20px' }}>
              RANDOM MODE
            </button>
          </Link>

          <Link to="/custom-game" style={{ textDecoration: 'none' }}>
            <button className="gamified-btn" style={{ width: '100%', padding: '24px', fontSize: '24px', borderRadius: '20px', background: '#e08a3d', boxShadow: '0 8px 0 #b36322' }}>
               CUSTOM MODE
            </button>
          </Link>
          
          <button 
            className="gamified-btn"
            style={{ 
              background: 'var(--surface-alt)', 
              color: 'var(--text)', 
              border: '2px solid var(--border)',
              padding: '20px',
              fontSize: '20px',
              borderRadius: '20px'
            }}
            onClick={() => setIsHistoryOpen(true)}
          >
            HISTORY
          </button>
        </div>
      </div>
    </div>
  );
}
