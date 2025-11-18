import { createClient } from '@supabase/supabase-js';

// Type definitions for our database tables
export type Organization = {
  organization_uuid: string;
  name: string;
  created_at: string;
};

export type ApiCredential = {
  api_credentials_uuid: string;
  organization_uuid: string;
  provider: string;
  key_encrypted: Buffer;
  created_at: string;
};

export type JobRequest = {
  job_request_uuid: string;
  organization_uuid: string;
  external_job_id: string | null;
  correlation_uuid: string | null;
  callback_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  metadata: any;
};

// Database type
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, 'created_at'>;
        Update: Partial<Omit<Organization, 'organization_uuid' | 'created_at'>>;
      };
      api_credentials: {
        Row: ApiCredential;
        Insert: Omit<ApiCredential, 'api_credentials_uuid' | 'created_at'>;
        Update: Partial<Omit<ApiCredential, 'api_credentials_uuid' | 'created_at'>>;
      };
      job_requests: {
        Row: JobRequest;
        Insert: Omit<JobRequest, 'job_request_uuid' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<JobRequest, 'job_request_uuid' | 'created_at'>>;
      };
    };
  };
};

/**
 * Create Supabase client for client-side usage (browser)
 * Uses NEXT_PUBLIC_ variables which are safe to expose
 */
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase environment variables not configured');
  }

  return createClient<Database>(url, anonKey);
}

/**
 * Get existing client instance or create new one
 */
let clientInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createSupabaseClient();
  }
  return clientInstance;
}
