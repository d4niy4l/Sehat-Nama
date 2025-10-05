import { NextResponse } from 'next/server'

const PYTHON_BASE = process.env.NEXT_PUBLIC_PYTHON_API_BASE ?? 'https://sehatnamafastapi.onrender.com'

export async function POST() {
  try {
    const res = await fetch(`${PYTHON_BASE}/api/start-interview`, { method: 'POST' })
    const json = await res.json()
    return NextResponse.json(json)
  } catch (err) {
    console.error('ai-proxy start error', err)
    return NextResponse.json({ error: 'proxy failed' }, { status: 500 })
  }
}
