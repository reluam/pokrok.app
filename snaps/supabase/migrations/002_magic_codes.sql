-- Magic codes for custom OTP authentication
CREATE TABLE IF NOT EXISTS magic_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '5 minutes'
);

CREATE INDEX idx_magic_codes_email ON magic_codes(email, created_at DESC);
CREATE INDEX idx_magic_codes_cleanup ON magic_codes(expires_at) WHERE used = false;

-- RLS: only service_role can access this table
ALTER TABLE magic_codes ENABLE ROW LEVEL SECURITY;
-- No public policies — only accessible via service_role key in Edge Functions
