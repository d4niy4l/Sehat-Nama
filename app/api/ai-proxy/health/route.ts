import { NextResponse } from 'next/server'

const PYTHON_BASE = process.env.NEXT_PUBLIC_PYTHON_API_BASE ?? 'https://sehatnamafastapi.onrender.com'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const res = await fetch(`${PYTHON_BASE}/`, { method: 'GET' })
    if (!res.ok) return NextResponse.json({ healthy: false }, { status: 502 })
    return NextResponse.json({ healthy: true })
  } catch (err) {
    console.error('ai-proxy health error', err)
    return NextResponse.json({ healthy: false, details: String(err) }, { status: 500 })
  }
}
