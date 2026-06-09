export interface LogMessage {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  containerName: string;
  message: string;
}

export interface ElectronAPI {
  // Frontend-to-Backend (Invokes an action and waits for a response)
  getContainers: () => Promise<string[]>;

  // Streaming Backend-to-Frontend (Listens to real-time events)
  onLogStream: (callback: (logs: LogMessage[]) => void) => () => void;
  onStreamError: (callback: (error: string) => void) => () => void;

  // Control actions
  startMonitoring: (containerName: string, tailCount?: number) => Promise<void>;
  stopMonitoring: (containerName: string) => Promise<void>;

  analyzeLogs: (containerName: string) => Promise<string>;
}

// Re-declare the global Window interface so TypeScript recognizes our API in React
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
