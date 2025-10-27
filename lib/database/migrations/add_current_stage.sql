-- Add current_stage column to internal_requests table if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'internal_requests' 
        AND column_name = 'current_stage'
    ) THEN
        ALTER TABLE internal_requests ADD COLUMN current_stage VARCHAR(50);
        CREATE INDEX IF NOT EXISTS idx_internal_requests_stage ON internal_requests(current_stage);
        RAISE NOTICE 'Column current_stage added to internal_requests';
    ELSE
        RAISE NOTICE 'Column current_stage already exists in internal_requests';
    END IF;
END $$;

