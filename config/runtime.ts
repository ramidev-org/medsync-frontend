// config/runtime.ts
// Central place for Expo runtime flags (demo/role/speciality) with reliable overrides.
// Supports:
// - Native: EXPO_PUBLIC_* env (and app.config extra)
// - Web: URL query overrides + sessionStorage persistence across navigation
//
// Examples (web):
//   /?role=doctor&speciality=Cardiologie&demo=true
//   /?role=reception&demo=true
//   /?role=doctor&clinic_admin=true&demo=true

import Constants from "expo-constants";

export type AppRole = "doctor" | "reception";

const isWeb = typeof window !== "undefined";

const readBool = (v: unknown) => String(v ?? "").toLowerCase() === "true";

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

const parseRole = (raw: unknown): AppRole | null => {
  const v = String(raw ?? "").toLowerCase();
  if (v === "doctor") return "doctor";
  if (v === "reception") return "reception";
  // Back-compat (older naming)
  if (v === "assistant") return "reception";
  // Back-compat (older demo)
  if (v === "admin") return "doctor";
  return null;
};

const getQueryParam = (key: string): string | null => {
  if (!isWeb) return null;
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
};

const ROLE_KEY = "medsync_role_override";
const DEMO_KEY = "medsync_demo_override";
const SPEC_KEY = "medsync_spec_override";
const CLINIC_ADMIN_KEY = "medsync_clinic_admin_override";

const readSession = (k: string) => {
  if (!isWeb) return null;
  try {
    return window.sessionStorage.getItem(k);
  } catch {
    return null;
  }
};

const writeSession = (k: string, v: string) => {
  if (!isWeb) return;
  try {
    window.sessionStorage.setItem(k, v);
  } catch {}
};

/** WEB first: query param -> session -> env/extra */
export const getAppRole = (): AppRole => {
  // 1) URL override (persist for later navigation)
  const urlRole = parseRole(getQueryParam("role"));
  if (urlRole) {
    writeSession(ROLE_KEY, urlRole);
    return urlRole;
  }

  // 2) session override
  const saved = parseRole(readSession(ROLE_KEY));
  if (saved) return saved;

  // 3) env/extra
  const envRole = parseRole(readEnv("EXPO_PUBLIC_ROLE"));
  if (envRole) return envRole;

  return "reception";
};

/** WEB first: query param -> session -> env/extra */
export const getIsDemo = (): boolean => {
  // 1) URL override
  const url = getQueryParam("demo");
  if (url != null) {
    const v = String(readBool(url));
    writeSession(DEMO_KEY, v);
    return readBool(v);
  }

  // 2) session override
  const saved = readSession(DEMO_KEY);
  if (saved != null) return readBool(saved);

  // 3) env/extra
  return readBool(readEnv("EXPO_PUBLIC_DEMO"));
};

/** WEB first: query param -> session -> env/extra (demo helper) */
export const getIsClinicAdminOverride = (): boolean => {
  const url = getQueryParam("clinic_admin") ?? getQueryParam("admin");
  if (url != null) {
    const v = String(readBool(url));
    writeSession(CLINIC_ADMIN_KEY, v);
    return readBool(v);
  }

  const saved = readSession(CLINIC_ADMIN_KEY);
  if (saved != null) return readBool(saved);

  return readBool(readEnv("EXPO_PUBLIC_CLINIC_ADMIN"));
};

/** WEB first: query param -> session -> env/extra */
export const getDoctorSpeciality = (): string => {
  // 1) URL override
  const url = getQueryParam("speciality");
  if (url) {
    writeSession(SPEC_KEY, url);
    return url;
  }

  // 2) session override
  const saved = readSession(SPEC_KEY);
  if (saved) return saved;

  // 3) env/extra
  return String(readEnv("EXPO_PUBLIC_SPECIALITY") || "Médecine générale");
};

export const RUNTIME_INFO = () => ({
  IS_DEMO: getIsDemo(),
  APP_ROLE: getAppRole(),
  IS_CLINIC_ADMIN: getIsClinicAdminOverride(),
  DOCTOR_SPECIALITY: getDoctorSpeciality(),
});

// Convenience constants (note: these are fixed at import time)
export const IS_DEMO = getIsDemo();
export const APP_ROLE: AppRole = getAppRole();
export const IS_CLINIC_ADMIN = getIsClinicAdminOverride();

// Images per role
export const roleImages: Record<AppRole, string> = {
  doctor:
    "https://plus.unsplash.com/premium_photo-1723514536306-26fe5c4adeb7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  reception:
    "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=687&auto=format&fit=crop",
};

// Always safe, always typed:
export const getCurrentRoleImage = () => roleImages[getAppRole()];

// If you still want a constant (fixed at import time):
export const CURRENT_ROLE_IMAGE = getCurrentRoleImage();

/** Optional helper for dev (web): clear stored overrides */
export const clearRuntimeOverrides = () => {
  if (!isWeb) return;
  try {
    window.sessionStorage.removeItem(ROLE_KEY);
    window.sessionStorage.removeItem(DEMO_KEY);
    window.sessionStorage.removeItem(SPEC_KEY);
  } catch {}
};
