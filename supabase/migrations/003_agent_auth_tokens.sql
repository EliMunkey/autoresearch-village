-- Add auth token hash column to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS auth_token_hash text;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_agents_auth_token ON agents(auth_token_hash);

-- Add compound index for claim expiration queries (missing from original schema)
CREATE INDEX IF NOT EXISTS idx_experiments_status_claimed ON experiments(status, claimed_at);

-- Add CHECK constraint on result_value to prevent extreme values
ALTER TABLE experiments ADD CONSTRAINT chk_result_value
  CHECK (result_value IS NULL OR (result_value > -1e9 AND result_value < 1e9));
