# API Security Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 500 error on the coordination API and harden all endpoints against the issues found in the security audit — auth tokens, input validation, rate limiting, security headers, info disclosure, and race conditions.

**Architecture:** Keep the existing route structure. Add a shared `src/lib/auth.ts` for token generation/validation, a `src/lib/validate.ts` for Zod schemas, a `src/lib/rate-limit.ts` for in-memory rate limiting, and a `src/middleware.ts` for security headers. Add a DB migration for the `auth_token_hash` column on the `agents` table. Each API route gets hardened in-place.

**Tech Stack:** Next.js 16, Supabase, Zod (new dep), Node crypto (built-in)

---

## Task 1: Install Zod

**Files:**
- Modify: `package.json`

**Step 1: Install zod**

Run: `npm install zod`

**Step 2: Verify**

Run: `npm ls zod`
Expected: `zod@3.x.x`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add zod for input validation"
```

---

## Task 2: Add DB migration for auth tokens

**Files:**
- Create: `supabase/migrations/003_agent_auth_tokens.sql`

**Step 1: Write the migration**

```sql
-- Add auth token hash column to agents table
ALTER TABLE agents ADD COLUMN auth_token_hash text;

-- Index for fast token lookups
CREATE INDEX idx_agents_auth_token ON agents(auth_token_hash);

-- Add compound index for claim expiration queries (missing from original schema)
CREATE INDEX idx_experiments_status_claimed ON experiments(status, claimed_at);

-- Add CHECK constraint on result_value to prevent extreme values
ALTER TABLE experiments ADD CONSTRAINT chk_result_value
  CHECK (result_value IS NULL OR (result_value > -1e9 AND result_value < 1e9));
```

**Step 2: Commit**

```bash
git add supabase/migrations/003_agent_auth_tokens.sql
git commit -m "feat: add auth token column and missing indexes"
```

> **Note for executor:** This migration must be applied to the production Supabase instance manually via the Supabase dashboard SQL editor or `supabase db push`.

---

## Task 3: Create auth helper (`src/lib/auth.ts`)

**Files:**
- Create: `src/lib/auth.ts`

**Step 1: Write the auth module**

```typescript
import { randomBytes, createHash } from 'crypto'
import { supabase } from './supabase'

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Validate a Bearer token from the Authorization header.
 * Returns the agent record if valid, null otherwise.
 */
export async function validateToken(
  request: Request
): Promise<{ agent_id: string; project_slug: string } | null> {
  if (!supabase) return null

  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  if (!token || token.length !== 64) return null

  const hash = hashToken(token)

  const { data, error } = await supabase
    .from('agents')
    .select('agent_id, project_slug')
    .eq('auth_token_hash', hash)
    .single()

  if (error || !data) return null
  return data
}
```

**Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add auth token generation and validation helpers"
```

---

## Task 4: Create input validation schemas (`src/lib/validate.ts`)

**Files:**
- Create: `src/lib/validate.ts`

**Step 1: Write the validation module**

```typescript
import { z } from 'zod'

export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')

export const joinSchema = z.object({
  agent_id: z.string().min(1).max(255),
  agent_type: z.string().max(100).optional(),
})

export const claimSchema = z.object({
  agent_id: z.string().min(1).max(255),
  hypothesis: z.string().min(1).max(2000),
})

export const resultSchema = z.object({
  experiment_id: z.string().uuid(),
  agent_id: z.string().min(1).max(255),
  result_value: z.number().finite().gte(-1e9).lte(1e9),
  agent_type: z.string().max(100).optional(),
})

/**
 * Parse and validate request JSON body against a Zod schema.
 * Returns { data } on success, { error, status } on failure.
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: string; status: number }> {
  const contentType = request.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    return { error: 'Content-Type must be application/json', status: 415 }
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return { error: 'Invalid JSON body', status: 400 }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    return { error: message, status: 400 }
  }

  return { data: result.data }
}
```

**Step 2: Commit**

```bash
git add src/lib/validate.ts
git commit -m "feat: add Zod validation schemas for all API inputs"
```

---

## Task 5: Create rate limiter (`src/lib/rate-limit.ts`)

**Files:**
- Create: `src/lib/rate-limit.ts`

**Step 1: Write the rate limiter**

