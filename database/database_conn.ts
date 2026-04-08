import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";
import { getIsDemo } from "@/config/runtime";

const extra =
  (Constants.expoConfig as any)?.extra ??
  (Constants as any).manifest2?.extra ??
  (Constants as any).manifest?.extra ??
  {};

const SUPABASE_URL =
  (process.env as any)?.EXPO_PUBLIC_SUPABASE_URL ??
  (extra as any)?.EXPO_PUBLIC_SUPABASE_URL ??
  (extra as any)?.SUPABASE_URL;

const SUPABASE_ANON_KEY =
  (process.env as any)?.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (extra as any)?.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (extra as any)?.SUPABASE_ANON_KEY;

const isDemo = (() => {
  try {
    return getIsDemo();
  } catch {
    return false;
  }
})();

const finalUrl = SUPABASE_URL || (isDemo ? "https://example.supabase.co" : "");
const finalAnonKey = SUPABASE_ANON_KEY || (isDemo ? "public-anon-key" : "");

if (!finalUrl || !finalAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const db = createClient(finalUrl, finalAnonKey);
