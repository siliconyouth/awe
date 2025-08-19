'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProject } from '../../../contexts/project-context'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog'
import { PageContainer } from '../../../components/layout/page-container'
import { PageHeader } from '../../../components/layout/page-header'
import { EmptyState } from '../../../components/ui/empty-state'
import { designSystem, cn } from '../../../lib/design-system'
import {
  FolderOpen,
  Plus,
  Settings,
  Star,
  StarOff,
  Trash2,
  Edit,
  Code,
  FileText,
  Sparkles,
  Clock,
  FolderPlus,
  Check,
  ArrowRight,
  Zap,
  GitBranch,
  Database
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProjectsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSelecting = searchParams.get('select') === 'true'
  
  const { 
    currentProject, 
    projects, 
    loading, 
    selectProject, 
    createProject,
    updateProject,
    deleteProject
  } = useProject()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [deletingProject, setDeletingProject] = useState<any>(null)
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    path: ''
  })
  const [saving, setSaving] = useState(false)

  // If selecting and already have a project, redirect back
  useEffect(() => {
    if (isSelecting && currentProject) {
      router.back()
    }
  }, [isSelecting, currentProject, router])

  const handleCreateProject = async () => {
    if (!projectData.name) return

    try {
      setSaving(true)
      const project = await createProject({
        name: projectData.name,
        description: projectData.description,
        path: projectData.path || `/projects/${projectData.name.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'unknown'
      })
      
      toast.success('Project created successfully')
      
      if (isSelecting) {
        selectProject(project)
        router.back()
      } else {
        setShowCreateDialog(false)
        setProjectData({ name: '', description: '', path: '' })
      }
    } catch (error) {
      toast.error('Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateProject = async () => {
    if (!editingProject || !projectData.name) return

    try {
      setSaving(true)
      await updateProject(editingProject.id, {
        name: projectData.name,
        description: projectData.description,
        path: projectData.path
      })
      
      toast.success('Project updated successfully')
      setEditingProject(null)
      setProjectData({ name: '', description: '', path: '' })
    } catch (error) {
      toast.error('Failed to update project')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!deletingProject) return

    try {
      await deleteProject(deletingProject.id)
      toast.success('Project deleted successfully')
      setDeletingProject(null)
    } catch (error) {
      toast.error('Failed to delete project')
    }
  }

  const handleSelectProject = (project: any) => {
    selectProject(project)
    if (isSelecting) {
      router.back()
    } else {
      toast.success(`Switched to ${project.name}`)
    }
  }

  const handleSetDefault = async (project: any) => {
    try {
      await updateProject(project.id, { isDefault: true })
      toast.success(`${project.name} is now your default project`)
    } catch (error) {
      toast.error('Failed to set default project')
    }
  }

  const openEditDialog = (project: any) => {
    setEditingProject(project)
    setProjectData({
      name: project.name,
      description: project.description || '',
      path: project.path || ''
    })
  }

  const getProjectIcon = (project: any) => {
    if (project.hasClaudeMd) return FileText
    if (project.optimizationLevel > 0.5) return Sparkles
    return Code
  }

  const getProjectStats = (project: any) => {
    const stats = []
    if (project.hasClaudeMd) stats.push({ icon: FileText, label: 'CLAUDE.md' })
    if (project.optimizationLevel > 0.7) stats.push({ icon: Zap, label: 'Optimized' })
    if (project.type === 'monorepo') stats.push({ icon: GitBranch, label: 'Monorepo' })
    if (project.patterns?.length > 0) stats.push({ icon: Database, label: `${project.patterns.length} patterns` })
    return stats
  }

  if (loading) {
    return (
      <PageContainer>
        <div className={cn(designSystem.animations.fadeIn, 'flex items-center justify-center min-h-[400px]')}>
          <div className="text-center space-y-4">
            <div className={cn(
              'h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center',
              'animate-pulse'
            )}>
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className={cn(designSystem.typography.muted)}>Loading projects...</p>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description={isSelecting 
          ? 'Select a project to continue working'
          : 'Manage your projects and their configurations'
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects' }
        ]}
        actions={
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className={cn('bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        }
      />

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className={cn(designSystem.components.card.default, designSystem.animations.fadeIn)}>
          <CardContent className="py-16">
            <EmptyState
              icon={FolderPlus}
              title="No projects yet"
              description="Create your first project to start organizing your work and tracking optimizations"
              action={{
                label: 'Create First Project',
                onClick: () => setShowCreateDialog(true)
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
          designSystem.animations.fadeIn
        )}>
          {projects.map((project, index) => {
            const Icon = getProjectIcon(project)
            const stats = getProjectStats(project)
            const isActive = currentProject?.id === project.id
            
            return (
              <Card 
                key={project.id}
                className={cn(
                  'group relative overflow-hidden',
                  designSystem.animations.hover.lift,
                  designSystem.animations.fadeIn,
                  isActive && 'ring-2 ring-primary shadow-lg'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Gradient Background Effect */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 pointer-events-none" />
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center',
                        isActive ? 'bg-primary/10' : 'bg-muted',
                        'group-hover:scale-110 transition-transform'
                      )}>
                        <Icon className={cn(
                          'h-5 w-5',
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className={cn(designSystem.typography.heading[4])}>
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {project.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                    {isActive && (
                      <Badge className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Stats */}
                  {stats.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      {stats.map((stat, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{stat.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Metadata */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {project.path && (
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-3 w-3" />
                        <span className="truncate font-mono text-xs">{project.path}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {project.optimizationLevel > 0 && (
                      <div className="w-full space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Optimization
                          </span>
                          <span className="font-medium">{(project.optimizationLevel * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                            style={{ width: `${project.optimizationLevel * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    {isActive ? (
                      <Button size="sm" variant="secondary" disabled>
                        <Check className="h-4 w-4 mr-2" />
                        Active
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSelectProject(project)}
                        className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        Select
                        <ArrowRight className="h-3 w-3 ml-1.5" />
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleSetDefault(project)}
                      disabled={project.isDefault}
                      className="h-8 w-8"
                    >
                      {project.isDefault ? (
                        <Star className="h-4 w-4 fill-current text-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(project)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeletingProject(project)}
                      disabled={projects.length === 1}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Project Dialog */}
      <Dialog 
        open={showCreateDialog || !!editingProject} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setEditingProject(null)
            setProjectData({ name: '', description: '', path: '' })
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className={designSystem.typography.heading[3]}>
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
            <DialogDescription>
              {editingProject 
                ? 'Update your project details and configuration'
                : 'Set up a new project to track your development work'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={projectData.name}
                onChange={(e) => setProjectData(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="My Awesome Project"
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={projectData.description}
                onChange={(e) => setProjectData(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                placeholder="Brief description of your project..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="path">Project Path (Optional)</Label>
              <Input
                id="path"
                value={projectData.path}
                onChange={(e) => setProjectData(prev => ({
                  ...prev,
                  path: e.target.value
                }))}
                placeholder="/path/to/project"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default path structure
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setEditingProject(null)
                setProjectData({ name: '', description: '', path: '' })
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={editingProject ? handleUpdateProject : handleCreateProject}
              disabled={!projectData.name || saving}
              className={cn(!projectData.name || saving ? '' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90')}
            >
              {saving ? (
                <>Saving...</>
              ) : editingProject ? (
                <>Save Changes</>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProject} onOpenChange={() => setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProject?.name}"? This action cannot be undone
              and will permanently delete all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}