"use client"

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { getClerkAppearance } from '../../lib/clerk-theme'

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  return (
    <BaseClerkProvider appearance={getClerkAppearance(theme)}>
      {children}
    </BaseClerkProvider>
  )
}