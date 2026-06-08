import { useState, useEffect } from 'react';
import { Box, RefreshCw, Play, Activity } from 'lucide-react';
import LogViewer from './LogViewer';

export default function App() {
  const [isBridgeReady, setIsBridgeReady] = useState(false);
  const [containers, setContainers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which container is currently being viewed
  const [activeContainer, setActiveContainer] = useState<string | null>(null);

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
      setIsLoading(false);
    }
  };

  if (activeContainer) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-50 flex flex-col">
        <LogViewer 
          containerName={activeContainer} 
          onClose={() => setActiveContainer(null)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header - Glassmorphism */}
        <header className="sticky top-4 z-10 backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              <Box className="w-8 h-8 text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 m-0 tracking-tight">
                StreamMind
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`relative flex h-2.5 w-2.5`}>
                  {isBridgeReady && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isBridgeReady ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                <span className="text-sm text-slate-400 font-medium">
                  {isBridgeReady ? 'System Bridge Active' : 'Bridge Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={fetchContainers}
            disabled={isLoading || !isBridgeReady}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Scanning...' : 'Refresh'}
          </button>
        </header>

        <main>
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
              <Activity className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-200 m-0">
                Active Docker Containers
              </h2>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3">
                <div className="mt-0.5">⚠️</div>
                <div>
                  <strong className="block font-semibold mb-1">Connection Error</strong>
                  {error}
                </div>
              </div>
            )}

            {!isLoading && !error && containers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                <Box className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium text-lg">No active containers found</p>
                <p className="text-sm mt-1">Ensure Docker is running and try refreshing.</p>
              </div>
            )}

            {!error && containers.length > 0 && (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
                {containers.map((name) => (
                  <li 
                    key={name} 
                    className="group bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-sky-500/30 p-4 rounded-xl flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/5"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="font-medium text-slate-200 truncate pr-4">{name}</span>
                    </div>

                    <button 
                      onClick={() => setActiveContainer(name)}
                      className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-2 rounded-lg font-semibold transition-all duration-200 active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      Stream
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}