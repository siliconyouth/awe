'use client'

import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs'
import { MainLayout } from '../layout/main-layout'
import { ProjectProvider } from '../../contexts/project-context'
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
    <>
      <ClerkLoading>
        <LoadingState />
      </ClerkLoading>
      <ClerkLoaded>
        <ProjectProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </ProjectProvider>
      </ClerkLoaded>
    </>
  )
}