# Daily News - HackerNews Summarizer PWA

A Progressive Web App that fetches the #1 top story from Hacker News daily, summarizes it using AI, and presents it in a clean, readable format.

## Tech Stack (All Free Tier)

| Layer | Technology | Free Tier Limits |
|-------|-----------|-----------------|
| Frontend | Next.js + Tailwind CSS | - |
| Backend | Supabase Edge Functions (Deno) | 500K invocations/month |
| AI Summary | Google Gemini 2.0 Flash | 1,500 req/day |
| Content Extraction | Jina AI Reader API | 200 req/hour |
| News Source | Hacker News Firebase API | Unlimited |
| Database | Supabase PostgreSQL | 500MB |
| Scheduling | pg_cron (Supabase) | - |
| Hosting | Vercel | 100GB BW |
| PWA | @ducanh2912/next-pwa | - |

## Architecture

```
User -> Next.js Page (reads from Supabase DB)

pg_cron (daily 8am UTC) -----> run-pipeline (Edge Function)
Manual trigger button -------> run-pipeline (Edge Function)

run-pipeline Edge Function:
  1. Fetch top story ID from HN API
  2. Check if article exists in Supabase (skip if yes)
  3. Fetch full story from HN API
  4. Extract content via Jina Reader
  5. Summarize via Gemini AI
  6. Save article to Supabase
```

The project has two parts:
- **Frontend** (`src/`) — Next.js app deployed on Vercel, reads articles from Supabase
- **Backend** (`supabase/`) — Edge Function + pg_cron, deployed on Supabase

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free) — [supabase.com](https://supabase.com)
- Google Gemini API key (free) — [aistudio.google.com](https://aistudio.google.com)
- Jina API key (optional) — [jina.ai](https://jina.ai)

### 1. Clone and install

```bash
git clone <repo-url>
cd daily-news
npm install
```

### 2. Set up Supabase project

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Run this SQL in the **SQL Editor** to create the articles table:

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

### 3. Deploy the Edge Function (backend)

See [`supabase/README.md`](supabase/README.md) for full instructions on deploying the Edge Function and setting up the daily cron schedule.

### 4. Configure the frontend

```bash
cp .env.example .env.local
```

Edit `.env.local` — you only need two values (from your Supabase project settings > API):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Run the frontend locally

```bash
npm run dev
```

### 6. Test the trigger button

Click "Trigger Summary" in the UI and enter your `TRIGGER_SECRET` when prompted. This calls the Edge Function directly.

### 7. Deploy the frontend to Vercel

1. Push to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel dashboard
4. Deploy

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Environment Variables

### Frontend (Next.js) — set in `.env.local` or Vercel dashboard

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Yes | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | Supabase anon key |

### Backend (Edge Function) — set via `npx supabase secrets set`

| Variable | Required | Description |
|----------|----------|-------------|
| GOOGLE_GEMINI_API_KEY | Yes | Gemini API key |
| TRIGGER_SECRET | Yes | Auth secret for the Edge Function |
| JINA_API_KEY | No | Jina Reader API key (higher rate limits) |

## License

MIT
