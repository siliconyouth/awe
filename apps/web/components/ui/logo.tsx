'use client'

import { cn } from '../../lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'white' | 'black'
}

export function Logo({ className, size = 'md', variant = 'default' }: LogoProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12',
  }

  const fontSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  return (
    <div 
      className={cn(
        sizes[size], 
        'rounded-full flex items-center justify-center font-bold text-white shadow-md',
        'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500',
        'hover:shadow-lg transition-shadow',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #ffa585 100%)'
      }}
    >
      <span className={cn('font-bold', fontSizes[size])} style={{ letterSpacing: '-0.02em' }}>
        a!
      </span>
    </div>
  )
}

export function LogoWithText({ className, size = 'md', variant = 'default' }: LogoProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  const colors = {
    default: 'text-foreground',
    white: 'text-white',
    black: 'text-black',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Logo size={size} variant={variant} />
      <span className={cn('font-medium', textSizes[size], colors[variant])}>
        AWE
      </span>
    </div>
  )
}

// Icon version for favicon and small uses
export function LogoIcon({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div 
      className={cn(
        "flex items-center justify-center font-bold text-white rounded-full shadow-md",
        className
      )}
      style={{ 
        width: size, 
        height: size,
        fontSize: size * 0.6,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #ffa585 100%)'
      }}
    >
      a!
    </div>
  )
}