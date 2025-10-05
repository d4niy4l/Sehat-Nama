import { supabaseAdmin } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Use Node runtime for better compatibility with the Supabase admin client and Buffer
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // Only accept multipart/form-data
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })
    }

    const formData = await request.formData()
    const userId = formData.get('userId') as string | null
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const bucketName = process.env.SUPABASE_BUCKET_USER_HISTORY_DOCS
    if (!bucketName) {
      return NextResponse.json({ error: 'Bucket not configured' }, { status: 500 })
    }

    const files: Array<{ key: string; name: string }> = []

    for (const entry of Array.from(formData.entries())) {
      const value = entry[1]
      // formData File objects in the Next.js request will have .name and .arrayBuffer
      if (typeof (value as any)?.name === 'string' && typeof (value as any)?.arrayBuffer === 'function') {
        const fileLike = value as File
        const filename = `${userId}_${fileLike.name}`
        const arrayBuffer = await fileLike.arrayBuffer()

        // Convert to Node Buffer for supabase-js node upload
        const buffer = Buffer.from(arrayBuffer)

        const { data, error } = await supabaseAdmin.storage.from(bucketName).upload(filename, buffer, { upsert: false })
        if (error) {
          console.error('Supabase upload error:', error)
          return NextResponse.json({ error: error.message, details: error }, { status: 500 })
        }
        files.push({ key: (data as any).path, name: fileLike.name })
      }
    }

    return NextResponse.json({ uploaded: files })
  } catch (err: any) {
    console.error('Upload route failed:', err)
    const message = err?.message ?? String(err)
    return NextResponse.json({ error: 'Upload failed', details: message }, { status: 500 })
  }
}
