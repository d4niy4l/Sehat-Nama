'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="w-10 h-10">
        <div className="h-4 w-4 animate-pulse bg-gray-300 rounded"></div>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 transition-all duration-300 hover:scale-110 hover:rotate-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 transition-all duration-300 text-yellow-500" />
      ) : (
        <Moon className="h-4 w-4 transition-all duration-300 text-gray-600 dark:text-gray-400" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
