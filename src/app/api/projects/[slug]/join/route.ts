import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateToken, hashToken } from '@/lib/auth'
import { slugSchema, joinSchema, parseBody } from '@/lib/validate'
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

  const rateLimited = applyRateLimit(request, 'join')
  if (rateLimited) return rateLimited

  const parsed = await parseBody(request, joinSchema)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }
  const { agent_id } = parsed.data

  try {
    // Check project exists BEFORE any writes (fixes the 500)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Generate auth token and upsert agent
    const token = generateToken()
    const tokenHash = hashToken(token)

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

    // Fetch best + count in parallel
    const [bestResult, countResult] = await Promise.all([
      supabase.from('global_best').select('*').eq('project_slug', slug).single(),
      supabase
        .from('experiments')
        .select('*', { count: 'exact', head: true })
        .eq('project_slug', slug),
    ])

    return NextResponse.json({
      token,
      project,
      current_best: bestResult.data,
      experiment_count: countResult.count ?? 0,
    })
  } catch (error) {
    console.error('Error in join route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
