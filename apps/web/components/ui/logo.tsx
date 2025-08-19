'use client'

import { cn } from '../../lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'white' | 'black'
}

export function Logo({ className, size = 'md', variant = 'default' }: LogoProps) {
  const sizes = {
    sm: 'h-5 w-auto',
    md: 'h-6 w-auto',
    lg: 'h-7 w-auto',
    xl: 'h-8 w-auto',
  }

  const colors = {
    default: 'text-foreground',
    white: 'text-white',
    black: 'text-black',
  }

  return (
    <div className={cn(sizes[size], 'flex items-center justify-center font-bold', colors[variant], className)}>
      <span style={{ fontSize: '1.2em', letterSpacing: '-0.02em' }}>a!</span>
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
        "flex items-center justify-center font-bold text-white bg-primary rounded-lg",
        className
      )}
      style={{ 
        width: size, 
        height: size,
        fontSize: size * 0.6
      }}
    >
      a!
    </div>
  )
}