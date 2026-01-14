// src/database/database.ts
import { createClient } from "@supabase/supabase-js";

// Get these from your Supabase project
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";


// Get these from your Supabase project
const DEV_SUPABASE_URL = 'https://cxycroqsgmtasgibapen.supabase.co';
const DEV_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4eWNyb3FzZ210YXNnaWJhcGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTg5MzIsImV4cCI6MjA4MDQ5NDkzMn0.AstEUFHIzbWLdBBjjQogR_QkeWKWi4qS3fE_Cq4BMhE';

export const db = createClient(DEV_SUPABASE_URL, DEV_SUPABASE_ANON_KEY);



    
