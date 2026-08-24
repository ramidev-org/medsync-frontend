import { useAuth } from "@/contexts/auth_context";
import { isDesktopApp } from "@/services/desktop_runtime";
import { flushOfflineQueue, readOfflineQueue } from "@/services/offline_queue";
import { callRpc } from "@/services/backend";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type OfflineSyncContextValue = {
  enabled: boolean;
  online: boolean;
  syncing: boolean;
  pendingCount: number;
  lastError: string | null;
  flush: () => Promise<void>;
};

const OfflineSyncContext = createContext<OfflineSyncContextValue | null>(null);

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const enabled = isDesktopApp();
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshPendingCount = useCallback(async () => {
    if (!enabled || !user?.id) {
      setPendingCount(0);
      return;
    }
    const queue = await readOfflineQueue();
    setPendingCount(queue.filter((item) => item.ownerUserId === user.id).length);
  }, [enabled, user?.id]);

  const flush = useCallback(async () => {
    if (!enabled || !user?.id || typeof navigator !== "undefined" && !navigator.onLine) {
      await refreshPendingCount();
      return;
    }

    setSyncing(true);
    try {
      const result = await flushOfflineQueue(user.id, (rpcName, params) =>
        callRpc<unknown, Record<string, unknown>>(rpcName as any, params),
      );
      setPendingCount(result.pending);
      setLastError(result.error);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Impossible de lire la file locale");
      await refreshPendingCount();
    } finally {
      setSyncing(false);
    }
  }, [enabled, refreshPendingCount, user?.id]);

  useEffect(() => {
    if (!enabled) return;

    const updateOnline = () => {
      const nextOnline = typeof navigator === "undefined" || navigator.onLine;
      setOnline(nextOnline);
      if (nextOnline) void flush();
    };

    updateOnline();
    void refreshPendingCount();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    const interval = window.setInterval(() => void flush(), 30_000);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.clearInterval(interval);
    };
  }, [enabled, flush, refreshPendingCount]);

  return (
    <OfflineSyncContext.Provider
      value={{ enabled, online, syncing, pendingCount, lastError, flush }}
    >
      {children}
      <OfflineSyncBanner />
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSync() {
  const value = useContext(OfflineSyncContext);
  if (!value) throw new Error("OfflineSyncProvider missing");
  return value;
}

function OfflineSyncBanner() {
  const { enabled, online, syncing, pendingCount, lastError } = useOfflineSync();
  if (!enabled || (online && pendingCount === 0 && !syncing && !lastError)) return null;

  const message = !online
    ? `Hors connexion — ${pendingCount} modification(s) en attente`
    : syncing
      ? "Synchronisation en cours…"
      : lastError
        ? `Synchronisation interrompue — ${pendingCount} en attente`
        : `${pendingCount} modification(s) en attente de synchronisation`;

  return (
    <View pointerEvents="none" style={styles.banner}>
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    alignItems: "center",
    zIndex: 1000,
  },
  bannerText: {
    color: "#FFFFFF",
    backgroundColor: "#1F2937",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "700",
  },
});
