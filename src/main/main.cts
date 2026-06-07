import { app, BrowserWindow } from "electron";
import * as path from "node:path";
import { ipcMain } from "electron";
import { DockerClient } from "./docker.cjs";

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const RENDERER_DIST = path.join(__dirname, "../renderer");
const PRELOAD_SCRIPT = path.join(__dirname, "../preload/index.cjs");

let mainWindow: BrowserWindow | null = null;

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

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception in Main Process:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection in Main Process:", reason);
});
