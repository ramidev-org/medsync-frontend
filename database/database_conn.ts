// src/database/database.ts
import { createClient } from "@supabase/supabase-js";

// Get these from your Supabase project
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
