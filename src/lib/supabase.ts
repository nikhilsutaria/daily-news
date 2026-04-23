import { getEnv } from "@/config/env";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseClient(): SupabaseClient {
  const env = getEnv();
  return createClient(env.supabaseUrl, env.supabaseAnonKey);
}
