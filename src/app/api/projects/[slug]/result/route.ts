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
    const { experiment_id, agent_id, result_value, agent_type } = body

    if (!experiment_id || !agent_id || result_value === undefined) {
      return NextResponse.json(
        { error: 'experiment_id, agent_id, and result_value are required' },
        { status: 400 }
      )
    }

    // Update experiment to completed
    const { data: updated, error: updateError } = await supabase
      .from('experiments')
      .update({
        status: 'completed',
        result_value,
        agent_type: agent_type ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', experiment_id)
      .eq('agent_id', agent_id)
      .eq('status', 'claimed')
      .select()

    if (updateError) throw updateError

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: 'Experiment not found or not owned by this agent' },
        { status: 404 }
      )
    }

    // Fetch project to know metric_direction
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('metric_direction')
      .eq('slug', slug)
      .single()

    if (projectError) throw projectError

    // Check global_best for this project
    const { data: globalBest } = await supabase
      .from('global_best')
      .select('*')
      .eq('project_slug', slug)
      .single()

    let isNewBest = false
    const direction = project.metric_direction ?? 'lower'

    if (!globalBest) {
      // No existing best — this is the first result
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

    const bestValue = isNewBest ? result_value : globalBest?.best_value ?? result_value

    // Update agent's last_seen_at
    await supabase
      .from('agents')
      .upsert(
        {
          agent_id,
          project_slug: slug,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'agent_id,project_slug' }
      )

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
