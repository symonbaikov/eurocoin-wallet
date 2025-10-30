-- =============================================================================
-- NextAuth.js Database Schema for PostgreSQL
-- =============================================================================
-- This schema supports both OAuth (email) and MetaMask (wallet) authentication
-- Compatible with NextAuth.js v5 and Drizzle ORM
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Users Table
-- -----------------------------------------------------------------------------
-- Stores all users regardless of authentication method
-- Can have both email (OAuth) and wallet address (MetaMask) linked to same user

CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE,
  email_verified TIMESTAMP WITH TIME ZONE,
  image TEXT,

  -- Authentication type: 'email' for OAuth, 'wallet' for MetaMask
  -- Stored as TEXT for flexibility (not enum to avoid migration issues)
  auth_type TEXT NOT NULL DEFAULT 'email' CHECK (auth_type IN ('email', 'wallet')),

  -- Wallet address for MetaMask users (optional, can be NULL for email-only users)
  wallet_address TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_users_wallet ON auth_users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_users_auth_type ON auth_users(auth_type);
CREATE INDEX IF NOT EXISTS idx_auth_users_created_at ON auth_users(created_at);

-- Comments for documentation
COMMENT ON TABLE auth_users IS 'Unified user table supporting both OAuth and MetaMask authentication';
COMMENT ON COLUMN auth_users.auth_type IS 'Primary authentication method: email (OAuth) or wallet (MetaMask)';
COMMENT ON COLUMN auth_users.wallet_address IS 'Ethereum wallet address (0x...) for MetaMask users, NULL for email-only';

-- -----------------------------------------------------------------------------
-- Accounts Table
-- -----------------------------------------------------------------------------
-- Stores OAuth provider connections (Google, GitHub, etc.)
-- One user can have multiple accounts from different providers

CREATE TABLE IF NOT EXISTS auth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,

  -- Account type: 'oauth', 'email', 'credentials'
  type TEXT NOT NULL,

  -- OAuth provider: 'google', 'github', 'microsoft', etc.
  provider TEXT NOT NULL,

  -- Provider's unique user ID
  provider_account_id TEXT NOT NULL,

  -- OAuth tokens
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: one account per provider per user
  UNIQUE(provider, provider_account_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auth_accounts_user_id ON auth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_accounts_provider ON auth_accounts(provider);

-- Comments
COMMENT ON TABLE auth_accounts IS 'OAuth provider accounts linked to users';
COMMENT ON COLUMN auth_accounts.provider_account_id IS 'Unique identifier from OAuth provider (e.g., Google user ID)';

-- -----------------------------------------------------------------------------
-- Sessions Table
-- -----------------------------------------------------------------------------
-- Stores active user sessions
-- Note: With JWT strategy, this table is optional and may not be used
-- Keeping it for flexibility and potential database session strategy

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires);

-- Comments
COMMENT ON TABLE auth_sessions IS 'Active user sessions (optional with JWT strategy)';
COMMENT ON COLUMN auth_sessions.session_token IS 'Unique session identifier stored in cookie';

-- -----------------------------------------------------------------------------
-- Verification Tokens Table
-- -----------------------------------------------------------------------------
-- Stores verification tokens for email magic links (passwordless login)
-- Used for email verification and password reset flows

CREATE TABLE IF NOT EXISTS auth_verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,

  PRIMARY KEY (identifier, token)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_auth_verification_expires ON auth_verification_tokens(expires);

-- Comments
COMMENT ON TABLE auth_verification_tokens IS 'Verification tokens for email magic links and password reset';
COMMENT ON COLUMN auth_verification_tokens.identifier IS 'Usually the user email address';
COMMENT ON COLUMN auth_verification_tokens.token IS 'Unique token sent to user';

-- -----------------------------------------------------------------------------
-- Authenticators Table (Optional - for WebAuthn/Passkeys future support)
-- -----------------------------------------------------------------------------
-- Stores WebAuthn authenticators for passwordless authentication
-- This is for future Phase 3 implementation

CREATE TABLE IF NOT EXISTS auth_authenticators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  provider_account_id TEXT NOT NULL,
  credential_public_key TEXT NOT NULL,
  counter BIGINT NOT NULL,
  credential_device_type TEXT NOT NULL,
  credential_backed_up BOOLEAN NOT NULL,
  transports TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_auth_authenticators_user_id ON auth_authenticators(user_id);

-- Comments
COMMENT ON TABLE auth_authenticators IS 'WebAuthn/Passkey authenticators (future feature)';

-- -----------------------------------------------------------------------------
-- Helper Functions
-- -----------------------------------------------------------------------------

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_auth_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_auth_users_updated_at
  BEFORE UPDATE ON auth_users
  FOR EACH ROW
  EXECUTE FUNCTION update_auth_users_updated_at();

-- -----------------------------------------------------------------------------
-- Cleanup Functions
-- -----------------------------------------------------------------------------

-- Function to delete expired sessions (run periodically via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_auth_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM auth_sessions
  WHERE expires < CURRENT_TIMESTAMP;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to delete expired verification tokens
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM auth_verification_tokens
  WHERE expires < CURRENT_TIMESTAMP;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Sample Queries for Testing
-- -----------------------------------------------------------------------------

-- Find user by email
-- SELECT * FROM auth_users WHERE email = 'user@example.com';

-- Find user by wallet address
-- SELECT * FROM auth_users WHERE wallet_address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

-- Get all OAuth accounts for a user
-- SELECT * FROM auth_accounts WHERE user_id = 'user-uuid-here';

-- Get active sessions for a user
-- SELECT * FROM auth_sessions WHERE user_id = 'user-uuid-here' AND expires > CURRENT_TIMESTAMP;

-- Get user with all their accounts
-- SELECT u.*, json_agg(a.*) as accounts
-- FROM auth_users u
-- LEFT JOIN auth_accounts a ON u.id = a.user_id
-- WHERE u.email = 'user@example.com'
-- GROUP BY u.id;

-- Count users by auth type
-- SELECT auth_type, COUNT(*) as count
-- FROM auth_users
-- GROUP BY auth_type;

-- -----------------------------------------------------------------------------
-- Migration Notes
-- -----------------------------------------------------------------------------

-- To apply this schema:
-- psql -U username -d database_name -f lib/database/auth-schema.sql

-- To rollback (DANGER - deletes all auth data):
-- DROP TABLE IF EXISTS auth_authenticators CASCADE;
-- DROP TABLE IF EXISTS auth_verification_tokens CASCADE;
-- DROP TABLE IF EXISTS auth_sessions CASCADE;
-- DROP TABLE IF EXISTS auth_accounts CASCADE;
-- DROP TABLE IF EXISTS auth_users CASCADE;
-- DROP FUNCTION IF EXISTS update_auth_users_updated_at CASCADE;
-- DROP FUNCTION IF EXISTS cleanup_expired_auth_sessions CASCADE;
-- DROP FUNCTION IF EXISTS cleanup_expired_verification_tokens CASCADE;

-- =============================================================================
-- End of Schema
-- =============================================================================
