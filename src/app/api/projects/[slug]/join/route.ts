import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { agent_id, agent_type } = body

    if (!agent_id) {
      return NextResponse.json(
        { error: 'agent_id is required' },
        { status: 400 }
      )
    }

    // Upsert agent into agents table
    const { error: agentError } = await supabase
      .from('agents')
      .upsert(
        {
          agent_id,
          project_slug: slug,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'agent_id,project_slug' }
      )

    if (agentError) throw agentError

    // Fetch project config
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single()

    if (projectError) throw projectError

    // Fetch current best
    const { data: currentBest } = await supabase
      .from('global_best')
      .select('*')
      .eq('project_slug', slug)
      .single()

    // Count total experiments
    const { count: experimentCount, error: countError } = await supabase
      .from('experiments')
      .select('*', { count: 'exact', head: true })
      .eq('project_slug', slug)

    if (countError) throw countError

    return NextResponse.json({
      project,
      current_best: currentBest,
      experiment_count: experimentCount ?? 0,
    })
  } catch (error) {
    console.error('Error in join route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
