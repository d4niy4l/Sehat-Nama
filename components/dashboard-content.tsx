'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { authUtils } from '@/lib/auth-utils'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  Heart, 
  Stethoscope, 
  FileText, 
  User as UserIcon, 
  Settings, 
  LogOut,
  Plus,
  History,
  Shield,
  Users,
  Calendar,
  Activity,
  Upload
} from 'lucide-react'

interface DashboardContentProps {
  user: User
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await authUtils.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateToAI = () => {
    router.push('/ai-conversation')
  }

  const navigateToMedicalHistories = () => {
    router.push('/medical-histories')
  }

  const navigateToUpload = () => {
    router.push('/dashboard/upload')
  }

  const navigateToDocuments = () => {
    router.push('/documents')
  }

  const stats = [
    {
      title: 'AI History Taking',
      value: 'Available',
      change: 'Voice Enabled',
      icon: Stethoscope,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Document Upload',
      value: 'Active',
      change: 'Secure Storage',
      icon: Upload,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Medical Histories',
      value: 'Stored',
      change: 'Bilingual',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'User Account',
      value: 'Active',
      change: 'Authenticated',
      icon: Shield,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  const recentActivities = [
    {
      id: 1,
      patient: 'System',
      action: 'AI Interview feature available',
      time: 'Ready to use',
      type: 'feature',
    },
    {
      id: 2,
      patient: 'System',
      action: 'Document upload system active',
      time: 'Ready to use',
      type: 'feature',
    },
    {
      id: 3,
      patient: 'System',
      action: 'Medical history storage enabled',
      time: 'Active',
      type: 'feature',
    },
    {
      id: 4,
      patient: 'User',
      action: 'Account authenticated successfully',
      time: 'Just now',
      type: 'auth',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-medical-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="bg-primary-100 dark:bg-primary-900 rounded-lg p-2 mr-3 animate-float">
                  <Heart className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white font-urdu">صحت نامہ</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sehat Nama</p>
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
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {loading ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-slide-up">
            Welcome to Sehat Nama
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-urdu animate-slide-up" style={{ animationDelay: '0.1s' }}>
            آپ کے طبی تاریخ کے انتظام کے لیے آپ کا ڈیش بورڈ
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="card p-6 animate-scale-in" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`${stat.bgColor} dark:bg-gray-700 rounded-lg p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.color} dark:text-white`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={navigateToAI}>
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Start AI Interview
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={navigateToUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Medical Documents
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={navigateToDocuments}>
                  <FileText className="h-4 w-4 mr-2" />
                  View My Documents
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={navigateToMedicalHistories}>
                  <History className="h-4 w-4 mr-2" />
                  View Medical Histories
                </Button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                System Status
              </h3>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="bg-primary-100 dark:bg-primary-800 rounded-full p-2">
                      <Stethoscope className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.patient}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {activity.action}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Available Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="bg-primary-100 dark:bg-primary-900 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Stethoscope className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                AI Medical Interview
              </h4>
              <p className="text-gray-600 dark:text-gray-300 font-urdu mb-2">
                آواز کے ذریعے طبی تاریخ
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Voice-enabled Urdu medical history collection with real-time transcription
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Upload className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Document Upload
              </h4>
              <p className="text-gray-600 dark:text-gray-300 font-urdu mb-2">
                دستاویزات اپ لوڈ کریں
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Secure upload for medical documents, prescriptions, and reports
              </p>
            </div>
            
            <div className="card p-6 text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Medical History Storage
              </h4>
              <p className="text-gray-600 dark:text-gray-300 font-urdu mb-2">
                طبی تاریخ کا محفوظ ذخیرہ
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Secure bilingual storage with automatic English translation
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
