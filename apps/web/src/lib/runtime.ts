export type AppRole = "doctor" | "assistant";

const isBrowser = typeof window !== "undefined";

const readBool = (value: unknown) => String(value ?? "").toLowerCase() === "true";

export function parseRole(raw: unknown): AppRole | null {
  const value = String(raw ?? "").toLowerCase();
  if (value === "doctor") return "doctor";
  if (value === "assistant" || value === "reception") return "assistant";
  return null;
}

function readQueryParam(key: string) {
  if (!isBrowser) return null;
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
}

function readSession(key: string) {
  if (!isBrowser) return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string) {
  if (!isBrowser) return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {}
}

const ROLE_KEY = "mydoctor_role_override";
const CLINIC_ADMIN_KEY = "mydoctor_clinic_admin_override";
const SPEC_KEY = "mydoctor_speciality_override";

export function getAppRole(): AppRole {
  const queryRole = parseRole(readQueryParam("role"));
  if (queryRole) {
    writeSession(ROLE_KEY, queryRole);
    return queryRole;
  }

  const savedRole = parseRole(readSession(ROLE_KEY));
  if (savedRole) return savedRole;

  return parseRole(process.env.NEXT_PUBLIC_ROLE ?? process.env.EXPO_PUBLIC_ROLE) ?? "assistant";
}

export function getIsClinicAdminOverride() {
  const queryValue = readQueryParam("clinic_admin") ?? readQueryParam("admin");
  if (queryValue !== null) {
    writeSession(CLINIC_ADMIN_KEY, String(readBool(queryValue)));
    return readBool(queryValue);
  }

  const savedValue = readSession(CLINIC_ADMIN_KEY);
  if (savedValue !== null) return readBool(savedValue);

  return readBool(process.env.NEXT_PUBLIC_CLINIC_ADMIN ?? process.env.EXPO_PUBLIC_CLINIC_ADMIN);
}

export function getDoctorSpeciality() {
  const queryValue = readQueryParam("speciality");
  if (queryValue) {
    writeSession(SPEC_KEY, queryValue);
    return queryValue;
  }

  const savedValue = readSession(SPEC_KEY);
  if (savedValue) return savedValue;

  return (
    process.env.NEXT_PUBLIC_SPECIALITY ??
    process.env.EXPO_PUBLIC_SPECIALITY ??
    "Medecine generale"
  );
}
