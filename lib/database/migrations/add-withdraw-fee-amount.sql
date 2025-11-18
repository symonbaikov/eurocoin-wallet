-- Migration: Add fee_amount column to withdraw_requests table
-- Allows admin to set individual commission for each withdrawal request

ALTER TABLE withdraw_requests
ADD COLUMN IF NOT EXISTS fee_amount NUMERIC(78, 0) DEFAULT NULL;

COMMENT ON COLUMN withdraw_requests.fee_amount IS 'Individual commission amount set by admin (in token units, same decimals as amount)';

