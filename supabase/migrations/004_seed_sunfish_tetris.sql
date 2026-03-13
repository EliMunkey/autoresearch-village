-- Seed missing projects: sunfish and tetris-ai
INSERT INTO projects (slug, name, field, metric_name, metric_unit, metric_baseline, metric_direction, repo_url, time_budget)
VALUES (
  'sunfish',
  'Sunfish',
  'Fun',
  'Estimated ELO',
  'ELO',
  2000,
  'higher',
  'https://github.com/thomasahle/sunfish',
  '5m'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO global_best (project_slug, best_value)
VALUES ('sunfish', 2000)
ON CONFLICT (project_slug) DO NOTHING;

INSERT INTO projects (slug, name, field, metric_name, metric_unit, metric_baseline, metric_direction, repo_url, time_budget)
VALUES (
  'tetris-ai',
  'Tetris AI',
  'Fun',
  'Average Score',
  'pts',
  1500,
  'higher',
  'https://github.com/nuno-faria/tetris-ai',
  '5m'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO global_best (project_slug, best_value)
VALUES ('tetris-ai', 1500)
ON CONFLICT (project_slug) DO NOTHING;
