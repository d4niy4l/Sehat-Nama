"use client"

import React, { useCallback, useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/spinner'
import { Upload, FileText, CheckCircle, XCircle, Loader2, LogOut, Heart, Moon, Sun, X, AlertCircle } from 'lucide-react'

// Mock components - replace with your actual imports
type ButtonProps = {
  children: React.ReactNode
  onClick?: (e?: any) => void
  disabled?: boolean
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Button: React.FC<ButtonProps> = ({ children, onClick, disabled, variant = 'primary', size = 'md', className = '' }) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40',
    outline: 'border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  }
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button 
      onClick={onClick as any} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

type UploadDropzoneProps = {
  onFilesChange: (files: File[]) => void
  files: File[]
}

const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onFilesChange, files }) => {
  const [isDragging, setIsDragging] = useState(false)
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    onFilesChange([...files, ...droppedFiles])
  }
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    onFilesChange([...files, ...selectedFiles])
  }
  
  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }
  
  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-3 border-dashed rounded-2xl p-8 md:p-12 transition-all duration-300 cursor-pointer ${
          isDragging 
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 scale-[1.02]' 
            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-2xl">
            <Upload className="w-10 h-10 md:w-12 md:h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Drop your medical documents here
            </p>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              or click to browse • PDF, JPG, PNG, DOC (max 10MB each)
            </p>
          </div>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected Files ({files.length})
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function UploadPage() {
  // Use real Supabase auth
  const { user, loading } = useSupabase()
  const displayName = loading ? 'Loading…' : (user?.user_metadata?.full_name ?? user?.email ?? 'Patient')
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])
  const [theme, setTheme] = useState<'light'|'dark'>('light')
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({})
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)
  type Summary = {
    patientName: string
    totalVisits: number
    lastVisit: string
    conditions: string[]
    medications: string[]
    allergies: string[]
    recentNotes: string
  }

  const [summary, setSummary] = useState<Summary | null>(null)

  const validateFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    
    if (file.size > maxSize) {
      throw new Error(`${file.name} exceeds 10MB limit`)
    }
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`${file.name} is not a supported file type`)
    }
  }

  const handleUpload = useCallback(async () => {
    if (!user) return setMessage({ type: 'error', text: 'You must be signed in to upload files.' })
    if (selectedFiles.length === 0) return setMessage({ type: 'error', text: 'Please select files first.' })

    setUploading(true)
    setMessage(null)
    setUploadProgress({})
    
    try {
      // Validate all files first
      for (const file of selectedFiles) {
        validateFile(file)
      }

      // Upload via server-side API to keep bucket name private and use service role key
      const formData = new FormData()
      for (const file of selectedFiles) {
        formData.append('files', file)
      }
      formData.append('userId', user.id)

      // POST to server route which uses SUPABASE_SERVICE_ROLE_KEY and private bucket
      const res = await fetch('/api/upload-files', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed on server')
      const json = await res.json()
      const uploaded = json.uploaded ?? []
      setMessage({ type: 'success', text: `Successfully uploaded ${uploaded.length} file(s)` })

      // Mock API call for summary
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSummary({
        patientName: "Ahmad Khan",
        totalVisits: 5,
        lastVisit: "2025-09-15",
        conditions: ["Hypertension", "Type 2 Diabetes"],
        medications: ["Metformin 500mg", "Lisinopril 10mg"],
        allergies: ["Penicillin"],
        recentNotes: "Patient showing good compliance with medication. Blood pressure under control."
      })
      
    } catch (err: unknown) {
      console.error(err)
      const messageText = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setMessage({ type: 'error', text: messageText })
    } finally {
      setUploading(false)
    }
  }, [selectedFiles, user])

  const handleClear = () => {
    setSelectedFiles([])
    setSummary(null)
    setMessage(null)
    setUploadProgress({})
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-medical-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 font-urdu">لوڈ ہو رہا ہے...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
        
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 dark:bg-emerald-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 dark:bg-teal-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Header */}
        <header className="relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 md:h-20">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl p-2.5 shadow-lg">
                    <Heart className="h-6 w-6 text-white fill-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                    صحت نامہ
                  </h1>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">Sehat Nama</p>
                </div>
              </div>

              {/* User info & actions */}
              <div className="flex items-center gap-2 md:gap-4">
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {theme === 'light' ? <Moon className="w-5 h-5 text-gray-700" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                </button>
                
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">مریض • Patient</p>
                </div>
                
                <Button variant="outline" size="sm" onClick={async () => {
                  try {
                    await supabase.auth.signOut()
                    router.push('/')
                  } catch (err: any) {
                    console.error('Sign out failed', err)
                    setMessage({ type: 'error', text: 'Sign out failed. Please try again.' })
                  }
                }}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative max-w-5xl mx-auto py-6 md:py-12 px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="mb-8 md:mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Secure Document Upload</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Upload Your Medical Records
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Share your past visit documents, prescriptions, and reports. Our AI will analyze them to create a comprehensive health summary.
            </p>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 animate-in slide-in-from-top-2 ${
              message.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Upload Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 md:p-8 mb-8">
            <UploadDropzone onFilesChange={setSelectedFiles} files={selectedFiles} />

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0} size="lg" className="flex-1">
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Analyze
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClear} disabled={uploading} size="lg">
                Clear All
              </Button>
            </div>

            {/* Upload Progress */}
            {uploading && Object.keys(uploadProgress).length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Progress</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{file.name}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium ml-2">{uploadProgress[index] || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${uploadProgress[index] || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary Card */}
          {summary && (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 md:p-8 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-xl">
                  <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Patient Health Summary</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI-generated overview from your documents</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Patient Info */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Patient Name</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.patientName}</p>
                </div>

                {/* Total Visits */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">Total Visits</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.totalVisits} visits</p>
                </div>

                {/* Last Visit */}
                <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-100 dark:border-orange-800/30">
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">Last Visit</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.lastVisit}</p>
                </div>

                {/* Conditions */}
                <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.conditions.map((condition: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Medications */}
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30 md:col-span-2">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-3">Current Medications</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.medications.map((med: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 border border-emerald-200 dark:border-emerald-800">
                        {med}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800/30 md:col-span-2">
                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide mb-2">⚠️ Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.allergies.map((allergy: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-sm font-bold text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-800">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recent Notes */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-xl border border-gray-200 dark:border-gray-700 md:col-span-2">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Recent Notes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary.recentNotes}</p>
                </div>
              </div>
            </div>
          )}
        </main>

        <style jsx>{`
          @keyframes slide-in-from-top-2 {
            from {
              transform: translateY(-0.5rem);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes slide-in-from-bottom-4 {
            from {
              transform: translateY(1rem);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          .animate-in {
            animation-duration: 0.5s;
            animation-fill-mode: both;
          }
          
          .slide-in-from-top-2 {
            animation-name: slide-in-from-top-2;
          }
          
          .slide-in-from-bottom-4 {
            animation-name: slide-in-from-bottom-4;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #10b981;
            border-radius: 4px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #059669;
          }
        `}</style>
      </div>
    </div>
  )
}