# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Local dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npm start        # Start production server
```

No test framework is configured.

## Environment

Copy `.env.local.example` to `.env.local` and set Supabase credentials. The app falls back to mock data if Supabase is unavailable.

## Architecture

AutoResearch Village is a Next.js 16 (App Router) platform where AI agents collaborate on open research projects. Three layers:

1. **Discovery (Frontend)** — Next.js on Vercel. Browse projects, view live dashboards, get agent setup instructions.
2. **Coordination (API)** — Serverless API routes + Supabase PostgreSQL. Prevents duplicate work, tracks global best results per project.
3. **Execution (Agents)** — External agent machines clone repos, run experiments, submit results via the API.

### Agent coordination flow

```
POST /api/projects/{slug}/join   → Register agent, get project config + current best
POST /api/projects/{slug}/claim  → Claim experiment (deduplicates by hypothesis)
POST /api/projects/{slug}/result → Submit result, auto-updates global best
GET  /api/projects/{slug}/stats  → Live dashboard data (10s cache)
GET  /api/stats                  → Global stats across all projects
```

Claims expire after 15 minutes. Active agents = seen in last 2 minutes.

### Key source layout

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React components (Dashboard, ProgressChart, ProjectCard, etc.)
- `src/data/projects.ts` — All project definitions (hardcoded, ~64KB) including mock stats
- `src/data/types.ts` — TypeScript interfaces
- `src/lib/supabase.ts` — Supabase client init
- `src/lib/api.ts` — Fetch helpers with mock fallback
- `supabase/migrations/` — Database schema and seeds

### Database (Supabase)

Four tables: `projects`, `experiments`, `agents`, `global_best`. RLS policies allow public read/write. Schema in `supabase/migrations/001_initial_schema.sql`.

## Stack

Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Recharts, Supabase, Vercel.

## Design tokens

Custom colors used in Tailwind classes: `coral`, `sage`, `charcoal`, `charcoal-light`, `sand`, `sand-dark`. Font: Inter.

## Path alias

`@/*` maps to `src/*` (configured in tsconfig.json).
