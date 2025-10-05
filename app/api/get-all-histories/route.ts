import { supabaseAdmin } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface MedicalHistoryRecord {
  id: number
  created_at: string
  updated_at: string
  email: string
  urdu_version: any
  english_version: any
}

interface ProcessedHistory {
  id: number
  created_at: string
  updated_at: string
  primary_language: string
  chief_complaint_preview: string
  stats: {
    total_sections: number
    total_fields: number
    completion_status: string
  }
  urdu_version: any
  english_version: any
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    // Get all medical history records for this email
    const { data: records, error } = await supabaseAdmin
      .from('medical_history')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch medical histories', details: error.message },
        { status: 500 }
      )
    }

    const histories: ProcessedHistory[] = []
    
    for (const record of (records || []) as MedicalHistoryRecord[]) {
      // Create a summary of each record
      const urduData = record.urdu_version
      const englishData = record.english_version
      
      // Calculate completion stats
      let totalSections = 0
      let totalFields = 0
      
      if (urduData && typeof urduData === 'object') {
        totalSections = Object.keys(urduData).length
        
        for (const sectionData of Object.values(urduData)) {
          if (sectionData && typeof sectionData === 'object') {
            totalFields += Object.values(sectionData).filter(
              v => v && String(v).trim() !== ''
            ).length
          }
        }
      }
      
      // Get chief complaint for preview
      let chiefComplaint = ""
      if (urduData && typeof urduData === 'object') {
        outer: for (const [sectionKey, sectionData] of Object.entries(urduData)) {
          if (sectionData && typeof sectionData === 'object') {
            for (const [fieldKey, fieldValue] of Object.entries(sectionData)) {
              if (fieldKey.toLowerCase().includes('complaint') || 
                  fieldKey.toLowerCase().includes('chief') ||
                  sectionKey.toLowerCase().includes('complaint') ||
                  sectionKey.toLowerCase().includes('presentation')) {
                const value = String(fieldValue)
                chiefComplaint = value.length > 100 ? value.substring(0, 100) + "..." : value
                break outer
              }
            }
          }
        }
      }
      
      // If no chief complaint found, try to get first meaningful text
      if (!chiefComplaint && urduData && typeof urduData === 'object') {
        outer: for (const sectionData of Object.values(urduData)) {
          if (sectionData && typeof sectionData === 'object') {
            for (const value of Object.values(sectionData)) {
              if (typeof value === 'string' && value.trim() && value.length > 5) {
                chiefComplaint = value.length > 100 ? value.substring(0, 100) + "..." : value
                break outer
              }
            }
          }
        }
      }
      
      // Determine primary language based on content
      let primaryLanguage = "urdu"
      if (urduData && typeof urduData === 'object') {
        let sampleText = ""
        
        outer: for (const sectionData of Object.values(urduData)) {
          if (sectionData && typeof sectionData === 'object') {
            for (const value of Object.values(sectionData)) {
              if (typeof value === 'string' && value.trim()) {
                sampleText = value
                break outer
              }
            }
          }
        }
        
        // Simple heuristic: if contains English alphabet more than Urdu, consider it English
        if (sampleText) {
          const englishChars = Array.from(sampleText).filter(
            c => c.match(/[a-zA-Z]/) && c.charCodeAt(0) < 128
          ).length
          const totalAlphaChars = Array.from(sampleText).filter(c => c.match(/[a-zA-Z\u0600-\u06FF]/)).length
          
          if (totalAlphaChars > 0 && englishChars / totalAlphaChars > 0.7) {
            primaryLanguage = "english"
          }
        }
      }
      
      histories.push({
        id: record.id,
        created_at: record.created_at,
        updated_at: record.updated_at,
        primary_language: primaryLanguage,
        chief_complaint_preview: chiefComplaint,
        stats: {
          total_sections: totalSections,
          total_fields: totalFields,
          completion_status: totalSections >= 5 ? 'Complete' : 'Partial'
        },
        urdu_version: urduData,
        english_version: englishData
      })
    }

    return NextResponse.json({
      email,
      total_records: histories.length,
      histories
    })

  } catch (error) {
    console.error('Get all histories API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
