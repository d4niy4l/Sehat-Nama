import { NextResponse } from 'next/server'

// Use node runtime so requests to localhost python backend succeed reliably
export const runtime = 'nodejs'

const PYTHON_BASE = process.env.PYTHON_API_BASE ?? 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const url = `${PYTHON_BASE}/transcribe`

    // Read incoming body as ArrayBuffer and forward with original content-type
    const contentType = request.headers.get('content-type') || ''
    const arrayBuf = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuf)

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: buffer,
    })

    const resCt = res.headers.get('content-type') || ''
    if (resCt.includes('application/json')) {
      const json = await res.json()
      return NextResponse.json(json)
    }

    const text = await res.text()
    return NextResponse.json({ text })
  } catch (err: any) {
    console.error('ai-proxy transcribe error', err, err?.stack)
    return NextResponse.json({ error: 'proxy transcribe failed', details: String(err) }, { status: 500 })
  }
}
