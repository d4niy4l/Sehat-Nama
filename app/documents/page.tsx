'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/supabase-provider'
import { LoadingSpinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  Heart, 
  ArrowLeft,
  LogOut,
  FileText,
  Download,
  Eye,
  Trash2,
  Upload,
  Calendar,
  HardDrive,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { authUtils } from '@/lib/auth-utils'

interface Document {
  id: string
  name: string
  originalName: string
  size: number
  mimeType: string
  createdAt: string
  updatedAt: string
  downloadUrl: string | null
  publicUrl: string | null
}

interface DocumentsResponse {
  success: boolean
  userId: string
  totalDocuments: number
  documents: Document[]
  message: string
}

export default function DocumentsPage() {
  const { user, loading } = useSupabase()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'image' | 'document'>('all')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    } else if (user) {
      fetchDocuments()
    }
  }, [user, loading, router])

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true)
      setError(null)
      
      // Get user ID to send to API
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch(`/api/get-documents?userId=${encodeURIComponent(user.id)}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`)
      }
      
      const data: DocumentsResponse = await response.json()
      
      if (data.success) {
        setDocuments(data.documents)
      } else {
        throw new Error(data.message || 'Failed to fetch documents')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
      console.error('Error fetching documents:', err)
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await authUtils.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const goBackToDashboard = () => {
    router.push('/dashboard')
  }

  const goToUpload = () => {
    router.push('/dashboard/upload')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (mimeType: string): JSX.Element => {
    if (mimeType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />
    } else if (mimeType.includes('image')) {
      return <FileText className="h-8 w-8 text-blue-500" />
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-600" />
    }
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  const getFileType = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('image')) return 'Image'
    if (mimeType.includes('word')) return 'Word'
    if (mimeType.includes('document')) return 'Document'
    return 'File'
  }

  const handleDownload = async (document: Document) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      
      if (document.downloadUrl) {
        // Use existing URL if available
        window.open(document.downloadUrl, '_blank')
      } else {
        // Generate new download URL
        const response = await fetch(`/api/download-document/${encodeURIComponent(document.name)}?userId=${encodeURIComponent(user.id)}`)
        const data = await response.json()
        
        if (data.success && data.downloadUrl) {
          window.open(data.downloadUrl, '_blank')
        } else {
          throw new Error('Failed to generate download link')
        }
      }
    } catch (error) {
      console.error('Download error:', error)
      setError('Failed to download document')
    }
  }

  const filteredAndSortedDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterType === 'all' || 
        (filterType === 'pdf' && doc.mimeType.includes('pdf')) ||
        (filterType === 'image' && doc.mimeType.includes('image')) ||
        (filterType === 'document' && (doc.mimeType.includes('word') || doc.mimeType.includes('document')))
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'size':
          return b.size - a.size
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

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

  if (!user) {
    return null // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-medical-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                onClick={goBackToDashboard}
                variant="ghost"
                size="sm"
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center">
                <div className="bg-primary-100 dark:bg-primary-900 rounded-lg p-2 mr-3 animate-float">
                  <Heart className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white font-urdu">صحت نامہ</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">My Documents</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-urdu">مرحبا</p>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Medical Documents
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              View and download your uploaded medical files
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={fetchDocuments} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={goToUpload} className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="pdf">PDF Files</option>
                <option value="image">Images</option>
                <option value="document">Documents</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              <span>{documents.length} total documents</span>
            </div>
            <div className="flex items-center">
              <HardDrive className="h-4 w-4 mr-1" />
              <span>{formatFileSize(documents.reduce((total, doc) => total + doc.size, 0))} total size</span>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {loadingDocs ? (
          <div className="card p-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="spinner w-6 h-6"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
            </div>
          </div>
        ) : filteredAndSortedDocuments.length > 0 ? (
          <div className="grid gap-4">
            {filteredAndSortedDocuments.map((document) => (
              <div key={document.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getFileIcon(document.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {document.name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-medium">
                          {getFileType(document.mimeType)}
                        </span>
                        <div className="flex items-center">
                          <HardDrive className="h-3 w-3 mr-1" />
                          <span>{formatFileSize(document.size)}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(document.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleDownload(document)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm || filterType !== 'all' ? 'No documents match your search' : 'No documents found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search terms or filters' 
                : 'Upload your first medical document to get started'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <Button onClick={goToUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
