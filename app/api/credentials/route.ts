import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { encrypt } from '@/src/lib/encryption';

/**
 * GET /api/credentials?org_uuid={uuid}&provider={provider}
 * Returns all API credentials for organization (metadata only, not decrypted keys)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgUuid = searchParams.get('org_uuid');
    const provider = searchParams.get('provider') || 'heygen';

    if (!orgUuid) {
      return NextResponse.json(
        { error: 'org_uuid parameter is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('api_credentials')
      .select('api_credentials_uuid, organization_uuid, provider, name, created_at')
      .eq('organization_uuid', orgUuid)
      .eq('provider', provider)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const credentials = data ?? [];

    return NextResponse.json({
      exists: credentials.length > 0,
      credentials,
      organization_uuid: orgUuid,
      provider
    });
  } catch (error: any) {
    console.error('Error checking API credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/credentials
 * Store new API key (encrypted). Always inserts a new credential row.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_uuid, provider = 'heygen', api_key, name } = body;

    if (!organization_uuid) {
      return NextResponse.json(
        { error: 'organization_uuid is required' },
        { status: 400 }
      );
    }

    if (!api_key) {
      return NextResponse.json(
        { error: 'api_key is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();
    const { data: org } = await supabase
      .from('organizations')
      .select('organization_uuid')
      .eq('organization_uuid', organization_uuid)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found. Please sync organization first.' },
        { status: 404 }
      );
    }

    const keyEncrypted = encrypt(api_key);
    const keyEncryptedHex = '\\x' + keyEncrypted.toString('hex');

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('api_credentials')
      .insert({
        organization_uuid,
        provider,
        key_encrypted: keyEncryptedHex,
        name: trimmedName
      })
      .select('api_credentials_uuid, organization_uuid, provider, name, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      credential: data,
      created: true
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving API credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/credentials
 * Rename an API credential
 *
 * Body: {
 *   organization_uuid: string,
 *   credential_uuid: string,
 *   name: string,
 *   provider?: string (default: 'heygen')
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_uuid,
      credential_uuid,
      name,
      provider = 'heygen'
    } = body;

    if (!organization_uuid || !credential_uuid) {
      return NextResponse.json(
        { error: 'organization_uuid and credential_uuid are required' },
        { status: 400 }
      );
    }

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('api_credentials')
      .update({ name: trimmedName })
      .eq('organization_uuid', organization_uuid)
      .eq('provider', provider)
      .eq('api_credentials_uuid', credential_uuid)
      .select('api_credentials_uuid, organization_uuid, provider, name, created_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'API credentials not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      credential: data
    });
  } catch (error: any) {
    console.error('Error renaming API credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/credentials?org_uuid={uuid}&provider={provider}&credential_uuid={uuid}
 * Deletes credentials for organization. Optional credential_uuid targets one row.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgUuid = searchParams.get('org_uuid');
    const provider = searchParams.get('provider') || 'heygen';
    const credentialUuid = searchParams.get('credential_uuid');

    if (!orgUuid) {
      return NextResponse.json(
        { error: 'org_uuid parameter is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();
    let query = supabase
      .from('api_credentials')
      .delete()
      .eq('organization_uuid', orgUuid)
      .eq('provider', provider);

    if (credentialUuid) {
      query = query.eq('api_credentials_uuid', credentialUuid);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'API credentials deleted'
    });
  } catch (error: any) {
    console.error('Error deleting API credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
