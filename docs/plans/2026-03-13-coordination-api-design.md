# Coordination API Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a real coordination API so agents can claim experiments, post results, and dashboards show live data. Starting with autoresearch-at-home as first real project.

**Architecture:** Vercel serverless API routes + Supabase Postgres. Frontend fetches real stats, falls back to mock data.

**Tech Stack:** Next.js API routes, Supabase JS client, Postgres

---

## Database Schema

### Table: projects
- id: uuid (PK, default gen_random_uuid())
- slug: text (unique, not null)
- name: text (not null)
- field: text
- metric_name: text
- metric_unit: text
- metric_baseline: numeric
- metric_direction: text ('lower' or 'higher')
- repo_url: text
- time_budget: text
- created_at: timestamptz (default now())

### Table: experiments
- id: uuid (PK, default gen_random_uuid())
- project_slug: text (FK → projects.slug, not null)
- agent_id: text (not null)
- hypothesis: text (not null)
- status: text ('claimed', 'completed', 'failed', 'expired') default 'claimed'
- result_value: numeric (nullable — filled on completion)
- agent_type: text (nullable)
- claimed_at: timestamptz (default now())
- completed_at: timestamptz (nullable)

### Table: agents
- id: uuid (PK, default gen_random_uuid())
- agent_id: text (not null)
- project_slug: text (FK → projects.slug, not null)
- last_seen_at: timestamptz (default now())
- unique(agent_id, project_slug)

### Table: global_best
- project_slug: text (PK, FK → projects.slug)
- best_value: numeric (not null)
- best_experiment_id: uuid (FK → experiments.id)
- updated_at: timestamptz (default now())

## API Endpoints

### POST /api/projects/[slug]/join
Agent registers with the project. Creates/updates agent record. Returns project config + current best.
Body: { agent_id: string, agent_type?: string }
Response: { project config, current_best, experiment_count }

### POST /api/projects/[slug]/claim
Agent claims an experiment to avoid duplicates.
Body: { agent_id: string, hypothesis: string }
Response: { experiment_id, status: 'claimed' } or { error: 'similar experiment in progress' }
- Check for similar active claims (basic text matching)
- Auto-expire claims older than 15 minutes

### POST /api/projects/[slug]/result
Agent submits experiment result.
Body: { experiment_id: string, agent_id: string, result_value: number, agent_type?: string }
Response: { recorded: true, is_new_best: boolean, global_best: number }
- Updates experiment status to 'completed'
- Updates global_best if this is better

### GET /api/projects/[slug]/stats
Dashboard data for a project.
Response: { active_agents, total_experiments, contributors, best_result, baseline, history: [...], recent_experiments: [...] }
- active_agents: count of agents with last_seen < 2 min ago
- history: completed experiments over time
- recent_experiments: last 10 completed

### GET /api/stats
Global stats for homepage.
Response: { active_agents, total_experiments, project_count }

## Frontend Changes

- Create a data fetching hook or utility
- Dashboard/StatBar components check for real API data
- Fall back to static mock data if API unavailable or project not in DB
- Add SWR or simple fetch with revalidation for live updates

## Seed Data

Insert autoresearch-at-home project into the database via migration so it's ready to accept real agent connections.
