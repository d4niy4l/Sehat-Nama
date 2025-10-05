import { NextResponse } from 'next/server';
const PYTHON_BASE = process.env.PYTHON_API_BASE ?? 'http://localhost:8000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const view = searchParams.get('view') || 'patient';
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

  try {
    const res = await fetch(`${PYTHON_BASE}/api/get-history?session_id=${encodeURIComponent(sessionId)}&view=${encodeURIComponent(view)}`);
    const json = await res.json();
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: 'Proxy failed', details: String(err) }, { status: 500 });
  }
}