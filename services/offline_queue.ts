import { isDesktopApp, isDesktopOnline } from "@/services/desktop_runtime";

export type OfflineQueueItem = {
  id: string;
  ownerUserId: string;
  rpcName: string;
  params: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError: string | null;
};

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const desktopBridge = () => (isDesktopApp() ? window.medSyncDesktop : undefined);

export const isLikelyOfflineError = (error: unknown): boolean => {
  if (!isDesktopApp()) return false;
  if (!isDesktopOnline()) return true;

  const message = error instanceof Error ? error.message : String(error ?? "");
  return /failed to fetch|network|offline|internet|timed out|timeout|connection/i.test(message);
};

export async function readOfflineQueue(): Promise<OfflineQueueItem[]> {
  const bridge = desktopBridge();
  if (!bridge) return [];
  const items = await bridge.readOfflineQueue();
  return Array.isArray(items) ? items : [];
}

async function writeOfflineQueue(items: OfflineQueueItem[]): Promise<void> {
  const bridge = desktopBridge();
  if (!bridge) return;
  await bridge.writeOfflineQueue(items);
}

export async function enqueueOfflineRpc(input: {
  ownerUserId: string;
  rpcName: string;
  params: Record<string, unknown>;
}): Promise<boolean> {
  if (!isDesktopApp()) return false;

  const now = new Date().toISOString();
  const queue = await readOfflineQueue();
  const consultationId = input.params.p_consultation_id;

  // Consultation drafts are replaceable. Keeping only the newest draft avoids
  // replaying every keystroke/save after a long outage.
  const replaceIndex = queue.findIndex(
    (item) =>
      item.ownerUserId === input.ownerUserId &&
      item.rpcName === input.rpcName &&
      consultationId != null &&
      item.params.p_consultation_id === consultationId,
  );

  const next: OfflineQueueItem = {
    id: replaceIndex >= 0 ? queue[replaceIndex].id : makeId(),
    ownerUserId: input.ownerUserId,
    rpcName: input.rpcName,
    params: input.params,
    createdAt: now,
    attempts: replaceIndex >= 0 ? queue[replaceIndex].attempts : 0,
    lastError: null,
  };

  if (replaceIndex >= 0) queue[replaceIndex] = next;
  else queue.push(next);

  await writeOfflineQueue(queue);
  return true;
}

export async function flushOfflineQueue(
  ownerUserId: string,
  executor: (rpcName: string, params: Record<string, unknown>) => Promise<unknown>,
): Promise<{ synced: number; pending: number; error: string | null }> {
  if (!isDesktopApp() || !isDesktopOnline()) {
    const pending = (await readOfflineQueue()).filter((item) => item.ownerUserId === ownerUserId).length;
    return { synced: 0, pending, error: null };
  }

  const queue = await readOfflineQueue();
  const owned = queue.filter((item) => item.ownerUserId === ownerUserId);
  let synced = 0;
  let lastError: string | null = null;

  for (const item of owned) {
    try {
      await executor(item.rpcName, item.params);
      const index = queue.findIndex((candidate) => candidate.id === item.id);
      if (index >= 0) queue.splice(index, 1);
      synced += 1;
      await writeOfflineQueue(queue);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error ?? "Sync failed");
      const index = queue.findIndex((candidate) => candidate.id === item.id);
      if (index >= 0) {
        queue[index] = {
          ...queue[index],
          attempts: queue[index].attempts + 1,
          lastError,
        };
        await writeOfflineQueue(queue);
      }
      // Do not continue replaying later mutations when the connection is down.
      break;
    }
  }

  return {
    synced,
    pending: queue.filter((item) => item.ownerUserId === ownerUserId).length,
    error: lastError,
  };
}
