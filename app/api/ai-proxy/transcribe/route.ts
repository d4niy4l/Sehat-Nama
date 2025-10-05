import { NextResponse } from 'next/server'

// Use node runtime so requests to localhost python backend succeed reliably
export const runtime = 'nodejs'

const PYTHON_BASE = process.env.NEXT_PUBLIC_PYTHON_API_BASE ?? 'https://sehatnamafastapi.onrender.com'

export async function POST(request: Request) {
  try {
    const url = `${PYTHON_BASE}/transcribe`

    // Parse the incoming FormData from the frontend
    const formData = await request.formData()
    const file = formData.get('file') as File
    const model = formData.get('model') as string || 'whisper-large-v3'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      )
    }

    console.log(`STT Proxy: Received file ${file.name}, size: ${file.size}, type: ${file.type}`)

    // Create new FormData for Python backend
    const pythonFormData = new FormData()
    pythonFormData.append('file', file)
    pythonFormData.append('model', model)

    // Forward to Python backend
    const res = await fetch(url, {
      method: 'POST',
      body: pythonFormData,
    })

    console.log(`STT Proxy: Python backend responded with status ${res.status}`)

    if (!res.ok) {
      const errorText = await res.text()
      console.error('STT Proxy: Python backend error:', errorText)
      return NextResponse.json(
        { error: 'Python backend transcription failed', details: errorText },
        { status: res.status }
      )
    }

    const json = await res.json()
    console.log('STT Proxy: Success, transcription length:', json.text?.length || 0)
    
    return NextResponse.json(json)
  } catch (err: any) {
    console.error('STT Proxy error:', err, err?.stack)
    return NextResponse.json(
      { error: 'proxy transcribe failed', details: String(err) }, 
      { status: 500 }
    )
  }
}
