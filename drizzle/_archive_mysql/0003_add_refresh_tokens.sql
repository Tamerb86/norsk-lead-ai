-- Add refresh_tokens table for JWT rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tokenHash" VARCHAR(255) NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "revokedAt" TIMESTAMP,
  "userAgent" TEXT,
  "ipAddress" VARCHAR(45)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens("userId");
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens("tokenHash");
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens("expiresAt");
