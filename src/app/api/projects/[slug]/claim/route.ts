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
    const { agent_id, hypothesis } = body

    if (!agent_id || !hypothesis) {
      return NextResponse.json(
        { error: 'agent_id and hypothesis are required' },
        { status: 400 }
      )
    }

    // Expire old claims (older than 15 minutes)
    await supabase
      .from('experiments')
      .update({ status: 'expired' })
      .eq('status', 'claimed')
      .lt('claimed_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())

    // Check for duplicate: exact match, case-insensitive
    const { data: existing } = await supabase
      .from('experiments')
      .select('hypothesis')
      .eq('project_slug', slug)
      .eq('status', 'claimed')
      .ilike('hypothesis', hypothesis)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error: 'Similar experiment already claimed',
          existing_hypothesis: existing[0].hypothesis,
        },
        { status: 409 }
      )
    }

    // Insert new experiment
    const { data: experiment, error: insertError } = await supabase
      .from('experiments')
      .insert({
        project_slug: slug,
        agent_id,
        hypothesis,
        status: 'claimed',
        claimed_at: new Date().toISOString(),
      })
      .select('id, status')
      .single()

    if (insertError) throw insertError

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
