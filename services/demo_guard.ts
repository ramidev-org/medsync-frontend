import { IS_DEMO } from "@/config/runtime";

export const ensureNotDemo = (featureName: string) => {
  if (!IS_DEMO) return;
  // In demo mode we silently no-op; pages should still render.
  // Throwing would break the prototype flows.
  return;
};
