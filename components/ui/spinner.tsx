import { cn } from '@/lib/utils'

interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-primary-600',
        sizeClasses[size],
        className
      )}
    />
  )
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600"></div>
        <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-primary-400 opacity-75"></div>
      </div>
    </div>
  )
}

export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className="flex space-x-1">
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary-600"></div>
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary-600" style={{ animationDelay: '0.1s' }}></div>
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary-600" style={{ animationDelay: '0.2s' }}></div>
    </div>
  )
}
