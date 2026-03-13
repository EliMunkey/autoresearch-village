import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateToken } from '@/lib/auth'
import { slugSchema, resultSchema, parseBody } from '@/lib/validate'
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

  const rateLimited = applyRateLimit(request, 'result')
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

  const parsed = await parseBody(request, resultSchema)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }
  const { experiment_id, result_value, agent_type } = parsed.data

  try {
    // Update experiment — agent_id from auth, not from body
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

    // Fetch project direction + global best in parallel
    const [projectResult, bestResult] = await Promise.all([
      supabase
        .from('projects')
        .select('metric_direction')
        .eq('slug', slug)
        .single(),
      supabase
        .from('global_best')
        .select('*')
        .eq('project_slug', slug)
        .single(),
    ])

    if (projectResult.error) throw projectResult.error

    const globalBest = bestResult.data
    let isNewBest = false
    const direction = projectResult.data.metric_direction ?? 'lower'

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
      } else if (
        direction === 'higher' &&
        result_value > globalBest.best_value
      ) {
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

    // Update agent's last_seen_at (fire and forget)
    supabase
      .from('agents')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('agent_id', agent.agent_id)
      .eq('project_slug', slug)
      .then(() => {})

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
