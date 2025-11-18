import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';

/**
 * GET /api/jobs/[id]
 * Get job by UUID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobUuid = params.id;

    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('job_requests')
      .select('*')
      .eq('job_request_uuid', jobUuid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      job: data
    });
  } catch (error: any) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/jobs/[id]
 * Update job status and metadata
 *
 * Body: {
 *   status?: string,
 *   external_job_id?: string,
 *   metadata?: object (will be merged with existing)
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobUuid = params.id;
    const body = await request.json();
    const { status, external_job_id, metadata } = body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'processing', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const supabase = supabaseServer();

    // Get existing job to merge metadata
    const { data: existingJob } = await supabase
      .from('job_requests')
      .select('metadata')
      .eq('job_request_uuid', jobUuid)
      .single();

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Prepare update object
    const updateData: any = {};
    if (status) updateData.status = status;
    if (external_job_id) updateData.external_job_id = external_job_id;
    if (metadata) {
      // Merge metadata with existing
      updateData.metadata = {
        ...existingJob.metadata,
        ...metadata
      };
    }

    // Update job
    const { data, error } = await supabase
      .from('job_requests')
      .update(updateData)
      .eq('job_request_uuid', jobUuid)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      job: data
    });
  } catch (error: any) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id]
 * Delete job by UUID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobUuid = params.id;

    const supabase = supabaseServer();
    const { error } = await supabase
      .from('job_requests')
      .delete()
      .eq('job_request_uuid', jobUuid);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Job deleted'
    });
  } catch (error: any) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
