'use client'

import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs'
import { ProjectProvider } from '../../contexts/project-context'
import { Loader2 } from 'lucide-react'

interface HomepageWrapperProps {
  children: React.ReactNode
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export function HomepageWrapper({ children }: HomepageWrapperProps) {
  return (
    <>
      <ClerkLoading>
        <LoadingState />
      </ClerkLoading>
      <ClerkLoaded>
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </ClerkLoaded>
    </>
  )
}