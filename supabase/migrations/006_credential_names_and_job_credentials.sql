-- Add friendly name for API credentials (multi-account switching)
ALTER TABLE api_credentials
ADD COLUMN IF NOT EXISTS name TEXT;

-- Link job requests to the credential used at creation time
ALTER TABLE job_requests
ADD COLUMN IF NOT EXISTS api_credentials_uuid UUID
REFERENCES api_credentials(api_credentials_uuid);

CREATE INDEX IF NOT EXISTS idx_job_requests_api_credentials
ON job_requests(api_credentials_uuid);
