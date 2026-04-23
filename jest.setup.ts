process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.GOOGLE_GEMINI_API_KEY = "test-gemini-key";
process.env.TRIGGER_SECRET = "test-trigger-secret";
process.env.CRON_SECRET = "test-cron-secret";

// Ensure fetch is available for mocking in tests
if (!global.fetch) {
  global.fetch = jest.fn() as typeof fetch;
}
