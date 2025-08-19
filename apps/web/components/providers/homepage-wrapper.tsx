'use client'

import { ProjectProvider } from '../../contexts/project-context'

interface HomepageWrapperProps {
  children: React.ReactNode
}

export function HomepageWrapper({ children }: HomepageWrapperProps) {
  return (
    <ProjectProvider>
      {children}
    </ProjectProvider>
  )
}