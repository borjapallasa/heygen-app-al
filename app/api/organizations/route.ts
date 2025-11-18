import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';

/**
 * GET /api/organizations?org_uuid={uuid}
 * Get organization by UUID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgUuid = searchParams.get('org_uuid');

    if (!orgUuid) {
      return NextResponse.json(
        { error: 'org_uuid parameter is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('organization_uuid', orgUuid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return NextResponse.json(
          { error: 'Organization not found', exists: false },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ organization: data, exists: true });
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations
 * Create or sync organization from parent app
 *
 * Body: {
 *   organization_uuid: string,
 *   name: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_uuid, name } = body;

    if (!organization_uuid) {
      return NextResponse.json(
        { error: 'organization_uuid is required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // Check if organization already exists
    const { data: existing } = await supabase
      .from('organizations')
      .select('*')
      .eq('organization_uuid', organization_uuid)
      .single();

    if (existing) {
      // Organization exists, update name if different
      if (existing.name !== name) {
        const { data, error } = await supabase
          .from('organizations')
          .update({ name })
          .eq('organization_uuid', organization_uuid)
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({
          success: true,
          organization: data,
          updated: true
        });
      }

      return NextResponse.json({
        success: true,
        organization: existing,
        updated: false
      });
    }

    // Create new organization
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        organization_uuid,
        name
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      organization: data,
      created: true
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating/syncing organization:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
