# Daily News - HackerNews Summarizer PWA

A Progressive Web App that fetches the #1 top story from Hacker News daily, summarizes it using AI, and presents it in a clean, readable format.

## Tech Stack (All Free Tier)

| Layer | Technology | Free Tier Limits |
|-------|-----------|-----------------|
| Frontend | Next.js 14+ (App Router) + Tailwind CSS | - |
| AI Summary | Google Gemini 2.0 Flash | 1,500 req/day |
| Content Extraction | Jina AI Reader API | 200 req/hour |
| News Source | Hacker News Firebase API | Unlimited |
| Database | Supabase PostgreSQL | 500MB |
| Hosting | Vercel | 2 cron jobs, 100GB BW |
| PWA | @ducanh2912/next-pwa | - |

## Architecture

```
User -> Next.js Page (reads from Supabase only)

Vercel Cron (daily 8am UTC) --> GET /api/cron --> PipelineService
Manual trigger button -------> POST /api/trigger --> PipelineService

PipelineService:
  1. HackerNewsService.getTopStoryId() -> HN API
  2. ArticleRepository.findById() -> Supabase (skip if exists)
  3. HackerNewsService.getStory() -> HN API
  4. ContentExtractor.extract() -> Jina Reader
  5. SummarizerService.summarize() -> Gemini AI
  6. ArticleRepository.save() -> Supabase
```

## Design Patterns

- **Repository Pattern**: Abstract data access (Supabase)
- **Service Pattern**: Business logic layer (HN, Jina, Gemini, Pipeline)
- **Constructor Injection**: All dependencies injected via constructor
- **Interface-first**: Every service has an interface for testability
- **Composition Root**: API route handlers wire real implementations

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free)
- Google Gemini API key (free)

### 1. Clone and install

```bash
git clone <repo-url>
cd daily-news
npm install
```

### 2. Set up Supabase

Create a Supabase project and run this SQL in the SQL Editor:

```sql
CREATE TABLE articles (
  id            BIGINT PRIMARY KEY,
  title         TEXT NOT NULL,
  url           TEXT,
  summary       TEXT NOT NULL,
  hn_score      INTEGER NOT NULL DEFAULT 0,
  author        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summarized_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_articles_summarized_at ON articles (summarized_at DESC);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON articles FOR SELECT USING (true);
CREATE POLICY "Service insert access" ON articles FOR INSERT WITH CHECK (true);
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
- `NEXT_PUBLIC_SUPABASE_URL` - from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - from Supabase project settings
- `GOOGLE_GEMINI_API_KEY` - from Google AI Studio
- `TRIGGER_SECRET` - any secret string for manual trigger auth
- `CRON_SECRET` - any secret string for cron job auth
- `JINA_API_KEY` - (optional) for higher Jina rate limits

### 4. Run locally

```bash
npm run dev
```

### 5. Trigger manually

```bash
curl -X POST http://localhost:3000/api/trigger \
  -H "Authorization: Bearer <your-trigger-secret>"
```

Or use the "Trigger Summary" button in the UI (prompts for secret).

### 6. Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set all environment variables in Vercel dashboard
4. Deploy - cron job will auto-register from `vercel.json`

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| POST | /api/trigger | Bearer TRIGGER_SECRET | Manual trigger |
| GET | /api/cron | Bearer CRON_SECRET | Vercel cron (daily 8am UTC) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Yes | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | Supabase anon key |
| GOOGLE_GEMINI_API_KEY | Yes | Gemini API key |
| TRIGGER_SECRET | Yes | Manual trigger auth secret |
| CRON_SECRET | Yes | Vercel cron auth secret |
| JINA_API_KEY | No | Jina Reader API key |

For local development, use `.env.local` (gitignored). For production, set in Vercel dashboard.

## Testing

57 tests across 12 test suites with 99%+ coverage:

```
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
All files              |   99.35 |    93.75 |     100 |   99.35 |
-----------------------|---------|----------|---------|---------|
```

## License

MIT
