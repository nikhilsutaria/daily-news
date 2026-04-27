# Daily News - HackerNews Summarizer PWA

A Progressive Web App that fetches the #1 top story from Hacker News daily, summarizes it using AI, and presents it in a clean, readable format.

## Tech Stack (All Free Tier)

| Layer | Technology | Free Tier Limits |
|-------|-----------|-----------------|
| Frontend | Next.js + Tailwind CSS | - |
| Backend | Supabase Edge Functions (Deno) | 500K invocations/month |
| AI Summary | Google Gemini Flash | 1,500 req/day |
| Content Extraction | Jina AI Reader API | 200 req/hour |
| News Source | Hacker News Firebase API | Unlimited |
| Database | Supabase PostgreSQL | 500MB |
| Scheduling | pg_cron + pg_net (Supabase) | - |
| Frontend Hosting | Vercel | 100GB BW |
| PWA | @ducanh2912/next-pwa | - |

## Architecture

This project has two independently deployed parts:

```
src/       -> Next.js frontend (deployed on Vercel)
supabase/  -> Edge Function + cron schedule (deployed on Supabase)
```

```
User -> Next.js Page (reads articles from Supabase DB)

pg_cron (daily 8am UTC) -----> run-pipeline Edge Function
Manual trigger button -------> run-pipeline Edge Function

run-pipeline Edge Function:
  1. Fetch top story ID from Hacker News API
  2. Check if article already exists in Supabase DB (skip if yes)
  3. Fetch full story details from Hacker News API
  4. Extract article content via Jina Reader API
  5. Summarize content via Google Gemini API (REST)
  6. Save article to Supabase DB
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier)
- A [Google Gemini API key](https://aistudio.google.com) (free tier)
- (Optional) A [Jina AI](https://jina.ai) API key for higher rate limits

### 1. Clone and install

```bash
git clone <repo-url>
cd daily-news
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
2. Once created, go to **SQL Editor** and run this to create the articles table:

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

### 3. Deploy the backend (Edge Function + cron)

Follow the step-by-step instructions in [`supabase/README.md`](supabase/README.md). This covers:
- Linking your Supabase project
- Setting secrets (Gemini key, trigger secret, etc.)
- Deploying the Edge Function
- Setting up the daily cron schedule via pg_cron

### 4. Configure and run the frontend

```bash
cp .env.example .env.local
```

Edit `.env.local` with values from your Supabase project (Project Settings > API):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Then start the dev server:

```bash
npm run dev
```

### 5. Test it

- **Via UI**: Click the "Trigger Summary" button and enter your `TRIGGER_SECRET` when prompted
- **Via curl**:
  ```bash
  curl -X POST https://<your-project-ref>.supabase.co/functions/v1/run-pipeline \
    -H "Authorization: Bearer <your-trigger-secret>"
  ```

### 6. Deploy the frontend to Vercel

1. Push to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add these environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Deployment Summary

| What | Where | How |
|------|-------|-----|
| Frontend (Next.js) | Vercel | Auto-deploys on git push |
| Edge Function | Supabase | `npx supabase functions deploy run-pipeline --no-verify-jwt` |
| Cron schedule | Supabase | SQL via dashboard (see [`supabase/README.md`](supabase/README.md)) |

## Environment Variables

### Frontend (Next.js) — set in `.env.local` or Vercel dashboard

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |

### Backend (Edge Function) — set via `npx supabase secrets set`

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GEMINI_API_KEY` | Yes | Google Gemini API key |
| `TRIGGER_SECRET` | Yes | Secret for authorizing Edge Function calls |
| `JINA_API_KEY` | No | Jina Reader API key (higher rate limits) |

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available inside Edge Functions — you don't need to set them.

## Scripts

```bash
npm run dev            # Start development server
npm run build          # Production build
npm run start          # Start production server
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

## License

MIT
