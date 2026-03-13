export interface ProjectMetric {
  name: string
  unit: string
  baseline: number
  current_best: number
  direction: 'lower' | 'higher'
}

export interface ExperimentResult {
  timestamp: string
  value: number
  hypothesis: string
  agent_type?: string
}

export interface ProjectStats {
  active_agents: number
  total_experiments: number
  contributors: number
  best_result: number
  history: { timestamp: string; value: number }[]
  recent_experiments: ExperimentResult[]
}

export interface Project {
  name: string
  slug: string
  field: string
  field_color: string
  compute_tier: 'cpu' | 'single-gpu' | 'multi-gpu'
  description: string
  long_description: string
  repo_url: string
  metric: ProjectMetric
  mutable_files: string[]
  time_budget: string
  program_md: string
  agent_prompt: string
  manual_setup: string
  stats: ProjectStats
}
