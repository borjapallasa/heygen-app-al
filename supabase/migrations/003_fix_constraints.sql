-- Fix constraints that are too strict

-- Make correlation_uuid nullable (it's optional)
ALTER TABLE job_requests
ALTER COLUMN correlation_uuid DROP NOT NULL;

-- Make external_job_id nullable (it's set after HeyGen API call)
ALTER TABLE job_requests
ALTER COLUMN external_job_id DROP NOT NULL;

-- Make callback_url nullable (it's optional)
ALTER TABLE job_requests
ALTER COLUMN callback_url DROP NOT NULL;
