import { getGlobalStats as getMockGlobalStats } from '@/data/projects'
import { getProject as getMockProject } from '@/data/projects'
import { fetchEnsueStats } from './ensue'

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || ''

function getMockProjectStats(slug: string) {
  const project = getMockProject(slug)
  if (!project) return null
  return {
    active_agents: project.stats.active_agents,
    total_experiments: project.stats.total_experiments,
    contributors: project.stats.contributors,
    best_result: project.stats.best_result,
    baseline: project.metric.baseline,
    metric_direction: project.metric.direction,
    history: project.stats.history,
    recent_experiments: project.stats.recent_experiments,
  }
}

export async function fetchProjectStats(slug: string) {
  // For autoresearch-at-home, fetch live data from Ensue's public API
  if (slug === 'autoresearch-at-home') {
    const ensueStats = await fetchEnsueStats()
    if (ensueStats) return ensueStats
  }

  if (!API_BASE) return getMockProjectStats(slug)

  try {
    const res = await fetch(`${API_BASE}/api/projects/${slug}/stats`, {
      next: { revalidate: 10 },
    })
    if (!res.ok) throw new Error('API unavailable')
    return await res.json()
  } catch {
    return getMockProjectStats(slug)
  }
}

export async function fetchGlobalStats() {
  if (!API_BASE) return getMockGlobalStats()

  try {
    const res = await fetch(`${API_BASE}/api/stats`, {
      next: { revalidate: 10 },
    })
    if (!res.ok) throw new Error('API unavailable')
    return await res.json()
  } catch {
    return getMockGlobalStats()
  }
}
