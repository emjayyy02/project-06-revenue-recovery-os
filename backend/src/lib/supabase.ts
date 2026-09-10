import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

export interface Env {
  APP_MODE?: string;
  ALLOWED_ORIGINS?: string;
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  OPENROUTER_API_KEY?: string;
  N8N_INTERVENTION_WEBHOOK_URL?: string;
}

export function createSupabaseClient(env: Env) {
  const supabaseUrl = env.SUPABASE_URL?.trim();
  const supabaseKey = env.SUPABASE_SECRET_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  // Validate that the URL itself is actually usable.
  new URL(supabaseUrl);

  return createClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
