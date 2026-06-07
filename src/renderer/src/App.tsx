import React, { useState, useEffect } from 'react';

export default function App() {
  const [isBridgeReady, setIsBridgeReady] = useState(false);
  const [containers, setContainers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.electronAPI) {
      setIsBridgeReady(true);
      fetchContainers();
    }
  }, []);

  const fetchContainers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await window.electronAPI.getContainers();
      setContainers(list);
    } catch (err: any) {
      console.error("Frontend fetch error:", err);
      setError(err.message || "Failed to communicate with Docker Daemon.");
    } finally {
      console.log("Fetch attempt completed.");
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      padding: '2rem', 
      background: '#121212', 
      color: '#ffffff', 
      minHeight: '100vh',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#4CAF50' }}>StreamMind</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: isBridgeReady ? '#4CAF50' : '#F44336'
            }} />
            <span style={{ color: '#888', fontSize: '0.9rem' }}>
              {isBridgeReady ? 'System Bridge Active' : 'Bridge Offline'}
            </span>
          </div>
        </div>
        <button 
          onClick={fetchContainers}
          disabled={isLoading || !isBridgeReady}
          style={{
            background: '#333', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: isLoading ? 'wait' : 'pointer'
          }}
        >
          {isLoading ? 'Scanning...' : 'Refresh Containers'}
        </button>
      </header>

      <main>
        <section style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
            Active Docker Containers
          </h2>

          {error && (
            <div style={{ background: '#3a1c1c', color: '#ff6b6b', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {!isLoading && !error && containers.length === 0 && (
            <div style={{ color: '#888', fontStyle: 'italic', padding: '1rem 0' }}>
              No running containers found. Ensure Docker is running and you have active containers.
            </div>
          )}

          {!error && containers.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {containers.map((name) => (
                <li key={name} style={{ 
                  background: '#2a2a2a', padding: '1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '1rem' 
                }}>
                  <span style={{ color: '#4CAF50' }}>▶</span>
                  <span style={{ fontWeight: '500', letterSpacing: '0.5px' }}>{name}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}