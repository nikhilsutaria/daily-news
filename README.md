# Daily News - HackerNews Summarizer PWA

A Progressive Web App that fetches top stories from Hacker News, summarizes each article using AI, and presents them in a clean, readable format.

## Features

- 📰 Fetch top stories from Hacker News
- 🤖 AI-powered article summarization (one paragraph per article)
- 📱 Progressive Web App (installable, offline support)
- ⚡ Fast and responsive UI
- 💾 Smart caching to avoid re-summarizing articles
- 🆓 Completely free to host and run

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
  - Built-in PWA support with `next-pwa`
  - Server-side rendering for better performance
  - React-based, modern development experience
- **Styling**: Tailwind CSS
  - Utility-first CSS framework
  - Responsive design out of the box
- **UI Components**: shadcn/ui (optional)
  - Beautiful, accessible components
  - Built on Radix UI

### Backend & APIs
- **News Source**: Hacker News API
  - Official API: `https://hacker-news.firebaseio.com/v0/`
  - Endpoints: `/topstories`, `/item/{id}`
  - Completely free, no rate limits
- **AI Summarization**: Google Gemini API
  - Free tier: 15 requests/minute, 1500 requests/day
  - High-quality text summarization
  - No credit card required for free tier
- **Article Content**: Jina AI Reader API
  - Free tier: Convert any URL to clean markdown
  - API: `https://r.jina.ai/{url}`
  - Fallback: Mozilla Readability for client-side parsing

### Database & Storage
- **Database**: Supabase (PostgreSQL)
  - Free tier: 500MB database, 1GB file storage
  - Used for caching article summaries
  - Prevents re-summarizing the same articles
  - Schema:
    ```sql
    articles (
      id: bigint (HN story ID),
      title: text,
      url: text,
      summary: text,
      created_at: timestamp,
      hn_score: int
    )
    ```

### Hosting & Deployment
- **Hosting**: Vercel
  - Free tier: unlimited personal projects
  - Automatic CI/CD from GitHub
  - Edge functions for API routes
  - Automatic PWA optimization

### PWA Features
- **Service Worker**: For offline support
- **Web Manifest**: For installability
- **Caching Strategy**: 
  - Cache-first for static assets
  - Network-first for API calls with cache fallback
- **Offline Mode**: Show cached summaries when offline

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌────────────────┐              ┌──────────────────┐
│  Hacker News   │              │  Supabase DB     │
│      API       │              │  (Cache)         │
└────────┬───────┘              └──────────────────┘
         │
         ▼
┌────────────────┐
│  Jina Reader   │
│      API       │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  Gemini AI     │
│  (Summarizer)  │
└────────────────┘
```

## Data Flow

1. User opens the app
2. Fetch top 30 stories from Hacker News API
3. For each story:
   - Check Supabase cache for existing summary
   - If cached: Display immediately
   - If not cached:
     - Fetch article content via Jina Reader API
     - Send to Gemini API for summarization
     - Store summary in Supabase
     - Display to user
4. PWA service worker caches everything for offline access

## Environment Variables

```env
# Gemini AI
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Jina AI (if you hit rate limits)
JINA_API_KEY=your_jina_api_key
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel deploy
```

## Free Tier Limits

- **Gemini API**: 1,500 requests/day (sufficient for ~50 users/day reading 30 articles)
- **Supabase**: 500MB database (can store ~100,000 summaries)
- **Vercel**: 100GB bandwidth/month (plenty for personal use)
- **Jina Reader**: 200 requests/hour on free tier

## Cost Optimization

- Summaries are cached in Supabase (never re-summarize)
- Service worker caches UI and data for offline use
- Batch summarization: summarize on-demand when user scrolls/clicks
- Optional: summarize only top 10-20 stories instead of all

## Future Enhancements

- [ ] User preferences (number of stories, categories)
- [ ] Dark mode
- [ ] Share summaries
- [ ] Save favorites
- [ ] Push notifications for hot topics
- [ ] Filter by topic/keyword

## License

MIT
