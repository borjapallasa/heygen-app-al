import { NextResponse } from 'next/server';

// Option A: single shared key from Vercel env
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY!;

export async function GET() {
  if (!HEYGEN_API_KEY) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }
  const url = 'https://api.heygen.com/v2/avatar_group.list?include_public=false';
  const res = await fetch(url, {
    headers: { accept: 'application/json', 'x-api-key': HEYGEN_API_KEY },
    // Consider cache: 'no-store' if you need always-fresh
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
