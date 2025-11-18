import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/heygen/proxy
 * Proxy requests to HeyGen API to avoid CORS issues
 *
 * Body: {
 *   url: string (HeyGen API endpoint),
 *   method?: string,
 *   body?: any,
 *   apiKey: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { url, method = 'GET', body, apiKey } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'apiKey is required' },
        { status: 400 }
      );
    }

    // Make request to HeyGen API
    const headers: HeadersInit = {
      'accept': 'application/json',
      'x-api-key': apiKey,
    };

    if (body && method !== 'GET') {
      headers['content-type'] = 'application/json';
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HeyGen API error:', response.status, errorText);
      return NextResponse.json(
        { error: `HeyGen API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
