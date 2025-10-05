import { supabaseAdmin } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    // Get user ID and filename from query parameters (sent by client)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const filename = searchParams.get('filename')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename parameter required' }, { status: 400 })
    }

    const bucketName = process.env.SUPABASE_BUCKET_USER_HISTORY_DOCS
    if (!bucketName) {
      return NextResponse.json({ error: 'Storage bucket not configured' }, { status: 500 })
    }

    // Construct the full filename with user prefix
    const fullFilename = `${userId}_${filename}`

    // Get the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(bucketName)
      .download(fullFilename)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
    }

    if (!fileData) {
      return NextResponse.json({ error: 'File data not found' }, { status: 404 })
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer()
    
    // Determine content type based on file extension
    const getContentType = (filename: string) => {
      const ext = filename.toLowerCase().split('.').pop()
      switch (ext) {
        case 'pdf': return 'application/pdf'
        case 'jpg':
        case 'jpeg': return 'image/jpeg'
        case 'png': return 'image/png'
        case 'doc': return 'application/msword'
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        default: return 'application/octet-stream'
      }
    }

    // Return the file with appropriate headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': getContentType(filename),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=0',
      },
    })

  } catch (error) {
    console.error('Download document API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}