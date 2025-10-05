'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  Activity, 
  Heart,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  Languages,
  BarChart3,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MedicalHistory {
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

interface MedicalHistoriesResponse {
  email: string
  total_records: number
  histories: MedicalHistory[]
}

interface MedicalHistoriesProps {
  userEmail: string
}

export default function MedicalHistories({ userEmail }: MedicalHistoriesProps) {
  const [histories, setHistories] = useState<MedicalHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'partial'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'completion'>('date')

  useEffect(() => {
    fetchHistories()
  }, [userEmail])

  const fetchHistories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`http://localhost:8000/api/get-all-histories?email=${encodeURIComponent(userEmail)}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch histories: ${response.statusText}`)
      }
      
      const data: MedicalHistoriesResponse = await response.json()
      setHistories(data.histories)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medical histories')
      console.error('Error fetching histories:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (historyId: number) => {
    setExpandedHistory(expandedHistory === historyId ? null : historyId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getLanguageIcon = (language: string) => {
    return language === 'urdu' ? '🇵🇰' : '🇺🇸'
  }

  const filteredAndSortedHistories = histories
    .filter(history => {
      const matchesSearch = history.chief_complaint_preview.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterStatus === 'all' || history.stats.completion_status.toLowerCase() === filterStatus
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return b.stats.total_fields - a.stats.total_fields
      }
    })

  const renderMedicalData = (data: any, language: string) => {
    if (!data || typeof data !== 'object') return null

    return (
      <div className="space-y-6">
        {Object.entries(data).map(([sectionKey, sectionData]) => {
          if (!sectionData || typeof sectionData !== 'object') return null

          const sectionTitle = getSectionTitle(sectionKey, language)
          const sectionIcon = getSectionIcon(sectionKey)

          return (
            <div key={sectionKey} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary-50 to-medical-50 dark:from-gray-800 dark:to-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{sectionIcon}</span>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {sectionTitle}
                  </h4>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {Object.entries(sectionData as object).map(([fieldKey, fieldValue]) => {
                  if (!fieldValue || String(fieldValue).trim() === '') return null

                  return (
                    <div key={fieldKey} className="flex flex-col sm:flex-row sm:items-start space-y-1 sm:space-y-0 sm:space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="font-medium text-gray-700 dark:text-gray-300 min-w-0 sm:min-w-[180px]">
                        {getFieldTitle(fieldKey, language)}:
                      </div>
                      <div className="text-gray-900 dark:text-white flex-1 break-words">
                        {String(fieldValue)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card p-8">
        <div className="flex items-center justify-center space-x-4">
          <div className="spinner w-6 h-6"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading medical histories...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Histories
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchHistories} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (histories.length === 0) {
    return (
      <div className="card p-8">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Medical Histories Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start your first AI interview to create your medical history.
          </p>
          <Button onClick={() => window.location.href = '/ai-conversation'}>
            Start AI Interview
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Medical Histories
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {histories.length} record{histories.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search medical histories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="complete">Complete</option>
              <option value="partial">Partial</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="date">Sort by Date</option>
              <option value="completion">Sort by Completion</option>
            </select>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredAndSortedHistories.map((history) => (
          <div key={history.id} className="card overflow-hidden animate-scale-in">
            {/* History Header */}
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleExpand(history.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary-100 dark:bg-primary-900 rounded-lg p-3">
                    <Heart className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Medical Record #{history.id}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(history.stats.completion_status)}`}>
                        {history.stats.completion_status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getLanguageIcon(history.primary_language)} {history.primary_language}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      <strong>Chief Complaint:</strong> {history.chief_complaint_preview || 'No chief complaint recorded'}
                    </p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(history.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>{history.stats.total_sections} sections, {history.stats.total_fields} fields</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Report
                  </Button>
                  {expandedHistory === history.id ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedHistory === history.id && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <Languages className="h-4 w-4" />
                        <span>Switch to {history.primary_language === 'urdu' ? 'English' : 'Urdu'}</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Render Medical Data */}
                  {renderMedicalData(
                    history.primary_language === 'urdu' ? history.urdu_version : history.english_version,
                    history.primary_language
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAndSortedHistories.length === 0 && (
        <div className="card p-8 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No histories match your search
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}
    </div>
  )
}

// Helper functions for section and field titles
function getSectionTitle(sectionKey: string, language: string): string {
  const titles: Record<string, Record<string, string>> = {
    english: {
      demographics: "👤 Patient Demographics",
      presentation: "🏥 Chief Complaint & Presentation", 
      complaint: "🏥 Chief Complaint & Presentation",
      hpc: "📋 History of Present Complaint",
      history: "📋 History of Present Complaint",
      systems: "🔍 Systems Review",
      review: "🔍 Systems Review",
      pmh: "📚 Past Medical History",
      past_history: "📚 Past Medical History",
      medications: "💊 Medications & Allergies",
      drugs: "💊 Medications & Allergies",
      social: "🏠 Social History",
      social_history: "🏠 Social History",
      examination: "🩺 Physical Examination",
      assessment: "🎯 Assessment & Plan"
    },
    urdu: {
      demographics: "👤 مریض کی معلومات",
      presentation: "🏥 بنیادی شکایت",
      complaint: "🏥 بنیادی شکایت", 
      hpc: "📋 موجودہ بیماری کی تاریخ",
      history: "📋 موجودہ بیماری کی تاریخ",
      systems: "🔍 نظاموں کا جائزہ",
      review: "🔍 نظاموں کا جائزہ",
      pmh: "📚 ماضی کی طبی تاریخ",
      past_history: "📚 ماضی کی طبی تاریخ",
      medications: "💊 ادویات اور الرجی",
      drugs: "💊 ادویات اور الرجی",
      social: "🏠 سماجی تاریخ",
      social_history: "🏠 سماجی تاریخ",
      examination: "🩺 جسمانی معائنہ",
      assessment: "🎯 تشخیص اور منصوبہ"
    }
  }
  
  return titles[language]?.[sectionKey] || sectionKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getSectionIcon(sectionKey: string): string {
  const icons: Record<string, string> = {
    demographics: "👤",
    presentation: "🏥",
    complaint: "🏥",
    hpc: "📋",
    history: "📋",
    systems: "🔍",
    review: "🔍",
    pmh: "📚",
    past_history: "📚",
    medications: "💊",
    drugs: "💊",
    social: "🏠",
    social_history: "🏠",
    examination: "🩺",
    assessment: "🎯"
  }
  
  return icons[sectionKey] || "📄"
}

function getFieldTitle(fieldKey: string, language: string): string {
  const titles: Record<string, Record<string, string>> = {
    english: {
      name: "Full Name",
      age: "Age", 
      gender: "Gender",
      occupation: "Occupation",
      address: "Address",
      contact: "Contact Number",
      chief_complaint: "Chief Complaint",
      hpc: "History of Present Complaint",
      pain_description: "Pain Description",
      duration: "Duration",
      severity: "Severity",
      cardiovascular: "Cardiovascular System",
      respiratory: "Respiratory System", 
      gastrointestinal: "Gastrointestinal System",
      neurological: "Neurological System",
      previous_illnesses: "Previous Illnesses",
      surgeries: "Previous Surgeries",
      current_medications: "Current Medications",
      allergies: "Known Allergies",
      smoking: "Smoking History",
      alcohol: "Alcohol History"
    },
    urdu: {
      name: "مکمل نام",
      age: "عمر",
      gender: "جنس", 
      occupation: "پیشہ",
      address: "پتہ",
      contact: "رابطہ نمبر",
      chief_complaint: "بنیادی شکایت",
      hpc: "موجودہ بیماری کی تاریخ",
      pain_description: "درد کی تفصیل",
      duration: "مدت",
      severity: "شدت",
      cardiovascular: "دل کا نظام",
      respiratory: "سانس کا نظام",
      gastrointestinal: "ہاضمے کا نظام", 
      neurological: "اعصابی نظام",
      previous_illnesses: "پرانی بیماریاں",
      surgeries: "پرانے آپریشن",
      current_medications: "موجودہ ادویات",
      allergies: "معلوم الرجی",
      smoking: "سگریٹ کی تاریخ",
      alcohol: "شراب کی تاریخ"
    }
  }
  
  return titles[language]?.[fieldKey] || fieldKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}
