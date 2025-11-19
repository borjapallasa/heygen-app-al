-- Add missing columns to existing tables
-- Run this if you already have the tables but they're missing some columns

-- =====================================================
-- Add metadata column to job_requests (if missing)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_requests' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE job_requests ADD COLUMN metadata JSONB;
        COMMENT ON COLUMN job_requests.metadata IS 'Job details: avatar IDs, script, voice source, etc.';
    END IF;
END $$;

-- =====================================================
-- Add updated_at column to job_requests (if missing)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_requests' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE job_requests ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- Create or replace the update_updated_at_column function
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Create trigger for job_requests updated_at (if not exists)
-- =====================================================
DROP TRIGGER IF EXISTS update_job_requests_updated_at ON job_requests;

CREATE TRIGGER update_job_requests_updated_at
BEFORE UPDATE ON job_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Add check constraint for status (if missing)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_status' AND conrelid = 'job_requests'::regclass
    ) THEN
        ALTER TABLE job_requests
        ADD CONSTRAINT valid_status
        CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
    END IF;
END $$;

-- =====================================================
-- Create indexes (if missing)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_job_requests_org ON job_requests(organization_uuid);
CREATE INDEX IF NOT EXISTS idx_job_requests_status ON job_requests(status);
CREATE INDEX IF NOT EXISTS idx_job_requests_external_id ON job_requests(external_job_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_correlation ON job_requests(correlation_uuid);
CREATE INDEX IF NOT EXISTS idx_job_requests_created ON job_requests(created_at DESC);

-- =====================================================
-- Verify columns exist
-- =====================================================
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'job_requests'
ORDER BY ordinal_position;
