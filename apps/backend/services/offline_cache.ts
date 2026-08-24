import { isDesktopApp } from "@/services/desktop_runtime";

const cacheKey = (userId: string, appointmentId: string) =>
  `consultation:${userId}:${appointmentId}`;

export async function cacheConsultation(
  userId: string,
  appointmentId: string,
  value: unknown,
): Promise<void> {
  if (!isDesktopApp()) return;
  try {
    await window.medSyncDesktop?.writeOfflineCache(cacheKey(userId, appointmentId), value);
  } catch (error) {
    console.warn("Unable to cache desktop consultation:", error);
  }
}

export async function getCachedConsultation<T>(
  userId: string,
  appointmentId: string,
): Promise<T | null> {
  if (!isDesktopApp()) return null;
  try {
    const value = await window.medSyncDesktop?.readOfflineCache(cacheKey(userId, appointmentId));
    return (value as T | null | undefined) ?? null;
  } catch (error) {
    console.warn("Unable to read desktop consultation cache:", error);
    return null;
  }
}
