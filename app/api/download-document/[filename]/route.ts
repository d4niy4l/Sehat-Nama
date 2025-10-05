import { supabaseAdmin } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    // Get user ID from query parameters (sent by client)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const filename = decodeURIComponent(params.filename)

    const bucketName = process.env.SUPABASE_BUCKET_USER_HISTORY_DOCS
    if (!bucketName) {
      return NextResponse.json({ error: 'Storage bucket not configured' }, { status: 500 })
    }

    // Verify the file belongs to this user
    const expectedFilename = `${userId}_${filename}`
    
    // Check if file exists and belongs to user
    const { data: fileData, error: fileError } = await supabaseAdmin.storage
      .from(bucketName)
      .list('', {
        search: expectedFilename
      })

    if (fileError || !fileData?.find(f => f.name === expectedFilename)) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
    }

    // Create a longer-lived signed URL for download (24 hours)
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(expectedFilename, 86400) // 24 hours

    if (urlError || !urlData?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      downloadUrl: urlData.signedUrl,
      filename: filename,
      expiresIn: '24 hours'
    })

  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
