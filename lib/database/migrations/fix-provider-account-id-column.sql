-- Migration: Fix provider_account_id column in accounts table
-- This ensures the column exists with the correct name (snake_case)
-- Required for NextAuth.js DrizzleAdapter to work correctly

-- Check if accounts table exists, if not create it
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

-- Fix provider_account_id column: check if it exists, if not add it
DO $$
BEGIN
  -- Check if provider_account_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'provider_account_id'
  ) THEN
    -- Check if providerAccountId (camelCase) exists instead
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'accounts' AND column_name = 'providerAccountId'
    ) THEN
      -- Rename camelCase to snake_case
      ALTER TABLE accounts RENAME COLUMN "providerAccountId" TO provider_account_id;
      RAISE NOTICE 'Renamed accounts.providerAccountId to accounts.provider_account_id';
    ELSE
      -- Column doesn't exist at all, add it
      ALTER TABLE accounts ADD COLUMN provider_account_id TEXT NOT NULL DEFAULT '';
      RAISE NOTICE 'Added accounts.provider_account_id column';
      
      -- Remove default after adding (if needed, update existing rows first)
      -- For now, we'll keep the default and let the application handle it
    END IF;
  ELSE
    RAISE NOTICE 'Column accounts.provider_account_id already exists';
  END IF;
END $$;

-- Fix other snake_case columns if they don't exist
DO $$
BEGIN
  -- Fix refresh_token
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'refresh_token'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'accounts' AND column_name = 'refreshToken'
    ) THEN
      ALTER TABLE accounts RENAME COLUMN "refreshToken" TO refresh_token;
      RAISE NOTICE 'Renamed accounts.refreshToken to accounts.refresh_token';
    ELSE
      ALTER TABLE accounts ADD COLUMN refresh_token TEXT;
      RAISE NOTICE 'Added accounts.refresh_token column';
    END IF;
  END IF;
  
  -- Fix access_token
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'access_token'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'accounts' AND column_name = 'accessToken'
    ) THEN
      ALTER TABLE accounts RENAME COLUMN "accessToken" TO access_token;
      RAISE NOTICE 'Renamed accounts.accessToken to accounts.access_token';
    ELSE
      ALTER TABLE accounts ADD COLUMN access_token TEXT;
      RAISE NOTICE 'Added accounts.access_token column';
    END IF;
  END IF;
  
  -- Fix expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'expires_at'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'accounts' AND column_name = 'expiresAt'
    ) THEN
      ALTER TABLE accounts RENAME COLUMN "expiresAt" TO expires_at;
      RAISE NOTICE 'Renamed accounts.expiresAt to accounts.expires_at';
    ELSE
      ALTER TABLE accounts ADD COLUMN expires_at BIGINT;
      RAISE NOTICE 'Added accounts.expires_at column';
    END IF;
  END IF;
  
  -- Fix token_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'token_type'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'accounts' AND column_name = 'tokenType'
    ) THEN
      ALTER TABLE accounts RENAME COLUMN "tokenType" TO token_type;
      RAISE NOTICE 'Renamed accounts.tokenType to accounts.token_type';
    ELSE
      ALTER TABLE accounts ADD COLUMN token_type TEXT;
      RAISE NOTICE 'Added accounts.token_type column';
    END IF;
  END IF;
  
  -- Fix id_token
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'id_token'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'accounts' AND column_name = 'idToken'
    ) THEN
      ALTER TABLE accounts RENAME COLUMN "idToken" TO id_token;
      RAISE NOTICE 'Renamed accounts.idToken to accounts.id_token';
    ELSE
      ALTER TABLE accounts ADD COLUMN id_token TEXT;
      RAISE NOTICE 'Added accounts.id_token column';
    END IF;
  END IF;
  
  -- Fix session_state
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'session_state'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'accounts' AND column_name = 'sessionState'
    ) THEN
      ALTER TABLE accounts RENAME COLUMN "sessionState" TO session_state;
      RAISE NOTICE 'Renamed accounts.sessionState to accounts.session_state';
    ELSE
      ALTER TABLE accounts ADD COLUMN session_state TEXT;
      RAISE NOTICE 'Added accounts.session_state column';
    END IF;
  END IF;
END $$;

-- Ensure unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'accounts_provider_provider_account_id_key'
  ) THEN
    ALTER TABLE accounts ADD CONSTRAINT accounts_provider_provider_account_id_key 
      UNIQUE(provider, provider_account_id);
    RAISE NOTICE 'Added unique constraint on (provider, provider_account_id)';
  END IF;
END $$;

-- Recreate indexes
DROP INDEX IF EXISTS idx_accounts_provider;
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider);
CREATE INDEX IF NOT EXISTS idx_accounts_provider_account_id ON accounts(provider_account_id);

-- Verify the structure
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns 
  WHERE table_name = 'accounts' 
  AND column_name = 'provider_account_id';
  
  IF col_count = 0 THEN
    RAISE EXCEPTION 'Migration failed: provider_account_id column still does not exist';
  ELSE
    RAISE NOTICE 'Migration successful: provider_account_id column exists';
  END IF;
END $$;

