import { contextBridge, ipcRenderer } from "electron";
import type { LogMessage } from "../shared/types";

// Ensure context isolation is enabled for security
if (!process.contextIsolated) {
  throw new Error("Context isolation must be enabled for security reasons.");
}

contextBridge.exposeInMainWorld("electronAPI", {
  getContainers: () => ipcRenderer.invoke("docker:get-containers"),

  onLogStream: (callback: (logs: LogMessage[]) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      logs: LogMessage[],
    ) => {
      callback(logs);
    };
    ipcRenderer.on("docker:log-stream", listener);

    // Return a cleanup function to remove the listener when it's no longer needed
    return () => {
      ipcRenderer.removeListener("docker:log-stream", listener);
    };
  },

  onLogStreamError: (callback: (error: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, error: string) => {
      callback(error);
    };

    ipcRenderer.on("docker:log-stream-error", listener);

    // Return a cleanup function to remove the listener when it's no longer needed
    return () => {
      ipcRenderer.removeListener("docker:log-stream-error", listener);
    };
  },

  startMonitoring: (containerName: string) =>
    ipcRenderer.invoke("docker:start-monitoring", containerName),

  stopMonitoring: (containerName: string) =>
    ipcRenderer.invoke("docker:stop-monitoring", containerName),
});
