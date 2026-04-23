interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  geminiApiKey: string;
  triggerSecret: string;
  cronSecret: string;
  jinaApiKey?: string;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getEnv(): EnvConfig {
  return {
    supabaseUrl: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    geminiApiKey: getRequiredEnv("GOOGLE_GEMINI_API_KEY"),
    triggerSecret: getRequiredEnv("TRIGGER_SECRET"),
    cronSecret: getRequiredEnv("CRON_SECRET"),
    jinaApiKey: process.env.JINA_API_KEY || undefined,
  };
}
