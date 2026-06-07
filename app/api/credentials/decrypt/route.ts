import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { decrypt } from '@/src/lib/encryption';

/**
 * POST /api/credentials/decrypt
 * Decrypt and return API key for organization (optionally by credential_uuid)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_uuid, provider = 'heygen', credential_uuid } = body;

    if (!organization_uuid) {
      return NextResponse.json(
        { error: 'organization_uuid is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();
    let query = supabase
      .from('api_credentials')
      .select('key_encrypted')
      .eq('organization_uuid', organization_uuid)
      .eq('provider', provider);

    if (credential_uuid) {
      query = query.eq('api_credentials_uuid', credential_uuid);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'API credentials not found for this organization' },
          { status: 404 }
        );
      }
      throw error;
    }

    let encryptedBuffer: Buffer;

    if (typeof data.key_encrypted === 'string') {
      if (data.key_encrypted.startsWith('\\x')) {
        const hexString = data.key_encrypted.slice(2);
        encryptedBuffer = Buffer.from(hexString, 'hex');
      } else {
        encryptedBuffer = Buffer.from(data.key_encrypted, 'base64');
      }
    } else if (data.key_encrypted instanceof Uint8Array || Array.isArray(data.key_encrypted)) {
      encryptedBuffer = Buffer.from(data.key_encrypted);
    } else {
      throw new Error(`Unexpected encrypted data type: ${typeof data.key_encrypted}`);
    }

    const apiKey = decrypt(encryptedBuffer);

    return NextResponse.json({
      success: true,
      api_key: apiKey,
      provider
    });
  } catch (error: any) {
    console.error('Error decrypting API key:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
