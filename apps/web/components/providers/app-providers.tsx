"use client"

import { Suspense } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '../providers/theme-provider'
import { useTheme } from 'next-themes'
import { getClerkAppearance } from '../../lib/clerk-theme'

// Loading skeleton for auth state
function AuthLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse">
        <div className="h-8 w-8 rounded-full bg-muted"></div>
      </div>
    </div>
  )
}

// Wrapper for dynamic ClerkProvider with theme support
function DynamicClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  
  return (
    <ClerkProvider 
      appearance={getClerkAppearance(theme)}
      dynamic
    >
      {children}
    </ClerkProvider>
  )
}

// Main providers component with proper suspense boundaries
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Suspense fallback={<AuthLoadingSkeleton />}>
        <DynamicClerkProvider>
          {children}
        </DynamicClerkProvider>
      </Suspense>
    </ThemeProvider>
  )
}