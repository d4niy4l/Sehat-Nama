"use client"

import React, { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SelectedFile {
  file: File
  id: string
  progress: number
}

interface UploadDropzoneProps {
  onFilesChange?: (files: File[]) => void
}

function humanFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function UploadDropzone({ onFilesChange }: UploadDropzoneProps) {
  const [files, setFiles] = useState<SelectedFile[]>([])
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback((selected: FileList | null) => {
    if (!selected) return
    const mapped: SelectedFile[] = Array.from(selected).map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      progress: 0,
    }))
    setFiles((prev) => {
      const next = [...prev, ...mapped]
      if (onFilesChange) onFilesChange(next.map((x) => x.file))
      return next
    })
  }, [onFilesChange])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.currentTarget.value = ''
  }

  const removeFile = (id: string) => {
    setFiles((f) => {
      const next = f.filter((x) => x.id !== id)
      if (onFilesChange) onFilesChange(next.map((x) => x.file))
      return next
    })
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center transition-colors flex flex-col items-center justify-center space-y-3',
          dragOver ? 'border-primary-600 bg-gradient-to-br from-primary-50/60 to-white' : 'border-gray-200 bg-white'
        )}
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-primary-100 text-primary-600">
            {/* simple upload SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v8m0-8l-4 4m4-4 4 4M12 4v8" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-gray-800 font-semibold">Drop files here or select to upload</p>
            <p className="text-sm text-gray-500">PDFs, images, and scanned reports — we keep them private and secure.</p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <label className="cursor-pointer inline-flex items-center">
            <Input type="file" multiple onChange={onFileInputChange} className="sr-only" />
            <Button variant="default">Select files</Button>
          </label>
          <span className="text-sm text-gray-500">or drag & drop</span>
        </div>
      </div>

      <div className="mt-4">
        {files.length === 0 ? (
          <p className="text-sm text-gray-500">No files selected</p>
        ) : (
          <div className="space-y-3">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center border">
                    <div className="text-xs font-semibold text-primary-600">{f.file.name.split('.').pop()}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{f.file.name}</div>
                    <div className="text-xs text-gray-500">{humanFileSize(f.file.size)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="h-2 bg-emerald-500" style={{ width: `${f.progress}%` }} />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFile(f.id)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadDropzone
