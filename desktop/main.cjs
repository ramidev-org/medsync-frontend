const { app, BrowserWindow, ipcMain, safeStorage } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const queueFileName = "offline-queue.dat";
const cacheFileName = "offline-cache.dat";

const dataPath = (name) => path.join(app.getPath("userData"), name);

async function readEncryptedJson(fileName, fallback) {
  try {
    const raw = await fs.readFile(dataPath(fileName), "utf8");
    const envelope = JSON.parse(raw);
    if (envelope.encrypted && safeStorage.isEncryptionAvailable()) {
      return JSON.parse(safeStorage.decryptString(Buffer.from(envelope.payload, "base64")));
    }
    return envelope.payload ?? fallback;
  } catch {
    return fallback;
  }
}

async function writeEncryptedJson(fileName, value) {
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  const json = JSON.stringify(value);
  const encrypted = safeStorage.isEncryptionAvailable();
  const envelope = encrypted
    ? { encrypted: true, payload: safeStorage.encryptString(json).toString("base64") }
    : { encrypted: false, payload: value };
  const target = dataPath(fileName);
  const temporary = `${target}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(envelope), "utf8");
  await fs.rename(temporary, target);
}

ipcMain.handle("offline:read-queue", () => readEncryptedJson(queueFileName, []));
ipcMain.handle("offline:write-queue", (_event, items) => writeEncryptedJson(queueFileName, items));
ipcMain.handle("offline:read-cache", async (_event, key) => {
  const cache = await readEncryptedJson(cacheFileName, {});
  return cache && typeof cache === "object" ? cache[key] ?? null : null;
});
ipcMain.handle("offline:write-cache", async (_event, key, value) => {
  const cache = await readEncryptedJson(cacheFileName, {});
  await writeEncryptedJson(cacheFileName, {
    ...(cache && typeof cache === "object" ? cache : {}),
    [key]: value,
  });
});

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  const devUrl = process.env.MEDSYNC_DESKTOP_URL;
  if (devUrl) window.loadURL(devUrl);
  else window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
