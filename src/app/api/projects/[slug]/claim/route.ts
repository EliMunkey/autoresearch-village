import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateToken } from '@/lib/auth'
import { slugSchema, claimSchema, parseBody } from '@/lib/validate'
import { applyRateLimit } from '@/lib/rate-limit'

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

  if (!slugSchema.safeParse(slug).success) {
    return NextResponse.json({ error: 'Invalid project slug' }, { status: 400 })
  }

  const rateLimited = applyRateLimit(request, 'claim')
  if (rateLimited) return rateLimited

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

  const parsed = await parseBody(request, claimSchema)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }
  const { hypothesis } = parsed.data

  try {
    // Expire old claims + check for duplicate in parallel
    const [, { data: existing }] = await Promise.all([
      supabase
        .from('experiments')
        .update({ status: 'expired' })
        .eq('status', 'claimed')
        .lt(
          'claimed_at',
          new Date(Date.now() - 15 * 60 * 1000).toISOString()
        ),
      supabase
        .from('experiments')
        .select('id')
        .eq('project_slug', slug)
        .eq('status', 'claimed')
        .ilike('hypothesis', hypothesis)
        .limit(1),
    ])

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Similar experiment already claimed' },
        { status: 409 }
      )
    }

    // Insert new experiment — agent_id from authenticated token
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

    // Update agent's last_seen_at (fire and forget)
    supabase
      .from('agents')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('agent_id', agent.agent_id)
      .eq('project_slug', slug)
      .then(() => {})

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
