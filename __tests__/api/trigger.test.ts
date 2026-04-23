import { PipelineResult } from "@/types";

const mockRun = jest.fn<() => Promise<PipelineResult>>();

jest.mock("@/config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    triggerSecret: "test-trigger-secret",
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

// Mock next/server to provide NextRequest and NextResponse in jsdom
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

describe("POST /api/trigger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRun.mockResolvedValue({
      status: "created",
      message: "Successfully summarized",
    });
  });

  it("returns 401 without authorization header", async () => {
    const { POST } = await import("@/app/api/trigger/route");
    const req = { headers: new Headers(), method: "POST" };
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong secret", async () => {
    const { POST } = await import("@/app/api/trigger/route");
    const req = {
      headers: new Headers({ Authorization: "Bearer wrong-secret" }),
      method: "POST",
    };
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 200 with correct secret", async () => {
    const { POST } = await import("@/app/api/trigger/route");
    const req = {
      headers: new Headers({ Authorization: "Bearer test-trigger-secret" }),
      method: "POST",
    };
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("created");
  });

  it("returns 500 when pipeline returns error", async () => {
    mockRun.mockResolvedValue({
      status: "error",
      message: "Something went wrong",
    });
    const { POST } = await import("@/app/api/trigger/route");
    const req = {
      headers: new Headers({ Authorization: "Bearer test-trigger-secret" }),
      method: "POST",
    };
    const res = await POST(req as never);
    expect(res.status).toBe(500);
  });
});

describe("GET /api/trigger", () => {
  it("returns 405", async () => {
    const { GET } = await import("@/app/api/trigger/route");
    const res = await GET();
    expect(res.status).toBe(405);
  });
});
