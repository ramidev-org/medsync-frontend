import { SpecialityKey } from "@/config/speciality";

const ensureTrailingSlash = (url: string) => (url.endsWith("/") ? url : `${url}/`);

const getEnv = (k: string) => (process.env as any)?.[k] as string | undefined;

export const normalizeOhifBaseUrl = (url?: string | null) => {
  if (!url) return null;
  const t = String(url).trim();
  if (!t) return null;
  return ensureTrailingSlash(t);
};

const DEFAULT_OHIF_BASE_URL = ensureTrailingSlash(
  getEnv("EXPO_PUBLIC_OHIF_VIEWER_URL") || "https://viewer.ohif.org/",
);

const OHIF_BASE_URL_BY_SPECIALITY: Partial<Record<SpecialityKey, string>> = {
  general: getEnv("EXPO_PUBLIC_OHIF_VIEWER_URL_GENERAL"),
  cardiology: getEnv("EXPO_PUBLIC_OHIF_VIEWER_URL_CARDIOLOGY"),
  dermatology: getEnv("EXPO_PUBLIC_OHIF_VIEWER_URL_DERMATOLOGY"),
  gynecology: getEnv("EXPO_PUBLIC_OHIF_VIEWER_URL_GYNECOLOGY"),
  pediatrics: getEnv("EXPO_PUBLIC_OHIF_VIEWER_URL_PEDIATRICS"),
  dentistry: getEnv("EXPO_PUBLIC_OHIF_VIEWER_URL_DENTISTRY"),
};

export const getOhifBaseUrl = (speciality?: SpecialityKey | null) => {
  const specific = speciality ? OHIF_BASE_URL_BY_SPECIALITY[speciality] : undefined;
  if (specific && typeof specific === "string" && specific.trim()) return ensureTrailingSlash(specific.trim());
  return DEFAULT_OHIF_BASE_URL;
};

export const getOhifBaseUrlWithOverrides = (
  speciality: SpecialityKey | null | undefined,
  overrides?: Partial<Record<SpecialityKey, string | null | undefined>> | null,
) => {
  const o = overrides && speciality ? overrides[speciality] : undefined;
  const normalized = normalizeOhifBaseUrl(o);
  if (normalized) return normalized;
  return getOhifBaseUrl(speciality);
};

type BuildOhifStudyUrlArgs = {
  baseUrl?: string;
  studyInstanceUIDs?: string | string[] | null;
  seriesInstanceUID?: string | string[] | null;
  initialSeriesInstanceUID?: string | null;
  accession?: string | null;
  modePath?: string; // e.g. "viewer", "basic", etc.
};

/**
 * Builds a URL to open OHIF with optional query params.
 * Works best with OHIF v3 routes like `.../viewer?StudyInstanceUIDs=...`.
 */
export const buildOhifStudyUrl = ({
  baseUrl,
  studyInstanceUIDs,
  seriesInstanceUID,
  initialSeriesInstanceUID,
  accession,
  modePath = "viewer",
}: BuildOhifStudyUrlArgs) => {
  const urlBase = ensureTrailingSlash(baseUrl || DEFAULT_OHIF_BASE_URL);
  const cleanModePath = String(modePath || "viewer").replace(/^\/+/, "").replace(/\/+$/, "");
  const u = new URL(`${urlBase}${cleanModePath}`);

  const add = (k: string, v: string | null | undefined) => {
    if (!v) return;
    const s = String(v).trim();
    if (!s) return;
    u.searchParams.append(k, s);
  };

  const addCsv = (k: string, v: string | string[] | null | undefined) => {
    if (!v) return;
    const arr = Array.isArray(v) ? v : [v];
    const cleaned = arr.map((x) => String(x).trim()).filter(Boolean);
    if (!cleaned.length) return;
    add(k, cleaned.join(","));
  };

  addCsv("StudyInstanceUIDs", studyInstanceUIDs);
  addCsv("seriesinstanceuid", seriesInstanceUID);
  add("initialseriesinstanceuid", initialSeriesInstanceUID);
  add("accession", accession);

  return u.toString();
};
