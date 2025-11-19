"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAppState } from "@/src/state/AppStateProvider";

export type Job = {
  job_request_uuid: string;
  organization_uuid: string;
  external_job_id: string | null;
  correlation_uuid: string | null;
  callback_url: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  metadata: any;
};

type UseJobPollingReturn = {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateJobStatus: (jobId: string, status: string, metadata?: any) => Promise<void>;
};

/**
 * Hook to poll jobs for the current organization
 * Polls every 10 seconds for pending/processing jobs
 */
export default function useJobPolling(): UseJobPollingReturn {
  const { parentData } = useAppState();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!parentData?.organizationId) {
      setJobs([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/jobs?org_uuid=${parentData.organizationId}&limit=50`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [parentData?.organizationId]);

  const updateJobStatus = async (
    jobId: string,
    status: string,
    metadata?: any
  ) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, metadata })
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      // Refetch jobs to update the list
      await fetchJobs();
    } catch (err: any) {
      console.error('Error updating job status:', err);
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [parentData?.organizationId]);

  // Poll for active jobs (pending or processing)
  useEffect(() => {
    const hasActiveJobs = jobs.some(
      job => job.status === 'pending' || job.status === 'processing'
    );

    if (hasActiveJobs) {
      // Start polling every 10 seconds
      intervalRef.current = setInterval(() => {
        fetchJobs();
      }, 10000);
    } else {
      // Stop polling if no active jobs
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jobs]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
    updateJobStatus
  };
}
