// config/runtime.ts
// Central place for Expo runtime flags.

import Constants from "expo-constants";

export type AppRole = "admin" | "doctor" | "assistant";

const readBool = (v: unknown) => String(v ?? "").toLowerCase() === "true";

// Expo env vars can come from process.env OR from app.config extra.
// This makes role/demo switching work reliably in Web + Native dev.
const extra =
  (Constants.expoConfig as any)?.extra ??
  (Constants as any).manifest2?.extra ??
  (Constants as any).manifest?.extra ??
  {};

const readEnv = (k: string) =>
  (process.env as any)?.[k] ??
  (extra as any)?.[k] ??
  // some setups strip EXPO_PUBLIC_ in extra
  (extra as any)?.[k.replace(/^EXPO_PUBLIC_/, "")];

// IMPORTANT:
// These values are exposed both as constants (common usage) AND as functions.
// Some dev setups can keep module state across fast refresh; the function form
// gives a reliable "read-latest" behavior after a full reload.

export const getIsDemo = () => readBool(readEnv("EXPO_PUBLIC_DEMO"));

export const getAppRole = (): AppRole => {
  const raw = String(readEnv("EXPO_PUBLIC_ROLE") || "assistant").toLowerCase();
  if (raw === "admin" || raw === "doctor" || raw === "assistant") return raw;
  return "assistant";
};

export const IS_DEMO = getIsDemo();
export const APP_ROLE: AppRole = getAppRole();

export const getDoctorSpeciality = () =>
  String(readEnv("EXPO_PUBLIC_SPECIALITY") || "Médecine générale");

export const RUNTIME_INFO = () => ({
  IS_DEMO: getIsDemo(),
  APP_ROLE: getAppRole(),
  DOCTOR_SPECIALITY: getDoctorSpeciality(),
});
