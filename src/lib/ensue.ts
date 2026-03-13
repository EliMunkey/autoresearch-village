const ENSUE_PUBLIC = 'https://api.ensue-network.ai/public'

async function ensueRpc(method: string, args: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(ENSUE_PUBLIC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: method, arguments: args },
        id: 1,
      }),
      next: { revalidate: 60 },
    })

    const raw = await res.text()
    const line = raw.startsWith('data: ') ? raw.slice(6) : raw
    const parsed = JSON.parse(line.trim())
    if (parsed.error || !parsed.result) return null

    const text = parsed.result.content[0]?.text
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

export async function fetchEnsueStats() {
  const bestData = await ensueRpc('public_get_memory', {
    path: 'autoresearch-at-home/best/metadata',
  }) as { value?: string } | null

  if (!bestData?.value) return null

  let best: { val_bpb: number; agent_id?: string; description?: string; achieved_at?: string }
  try {
    best = JSON.parse(bestData.value)
  } catch {
    return null
  }
  if (typeof best.val_bpb !== 'number') return null

  const recentKeys = await ensueRpc('public_list_keys', {
    path: 'autoresearch-at-home/results',
    limit: 20,
  }) as { keys?: { key_name: string; description: string; author_org_name: string; updated_at: number }[] } | null

  const agentKeys = await ensueRpc('public_list_keys', {
    path: 'autoresearch-at-home/best/agent',
    limit: 100,
  }) as { keys?: { key_name: string; author_org_name: string; size: number }[] } | null

  const contributors = agentKeys?.keys?.length ?? 0

  const claimKeys = await ensueRpc('public_list_keys', {
    path: 'autoresearch-at-home/claims',
    limit: 100,
  }) as { keys?: { key_name: string; updated_at: number }[] } | null

  // Count unique agents active in the last hour (from claims + recent results)
  const oneHourAgo = Math.floor(Date.now() / 1000) - 3600
  const recentClaimAgents = new Set(
    (claimKeys?.keys ?? [])
      .filter(k => k.updated_at > oneHourAgo)
      .map(k => k.key_name.split('--')[0])
  )
  const recentResultAgents = new Set(
    (recentKeys?.keys ?? [])
      .filter(k => k.updated_at > oneHourAgo)
      .map(k => k.author_org_name)
  )
  const activeAgents = new Set([...recentClaimAgents, ...recentResultAgents]).size

  const recentExperiments = (recentKeys?.keys ?? []).map(k => {
    const valMatch = k.description.match(/val_bpb=([0-9.]+)/)
    return {
      timestamp: new Date(k.updated_at * 1000).toISOString(),
      value: valMatch ? parseFloat(valMatch[1]) : 0,
      hypothesis: k.description
        .replace(/\[autoresearch\] Result: /, '')
        .replace(/\[.*?(?:SUCCESS|FAIL)\] /, '')
        .slice(0, 200),
      agent_type: k.author_org_name,
    }
  }).filter(e => e.value > 0)

  // Build history from the known trajectory + live best
  const history = [
    { timestamp: '2026-02-27T00:00:00Z', value: 1.12 },
    { timestamp: '2026-02-28T00:00:00Z', value: 1.10 },
    { timestamp: '2026-03-01T00:00:00Z', value: 1.08 },
    { timestamp: '2026-03-03T00:00:00Z', value: 1.05 },
    { timestamp: '2026-03-05T00:00:00Z', value: 1.02 },
    { timestamp: '2026-03-07T00:00:00Z', value: 0.99 },
    { timestamp: '2026-03-09T00:00:00Z', value: 0.98 },
    { timestamp: '2026-03-11T00:00:00Z', value: 0.97 },
    { timestamp: best.achieved_at ?? new Date().toISOString(), value: best.val_bpb },
  ]

  return {
    active_agents: activeAgents,
    total_experiments: 1600,
    contributors,
    best_result: best.val_bpb,
    best_agent: best.agent_id,
    best_description: best.description,
    history,
    recent_experiments: recentExperiments,
  }
}
