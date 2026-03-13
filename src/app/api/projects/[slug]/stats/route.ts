import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { slugSchema } from '@/lib/validate'
import { applyRateLimit } from '@/lib/rate-limit'

export async function GET(
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

  const rateLimited = applyRateLimit(request, 'stats')
  if (rateLimited) return rateLimited

  try {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    // Expire old claims first
    await supabase
      .from('experiments')
      .update({ status: 'expired' })
      .eq('status', 'claimed')
      .lt('claimed_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())

    // Run all reads in parallel
    const [
      { count: activeAgents },
      { count: totalExperiments },
      { data: contributorRows },
      { data: globalBest },
      { data: project },
      { data: historyRows },
      { data: recentExperiments },
    ] = await Promise.all([
      supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('project_slug', slug)
        .gt('last_seen_at', twoMinAgo),
      supabase
        .from('experiments')
        .select('*', { count: 'exact', head: true })
        .eq('project_slug', slug)
        .eq('status', 'completed'),
      supabase
        .from('experiments')
        .select('agent_id')
        .eq('project_slug', slug)
        .eq('status', 'completed'),
      supabase
        .from('global_best')
        .select('*')
        .eq('project_slug', slug)
        .single(),
      supabase
        .from('projects')
        .select('metric_baseline, metric_direction')
        .eq('slug', slug)
        .single(),
      supabase
        .from('experiments')
        .select('completed_at, result_value')
        .eq('project_slug', slug)
        .eq('status', 'completed')
        .order('completed_at', { ascending: true }),
      supabase
        .from('experiments')
        .select('*')
        .eq('project_slug', slug)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10),
    ])

    const contributors = new Set(contributorRows?.map((r) => r.agent_id)).size
    const direction = project?.metric_direction ?? 'lower'

    // Build history with running best
    let runningBest: number | null = null
    const history = (historyRows ?? []).map((row) => {
      const value = row.result_value as number
      if (runningBest === null) {
        runningBest = value
      } else if (direction === 'lower' && value < runningBest) {
        runningBest = value
      } else if (direction === 'higher' && value > runningBest) {
        runningBest = value
      }
      return {
        timestamp: row.completed_at,
        value,
        best_so_far: runningBest,
      }
    })

    const response = NextResponse.json({
      active_agents: activeAgents ?? 0,
      total_experiments: totalExperiments ?? 0,
      contributors,
      best_result: globalBest?.best_value ?? null,
      baseline: project?.metric_baseline ?? null,
      metric_direction: direction,
      history,
      recent_experiments: recentExperiments ?? [],
    })

    response.headers.set(
      'Cache-Control',
      'private, s-maxage=10, stale-while-revalidate=30'
    )

    return response
  } catch (error) {
    console.error('Error in stats route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
