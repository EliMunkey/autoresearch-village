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
