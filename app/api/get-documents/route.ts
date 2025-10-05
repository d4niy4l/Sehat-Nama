import { supabaseAdmin } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    // Get user ID from query parameters (sent by client)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const bucketName = process.env.SUPABASE_BUCKET_USER_HISTORY_DOCS
    if (!bucketName) {
      return NextResponse.json({ error: 'Storage bucket not configured' }, { status: 500 })
    }

    // List all files for this user using admin client for storage access
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(bucketName)
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError) {
      console.error('Error listing files:', listError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Filter files by user ID (files are named with userId_ prefix)
    const userFiles = files?.filter(file => 
      file.name.startsWith(`${userId}_`) && file.name !== `${userId}_`
    ) || []

    // Get download URLs and metadata for each file
    const documentsWithUrls = await Promise.all(
      userFiles.map(async (file) => {
        try {
          // Get signed URL for download (valid for 1 hour)
          const { data: urlData } = await supabaseAdmin.storage
            .from(bucketName)
            .createSignedUrl(file.name, 3600) // 1 hour expiry

          return {
            id: file.id || file.name,
            name: file.name.replace(`${userId}_`, ''), // Remove userId prefix for display
            originalName: file.name,
            size: file.metadata?.size || 0,
            mimeType: file.metadata?.mimetype || 'application/octet-stream',
            createdAt: file.created_at,
            updatedAt: file.updated_at,
            downloadUrl: urlData?.signedUrl || null,
            publicUrl: null
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error)
          return null
        }
      })
    )

    // Filter out any failed file processing
    const validDocuments = documentsWithUrls.filter(doc => doc !== null)

    return NextResponse.json({
      success: true,
      userId,
      totalDocuments: validDocuments.length,
      documents: validDocuments,
      message: validDocuments.length > 0 
        ? `Found ${validDocuments.length} document(s)` 
        : 'No documents found for this user'
    })

  } catch (error) {
    console.error('Get documents API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}