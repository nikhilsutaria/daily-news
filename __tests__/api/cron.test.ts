import { PipelineResult } from "@/types";

const mockRun = jest.fn<() => Promise<PipelineResult>>();

jest.mock("@/config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    cronSecret: "test-cron-secret",
    geminiApiKey: "test-key",
    jinaApiKey: undefined,
    supabaseUrl: "https://test.supabase.co",
    supabaseAnonKey: "test-anon",
  }),
}));

jest.mock("@/lib/supabase", () => ({
  createSupabaseClient: jest.fn().mockReturnValue({}),
}));

jest.mock("@/repositories/articleRepository", () => ({
  ArticleRepository: jest.fn(),
}));

jest.mock("@/services/hackerNewsService", () => ({
  HackerNewsService: jest.fn(),
}));

jest.mock("@/services/contentExtractor", () => ({
  ContentExtractor: jest.fn(),
}));

jest.mock("@/services/summarizerService", () => ({
  SummarizerService: jest.fn(),
}));

jest.mock("@/services/pipelineService", () => ({
  PipelineService: jest.fn().mockImplementation(() => ({
    run: mockRun,
  })),
}));

jest.mock("next/server", () => {
  return {
    NextRequest: class MockNextRequest {
      public headers: Headers;
      public method: string;
      constructor(url: string, init?: RequestInit) {
        this.headers = new Headers(init?.headers);
        this.method = init?.method || "GET";
      }
    },
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({
        status: init?.status || 200,
        json: async () => body,
      }),
    },
  };
});

describe("GET /api/cron", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRun.mockResolvedValue({
      status: "created",
      message: "Successfully summarized",
    });
  });

  it("returns 401 without authorization header", async () => {
    const { GET } = await import("@/app/api/cron/route");
    const req = { headers: new Headers(), method: "GET" };
    const res = await GET(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong secret", async () => {
    const { GET } = await import("@/app/api/cron/route");
    const req = {
      headers: new Headers({ Authorization: "Bearer wrong-secret" }),
      method: "GET",
    };
    const res = await GET(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 200 with correct cron secret", async () => {
    const { GET } = await import("@/app/api/cron/route");
    const req = {
      headers: new Headers({ Authorization: "Bearer test-cron-secret" }),
      method: "GET",
    };
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("created");
  });

  it("returns 500 when pipeline returns error", async () => {
    mockRun.mockResolvedValue({
      status: "error",
      message: "Pipeline failed",
    });
    const { GET } = await import("@/app/api/cron/route");
    const req = {
      headers: new Headers({ Authorization: "Bearer test-cron-secret" }),
      method: "GET",
    };
    const res = await GET(req as never);
    expect(res.status).toBe(500);
  });
});
