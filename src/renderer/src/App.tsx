import React, { useState, useEffect } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  const [isBridgeReady, setIsBridgeReady] = useState(false);

  useEffect(() => {
    // Check if the preload script successfully injected the secure bridge
    if (window.electronAPI) {
      setIsBridgeReady(true);
    }
  }, []);

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      padding: '2rem', 
      background: '#121212', 
      color: '#ffffff', 
      minHeight: '100vh' 
    }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, color: '#4CAF50' }}>StreamMind Baseline Verification</h1>
        <p style={{ color: '#888', margin: '0.5rem 0 0 0' }}>Testing Vite + React + Electron Pipeline</p>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Environment Status Block */}
        <section style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0 }}>System Bridge Status</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: isBridgeReady ? '#4CAF50' : '#F44336',
              display: 'inline-block'
            }} />
            <span>
              {isBridgeReady 
                ? 'Electron IPC Bridge Securely Initialized' 
                : 'Bridge Offline (Are you running inside Electron or a standard browser tab?)'}
            </span>
          </div>
        </section>

        {/* HMR Test Block */}
        <section style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0 }}>Hot Module Replacement (HMR) Test</h2>
          <p>Click the counter, then modify any text in <code>App.tsx</code> and save. The count should persist while the UI updates instantly.</p>
          <button 
            onClick={() => setCount(prev => prev + 1)}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Local State Count: {count}
          </button>
        </section>
      </main>
    </div>
  );
}