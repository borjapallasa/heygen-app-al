import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';

/**
 * POST /api/upload/audio
 * Upload audio file to Supabase Storage
 *
 * Body: FormData with:
 *   - file: audio blob
 *   - organizationId: organization UUID
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const filename = `${organizationId}/recordings/${timestamp}-${file.name}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const supabase = supabaseServer();
    const { data, error } = await supabase.storage
      .from('audio-files')
      .upload(filename, buffer, {
        contentType: file.type || 'audio/webm',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-files')
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
      filename: file.name
    });
  } catch (error: any) {
    console.error('Error uploading audio:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
