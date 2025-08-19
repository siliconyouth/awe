'use client'

import { cn } from '../../lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'white' | 'black'
}

export function Logo({ className, size = 'md', variant = 'default' }: LogoProps) {
  const sizes = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto',
    xl: 'h-12 w-auto',
  }

  const colors = {
    default: 'text-foreground',
    white: 'text-white',
    black: 'text-black',
  }

  return (
    <svg
      viewBox="0 0 60 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizes[size], colors[variant], className)}
      aria-label="AWE Logo"
    >
      {/* Letter 'a' with modern, geometric design */}
      <path
        d="M8 32C8 32 8 16 8 16C8 10 12 6 18 6C24 6 28 10 28 16C28 16 28 32 28 32M28 20H8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Exclamation mark with dot */}
      <path
        d="M38 8V24"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="38"
        cy="31"
        r="2"
        fill="currentColor"
      />
    </svg>
  )
}

export function LogoWithText({ className, size = 'md', variant = 'default' }: LogoProps) {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-12',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }

  const colors = {
    default: 'text-foreground',
    white: 'text-white',
    black: 'text-black',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Logo size={size} variant={variant} />
      <span className={cn('font-bold', textSizes[size], colors[variant])}>
        AWE
      </span>
    </div>
  )
}

// Icon version for favicon and small uses
export function LogoIcon({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <rect width="40" height="40" rx="8" fill="hsl(var(--primary))" />
      
      {/* Letter 'a' */}
      <path
        d="M6 28C6 28 6 14 6 14C6 9 9 6 14 6C19 6 22 9 22 14C22 14 22 28 22 28M22 18H6"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Exclamation mark */}
      <path
        d="M28 8V20"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle
        cx="28"
        cy="26"
        r="1.5"
        fill="white"
      />
    </svg>
  )
}