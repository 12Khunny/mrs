const { app, BrowserWindow, Menu } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

let mainWindow;
let serverProcess = null;

function getRuntimeConfigPath() {
  if (process.env.MRS_CONFIG_PATH) return process.env.MRS_CONFIG_PATH;
  return path.join(app.getPath("userData"), "config.json");
}

function loadRuntimeConfig() {
  const configPath = getRuntimeConfigPath();
  const defaultConfig = {
    apiUrl: "http://localhost:5000/api",
    upstreamApiBase: "https://api.zyanwoa.com/__testapi2__",
    autoStartLocalServer: true,
  };

  try {
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), "utf8");
      return { config: defaultConfig, configPath };
    }

    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);
    const config = { ...defaultConfig, ...(parsed || {}) };
    return { config, configPath };
  } catch {
    return { config: defaultConfig, configPath };
  }
}

function getServerEntryPath() {
  return app.isPackaged
    ? path.join(__dirname, "server-dist", "server.js")
    : path.resolve(__dirname, "../server/server.js");
}

function startLocalServerIfNeeded(config) {
  if (!config?.autoStartLocalServer || serverProcess) return;

  const serverEntry = getServerEntryPath();
  if (!fs.existsSync(serverEntry)) return;

  serverProcess = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      MRS_WEB_ORIGIN: "null,http://localhost:5173,http://localhost:5261",
      MRS_API_BASE: config.upstreamApiBase || "https://api.zyanwoa.com/__testapi2__",
    },
    stdio: "ignore",
    windowsHide: true,
  });

  serverProcess.on("exit", () => {
    serverProcess = null;
  });
}

function stopLocalServer() {
  if (!serverProcess) return;
  try {
    serverProcess.kill();
  } catch {}
  serverProcess = null;
}

function createWindow() {
  const isDev = !app.isPackaged;
  const { config, configPath } = loadRuntimeConfig();
  startLocalServerIfNeeded(config);

  process.env.MRS_RUNTIME_CONFIG = JSON.stringify({
    ...config,
    configPath,
  });

  mainWindow = new BrowserWindow({
    width: 1900,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Remove default app menu (File/Edit/View...) for kiosk-like UI.
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    const devUrl = process.env.ELECTRON_RENDERER_URL || "http://localhost:5173";
    mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, "renderer", "index.html");
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("before-quit", stopLocalServer);
app.on("window-all-closed", () => {
  stopLocalServer();
  app.quit();
});
