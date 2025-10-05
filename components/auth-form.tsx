'use client'

import { useState } from 'react'
import { authUtils } from '@/lib/auth-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner, LoadingSpinner } from '@/components/ui/spinner'
import { ThemeToggle } from '@/components/theme-toggle'
import { Heart, Stethoscope, Shield, Users, Eye, EyeOff } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [cnic, setCnic] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { theme } = useTheme()

  // CNIC validation function
  const validateCNIC = (cnic: string) => {
    // Remove any non-digit characters
    const cleanCNIC = cnic.replace(/\D/g, '')
    // Check if it's exactly 13 digits
    return cleanCNIC.length === 13 && /^\d{13}$/.test(cleanCNIC)
  }

  // Format CNIC for display
  const formatCNIC = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length <= 5) return cleanValue
    if (cleanValue.length <= 12) return `${cleanValue.slice(0, 5)}-${cleanValue.slice(5)}`
    return `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 12)}-${cleanValue.slice(12)}`
  }

  // Phone validation function
  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length >= 10 && cleanPhone.length <= 15
  }

  // Format phone for display
  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length <= 4) return cleanValue
    if (cleanValue.length <= 7) return `${cleanValue.slice(0, 4)}-${cleanValue.slice(4)}`
    if (cleanValue.length <= 11) return `${cleanValue.slice(0, 4)}-${cleanValue.slice(4, 7)}-${cleanValue.slice(7)}`
    return `${cleanValue.slice(0, 4)}-${cleanValue.slice(4, 7)}-${cleanValue.slice(7, 11)}`
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        await authUtils.signIn({ email, password })
      } else {
        // Validate required fields for signup
        if (!firstName.trim()) {
          throw new Error('First name is required')
        }
        if (!lastName.trim()) {
          throw new Error('Last name is required')
        }
        if (!validateCNIC(cnic)) {
          throw new Error('CNIC must be 13 digits (e.g., 12345-1234567-1)')
        }
        if (!validatePhone(phone)) {
          throw new Error('Phone number must be 10-15 digits')
        }
        if (!dateOfBirth) {
          throw new Error('Date of birth is required')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }

        await authUtils.signUp({
          email,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          cnic,
          phone: phone.replace(/\D/g, ''),
          dateOfBirth
        })
        
        // Show success message
        setSuccess('Account created successfully! Please check your email to confirm your account.')
        setError('')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setGoogleLoading(true)
    setError('')

    try {
      await authUtils.signInWithGoogle()
    } catch (error: any) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 medical-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-8 w-full max-w-lg mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-white/30 backdrop-blur-sm rounded-full p-6 animate-float">
                <Heart className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6 font-urdu animate-slide-up leading-tight">صحت نامہ</h1>
            <h2 className="text-3xl font-semibold mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>Sehat Nama</h2>
            <p className="text-xl opacity-95 animate-slide-up mb-4" style={{ animationDelay: '0.2s' }}>
              Automated Medical History Taking
            </p>
            <p className="text-lg opacity-85 font-urdu animate-slide-up leading-relaxed" style={{ animationDelay: '0.3s' }}>
              مقامی لوگوں کے لیے خودکار طبی تاریخ
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 w-full">
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="bg-white/25 backdrop-blur-sm rounded-xl p-6 mb-4">
                <Stethoscope className="h-10 w-10 mx-auto" />
              </div>
              <h3 className="font-semibold mb-2 text-lg">Medical History</h3>
              <p className="text-sm opacity-85 font-urdu">طبی تاریخ</p>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <div className="bg-white/25 backdrop-blur-sm rounded-xl p-6 mb-4">
                <Shield className="h-10 w-10 mx-auto" />
              </div>
              <h3 className="font-semibold mb-2 text-lg">Secure & Private</h3>
              <p className="text-sm opacity-85 font-urdu">محفوظ اور نجی</p>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.6s' }}>
              <div className="bg-white/25 backdrop-blur-sm rounded-xl p-6 mb-4">
                <Users className="h-10 w-10 mx-auto" />
              </div>
              <h3 className="font-semibold mb-2 text-lg">Local Community</h3>
              <p className="text-sm opacity-85 font-urdu">مقامی کمیونٹی</p>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.7s' }}>
              <div className="bg-white/25 backdrop-blur-sm rounded-xl p-6 mb-4">
                <Heart className="h-10 w-10 mx-auto" />
              </div>
              <h3 className="font-semibold mb-2 text-lg">Urdu Support</h3>
              <p className="text-sm opacity-85 font-urdu">اردو سپورٹ</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-white dark:bg-gray-900 overflow-y-auto">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="w-full max-w-xl animate-fade-in">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary-100 dark:bg-primary-900 rounded-full p-3 animate-float">
                <Heart className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 animate-slide-up">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-urdu animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {isLogin ? 'واپس آئیں' : 'اکاؤنٹ بنائیں'}
            </p>
          </div>

          <div className="card p-8 animate-scale-in" style={{ animationDelay: '0.2s' }}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm animate-slide-down">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm animate-slide-down">
                {success}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="input-field dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              {!isLogin && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <Input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        required={!isLogin}
                        className="input-field dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <Input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        required={!isLogin}
                        className="input-field dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CNIC Number
                    </label>
                    <Input
                      type="text"
                      value={cnic}
                      onChange={(e) => setCnic(formatCNIC(e.target.value))}
                      placeholder="12345-1234567-1"
                      required={!isLogin}
                      maxLength={15}
                      className="input-field dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter your 13-digit CNIC number
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.6s' }}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        placeholder="0300-1234567"
                        required={!isLogin}
                        className="input-field dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Enter your phone number
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date of Birth
                      </label>
                      <Input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        required={!isLogin}
                        className="input-field dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Select your date of birth
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="animate-slide-up" style={{ animationDelay: isLogin ? '0.4s' : '0.8s' }}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    className="input-field dark:bg-gray-800 dark:border-gray-600 dark:text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              {!isLogin && (
                <div className="animate-slide-up" style={{ animationDelay: '0.9s' }}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required={!isLogin}
                      minLength={6}
                      className="input-field dark:bg-gray-800 dark:border-gray-600 dark:text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Re-enter your password to confirm
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="btn-auth-primary animate-slide-up"
                style={{ animationDelay: isLogin ? '0.5s' : '1.0s' }}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <Spinner size="sm" className="mr-2" />
                      <div className="pulse-ring"></div>
                    </div>
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                </div>
              </div>

              {/* <Button
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                className="btn-auth-secondary animate-slide-up mt-4"
                style={{ animationDelay: isLogin ? '0.6s' : '1.1s' }}
              >
                {googleLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <Spinner size="sm" className="mr-2" />
                      <div className="pulse-ring"></div>
                    </div>
                    Connecting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="transition-all duration-300">Continue with Google</span>
                  </div>
                )}
              </Button> */}
            </div>

            <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: isLogin ? '0.7s' : '1.2s' }}>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors duration-200"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 animate-slide-up" style={{ animationDelay: isLogin ? '0.8s' : '1.3s' }}>
            <p className="font-urdu">صحت نامہ - مقامی لوگوں کے لیے خودکار طبی تاریخ</p>
            <p className="mt-1">Sehat Nama - Automated Medical History for Local People</p>
          </div>
        </div>
      </div>
    </div>
  )
}
