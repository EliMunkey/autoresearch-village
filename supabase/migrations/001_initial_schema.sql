-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  field text,
  metric_name text,
  metric_unit text,
  metric_baseline numeric,
  metric_direction text CHECK (metric_direction IN ('lower', 'higher')),
  repo_url text,
  time_budget text,
  created_at timestamptz DEFAULT now()
);

-- Experiments table
CREATE TABLE IF NOT EXISTS experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_slug text NOT NULL REFERENCES projects(slug),
  agent_id text NOT NULL,
  hypothesis text NOT NULL,
  status text DEFAULT 'claimed' CHECK (status IN ('claimed', 'completed', 'failed', 'expired')),
  result_value numeric,
  agent_type text,
  claimed_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Agents table (for tracking active agents)
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  project_slug text NOT NULL REFERENCES projects(slug),
  last_seen_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, project_slug)
);

-- Global best tracking
CREATE TABLE IF NOT EXISTS global_best (
  project_slug text PRIMARY KEY REFERENCES projects(slug),
  best_value numeric NOT NULL,
  best_experiment_id uuid REFERENCES experiments(id),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_experiments_project_slug ON experiments(project_slug);
CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_experiments_claimed_at ON experiments(claimed_at);
CREATE INDEX idx_agents_project_slug ON agents(project_slug);
CREATE INDEX idx_agents_last_seen ON agents(last_seen_at);

-- Seed autoresearch-at-home project
INSERT INTO projects (slug, name, field, metric_name, metric_unit, metric_baseline, metric_direction, repo_url, time_budget)
VALUES (
  'autoresearch-at-home',
  'autoresearch-at-home',
  'ML / AI',
  'Validation BPB',
  'bpb',
  1.12,
  'lower',
  'https://github.com/mutable-state-inc/autoresearch-at-home',
  '5m'
) ON CONFLICT (slug) DO NOTHING;

-- Initialize global_best for autoresearch-at-home
INSERT INTO global_best (project_slug, best_value)
VALUES ('autoresearch-at-home', 1.12)
ON CONFLICT (project_slug) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_best ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read access" ON projects FOR SELECT USING (true);
CREATE POLICY "Public read access" ON experiments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON agents FOR SELECT USING (true);
CREATE POLICY "Public read access" ON global_best FOR SELECT USING (true);

-- Public write access for agents and experiments (API handles validation)
CREATE POLICY "Public insert experiments" ON experiments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update experiments" ON experiments FOR UPDATE USING (true);
CREATE POLICY "Public insert agents" ON agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update agents" ON agents FOR UPDATE USING (true);
CREATE POLICY "Public insert global_best" ON global_best FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update global_best" ON global_best FOR UPDATE USING (true);
