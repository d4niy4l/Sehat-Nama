import { NextResponse } from 'next/server'

const PYTHON_BASE = process.env.PYTHON_API_BASE ?? 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const res = await fetch(`${PYTHON_BASE}/api/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const json = await res.json()
    return NextResponse.json(json)
  } catch (err) {
    console.error('ai-proxy send error', err)
    return NextResponse.json({ error: 'proxy failed' }, { status: 500 })
  }
}
