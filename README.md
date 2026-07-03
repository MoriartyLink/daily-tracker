# Daily Tracker

Track your daily journal, tasks, mental/physical status, projects, and insights — all in one place.

## Features

- **Journal** — Daily entries with tasks, mood tracking, and reflections
- **Insights** — Weekly/monthly summaries and charts
- **Projects** — Kanban boards with milestones and cards
- **Profile** — Personal goals and fun facts
- **Auth** — Sign up / log in with Supabase Auth
- **Multi-user** — Each user's data is isolated by `user_id`
- **Offline** — LocalStorage fallback when Supabase is unavailable

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (Auth + Postgres)
- **Charts:** Recharts
- **Testing:** Vitest + React Testing Library

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/MoriartyLink/daily-tracker.git
cd daily-tracker
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GROQ_API_KEY=your-groq-api-key  # optional, for AI insights
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema:

```sql
-- Run supabase-schema.sql from this repo
```

3. Enable **Email** auth in **Authentication → Providers**
4. In **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:5173`
   - **Redirect URLs:** Add `http://localhost:5173/**`

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:5173` and sign up / log in.

### 5. Run tests

```bash
npm test
```

### 6. Build for production

```bash
npm run build
```

## Deploying to Vercel

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add these **Environment Variables** in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GROQ_API_KEY` (optional)
4. Deploy

After first deploy, update Supabase **Redirect URLs** to include your Vercel domain:
```
https://your-project.vercel.app/**
```

## Database Migrations

If you already have data from an earlier version (before multi-user support), run the migration in Supabase SQL Editor:

```bash
# Run supabase-migration-add-user-id.sql from this repo
```

This adds `user_id` columns to all tables and enables per-user data isolation with RLS policies.

## Project Structure

```
src/
  components/      # Reusable UI components (shadcn/ui)
  contexts/        # React contexts (DataContext, SidebarContext)
  hooks/           # Custom hooks
  lib/             # Supabase client
  pages/           # Route pages (Journal, Insights, Projects, Profile, Auth)
  types/           # TypeScript interfaces
tests/             # Vitest tests (outside src/ for build compatibility)
supabase-schema.sql          # Initial database schema
supabase-migration-add-user-id.sql  # Migration for existing databases
```

## License

MIT
