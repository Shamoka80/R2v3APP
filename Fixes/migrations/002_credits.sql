-- credits ledger (idempotent-ish)
CREATE TABLE IF NOT EXISTS credits_ledger (
  id TEXT PRIMARY KEY,
  ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref_kind TEXT,
  ref_id TEXT
);
CREATE INDEX IF NOT EXISTS ix_credits_user_ts ON credits_ledger(user_id, ts DESC);
-- view: balances
CREATE VIEW IF NOT EXISTS v_credit_balances AS
SELECT user_id, COALESCE(SUM(delta),0) AS balance
FROM credits_ledger GROUP BY user_id;
