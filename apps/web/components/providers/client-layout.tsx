'use client'

import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/nextjs'
import { MainLayout } from '../layout/main-layout'
import { Loader2 } from 'lucide-react'

interface ClientLayoutProps {
  children: React.ReactNode
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Loading authentication...</p>
      </div>
    </div>
  )
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ClerkProvider>
      <ClerkLoading>
        <LoadingState />
      </ClerkLoading>
      <ClerkLoaded>
        <MainLayout>
          {children}
        </MainLayout>
      </ClerkLoaded>
    </ClerkProvider>
  )
}