"use client"

import React, { useEffect, useState, useRef } from 'react'
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
const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
//const currentAudioRef = useRef<HTMLAudioElement | null>(null)
useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
// REPLACE the playAudioFromArrayBuffer function
function playAudioFromArrayBuffer(buffer: ArrayBuffer, mimeType: string) {
  // Stop any currently playing audio first
  if (currentAudioRef.current) {
    currentAudioRef.current.pause()
    currentAudioRef.current = null
  }

  return new Promise<void>((resolve, reject) => {
    try {
      setIsPlayingAudio(true)
      
      const blob = new Blob([buffer], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      
      currentAudioRef.current = audio
      
      audio.onended = () => {
        console.log('Audio playback finished')
        setIsPlayingAudio(false)
        URL.revokeObjectURL(url)
        currentAudioRef.current = null
        resolve()
      }
      
      audio.onerror = (err) => {
        console.error('Audio playback error:', err)
        setIsPlayingAudio(false)
        URL.revokeObjectURL(url)
        currentAudioRef.current = null
        reject(err)
      }
      
      audio.play().catch(err => {
        console.error('Audio play failed:', err)
        setIsPlayingAudio(false)
        URL.revokeObjectURL(url)
        currentAudioRef.current = null
        reject(err)
      })
    } catch (err) {
      console.error('Error creating audio:', err)
      setIsPlayingAudio(false)
      reject(err)
    }
  })
}
  // Start interview with retry logic
  // useEffect(() => {
  //   let mounted = true
  //   async function startWithRetry(attempts = 3) {
  //     for (let i = 0; i < attempts; i++) {
  //       try {
  //         setLoading(true)
  //         const res = await startInterviewProxy()
  //         if (!mounted) return
  //         const sid = res.session_id || res.sessionId || null
  //         setSessionId(sid)
  //         const aiMsg = res.message || res.ai_message || 'السلام علیکم۔ آپ کا پورا نام کیا ہے؟' // Fallback greeting
  //         setMessages([{ role: 'assistant', content: aiMsg, timestamp: new Date().toLocaleTimeString() }])
  //         setError(null) // Clear errors

  //         // Prefetch TTS
  //         try {
  //           const ttsRes = await fetch('/api/ai-proxy/tts', {
  //             method: 'POST',
  //             headers: { 'Content-Type': 'application/json' },
  //             body: JSON.stringify({ text: aiMsg, voice_id: 'v_meklc281' })
  //           })
  //           if (ttsRes.ok) {
  //             const ab = await ttsRes.arrayBuffer()
  //             setStarterAudioQueued(ab)
  //           }
  //         } catch (err) {
  //           console.warn('TTS prefetch failed', err)
  //         }
  //         return // Success, exit loop
  //       } catch (err) {
  //         console.error('Start interview failed (attempt ' + (i + 1) + ')', err)
  //         setError('Greeting failed to load. Retrying...')
  //       } finally {
  //         setLoading(false)
  //       }
  //     }
  //     setError('Failed to load greeting after retries. Check backend.')
  //   }
  //   startWithRetry()
  //   return () => { mounted = false }
  // }, [])
// useEffect(() => {
//   let mounted = true
//   async function startWithRetry(attempts = 3) {
//     for (let i = 0; i < attempts; i++) {
//       try {
//         setLoading(true)
//         const res = await startInterviewProxy()
//         if (!mounted) return
//         const sid = res.session_id || res.sessionId || null
//         setSessionId(sid)
//         const aiMsg = res.message || res.ai_message || 'السلام علیکم۔ آپ کا پورا نام کیا ہے؟'
//         setMessages([{ role: 'assistant', content: aiMsg, timestamp: new Date().toLocaleTimeString() }])
//         setError(null)

//         // Prefetch TTS
//         try {
//           const formData = new FormData()
//           formData.append('text', aiMsg)
//           formData.append('voice_id', 'v_meklc281')
//           formData.append('output_format', 'MP3_22050_32')
//           formData.append('save_file', 'false')

//           const ttsRes = await fetch('../api/ai-proxy/tts', {
//             method: 'POST',
//             body: formData
//           })
//           if (ttsRes.ok) {
//             const ab = await ttsRes.arrayBuffer()
//             setStarterAudioQueued(ab)
//           } else {
//             console.warn('TTS prefetch failed', await ttsRes.text())
//           }
//         } catch (err) {
//           console.warn('TTS prefetch failed', err)
//         }
//         return
//       } catch (err) {
//         console.error('Start interview failed (attempt ' + (i + 1) + ')', err)
//         setError('Greeting failed to load. Retrying...')
//       } finally {
//         setLoading(false)
//       }
//     }
//     setError('Failed to load greeting after retries. Check backend.')
//   }
//   startWithRetry()
//   return () => { mounted = false }
// }, [])
useEffect(() => {
    let mounted = true
    async function startInterview() {
      try {
        setLoading(true)
        const res = await startInterviewProxy()
        if (!mounted) return
        setSessionId(res.session_id)
        const aiMsg = res.message || 'السلام علیکم۔ آپ کا پورا نام کیا ہے؟'
        setMessages([{ role: 'assistant', content: aiMsg, timestamp: new Date().toLocaleTimeString() }])
        
        // Try to play audio immediately
        try {
          const formData = new FormData()
          formData.append('text', aiMsg)
          formData.append('voice_id', 'v_meklc281')
          const ttsRes = await fetch('../api/ai-proxy/tts', { method: 'POST', body: formData })
          if (ttsRes.ok) {
            const ab = await ttsRes.arrayBuffer()
            setStarterAudioQueued(ab)
            playAudioFromArrayBuffer(ab, 'audio/mpeg').catch(() => {})
          }
        } catch (err) {
          console.warn('TTS prefetch failed')
        }
      } catch (err) {
        setError('Failed to start interview')
      } finally {
        setLoading(false)
      }
    }
    startInterview()
    return () => { mounted = false }
  }, [])
  // Play starter TTS after user interaction
  useEffect(() => {
    if (!userInteracted || !starterAudioQueued) return
    playAudioFromArrayBuffer(starterAudioQueued, 'audio/mpeg')
    setStarterAudioQueued(null)
  }, [userInteracted, starterAudioQueued])

  // Setup media recorder
  const audioChunksRef = useRef<Blob[]>([])
  useEffect(() => {
  if (!navigator.mediaDevices) {
    setError('Media devices not available in this browser.')
    return
  }

  navigator.mediaDevices.getUserMedia({ 
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 16000
    } 
  })
  .then(stream => {
    const options = { mimeType: 'audio/webm;codecs=opus' }
    
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      const fallbacks = [
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ]
      
      for (const type of fallbacks) {
        if (MediaRecorder.isTypeSupported(type)) {
          options.mimeType = type
          break
        }
      }
    }
    
    console.log('Using media recorder with:', options.mimeType)
    
    const mr = new MediaRecorder(stream, options)
    setMediaRecorder(mr)
    
    // CRITICAL: Store chunks in ref, not state
    mr.ondataavailable = (ev) => {
      if (ev.data.size > 0) {
        console.log('Chunk received:', ev.data.size, 'bytes')
        audioChunksRef.current.push(ev.data)
      }
    }
    
    mr.onerror = (err) => {
      console.error('MediaRecorder error:', err)
      setError('Recording error occurred.')
    }
  })
  .catch(err => {
    console.error('Mic access denied:', err)
    setError('Microphone access denied. Please allow microphone and refresh.')
  })
}, [])

