export interface DbProject {
  id: string
  slug: string
  name: string
  field: string | null
  metric_name: string | null
  metric_unit: string | null
  metric_baseline: number | null
  metric_direction: string | null
  repo_url: string | null
  time_budget: string | null
  created_at: string
}

export interface DbExperiment {
  id: string
  project_slug: string
  agent_id: string
  hypothesis: string
  status: 'claimed' | 'completed' | 'failed' | 'expired'
  result_value: number | null
  agent_type: string | null
  claimed_at: string
  completed_at: string | null
}

export interface DbAgent {
  id: string
  agent_id: string
  project_slug: string
  last_seen_at: string
}

export interface DbGlobalBest {
  project_slug: string
  best_value: number
  best_experiment_id: string
  updated_at: string
}
