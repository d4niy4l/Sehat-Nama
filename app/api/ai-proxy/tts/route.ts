import { NextResponse } from 'next/server'

const PYTHON_BASE = process.env.PYTHON_API_BASE ?? 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const url = `${PYTHON_BASE}/text-to-speech`
    // forward body as JSON or form depending on client
    const body = await request.text()
    const headers: any = { 'Content-Type': request.headers.get('content-type') || 'application/json' }

    const res = await fetch(url, { method: 'POST', headers, body })
    // Stream audio back to client
    const contentType = res.headers.get('content-type') || 'application/json'
    const arrayBuf = await res.arrayBuffer()
    return new NextResponse(arrayBuf, { status: res.status, headers: { 'Content-Type': contentType } })
  } catch (err) {
    console.error('ai-proxy tts error', err)
    return NextResponse.json({ error: 'tts proxy failed' }, { status: 500 })
  }
}
