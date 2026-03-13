import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 503 }
    )
  }

  try {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    // Active agents across all projects
    const { count: activeAgents } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .gt('last_seen_at', twoMinAgo)

    // Total completed experiments across all projects
    const { count: totalExperiments } = await supabase
      .from('experiments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Count projects
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })

    const response = NextResponse.json({
      active_agents: activeAgents ?? 0,
      total_experiments: totalExperiments ?? 0,
      project_count: projectCount ?? 0,
    })

    response.headers.set(
      'Cache-Control',
      'public, s-maxage=10, stale-while-revalidate=30'
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