```typescript
/**
 * Simple in-memory sliding window rate limiter.
 * Note: Does not persist across serverless cold starts — that's acceptable
 * for basic abuse prevention without external dependencies.
 */

const windowMs = 60_000 // 1 minute
const maxRequests: Record<string, number> = {
  join: 10,
  claim: 20,
  result: 20,
  stats: 60,
}

const hits = new Map<string, number[]>()

// Periodically clean old entries to prevent memory leaks
setInterval(() => {
  const cutoff = Date.now() - windowMs
  for (const [key, timestamps] of hits) {
    const filtered = timestamps.filter((t) => t > cutoff)
    if (filtered.length === 0) hits.delete(key)
    else hits.set(key, filtered)
  }
}, 60_000)

export function checkRateLimit(
  ip: string,
  endpoint: string
): { allowed: boolean; retryAfterMs?: number } {
  const limit = maxRequests[endpoint] ?? 30
  const key = `${ip}:${endpoint}`
  const now = Date.now()
  const cutoff = now - windowMs

  const timestamps = (hits.get(key) ?? []).filter((t) => t > cutoff)
  timestamps.push(now)
  hits.set(key, timestamps)

  if (timestamps.length > limit) {
    const oldest = timestamps[0]
    return { allowed: false, retryAfterMs: oldest + windowMs - now }
  }

  return { allowed: true }
}

export function getRateLimitHeaders(
  ip: string,
  endpoint: string
): Record<string, string> {
  const limit = maxRequests[endpoint] ?? 30
  const key = `${ip}:${endpoint}`
  const cutoff = Date.now() - windowMs
  const timestamps = (hits.get(key) ?? []).filter((t) => t > cutoff)

  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, limit - timestamps.length)),
    'X-RateLimit-Reset': String(Math.ceil((cutoff + windowMs) / 1000)),
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/rate-limit.ts
git commit -m "feat: add in-memory rate limiter for API endpoints"
```

---

## Task 6: Add security headers middleware (`src/middleware.ts`)

**Files:**
- Create: `src/middleware.ts`

**Step 1: Write the middleware**

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.ensue-network.ai; font-src 'self' data:; frame-ancestors 'none'"
  )

  return response
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add security headers middleware"
```

---

## Task 7: Harden `/join` route (fix 500 + add auth token)

**Files:**
- Modify: `src/app/api/projects/[slug]/join/route.ts`

**Step 1: Rewrite the route**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateToken, hashToken } from '@/lib/auth'
import { slugSchema, joinSchema, parseBody } from '@/lib/validate'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  // Validate slug
  const slugResult = slugSchema.safeParse(slug)
  if (!slugResult.success) {
    return NextResponse.json({ error: 'Invalid project slug' }, { status: 400 })
  }

  // Rate limit
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(ip, 'join')
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 60000) / 1000)),
          ...getRateLimitHeaders(ip, 'join'),
        },
      }
    )
  }

  // Validate body
  const parsed = await parseBody(request, joinSchema)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }
  const { agent_id, agent_type } = parsed.data

  try {
    // Check project exists BEFORE any writes
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Generate auth token
    const token = generateToken()
    const tokenHash = hashToken(token)

    // Upsert agent with new token
    const { error: agentError } = await supabase
      .from('agents')
      .upsert(
        {
          agent_id,
          project_slug: slug,
          auth_token_hash: tokenHash,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'agent_id,project_slug' }
      )

    if (agentError) throw agentError

    // Fetch current best
    const { data: currentBest } = await supabase
      .from('global_best')
      .select('*')
      .eq('project_slug', slug)
      .single()

    // Count total experiments
    const { count: experimentCount } = await supabase
      .from('experiments')
      .select('*', { count: 'exact', head: true })
      .eq('project_slug', slug)

    const response = NextResponse.json({
      token,
      project,
      current_best: currentBest,
      experiment_count: experimentCount ?? 0,
    })

    const rlHeaders = getRateLimitHeaders(ip, 'join')
    for (const [k, v] of Object.entries(rlHeaders)) {
      response.headers.set(k, v)
    }

    return response
  } catch (error) {
    console.error('Error in join route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/projects/[slug]/join/route.ts
git commit -m "fix: harden /join route — validate input, check project first, return auth token"
```

---

## Task 8: Harden `/claim` route

**Files:**
- Modify: `src/app/api/projects/[slug]/claim/route.ts`

