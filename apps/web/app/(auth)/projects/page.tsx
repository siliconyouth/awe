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
  Check
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
    if (project.hasClaudeMd) return <FileText className="h-5 w-5" />
    if (project.optimizationLevel > 0.5) return <Sparkles className="h-5 w-5" />
    return <Code className="h-5 w-5" />
  }

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-2">
              {isSelecting 
                ? 'Select a project to continue'
                : 'Manage your projects and their settings'
              }
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create your first project to start organizing your work
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <Card 
                key={project.id} 
                className={`relative transition-all hover:shadow-lg ${
                  currentProject?.id === project.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getProjectIcon(project)}
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      {project.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                      {currentProject?.id === project.id && (
                        <Badge className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <CardDescription className="mt-2 line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {project.path && (
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-3 w-3" />
                        <span className="truncate">{project.path}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {project.optimizationLevel > 0 && (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        <span>{(project.optimizationLevel * 100).toFixed(0)}% optimized</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex gap-2">
                    {currentProject?.id === project.id ? (
                      <Button size="sm" variant="secondary" disabled>
                        <Check className="h-4 w-4 mr-2" />
                        Active
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSelectProject(project)}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleSetDefault(project)}
                      disabled={project.isDefault}
                    >
                      {project.isDefault ? (
                        <Star className="h-4 w-4 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(project)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeletingProject(project)}
                      disabled={projects.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
            <DialogDescription>
              {editingProject 
                ? 'Update your project details'
                : 'Create a new project to organize your work'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={projectData.name}
                onChange={(e) => setProjectData(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="My Awesome Project"
              />
            </div>
            <div>
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
            <div>
              <Label htmlFor="path">Project Path (Optional)</Label>
              <Input
                id="path"
                value={projectData.path}
                onChange={(e) => setProjectData(prev => ({
                  ...prev,
                  path: e.target.value
                }))}
                placeholder="/path/to/project"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use default path
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
    </div>
  )
}