// 3. REPLACE Start Recording Handler
const handleStartRecording = () => {
  // CRITICAL: Don't allow recording while audio is playing
  if (isPlayingAudio) {
    console.log('Waiting for audio to finish before recording...')
    setError('Please wait for the question to finish playing.')
    return
  }
  
  // If there's queued audio waiting, trigger it first (for autoplay blocked scenarios)
  if (starterAudioQueued && !userInteracted) {
    setUserInteracted(true)
    setError('Playing question first. Please wait...')
    return
  }
  
  if (!mediaRecorder) {
    setError('No media recorder available.')
    return
  }
  
  // Clear previous chunks
  audioChunksRef.current = []
  
  try {
    mediaRecorder.start(100)
    setRecording(true)
    console.log('Recording started')
    setError(null) // Clear any previous errors
  } catch (err) {
    console.error('Failed to start recording:', err)
    setError('Failed to start recording.')
  }
}
  // Handle start recording
  // const handleStartRecording = () => {
  //   setUserInteracted(true)
  //   if (!mediaRecorder) return setError('No media recorder available.')
  //   setAudioChunks([])
  //   mediaRecorder.start()
  //   setRecording(true)
  // }

  // Handle stop and send recording (with transcribe fix)
 const handleStopAndSendRecording = async () => {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return
  
  setRecording(false)
  setLoading(true)

  try {
    // Wait for stop event
    const stopPromise = new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped')
        resolve()
      }
    })
    
    mediaRecorder.stop()
    await stopPromise
    
    // Give extra time for last chunks
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const chunks = audioChunksRef.current
    console.log('Total chunks collected:', chunks.length)
    
    if (chunks.length === 0) {
      throw new Error('No audio data recorded. Please try again.')
    }
    
    // Create blob from chunks
    const mimeType = mediaRecorder.mimeType || 'audio/webm'
    const audioBlob = new Blob(chunks, { type: mimeType })
    
    console.log(`Audio blob: ${audioBlob.size} bytes, type: ${mimeType}`)
    
    if (audioBlob.size === 0) {
      throw new Error('Audio recording is empty. Please speak louder or check microphone.')
    }
    
    // Minimum size check (less than 1KB is suspicious)
    if (audioBlob.size < 1000) {
      console.warn('Audio seems very short:', audioBlob.size, 'bytes')
    }
    
    // Determine extension
    const extension = mimeType.includes('webm') ? 'webm' : 
                     mimeType.includes('ogg') ? 'ogg' : 
                     mimeType.includes('mp4') ? 'mp4' : 'webm'
    
    // Send to backend
    const form = new FormData()
    form.append('file', audioBlob, `recording.${extension}`)
    form.append('model', 'whisper-large-v3')

    console.log('Sending to STT API...')

    const res = await fetch('../api/ai-proxy/transcribe', { 
      method: 'POST', 
      body: form 
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('STT error:', errorText)
      throw new Error(`STT failed: ${res.statusText}`)
    }
    
    const json = await res.json()
    console.log('Transcription received:', json)
    
    const transcribed = json.text || ''
    if (!transcribed) {
      throw new Error('No transcription text returned')
    }

    console.log('Transcribed text:', transcribed)
    setInput(transcribed)
    await send(transcribed)
    setError(null)
    
  } catch (err) {
    console.error('Recording/transcription error:', err)
    setError(`${String(err)}`)
  } finally {
    setLoading(false)
    audioChunksRef.current = [] // Clear for next recording
  }
}
const handleMicToggle = async () => {
    if (recording) {
      // Stop recording
      if (!mediaRecorder || mediaRecorder.state === 'inactive') return
      setRecording(false)
      setLoading(true)

      try {
        const stopPromise = new Promise<void>((resolve) => {
          mediaRecorder.onstop = () => resolve()
        })
        mediaRecorder.stop()
        await stopPromise
        await new Promise(resolve => setTimeout(resolve, 200))

        const chunks = audioChunksRef.current
        if (chunks.length === 0) throw new Error('No audio recorded')

        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        if (audioBlob.size === 0) throw new Error('Empty recording')

        const form = new FormData()
        form.append('file', audioBlob, 'recording.webm')
        form.append('model', 'whisper-large-v3')

        const res = await fetch('../api/ai-proxy/transcribe', { method: 'POST', body: form })
        if (!res.ok) throw new Error('Transcription failed')

        const json = await res.json()
        const transcribed = json.text || ''
        if (!transcribed) throw new Error('No transcription')

        await sendMessage(transcribed)
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
        audioChunksRef.current = []
      }
    } else {
      // Start recording
      if (isPlayingAudio) {
        setError('Please wait for question to finish')
        return
      }
      if (!mediaRecorder) {
        setError('Microphone not available')
        return
      }
      audioChunksRef.current = []
      mediaRecorder.start(100)
      setRecording(true)
      setError(null)
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

    // IMPORTANT: Wait for TTS to complete before allowing next recording
    try {
      const formData = new FormData()
      formData.append('text', aiMsg)
      formData.append('voice_id', 'v_meklc281')
      formData.append('output_format', 'MP3_22050_32')
      formData.append('save_file', 'false')

      const ttsRes = await fetch('../api/ai-proxy/tts', {
        method: 'POST',
        body: formData
      })
      
      if (ttsRes.ok) {
        const ab = await ttsRes.arrayBuffer()
        // Wait for audio to finish playing
        await playAudioFromArrayBuffer(ab, 'audio/mpeg')
        console.log('AI response audio finished playing')
      } else {
        console.warn('TTS failed, continuing without audio')
      }
    } catch (ttsErr) {
      console.warn('TTS error:', ttsErr)
    }
    
    setError(null)
  } catch (err) {
    console.error('Send message failed', err)
    setError('Failed to send message.')
  } finally {
    setLoading(false)
  }
}
useEffect(() => {
  if (!userInteracted || !starterAudioQueued) return
  
  playAudioFromArrayBuffer(starterAudioQueued, 'audio/mpeg')
    .then(() => {
      console.log('Starter audio finished')
      setStarterAudioQueued(null)
    })
    .catch(err => {
      console.error('Starter audio failed:', err)
      setStarterAudioQueued(null)
    })
}, [userInteracted, starterAudioQueued])
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
const sendMessage = async (msg: string) => {
    if (!sessionId || !msg) return
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date().toLocaleTimeString() }])
    setLoading(true)

    try {
      const res = await sendMessageProxy(sessionId, msg)
      const aiMsg = res.message || 'Sorry, no response.'
      setMessages(prev => [...prev, { role: 'assistant', content: aiMsg, timestamp: new Date().toLocaleTimeString() }])

      // Play TTS
      const formData = new FormData()
      formData.append('text', aiMsg)
      formData.append('voice_id', 'v_meklc281')
      const ttsRes = await fetch('../api/ai-proxy/transcribe', { method: 'POST', body: formData })
      if (ttsRes.ok) {
        const ab = await ttsRes.arrayBuffer()
        await playAudioFromArrayBuffer(ab, 'audio/mpeg')
      }
    } catch (err) {
      setError('Failed to send message')
    } finally {
      setLoading(false)
    }
  }
  // ... (keep your existing playAudioFromArrayBuffer, exportWav, etc. functions unchanged)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg p-6 text-center">
        <h1 className="text-3xl font-bold text-indigo-800">صحت نامہ - Sehat Nama</h1>
        <p className="text-gray-600 mt-2">آواز سے طبی تاریخ - Voice Medical History</p>
      </div>

      {/* Status Indicators */}
      <div className="p-4 space-y-2">
        {isPlayingAudio && (
          <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-4 flex items-center justify-center space-x-3 animate-pulse">
            <div className="flex space-x-1">
              <div className="w-2 h-8 bg-blue-600 rounded animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-8 bg-blue-600 rounded animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-8 bg-blue-600 rounded animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-blue-800 font-semibold">🔊 AI سوال سنا رہا ہے...</span>
          </div>
        )}
        {!isPlayingAudio && !recording && !loading && messages.length > 0 && (
          <div className="bg-green-100 border border-green-500 rounded-lg p-3 text-center">
            <span className="text-green-800">✓ اب آپ جواب ریکارڈ کر سکتے ہیں</span>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-500 rounded-lg p-3 text-center">
            <span className="text-red-800">{error}</span>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-900'
            }`}>
              <div className="font-semibold text-sm mb-1">{m.role === 'user' ? 'آپ' : 'AI'}</div>
              <div className="whitespace-pre-wrap">{m.content}</div>
              <div className="text-xs opacity-70 mt-1">{m.timestamp}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Mic Button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
        <button
          onClick={handleMicToggle}
          disabled={isPlayingAudio || loading}
          className={`relative w-20 h-20 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 ${
            recording
              ? 'bg-red-600 animate-pulse'
              : isPlayingAudio || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 animate-bounce'
          }`}
        >
          {recording ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
          ) : (
            <div className="flex items-center justify-center text-white text-3xl">🎤</div>
          )}
          {recording && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>
          )}
        </button>
        <div className="text-center mt-2 text-sm font-semibold text-gray-700">
          {recording ? 'رکیں' : isPlayingAudio ? 'انتظار...' : 'بولیں'}
        </div>
      </div>
    </div>
  )
}