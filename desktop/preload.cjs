const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("medSyncDesktop", {
  isDesktop: true,
  readOfflineQueue: () => ipcRenderer.invoke("offline:read-queue"),
  writeOfflineQueue: (items) => ipcRenderer.invoke("offline:write-queue", items),
  readOfflineCache: (key) => ipcRenderer.invoke("offline:read-cache", key),
  writeOfflineCache: (key, value) => ipcRenderer.invoke("offline:write-cache", key, value),
});
