'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from '../hooks/use-toast'

interface Project {
  id: string
  userId: string
  name: string
  description?: string
  path: string
  type: string
  languages: string[]
  frameworks: string[]
  hasClaudeMd: boolean
  optimizationLevel: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface ProjectContextType {
  currentProject: Project | null
  projects: Project[]
  loading: boolean
  selectProject: (project: Project) => void
  createProject: (data: Partial<Project>) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  refreshProjects: () => Promise<void>
  isProjectRequired: boolean
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

// Pages that don't require a project
const PROJECT_EXEMPT_PATHS = [
  '/projects',
  '/profile',
  '/settings',
  '/',
  '/sign-in',
  '/sign-up'
]

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Check if current path requires a project
  const isProjectRequired = !PROJECT_EXEMPT_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))

  // Load projects when user is authenticated
  useEffect(() => {
    if (userLoaded && user && !initialized) {
      loadProjects()
      setInitialized(true)
    }
  }, [userLoaded, user, initialized])

  // Load project from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && projects.length > 0 && !currentProject) {
      const savedProjectId = localStorage.getItem('awe-current-project')
      if (savedProjectId) {
        const savedProject = projects.find(p => p.id === savedProjectId)
        if (savedProject) {
          setCurrentProject(savedProject)
        }
      } else {
        // Select default project or first project
        const defaultProject = projects.find(p => p.isDefault) || projects[0]
        if (defaultProject) {
          selectProject(defaultProject)
        }
      }
    }
  }, [projects, currentProject])

  // Redirect to project selection if required and no project selected
  useEffect(() => {
    if (!loading && userLoaded && user && isProjectRequired && !currentProject && pathname !== '/projects') {
      router.push('/projects?select=true')
    }
  }, [loading, userLoaded, user, isProjectRequired, currentProject, pathname, router])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects/user')
      
      if (!response.ok) {
        throw new Error('Failed to load projects')
      }

      const data = await response.json()
      setProjects(data.projects || [])

      // If no projects exist, create a default one
      if (data.projects.length === 0) {
        await createDefaultProject()
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const createDefaultProject = async () => {
    try {
      const defaultProject = await createProject({
        name: 'My First Project',
        description: 'Default project created automatically',
        path: '/Users/' + user?.username || 'default',
        type: 'unknown',
        isDefault: true
      })
      
      setCurrentProject(defaultProject)
      localStorage.setItem('awe-current-project', defaultProject.id)
    } catch (error) {
      console.error('Failed to create default project:', error)
    }
  }

  const selectProject = useCallback((project: Project) => {
    setCurrentProject(project)
    localStorage.setItem('awe-current-project', project.id)
    
    // Add project info to all API calls
    if (typeof window !== 'undefined') {
      (window as any).__aweCurrentProject = project
    }

    toast({
      title: 'Project Selected',
      description: `Switched to ${project.name}`
    })
  }, [])

  const createProject = async (data: Partial<Project>): Promise<Project> => {
    try {
      const response = await fetch('/api/projects/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const result = await response.json()
      const newProject = result.project

      setProjects(prev => [...prev, newProject])
      
      // Auto-select if first project
      if (projects.length === 0) {
        selectProject(newProject)
      }

      toast({
        title: 'Project Created',
        description: `${newProject.name} has been created`
      })

      return newProject
    } catch (error) {
      console.error('Failed to create project:', error)
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive'
      })
      throw error
    }
  }

  const updateProject = async (id: string, data: Partial<Project>): Promise<Project> => {
    try {
      const response = await fetch(`/api/projects/user/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update project')
      }

      const result = await response.json()
      const updatedProject = result.project

      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p))
      
      if (currentProject?.id === id) {
        setCurrentProject(updatedProject)
      }

      toast({
        title: 'Project Updated',
        description: `${updatedProject.name} has been updated`
      })

      return updatedProject
    } catch (error) {
      console.error('Failed to update project:', error)
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive'
      })
      throw error
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/user/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      setProjects(prev => prev.filter(p => p.id !== id))
      
      // If deleting current project, select another
      if (currentProject?.id === id) {
        const nextProject = projects.find(p => p.id !== id)
        if (nextProject) {
          selectProject(nextProject)
        } else {
          setCurrentProject(null)
          localStorage.removeItem('awe-current-project')
        }
      }

      toast({
        title: 'Project Deleted',
        description: 'Project has been deleted'
      })
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive'
      })
      throw error
    }
  }

  const refreshProjects = async () => {
    await loadProjects()
  }

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        loading,
        selectProject,
        createProject,
        updateProject,
        deleteProject,
        refreshProjects,
        isProjectRequired
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

// Helper hook to get current project ID for API calls
export function useProjectId(): string | null {
  const { currentProject } = useProject()
  return currentProject?.id || null
}

// HOC to require project for a component
export function withProjectRequired<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ProjectRequiredComponent(props: P) {
    const { currentProject, loading } = useProject()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !currentProject) {
        router.push('/projects?select=true')
      }
    }, [loading, currentProject, router])

    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (!currentProject) {
      return null
    }

    return <Component {...props} />
  }
}