-- Create FCM Tokens Table for Firebase Cloud Messaging
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS fcm_tokens (
  id BIGSERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  player_id INTEGER REFERENCES player_accounts(id) ON DELETE CASCADE,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_player_id ON fcm_tokens(player_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON fcm_tokens(token);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_created_at ON fcm_tokens(created_at DESC);

-- Add comment
COMMENT ON TABLE fcm_tokens IS 'Stores Firebase Cloud Messaging tokens for push notifications';

-- Grant permissions (adjust as needed for your setup)
-- ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (uncomment if needed)
-- CREATE POLICY "Users can view their own tokens" ON fcm_tokens
--   FOR SELECT USING (auth.uid()::text = player_id::text);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fcm_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS fcm_tokens_updated_at ON fcm_tokens;
CREATE TRIGGER fcm_tokens_updated_at
  BEFORE UPDATE ON fcm_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_fcm_tokens_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'FCM tokens table created successfully!';
END $$;
