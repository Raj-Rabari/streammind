import React, { useState, useEffect, useRef } from 'react';
import { List, ListImperativeAPI } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
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
    <div {...ariaAttributes} style={{
      ...style,
      display: 'flex',
      gap: '1rem',
      padding: '0 1rem',
      alignItems: 'center',
      borderBottom: '1px solid #2a2a2a',
      background: isError ? '#2a1212' : 'transparent',
      color: isError ? '#ff6b6b' : '#a0a0a0',
      fontFamily: 'monospace',
      fontSize: '0.85rem',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }}>
      <span style={{ color: '#555', minWidth: '180px' }}>
        {new Date(log.timestamp).toLocaleTimeString()}
      </span>
      <span style={{ fontWeight: isError ? 'bold' : 'normal' }}>
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
        console.log(`Received batch of ${newBatch.length} logs from backend.`);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#121212' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#1e1e1e', borderBottom: '1px solid #333' }}>
        <div>
          <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Live Stream: </span>
          <span style={{ color: '#fff' }}>{containerName}</span>
          <span style={{ color: '#888', marginLeft: '1rem' }}>({logs.length} lines)</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ccc', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
          <button onClick={onClose} style={{ background: '#F44336', color: 'white', border: 'none', padding: '0.2rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>

      {/* 2. INJECT THE AI PANEL HERE */}
      <AiAnalyzer containerName={containerName} />

      {/* Virtualized Container */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0, minHeight: 0 }}>
        <AutoSizer
          renderProp={({ height, width }) => {
            if (height === undefined || width === undefined) return null;
            return (
              <List<{ logs: LogMessage[] }>
                listRef={listRef}
                style={{ height, width }}
                rowCount={logs.length}
                rowHeight={30} // Fixed height per row for maximum speed
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