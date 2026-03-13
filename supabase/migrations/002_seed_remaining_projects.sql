-- Seed remaining 4 projects into the database
-- (autoresearch-at-home was seeded in 001_initial_schema.sql)

-- ReProver (Theorem Proving)
INSERT INTO projects (slug, name, field, metric_name, metric_unit, metric_baseline, metric_direction, repo_url, time_budget)
VALUES (
  'reprover',
  'ReProver / LeanDojo',
  'Mathematics',
  'miniF2F Pass Rate',
  '%',
  57.6,
  'higher',
  'https://github.com/lean-dojo/ReProver',
  '15m'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO global_best (project_slug, best_value)
VALUES ('reprover', 57.6)
ON CONFLICT (project_slug) DO NOTHING;

-- GNINA (Drug Discovery)
INSERT INTO projects (slug, name, field, metric_name, metric_unit, metric_baseline, metric_direction, repo_url, time_budget)
VALUES (
  'gnina-torch',
  'GNINA / gnina-torch',
  'Drug Discovery',
  'Docking Success Rate',
  '%',
  73.0,
  'higher',
  'https://github.com/RMeli/gnina-torch',
  '10m'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO global_best (project_slug, best_value)
VALUES ('gnina-torch', 73.0)
ON CONFLICT (project_slug) DO NOTHING;

-- OpenFold (Protein Folding)
INSERT INTO projects (slug, name, field, metric_name, metric_unit, metric_baseline, metric_direction, repo_url, time_budget)
VALUES (
  'openfold',
  'OpenFold',
  'Biology',
  'lDDT-Cα',
  'score',
  0.902,
  'higher',
  'https://github.com/aqlaboratory/openfold',
  '15m'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO global_best (project_slug, best_value)
VALUES ('openfold', 0.902)
ON CONFLICT (project_slug) DO NOTHING;

-- NeuralGCM (Climate/Weather)
INSERT INTO projects (slug, name, field, metric_name, metric_unit, metric_baseline, metric_direction, repo_url, time_budget)
VALUES (
  'neuralgcm',
  'NeuralGCM',
  'Climate',
  '5-Day Forecast RMSE',
  'K',
  3.2,
  'lower',
  'https://github.com/neuralgcm/neuralgcm',
  '10m'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO global_best (project_slug, best_value)
VALUES ('neuralgcm', 3.2)
ON CONFLICT (project_slug) DO NOTHING;
