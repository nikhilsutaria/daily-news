# Supabase Backend

This directory contains the backend for Daily News — a Supabase Edge Function that runs the news pipeline, and a pg_cron migration to schedule it daily.

## Structure

```
supabase/
├── functions/
│   └── run-pipeline/
│       └── index.ts        # Edge Function — fetches, summarizes, and stores HN articles
├── migrations/
│   └── 20260427000000_setup_cron.sql   # Enables pg_cron and schedules daily run
├── .env.example            # Template for local secrets
└── config.toml             # Supabase CLI config
```

## Setup

### 1. Link to your Supabase project

Find your project ref in [Supabase Dashboard](https://supabase.com/dashboard) > Project Settings > General.

```bash
npx supabase link --project-ref <your-project-ref>
```

### 2. Set secrets

These are the environment variables the Edge Function needs at runtime:

```bash
npx supabase secrets set GOOGLE_GEMINI_API_KEY=your-gemini-key
npx supabase secrets set TRIGGER_SECRET=your-trigger-secret
npx supabase secrets set JINA_API_KEY=your-jina-key   # optional
```

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available — you don't need to set them.

### 3. Deploy the Edge Function

```bash
npx supabase functions deploy run-pipeline
```

### 4. Apply the cron migration

This enables the `pg_cron` and `pg_net` extensions and schedules the pipeline to run **daily at 8:00 AM UTC**.

> **Before running**, open `supabase/migrations/20260427000000_setup_cron.sql` and verify the cron schedule (`0 8 * * *`) works for your timezone. Edit if needed.

```bash
npx supabase db push
```

### 5. Test the function

```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/run-pipeline \
  -H "Authorization: Bearer <your-trigger-secret>"
```

You should get a JSON response with `status: "created"`, `"skipped"`, or `"error"`.

## Local Development

Local development requires [Docker Desktop](https://docs.docker.com/desktop/) since Supabase CLI runs services in containers.

```bash
# Copy the example env file and fill in your keys
cp supabase/.env.example supabase/.env

# Start local Supabase + serve the function
npx supabase start
npx supabase functions serve --env-file supabase/.env
```

Then test locally:

```bash
curl -X POST http://localhost:54321/functions/v1/run-pipeline \
  -H "Authorization: Bearer <your-trigger-secret>"
```

## How the Cron Works

The migration sets up a [pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron) job that uses [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net) to make an HTTP POST to the Edge Function every day at 8:00 AM UTC. This runs entirely within Supabase — no external scheduler needed.

To check or manage the cron job, run this SQL in the Supabase SQL Editor:

```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule
SELECT cron.unschedule('run-news-pipeline');
```