**Step 1: Rewrite the route**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateToken } from '@/lib/auth'
import { slugSchema, claimSchema, parseBody } from '@/lib/validate'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  // Validate slug
  const slugResult = slugSchema.safeParse(slug)
  if (!slugResult.success) {
    return NextResponse.json({ error: 'Invalid project slug' }, { status: 400 })
  }

  // Rate limit
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(ip, 'claim')
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 60000) / 1000)),
          ...getRateLimitHeaders(ip, 'claim'),
        },
      }
    )
  }

  // Authenticate
  const agent = await validateToken(request)
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify token matches this project
  if (agent.project_slug !== slug) {
    return NextResponse.json(
      { error: 'Token not valid for this project' },
      { status: 403 }
    )
  }

  // Validate body
  const parsed = await parseBody(request, claimSchema)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }
  const { hypothesis } = parsed.data

  try {
    // Check project exists
    const { data: project } = await supabase
      .from('projects')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Expire old claims (older than 15 minutes)
    await supabase
      .from('experiments')
      .update({ status: 'expired' })
      .eq('status', 'claimed')
      .lt('claimed_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())

    // Check for duplicate: exact match, case-insensitive
    const { data: existing } = await supabase
      .from('experiments')
      .select('id')
      .eq('project_slug', slug)
      .eq('status', 'claimed')
      .ilike('hypothesis', hypothesis)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Similar experiment already claimed' },
        { status: 409 }
      )
    }

    // Insert new experiment — use agent_id from the authenticated token
    const { data: experiment, error: insertError } = await supabase
      .from('experiments')
      .insert({
        project_slug: slug,
        agent_id: agent.agent_id,
        hypothesis,
        status: 'claimed',
        claimed_at: new Date().toISOString(),
      })
      .select('id, status')
      .single()

    if (insertError) throw insertError

    // Update agent's last_seen_at
    await supabase
      .from('agents')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('agent_id', agent.agent_id)
      .eq('project_slug', slug)

    return NextResponse.json({
      experiment_id: experiment.id,
      status: 'claimed',
    })
  } catch (error) {
    console.error('Error in claim route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

Key changes from original:
- Requires `Authorization: Bearer <token>` — agent_id derived from token, not from body
- Removed info disclosure: no longer returns `existing_hypothesis` on 409
- Added project existence check before writes
- Input validated via Zod

**Step 2: Commit**

```bash
git add src/app/api/projects/[slug]/claim/route.ts
git commit -m "fix: harden /claim route — require auth, remove info disclosure, validate input"
```

---

## Task 9: Harden `/result` route

**Files:**
- Modify: `src/app/api/projects/[slug]/result/route.ts`

**Step 1: Rewrite the route**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateToken } from '@/lib/auth'
import { slugSchema, resultSchema, parseBody } from '@/lib/validate'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  // Validate slug
  const slugResult = slugSchema.safeParse(slug)
  if (!slugResult.success) {
    return NextResponse.json({ error: 'Invalid project slug' }, { status: 400 })
  }

  // Rate limit
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(ip, 'result')
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 60000) / 1000)),
          ...getRateLimitHeaders(ip, 'result'),
        },
      }
    )
  }

  // Authenticate
  const agent = await validateToken(request)
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (agent.project_slug !== slug) {
    return NextResponse.json(
      { error: 'Token not valid for this project' },
      { status: 403 }
    )
  }

  // Validate body
  const parsed = await parseBody(request, resultSchema)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }
  const { experiment_id, result_value, agent_type } = parsed.data

  try {
    // Update experiment — use agent_id from auth, not from body
    const { data: updated, error: updateError } = await supabase
      .from('experiments')
      .update({
        status: 'completed',
        result_value,
        agent_type: agent_type ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', experiment_id)
      .eq('agent_id', agent.agent_id)
      .eq('status', 'claimed')
      .select()

    if (updateError) throw updateError

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: 'Experiment not found or not owned by this agent' },
        { status: 404 }
      )
    }

    // Fetch project metric direction
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('metric_direction')
      .eq('slug', slug)
      .single()

    if (projectError) throw projectError

    // Check and update global best
    const { data: globalBest } = await supabase
      .from('global_best')
      .select('*')
      .eq('project_slug', slug)
      .single()

    let isNewBest = false
    const direction = project.metric_direction ?? 'lower'

    if (!globalBest) {
      isNewBest = true
      await supabase.from('global_best').insert({
        project_slug: slug,
        best_value: result_value,
        best_experiment_id: experiment_id,
        updated_at: new Date().toISOString(),
      })
    } else {
      if (direction === 'lower' && result_value < globalBest.best_value) {
        isNewBest = true
      } else if (direction === 'higher' && result_value > globalBest.best_value) {
        isNewBest = true
      }

      if (isNewBest) {
        await supabase
          .from('global_best')
          .update({
            best_value: result_value,
            best_experiment_id: experiment_id,
            updated_at: new Date().toISOString(),
          })
          .eq('project_slug', slug)
      }
    }

    const bestValue = isNewBest
      ? result_value
      : (globalBest?.best_value ?? result_value)

    // Update agent's last_seen_at
    await supabase
      .from('agents')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('agent_id', agent.agent_id)
      .eq('project_slug', slug)

    return NextResponse.json({
      recorded: true,
      is_new_best: isNewBest,
      global_best: bestValue,
    })
  } catch (error) {
    console.error('Error in result route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

Key changes:
- Auth required — agent_id derived from token
- `result_value` validated as finite number within bounds via Zod
- `experiment_id` validated as UUID
- agent_id from body is ignored, auth token is the source of truth

**Step 2: Commit**

```bash
git add src/app/api/projects/[slug]/result/route.ts
git commit -m "fix: harden /result route — require auth, validate result bounds"
```

---

## Task 10: Harden `/stats` routes (rate limit + slug validation)

**Files:**
- Modify: `src/app/api/projects/[slug]/stats/route.ts`
- Modify: `src/app/api/stats/route.ts`

**Step 1: Add rate limiting and slug validation to project stats**

At the top of the GET handler in `src/app/api/projects/[slug]/stats/route.ts`, add after the slug extraction:

```typescript
import { slugSchema } from '@/lib/validate'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
```

Add after `const { slug } = await params`:

```typescript
  // Validate slug
  const slugResult = slugSchema.safeParse(slug)
  if (!slugResult.success) {
    return NextResponse.json({ error: 'Invalid project slug' }, { status: 400 })
  }

  // Rate limit
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(ip, 'stats')
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 60000) / 1000)) } }
    )
  }
```

Change cache header from `public` to `private`:

```typescript
  'Cache-Control',
  'private, s-maxage=10, stale-while-revalidate=30'
```

**Step 2: Add rate limiting to global stats**

Add the same rate limiting pattern to `src/app/api/stats/route.ts` (no slug needed). Change cache from `public` to `private`.

**Step 3: Commit**

```bash
git add src/app/api/projects/[slug]/stats/route.ts src/app/api/stats/route.ts
git commit -m "fix: add rate limiting and private cache to stats endpoints"
```

---

## Task 11: Wrap Ensue JSON parsing in try/catch

**Files:**
- Modify: `src/lib/ensue.ts`

**Step 1: Fix unsafe JSON.parse on line 36**

Change:
```typescript
  const best = JSON.parse(bestData.value)
```

To:
```typescript
  let best: { val_bpb: number; agent_id?: string; description?: string; achieved_at?: string }
  try {
    best = JSON.parse(bestData.value)
  } catch {
    return null
  }
  if (typeof best.val_bpb !== 'number') return null
```

**Step 2: Commit**

```bash
git add src/lib/ensue.ts
git commit -m "fix: safe JSON parsing in Ensue integration"
```

---

## Task 12: Build and verify

**Step 1: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Smoke test locally**

Run: `npm run dev`

Test the join endpoint:
```bash
curl -X POST http://localhost:3000/api/projects/autoresearch-at-home/join \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "test-agent-1"}'
```

Expected: 200 with `{ token: "...", project: {...}, ... }` (if Supabase is configured) or 503 (if not)

Test rate limiting:
```bash
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/projects/autoresearch-at-home/join \
    -H "Content-Type: application/json" \
    -d '{"agent_id": "test-agent-1"}'
done
```

Expected: First 10 return 200 (or 503), then 429.

Test validation rejection:
```bash
curl -X POST http://localhost:3000/api/projects/autoresearch-at-home/claim \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "x"}'
```

Expected: 401 Unauthorized (no Bearer token)

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: security hardening complete — auth, validation, rate limiting, headers"
```
