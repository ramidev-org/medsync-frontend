import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const extra =
  (Constants.expoConfig as any)?.extra ??
  (Constants as any).manifest2?.extra ??
  (Constants as any).manifest?.extra ??
  {};

export const SUPABASE_URL =
  (process.env as any)?.EXPO_PUBLIC_SUPABASE_URL ??
  (extra as any)?.EXPO_PUBLIC_SUPABASE_URL ??
  (extra as any)?.SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  (process.env as any)?.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (extra as any)?.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (extra as any)?.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
