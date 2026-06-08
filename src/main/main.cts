import { app, BrowserWindow } from "electron";
import * as path from "node:path";
import { ipcMain } from "electron";
import { DockerClient } from "./docker.cjs";
import { DockerLogStreamer } from "./logStreamer.cjs";
import { LogAnalyzer } from "./ai.cjs";

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const RENDERER_DIST = path.join(__dirname, "../renderer");
const PRELOAD_SCRIPT = path.join(__dirname, "../preload/index.cjs");

let mainWindow: BrowserWindow | null = null;

// Store active streams in memory
const activeStreams = new Map<string, DockerLogStreamer>();

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,

    webPreferences: {
      preload: PRELOAD_SCRIPT,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// if (process.platform === "linux") {
//   app.commandLine.appendSwitch("disable-features", "Vulkan");
// }

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("docker:get-containers", async () => {
  try {
    const containers = await DockerClient.getRunningContainers();
    return containers;
  } catch (error: any) {
    console.error("IPC Error fetching containers:", error);
    return [];
  }
});

// New Stream Start Handler
ipcMain.handle("docker:start-monitoring", (event, containerName: string) => {
  // Prevent duplicate streams for the same container
  if (activeStreams.has(containerName)) return;

  // We need the window instance to send events down to the frontend
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  const streamer = new DockerLogStreamer(window, containerName);
  activeStreams.set(containerName, streamer);
  streamer.start();
});

// New Stream Stop Handler
ipcMain.handle("docker:stop-monitoring", (_event, containerName: string) => {
  const streamer = activeStreams.get(containerName);
  if (streamer) {
    streamer.stop();
    activeStreams.delete(containerName);
  }
});

ipcMain.handle("ai:analyze", async (_event, containerName: string) => {
  const streamer = activeStreams.get(containerName);
  if (!streamer) {
    throw new Error(`No active stream found for ${containerName}`);
  }

  // Grab the sliding window snapshot
  const context = streamer.getContextSnapshot();

  // Pass it to the AI Service
  const analysis = await LogAnalyzer.analyzeContext(containerName, context);
  return analysis;
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception in Main Process:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection in Main Process:", reason);
});
