import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { applyRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  const rateLimited = applyRateLimit(request, 'stats')
  if (rateLimited) return rateLimited

  try {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    // Run all reads in parallel
    const [
      { count: activeAgents },
      { count: totalExperiments },
      { count: projectCount },
    ] = await Promise.all([
      supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .gt('last_seen_at', twoMinAgo),
      supabase
        .from('experiments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed'),
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true }),
    ])

    const response = NextResponse.json({
      active_agents: activeAgents ?? 0,
      total_experiments: totalExperiments ?? 0,
      project_count: projectCount ?? 0,
    })

    response.headers.set(
      'Cache-Control',
      'private, s-maxage=10, stale-while-revalidate=30'
    )

    return response
  } catch (error) {
    console.error('Error in global stats route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
