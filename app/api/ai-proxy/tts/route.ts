import { NextResponse } from 'next/server'

const PYTHON_BASE = process.env.PYTHON_API_BASE ?? 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const url = `${PYTHON_BASE}/text-to-speech`
    const headers: any = { 'Content-Type': request.headers.get('content-type') || 'multipart/form-data' }
    const body = await request.arrayBuffer() // Use arrayBuffer to preserve FormData
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: Buffer.from(body)
    })
    const contentType = res.headers.get('content-type') || 'audio/mpeg'
    const arrayBuf = await res.arrayBuffer()
    return new NextResponse(arrayBuf, { status: res.status, headers: { 'Content-Type': contentType } })
  } catch (err) {
    console.error('ai-proxy tts error', err)
    return NextResponse.json({ error: 'tts proxy failed' }, { status: 500 })
  }
}
