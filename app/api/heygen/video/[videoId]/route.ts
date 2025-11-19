import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/heygen/video/[videoId]
 * Fetch video details including video URL from HeyGen API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      );
    }

    // Fetch video status/details from HeyGen API
    const heygenUrl = `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`;

    const response = await fetch(heygenUrl, {
      headers: {
        'accept': 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `HeyGen API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching video details:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
