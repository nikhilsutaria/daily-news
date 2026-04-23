describe("getEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      GOOGLE_GEMINI_API_KEY: "test-gemini-key",
      TRIGGER_SECRET: "test-trigger-secret",
      CRON_SECRET: "test-cron-secret",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns config when all required vars are set", async () => {
    const { getEnv } = await import("@/config/env");
    const env = getEnv();

    expect(env.supabaseUrl).toBe("https://test.supabase.co");
    expect(env.supabaseAnonKey).toBe("test-anon-key");
    expect(env.geminiApiKey).toBe("test-gemini-key");
    expect(env.triggerSecret).toBe("test-trigger-secret");
    expect(env.cronSecret).toBe("test-cron-secret");
    expect(env.jinaApiKey).toBeUndefined();
  });

  it("returns jinaApiKey when set", async () => {
    process.env.JINA_API_KEY = "test-jina-key";
    const { getEnv } = await import("@/config/env");
    const env = getEnv();

    expect(env.jinaApiKey).toBe("test-jina-key");
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { getEnv } = await import("@/config/env");

    expect(() => getEnv()).toThrow("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  });

  it("throws when GOOGLE_GEMINI_API_KEY is missing", async () => {
    delete process.env.GOOGLE_GEMINI_API_KEY;
    const { getEnv } = await import("@/config/env");

    expect(() => getEnv()).toThrow("Missing required environment variable: GOOGLE_GEMINI_API_KEY");
  });

  it("throws when TRIGGER_SECRET is missing", async () => {
    delete process.env.TRIGGER_SECRET;
    const { getEnv } = await import("@/config/env");

    expect(() => getEnv()).toThrow("Missing required environment variable: TRIGGER_SECRET");
  });

  it("throws when CRON_SECRET is missing", async () => {
    delete process.env.CRON_SECRET;
    const { getEnv } = await import("@/config/env");

    expect(() => getEnv()).toThrow("Missing required environment variable: CRON_SECRET");
  });
});
