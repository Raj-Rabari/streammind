import React, { useState, useEffect, useRef } from 'react';
import { List, ListImperativeAPI } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { X, ArrowDownCircle, TerminalSquare } from 'lucide-react';
import type { LogMessage } from '../../shared/types';
import AiAnalyzer from './AiAnalyzer';

interface LogViewerProps {
  containerName: string;
  onClose: () => void;
}

const MAX_LOG_LINES = 10000; // The Ring Buffer Cap

// High-performance render function for each recycled row
const Row = ({ index, style, ariaAttributes, logs }: { index: number, style: React.CSSProperties, ariaAttributes: any, logs: LogMessage[] }) => {
  const log = logs[index];
  const isError = log.level === 'error';

  return (
    <div 
      {...ariaAttributes} 
      style={style}
      className={`flex items-center gap-4 px-6 border-b border-slate-800/40 font-mono text-sm whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${
        isError ? 'bg-red-950/20 text-red-400' : 'bg-transparent text-slate-300 hover:bg-slate-800/20'
      }`}
    >
      <span className="text-slate-500 min-w-[100px] tabular-nums shrink-0 text-xs">
        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className={`${isError ? 'font-semibold' : 'font-normal'} truncate`}>
        {log.message}
      </span>
    </div>
  );
};

export default function LogViewer({ containerName, onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const listRef = useRef<ListImperativeAPI>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    // 1. Tell the backend to start streaming
    window.electronAPI.startMonitoring(containerName);

    // 2. Subscribe to the batched log chunks
    const unsubscribeStream = window.electronAPI.onLogStream((newBatch) => {
      setLogs((prevLogs) => {
        // Implement the Ring Buffer logic
        const combined = [...prevLogs, ...newBatch];
        if (combined.length > MAX_LOG_LINES) {
          return combined.slice(combined.length - MAX_LOG_LINES);
        }
        return combined;
      });
    });

    // 3. Cleanup: Unsubscribe and stop backend stream on unmount
    return () => {
      unsubscribeStream();
      window.electronAPI.stopMonitoring(containerName);
    };
  }, [containerName]);

  // Auto-scroll to bottom when new logs arrive (if autoScroll is enabled)
  useEffect(() => {
    if (autoScroll && listRef.current && logs.length > 0) {
      listRef.current.scrollToRow({ index: logs.length - 1, align: 'end' });
    }
  }, [logs.length, autoScroll]);

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header Bar */}
      <div className="flex justify-between items-center px-6 py-4 bg-slate-900 border-b border-slate-800 shadow-md z-10">
        <div className="flex items-center gap-3">
          <TerminalSquare className="w-5 h-5 text-sky-400" />
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">Live Stream</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-50 font-medium">{containerName}</span>
          </div>
          <span className="text-xs text-sky-400 font-mono bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded-md ml-3 shadow-[0_0_10px_rgba(56,189,248,0.1)]">
            {logs.length} lines
          </span>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-slate-50 transition-colors select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="accent-sky-500 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <ArrowDownCircle className="w-4 h-4" />
              Auto-scroll
            </span>
          </label>
          <button 
            onClick={onClose} 
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>

      {/* INJECT THE AI PANEL HERE */}
      <AiAnalyzer containerName={containerName} />

      {/* Virtualized Container */}
      <div className="flex-1 relative min-w-0 min-h-0 bg-slate-950">
        <AutoSizer
          renderProp={({ height, width }) => {
            if (height === undefined || width === undefined) return null;
            return (
              <List<{ logs: LogMessage[] }>
                listRef={listRef}
                style={{ height, width }}
                rowCount={logs.length}
                rowHeight={32} // Fixed height per row for maximum speed
                rowProps={{ logs }}
                rowComponent={Row}
              />
            );
          }}
        />
      </div>
    </div>
  );
}