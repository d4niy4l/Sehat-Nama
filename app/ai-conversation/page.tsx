"use client"

import React, { useEffect, useState } from 'react'
import { startInterviewProxy, sendMessageProxy, getHistoryProxy } from '../../lib/ai-client'
import {Spinner} from '../../components/ui/spinner'
// Import jsPDF dynamically
let jsPDF: any = null
async function ensureJsPDF() {
  if (!jsPDF) {
    const mod = await import('jspdf').catch(() => null)
    jsPDF = mod?.jsPDF ?? mod
  }
  return jsPDF
}

type Message = { role: string; content: string; timestamp?: string }

const PLACEHOLDER_NAME = 'Patient-XXXX'

export default function AIConversationPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null)
  const [starterAudioQueued, setStarterAudioQueued] = useState<ArrayBuffer | null>(null)
  const [userInteracted, setUserInteracted] = useState(false)
  const [useStreaming, setUseStreaming] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [error, setError] = useState<string | null>(null) // For UI errors

  // Add this function (missing in provided code)
  function playAudioFromArrayBuffer(buffer: ArrayBuffer, mimeType: string) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContext.decodeAudioData(buffer, (decodedData) => {
      const source = audioContext.createBufferSource();
      source.buffer = decodedData;
      source.connect(audioContext.destination);
      source.start(0);
    }).catch(err => console.error('Audio playback failed', err));
  }
  // Start interview with retry logic
  useEffect(() => {
    let mounted = true
    async function startWithRetry(attempts = 3) {
      for (let i = 0; i < attempts; i++) {
        try {
          setLoading(true)
          const res = await startInterviewProxy()
          if (!mounted) return
          const sid = res.session_id || res.sessionId || null
          setSessionId(sid)
          const aiMsg = res.message || res.ai_message || 'السلام علیکم۔ آپ کا پورا نام کیا ہے؟' // Fallback greeting
          setMessages([{ role: 'assistant', content: aiMsg, timestamp: new Date().toLocaleTimeString() }])
          setError(null) // Clear errors

          // Prefetch TTS
          try {
            const ttsRes = await fetch('/api/ai-proxy/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: aiMsg, voice_id: 'v_meklc281' })
            })
            if (ttsRes.ok) {
              const ab = await ttsRes.arrayBuffer()
              setStarterAudioQueued(ab)
            }
          } catch (err) {
            console.warn('TTS prefetch failed', err)
          }
          return // Success, exit loop
        } catch (err) {
          console.error('Start interview failed (attempt ' + (i + 1) + ')', err)
          setError('Greeting failed to load. Retrying...')
        } finally {
          setLoading(false)
        }
      }
      setError('Failed to load greeting after retries. Check backend.')
    }
    startWithRetry()
    return () => { mounted = false }
  }, [])

  // Play starter TTS after user interaction
  useEffect(() => {
    if (!userInteracted || !starterAudioQueued) return
    playAudioFromArrayBuffer(starterAudioQueued, 'audio/mpeg')
    setStarterAudioQueued(null)
  }, [userInteracted, starterAudioQueued])

  // Setup media recorder
  useEffect(() => {
    if (!navigator.mediaDevices) return
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mr = new MediaRecorder(stream)
      setMediaRecorder(mr)
      mr.ondataavailable = ev => setAudioChunks(c => [...c, ev.data])
    }).catch(err => {
      console.error('Mic access denied', err)
      setError('Microphone access denied. Use text input instead.')
    })
  }, [])

  // Handle start recording
  const handleStartRecording = () => {
    setUserInteracted(true)
    if (!mediaRecorder) return setError('No media recorder available.')
    setAudioChunks([])
    mediaRecorder.start()
    setRecording(true)
  }

  // Handle stop and send recording (with transcribe fix)
  const handleStopAndSendRecording = async () => {
    if (!mediaRecorder) return
    mediaRecorder.stop()
    setRecording(false)
    setLoading(true)

    try {
      // Wait for chunks
      await new Promise(resolve => setTimeout(resolve, 500)) // Give time for ondataavailable
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      const form = new FormData()
      form.append('file', audioBlob, 'recording.wav')
      form.append('model', 'whisper-large-v3-turbo') // As per backend

      const res = await fetch('/api/ai-proxy/stt', { method: 'POST', body: form })
      if (!res.ok) throw new Error(`STT failed: ${res.statusText}`)
      const json = await res.json()
      const transcribed = json.text || json.transcription?.text || ''
      if (!transcribed) throw new Error('No transcription returned')

      setInput(transcribed) // Optional: Show in input for editing
      await send(transcribed) // Send to AI
      setError(null)
    } catch (err) {
      console.error('Transcribe error', err)
      setError(`Transcription failed: ${String(err)}. Try text input.`)
    } finally {
      setLoading(false)
    }
  }

  // Send message (text or transcribed)
  const send = async (msg = input) => {
    if (!sessionId || !msg) return
    setUserInteracted(true)
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date().toLocaleTimeString() }])
    setInput('')
    setLoading(true)

    try {
      const res = await sendMessageProxy(sessionId, msg)
      const aiMsg = res.message || res.ai_message || 'Sorry, no response.'
      setMessages(prev => [...prev, { role: 'assistant', content: aiMsg, timestamp: new Date().toLocaleTimeString() }])

      // Play TTS for AI response
      const ttsRes = await fetch('/api/ai-proxy/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiMsg, voice_id: 'v_meklc281' })
      })
      if (ttsRes.ok) {
        const ab = await ttsRes.arrayBuffer()
        playAudioFromArrayBuffer(ab, 'audio/mpeg')
      }
    } catch (err) {
      console.error('Send message failed', err)
      setError('Failed to send message.')
    } finally {
      setLoading(false)
    }
  }

  // Export PDF (merge with backend history JSON)
  async function exportPDF() {
    const js = await ensureJsPDF()
    if (!js) return alert('PDF export unavailable. Install jsPDF.')

    let fullHistory = [...messages]
    if (sessionId) {
      try {
        const historyRes = await getHistoryProxy(sessionId) // Assuming you have this proxy function
        if (historyRes.history) fullHistory = [...fullHistory, ...historyRes.history] // Merge JSON
      } catch (err) {
        console.warn('History fetch failed', err)
      }
    }

    const doc = new js()
    doc.setFontSize(12)
    doc.text('Sehat-Nama Conversation Export', 10, 10)
    let y = 20
    fullHistory.forEach(m => {
      const prefix = m.role === 'user' ? `${PLACEHOLDER_NAME}: ` : 'AI: '
      const lines = doc.splitTextToSize(prefix + m.content, 180)
      doc.text(lines, 10, y)
      y += lines.length * 7
      if (y > 270) { doc.addPage(); y = 10 }
    })

    const pdfBlob = doc.output('blob')
    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sehat-nama-conversation.pdf'
    a.click()
    URL.revokeObjectURL(url)

    // Upload to server
    try {
      const form = new FormData()
      form.append('userId', 'anon_user')
      form.append('file', new File([pdfBlob], 'sehat-nama-conversation.pdf', { type: 'application/pdf' }))
      await fetch('/api/upload-files', { method: 'POST', body: form })
    } catch (err) {
      console.error('PDF upload failed', err)
    }
  }

  // ... (keep your existing playAudioFromArrayBuffer, exportWav, etc. functions unchanged)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-6 font-urdu">
      <div className="w-full max-w-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-800 dark:text-indigo-300">AI Voice Conversation</h1>
          <p className="text-gray-600 dark:text-gray-400">السلام علیکم۔ ریکارڈ بٹن دبائیں اور بولیں۔</p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        <div className="h-[50vh] overflow-y-auto p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl shadow-inner space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-md ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                <div className="font-semibold text-sm">{m.role === 'user' ? 'آپ' : 'AI'}</div>
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div className="text-xs text-gray-400 mt-1">{m.timestamp}</div>
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-center"><Spinner /></div>}
        </div>

        <div className="flex items-center space-x-4">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="یا ٹائپ کریں..."
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button onClick={() => send()} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            بھیجیں
          </button>
          <button onClick={exportPDF} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
            PDF محفوظ کریں
          </button>
          {!recording ? (
            <button onClick={handleStartRecording} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition animate-pulse">
              ریکارڈ شروع کریں
            </button>
          ) : (
            <button onClick={handleStopAndSendRecording} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition animate-bounce">
              روکیں اور بھیجیں
            </button>
          )}
          {recording && <div className="text-red-500 animate-pulse">ریکارڈنگ چل رہی ہے...</div>}
        </div>
      </div>
    </div>
  )
}