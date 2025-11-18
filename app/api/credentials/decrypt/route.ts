import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { decrypt } from '@/src/lib/encryption';

/**
 * POST /api/credentials/decrypt
 * Decrypt and return API key for organization
 *
 * Body: {
 *   organization_uuid: string,
 *   provider: string (default: 'heygen')
 * }
 *
 * SECURITY NOTE: This endpoint should only be called server-side
 * or with proper authentication in production
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_uuid, provider = 'heygen' } = body;

    if (!organization_uuid) {
      return NextResponse.json(
        { error: 'organization_uuid is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('api_credentials')
      .select('key_encrypted')
      .eq('organization_uuid', organization_uuid)
      .eq('provider', provider)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'API credentials not found for this organization' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Decrypt the key
    // Supabase returns bytea as hex string with \x prefix
    console.log('Encrypted data type:', typeof data.key_encrypted);
    console.log('Encrypted data sample:', typeof data.key_encrypted === 'string' ? data.key_encrypted.substring(0, 20) : data.key_encrypted);

    let encryptedBuffer: Buffer;

    if (typeof data.key_encrypted === 'string') {
      // Supabase returns bytea as hex string with \x prefix (e.g., "\\x1a2b3c...")
      if (data.key_encrypted.startsWith('\\x')) {
        // Remove \x prefix and convert from hex
        const hexString = data.key_encrypted.slice(2);
        encryptedBuffer = Buffer.from(hexString, 'hex');
      } else {
        // Try base64 as fallback
        encryptedBuffer = Buffer.from(data.key_encrypted, 'base64');
      }
    } else if (data.key_encrypted instanceof Uint8Array || Array.isArray(data.key_encrypted)) {
      encryptedBuffer = Buffer.from(data.key_encrypted);
    } else {
      throw new Error(`Unexpected encrypted data type: ${typeof data.key_encrypted}`);
    }

    console.log('Buffer length:', encryptedBuffer.length);

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
