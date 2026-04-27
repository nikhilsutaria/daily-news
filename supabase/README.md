# Supabase Backend

This directory contains the backend for Daily News:

- **Edge Function** (`functions/run-pipeline/`) — fetches the top Hacker News story, extracts content, summarizes it with Gemini AI, and saves it to the database
- **Cron schedule** (`migrations/`) — pg_cron job that triggers the Edge Function daily at 8:00 AM UTC

Both the manual "Trigger Summary" button in the UI and the daily cron call the same Edge Function.

## Structure

```
supabase/
├── functions/
│   └── run-pipeline/
│       └── index.ts                        # The Edge Function
├── migrations/
│   └── 20260427000000_setup_cron.sql       # pg_cron + pg_net setup (reference only)
├── .env.example                            # Template for local dev secrets
├── config.toml                             # Supabase CLI config
└── README.md                               # You are here
```

## Setup (Step by Step)

### Prerequisites

- Node.js 18+ (Supabase CLI runs via `npx`)
- A Supabase project already created ([supabase.com/dashboard](https://supabase.com/dashboard))
- Your project ref (found in Project Settings > General)

### Step 1: Link to your Supabase project

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

### Step 2: Set secrets

The Edge Function needs these environment variables at runtime. Set them with:

```bash
npx supabase secrets set GOOGLE_GEMINI_API_KEY=<your-gemini-key>
npx supabase secrets set TRIGGER_SECRET=<your-trigger-secret>
npx supabase secrets set JINA_API_KEY=<your-jina-key>    # optional
```

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available inside Edge Functions — you don't need to set them.

### Step 3: Deploy the Edge Function

```bash
npx supabase functions deploy run-pipeline --no-verify-jwt
```

> `--no-verify-jwt` is required because this function uses a custom `TRIGGER_SECRET` for auth instead of Supabase's default JWT verification.

### Step 4: Test the Edge Function

```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/run-pipeline \
  -H "Authorization: Bearer <your-trigger-secret>"
```

Expected response (one of):
- `{"status": "created", "article": {...}, "message": "Successfully summarized: ..."}` — new article saved
- `{"status": "skipped", "message": "Article ... already summarized"}` — already exists
- `{"status": "error", "message": "..."}` — something went wrong

You can also test from the Supabase Dashboard: **Edge Functions > run-pipeline > Test** (select "service_role" auth).

### Step 5: Set up the daily cron schedule

Run the following SQL in the **Supabase Dashboard > SQL Editor**.

First, enable the required extensions:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

> If `pg_cron` is not available via SQL, enable it from **Dashboard > Database > Extensions** and search for "pg_cron".

Then create the cron job (replace the two placeholders with your actual values):

```sql
SELECT cron.schedule(
  'run-news-pipeline',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/run-pipeline',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_TRIGGER_SECRET>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

This runs the pipeline every day at **8:00 AM UTC**.

### Verify the cron job

```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- View recent execution history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Trigger the cron manually

pg_cron doesn't have a "run now" button. To trigger it manually, run the HTTP call directly in the SQL Editor:

```sql
SELECT net.http_post(
  url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/run-pipeline',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_TRIGGER_SECRET>"}'::jsonb,
  body := '{}'::jsonb
);
```

### Remove the cron job

```sql
SELECT cron.unschedule('run-news-pipeline');
```

## Local Development

Local development requires [Docker Desktop](https://docs.docker.com/desktop/) since the Supabase CLI runs Postgres, Auth, and the Edge Runtime in containers.

```bash
# Copy the example env file and fill in your keys
cp supabase/.env.example supabase/.env

# Start local Supabase services
npx supabase start

# Serve the Edge Function locally
npx supabase functions serve --env-file supabase/.env
```

Test locally:

```bash
curl -X POST http://localhost:54321/functions/v1/run-pipeline \
  -H "Authorization: Bearer <your-trigger-secret>"
```

## Auth

The Edge Function accepts requests from three sources:

| Source | Auth method |
|--------|-------------|
| UI trigger button | `Authorization: Bearer <TRIGGER_SECRET>` |
| pg_cron (daily) | `Authorization: Bearer <TRIGGER_SECRET>` |
| Supabase Dashboard test | Supabase JWT (anon or service_role) — auto-validated |

JWT verification is disabled at the gateway level (`--no-verify-jwt`). The function handles auth internally.
