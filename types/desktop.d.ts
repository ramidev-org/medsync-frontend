import type { OfflineQueueItem } from "@/services/offline_queue";

export {};

declare global {
  interface Window {
    medSyncDesktop?: {
      isDesktop: true;
      readOfflineQueue: () => Promise<OfflineQueueItem[]>;
      writeOfflineQueue: (items: OfflineQueueItem[]) => Promise<void>;
      readOfflineCache: (key: string) => Promise<unknown | null>;
      writeOfflineCache: (key: string, value: unknown) => Promise<void>;
    };
  }
}
