import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const files = body.files ?? []

    // Mocked logic: produce a simple summary mentioning the filenames and a fake status
    const summary = {
      uploadedCount: files.length,
      files: files.map((f: any) => ({ name: f.name, key: f.key })),
      patientStatus: 'stable',
      recentVisits: files.length > 0 ? Math.min(5, files.length) : 0,
      notes: 'This is a mocked summary. Replace with a real agent call to analyze documents and extract structured data.',
      recommendations: [
        'Schedule follow-up if symptoms persist',
        'Bring copies of the uploaded reports to your next appointment',
      ],
    }

    return NextResponse.json(summary)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
