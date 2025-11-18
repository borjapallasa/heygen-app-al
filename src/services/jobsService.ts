import type { JobRequest } from '@/src/lib/supabaseClient';
import { logService } from './logService';

/**
 * Jobs Service
 * Handles job_requests CRUD operations
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface CreateJobParams {
  organizationUuid: string;
  externalJobId?: string;
  correlationUuid?: string;
  callbackUrl?: string;
  status?: JobStatus;
  metadata?: any;
}

/**
 * Create a new job request
 */
export async function createJob(params: CreateJobParams): Promise<JobRequest> {
  try {
    logService.info('Creating job request', params);

    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create job');
    }

    const data = await response.json();
    logService.info('Job created successfully', { jobUuid: data.job.job_request_uuid });
    return data.job;
  } catch (error) {
    logService.reportError(error as Error, 'Failed to create job');
    throw error;
  }
}

/**
 * Get job by UUID
 */
export async function getJob(jobUuid: string): Promise<JobRequest | null> {
  try {
    const response = await fetch(`/api/jobs/${jobUuid}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get job');
    }

    const data = await response.json();
    return data.job;
  } catch (error) {
    logService.error('Failed to get job', { jobUuid, error });
    throw error;
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobUuid: string,
  status: JobStatus,
  externalJobId?: string,
  metadata?: any
): Promise<JobRequest> {
  try {
    logService.info('Updating job status', { jobUuid, status });

    const response = await fetch(`/api/jobs/${jobUuid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        ...(externalJobId && { external_job_id: externalJobId }),
        ...(metadata && { metadata })
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update job status');
    }

    const data = await response.json();
    logService.info('Job status updated successfully', { jobUuid, status });
    return data.job;
  } catch (error) {
    logService.reportError(error as Error, 'Failed to update job status');
    throw error;
  }
}

/**
 * Mark job as completed
 */
export async function markJobComplete(jobUuid: string, metadata?: any): Promise<JobRequest> {
  return updateJobStatus(jobUuid, 'completed', undefined, metadata);
}

/**
 * Mark job as failed
 */
export async function markJobFailed(
  jobUuid: string,
  errorMessage?: string
): Promise<JobRequest> {
  return updateJobStatus(jobUuid, 'failed', undefined, {
    error: errorMessage,
    failedAt: Date.now()
  });
}

/**
 * List jobs for organization
 */
export async function listJobs(
  orgUuid: string,
  status?: JobStatus,
  limit: number = 50
): Promise<JobRequest[]> {
  try {
    const params = new URLSearchParams({
      org_uuid: orgUuid,
      limit: limit.toString()
    });

    if (status) {
      params.append('status', status);
    }

    const response = await fetch(`/api/jobs?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to list jobs');
    }

    const data = await response.json();
    return data.jobs;
  } catch (error) {
    logService.error('Failed to list jobs', { orgUuid, error });
    throw error;
  }
}

/**
 * Delete job
 */
export async function deleteJob(jobUuid: string): Promise<void> {
  try {
    logService.info('Deleting job', { jobUuid });

    const response = await fetch(`/api/jobs/${jobUuid}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete job');
    }

    logService.info('Job deleted successfully', { jobUuid });
  } catch (error) {
    logService.reportError(error as Error, 'Failed to delete job');
    throw error;
  }
}
