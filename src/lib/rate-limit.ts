/**
 * Simple in-memory sliding window rate limiter.
 * Does not persist across serverless cold starts — acceptable
 * for basic abuse prevention without external dependencies.
 */

import { NextResponse } from 'next/server'

const windowMs = 60_000 // 1 minute
const maxRequests: Record<string, number> = {
  join: 10,
  claim: 20,
  result: 20,
  stats: 60,
}

const hits = new Map<string, number[]>()

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

function checkRateLimit(
  ip: string,
  endpoint: string
): { allowed: boolean; retryAfterMs?: number } {
  const limit = maxRequests[endpoint] ?? 30
  const key = `${ip}:${endpoint}`
  const now = Date.now()
  const cutoff = now - windowMs

  const timestamps = (hits.get(key) ?? []).filter((t) => t > cutoff)

  if (timestamps.length === 0 && hits.has(key)) {
    hits.delete(key)
  }

  timestamps.push(now)
  hits.set(key, timestamps)

  if (timestamps.length > limit) {
    const oldest = timestamps[0]
    return { allowed: false, retryAfterMs: oldest + windowMs - now }
  }

  return { allowed: true }
}

function getRateLimitHeaders(
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

/**
 * Check rate limit and return a 429 response if exceeded.
 * Returns null if allowed.
 */
export function applyRateLimit(
  request: Request,
  endpoint: string
): NextResponse | null {
  const ip = getClientIp(request)
  const rl = checkRateLimit(ip, endpoint)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 60000) / 1000)),
          ...getRateLimitHeaders(ip, endpoint),
        },
      }
    )
  }
  return null
}
