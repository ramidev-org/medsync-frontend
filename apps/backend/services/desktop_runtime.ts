export const isDesktopApp = (): boolean =>
  typeof window !== "undefined" && window.medSyncDesktop?.isDesktop === true;

export const isDesktopOnline = (): boolean => {
  if (!isDesktopApp()) return true;
  return typeof navigator === "undefined" || navigator.onLine !== false;
};
