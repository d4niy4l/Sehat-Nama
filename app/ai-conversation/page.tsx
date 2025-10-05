'use client'

import { useState, useEffect, useRef } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, Loader2, Volume2, Mic, MessageCircle } from 'lucide-react'

interface AIResponse {
  session_id: string
  message: string
  audio_base64?: string
  is_complete?: boolean
  collected_data?: any
  error?: string
  details?: string
}

interface TranscriptionResponse {
  text: string
  error?: string
}

export default function AIConversationPage() {
  const { user } = useSupabase()
  const router = useRouter()
  
  // Core state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [status, setStatus] = useState('Click "Start Medical Interview" to begin')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [interviewComplete, setInterviewComplete] = useState(false)
  
  // New subtitle state
  const [currentSubtitle, setCurrentSubtitle] = useState('')
  const [userResponse, setUserResponse] = useState('')
  
  // Recording state
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  
  // API base URL
  const apiBase = 'http://localhost:8000'

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  // Setup media recorder
  useEffect(() => {
    const setupRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000
          }
        })
        
        const recorder = new MediaRecorder(stream, { 
          mimeType: 'audio/webm;codecs=opus' 
        })
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data)
          }
        }
        
        recorder.onerror = (e) => {
          console.error('MediaRecorder error:', e)
          setStatus('Recording error occurred')
        }
        
        setMediaRecorder(recorder)
      } catch (error) {
        console.error('Microphone access denied:', error)
        setStatus('Microphone access denied. Please allow microphone and refresh.')
      }
    }
    
    setupRecorder()
  }, [])

  // Play audio from base64
  const playAudioFromBase64 = (audioBase64: string, subtitleText: string = ''): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Stop any currently playing audio
        if (currentAudioRef.current) {
          currentAudioRef.current.pause()
          currentAudioRef.current = null
        }

        const audioBlob = new Blob([
          Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
        ], { type: 'audio/mp3' })
        
        const url = URL.createObjectURL(audioBlob)
        const audio = new Audio(url)
        currentAudioRef.current = audio
        
        setIsPlayingAudio(true)
        setCurrentSubtitle(subtitleText) // Show subtitle
        
        audio.onended = () => {
          setStatus('🎤 Question finished. Click "Start Recording" to respond.')
          setIsPlayingAudio(false)
          setCurrentSubtitle('') // Clear subtitle
          URL.revokeObjectURL(url)
          currentAudioRef.current = null
          resolve()
        }
        
        audio.onerror = (e) => {
          console.error('Audio playback error:', e)
          setStatus('❌ Audio playback failed. Click "Start Recording" to respond.')
          setIsPlayingAudio(false)
          setCurrentSubtitle('') // Clear subtitle
          URL.revokeObjectURL(url)
          currentAudioRef.current = null
          reject(e)
        }
        
        audio.play().catch(e => {
          console.error('Audio play failed:', e)
          setStatus('❌ Audio play failed. Click "Start Recording" to respond.')
          setIsPlayingAudio(false)
          setCurrentSubtitle('') // Clear subtitle
          reject(e)
        })
      } catch (e) {
        console.error('Error creating audio from base64:', e)
        setStatus('Audio error. Click "Start Recording" to respond.')
        setIsPlayingAudio(false)
        reject(e)
      }
    })
  }

  // TTS fallback
  const ttsAndPlay = async (text: string): Promise<void> => {
    try {
      const formData = new FormData()
      formData.append('text', text)
      formData.append('voice_id', 'v_meklc281')
      formData.append('output_format', 'MP3_22050_32')
      formData.append('save_file', 'false')

      const ttsRes = await fetch(`${apiBase}/text-to-speech`, {
        method: 'POST',
        body: formData
      })
      
      if (!ttsRes.ok) throw new Error('TTS failed')
      
      const audioBlob = await ttsRes.blob()
      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)
      currentAudioRef.current = audio
      
      setIsPlayingAudio(true)
      setCurrentSubtitle(text) // Show subtitle
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          setStatus('🎤 Question finished. Click "Start Recording" to respond.')
          setIsPlayingAudio(false)
          setCurrentSubtitle('') // Clear subtitle
          URL.revokeObjectURL(url)
          currentAudioRef.current = null
          resolve()
        }
        
        audio.onerror = (e) => {
          console.error('TTS Audio playback error:', e)
          setStatus('❌ Audio playback failed. Click "Start Recording" to respond.')
          setIsPlayingAudio(false)
          setCurrentSubtitle('') // Clear subtitle
          URL.revokeObjectURL(url)
          currentAudioRef.current = null
          reject(e)
        }
        
        audio.play().catch(e => {
          console.error('TTS Audio play failed:', e)
          setStatus('❌ Audio play failed. Click "Start Recording" to respond.')
          setIsPlayingAudio(false)
          setCurrentSubtitle('') // Clear subtitle
          reject(e)
        })
      })
    } catch (error) {
      console.error('TTS error:', error)
      setStatus('❌ TTS failed. Click "Start Recording" to respond.')
      setIsPlayingAudio(false)
      setCurrentSubtitle('') // Clear subtitle
    }
  }

  // Start interview
  const startInterview = async () => {
    setStatus('🚀 Starting History Taking...')
    setIsProcessing(true)
    
    try {
      const res = await fetch(`${apiBase}/api/start-interview-with-voice`, { 
        method: 'POST' 
      })
      const data: AIResponse = await res.json()
      
      if (data.error) {
        throw new Error(data.details || data.error)
      }
      
      setSessionId(data.session_id)
      setInterviewStarted(true)
      
      // Play the initial question audio
      if (data.audio_base64) {
        setStatus('🔊 Playing question...')
        await playAudioFromBase64(data.audio_base64, data.message)
      } else {
        // Fallback to TTS if no audio
        setStatus('🔊 Playing question...')
        await ttsAndPlay(data.message)
      }
    } catch (error) {
      console.error('Error starting interview:', error)
      setStatus(`❌ Error starting interview: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Start recording
  const startRecording = async () => {
    if (!mediaRecorder || isPlayingAudio) return
    
    try {
      audioChunksRef.current = []
      mediaRecorder.start()
      setIsRecording(true)
      setUserResponse('') // Clear previous response
      setStatus('🎤 Recording... Press Stop to send')
    } catch (error) {
      console.error('Error starting recording:', error)
      setStatus(`❌ Error accessing microphone: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Stop recording and send
  const stopRecording = async () => {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return
    
    setIsRecording(false)
    setIsProcessing(true)
    setStatus('⚙️ Processing...')
    
    try {
      // Stop recording and wait for data
      const stopPromise = new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve()
      })
      
      mediaRecorder.stop()
      await stopPromise
      
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      
      // Transcribe audio
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('model', 'whisper-large-v3')

      const transRes = await fetch(`${apiBase}/transcribe`, {
        method: 'POST',
        body: formData
      })
      
      if (!transRes.ok) {
        throw new Error('Transcription failed')
      }
      
      const trans: TranscriptionResponse = await transRes.json()
      if (trans.error) {
        throw new Error(trans.error)
      }

      // Show transcribed text
      setUserResponse(trans.text)
      console.log('User said:', trans.text)

      // Send message to AI
      const sendRes = await fetch(`${apiBase}/api/send-message-with-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: sessionId, 
          message: trans.text 
        })
      })
      
      if (!sendRes.ok) {
        throw new Error('Failed to send message')
      }
      
      const resp: AIResponse = await sendRes.json()
      if (resp.error) {
        throw new Error(resp.details || resp.error)
      }

      if (resp.is_complete) {
        setStatus('🎉 History Taking complete!')
        setInterviewComplete(true)
        await saveHistory(resp.collected_data)
      } else {
        console.log('AI Response:', resp.message)
        
        // Play audio response if available
        if (resp.audio_base64) {
          setStatus('🔊 Playing AI response...')
          await playAudioFromBase64(resp.audio_base64, resp.message)
        } else {
          // Fallback to TTS
          setStatus('🔊 Playing AI response...')
          await ttsAndPlay(resp.message)
        }
      }
    } catch (error) {
      console.error('Error processing recording:', error)
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsPlayingAudio(false)
    } finally {
      setIsProcessing(false)
    }
  }

  // Save medical history
  const saveHistory = async (collectedData: any) => {
    if (!user?.email) return
    
    try {
      // Get the formatted history for display
      const historyRes = await fetch(`${apiBase}/api/get-history?session_id=${sessionId}&view=patient`)
      const historyData = await historyRes.json()
      if (historyData.error) {
        throw new Error(historyData.error)
      }
      
      console.log('History retrieved:', historyData.history)
      
      // Store the medical data in Supabase
      const storeRes = await fetch(`${apiBase}/api/store-medical-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: user.email,
          medical_data: collectedData
        })
      })
      
      const storeData = await storeRes.json()
      
      if (storeData.success) {
        console.log('Medical history stored successfully:', storeData)
        setStatus('History Taking complete! Medical history saved to database.')
      } else {
        throw new Error(storeData.detail || 'Failed to store medical history')
      }
    } catch (error) {
      console.error('Failed to save history:', error)
      setStatus(`History Taking complete, but failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Navigation
  const goBack = () => router.push('/dashboard')
  const goHome = () => router.push('/')

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-emerald-50 flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-teal-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-24 h-24 bg-blue-200 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-emerald-200 rounded-full opacity-20 animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 flex justify-between items-center bg-white/80 backdrop-blur-lg shadow-lg">
        <Button onClick={goBack} variant="outline" size="sm" className="flex items-center space-x-2 hover:bg-teal-50">
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Button>
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            صحت نامہ
          </h1>
          <p className="text-sm text-gray-600 font-medium">AI Medical History Taking</p>
        </div>
        <Button onClick={goHome} variant="outline" size="sm" className="flex items-center space-x-2 hover:bg-teal-50">
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-8 relative z-10">
        {/* Large Floating Ball */}
        <div className="relative flex flex-col items-center">
          <div className={`relative w-56 h-56 rounded-full transition-all duration-700 ease-in-out transform ${
            isPlayingAudio 
              ? 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 animate-bounce scale-110 shadow-2xl shadow-blue-500/50' 
              : isRecording 
              ? 'bg-gradient-to-br from-red-400 via-red-500 to-red-600 animate-pulse scale-110 shadow-2xl shadow-red-500/50' 
              : isProcessing
              ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 animate-spin scale-105 shadow-2xl shadow-yellow-500/50'
              : 'bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 hover:scale-105 shadow-xl hover:shadow-2xl'
          }`}>
            <div className="w-full h-full rounded-full flex items-center justify-center">
              {isPlayingAudio ? (
                <Volume2 className="h-24 w-24 text-white animate-pulse" />
              ) : isRecording ? (
                <Mic className="h-24 w-24 text-white animate-pulse" />
              ) : isProcessing ? (
                <Loader2 className="h-24 w-24 text-white animate-spin" />
              ) : (
                <MessageCircle className="h-24 w-24 text-white" />
              )}
            </div>
          </div>
          
          {/* Pulse effect rings for active states */}
          {(isPlayingAudio || isRecording) && (
            <>
              <div className={`absolute inset-0 w-56 h-56 rounded-full ${
                isPlayingAudio ? 'bg-blue-400' : 'bg-red-400'
              } animate-ping opacity-20`}></div>
              <div className={`absolute inset-2 w-52 h-52 rounded-full ${
                isPlayingAudio ? 'bg-blue-400' : 'bg-red-400'
              } animate-ping opacity-15 animation-delay-150`}></div>
            </>
          )}
          
          {/* Recording indicator dot */}
          {isRecording && (
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 rounded-full animate-ping shadow-lg">
              <div className="w-full h-full bg-red-600 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Subtitle Display */}
        {currentSubtitle && (
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Volume2 className="h-5 w-5 text-blue-600 animate-pulse" />
              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">AI Question</span>
            </div>
            <p className="text-lg text-gray-800 text-center leading-relaxed font-medium">
              {currentSubtitle}
            </p>
          </div>
        )}

        {/* User Response Display */}
         {userResponse && (
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-6 shadow-lg border border-teal-200 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Mic className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-semibold text-teal-600 uppercase tracking-wide">Your Response</span>
            </div>
            <p className="text-lg text-gray-800 text-center leading-relaxed font-medium">
              {userResponse}
            </p>
          </div>
        )} 

        {/* Status */}
        <div className="text-center max-w-2xl">
          <p className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">{status}</p>
          
          {/* Controls */}
          <div className="flex flex-col items-center space-y-6">
            {!interviewStarted ? (
              <Button
                onClick={startInterview}
                disabled={isProcessing}
                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-12 py-6 text-xl rounded-2xl shadow-xl transform transition-all duration-200 hover:scale-105 hover:shadow-2xl"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Starting Interview...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-6 w-6" />
                    <span>Start Medical Interview</span>
                  </div>
                )}
              </Button>
            ) : !interviewComplete ? (
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                <Button
                  onClick={startRecording}
                  disabled={isRecording || isProcessing || isPlayingAudio}
                  className={`px-8 py-4 text-lg rounded-xl transition-all duration-200 transform hover:scale-105 ${
                    isPlayingAudio 
                      ? 'bg-gray-400 cursor-not-allowed shadow-lg' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-xl hover:shadow-2xl'
                  } text-white`}
                >
                  <div className="flex items-center space-x-3">
                    <Mic className="h-5 w-5" />
                    <span>{isPlayingAudio ? 'Wait for Question...' : 'Start Recording'}</span>
                  </div>
                </Button>
                
                <Button
                  onClick={stopRecording}
                  disabled={!isRecording || isProcessing}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-white rounded-sm"></div>
                      <span>Stop Recording</span>
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-green-600 text-2xl font-bold mb-6 flex items-center justify-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-2xl">✅</span>
                  </div>
                  <span>Interview Complete!</span>
                </div>
                <Button
                  onClick={() => router.push('/medical-histories')}
                  className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5" />
                    <span>View Medical Histories</span>
                  </div>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Instructions */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200 max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">📋 How to Use</h3>
            <p className="text-gray-600">Follow these simple steps for the best experience</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Volume2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Listen Carefully</h4>
                  <p className="text-sm text-gray-600">Wait for each question to finish playing completely</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mic className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Record Response</h4>
                  <p className="text-sm text-gray-600">Click "Start Recording" when ready to answer</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Speak Clearly</h4>
                  <p className="text-sm text-gray-600">Use Urdu or English, speak at normal pace</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Stop When Done</h4>
                  <p className="text-sm text-gray-600">Click "Stop Recording" to send your response</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200">
            <p className="text-center text-sm text-gray-700">
              <span className="font-semibold">💡 Tip:</span> Your responses are automatically transcribed and saved. 
              The interview will complete when all necessary medical information is collected.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}