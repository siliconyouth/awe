'use client'

import { useState } from 'react'
import { useProject } from '../../contexts/project-context'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator
} from '../ui/select'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  FolderOpen,
  Plus,
  Settings,
  Check,
  Sparkles,
  Code,
  FileText,
  ChevronDown
} from 'lucide-react'

export function ProjectSelector() {
  const { 
    currentProject, 
    projects, 
    loading, 
    selectProject, 
    createProject 
  } = useProject()
  const router = useRouter()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    path: ''
  })
  const [creating, setCreating] = useState(false)

  const handleProjectChange = (projectId: string) => {
    if (projectId === 'new') {
      setShowCreateDialog(true)
    } else if (projectId === 'manage') {
      router.push('/projects')
    } else {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        selectProject(project)
      }
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectData.name) return

    try {
      setCreating(true)
      const project = await createProject({
        name: newProjectData.name,
        description: newProjectData.description,
        path: newProjectData.path || `/projects/${newProjectData.name.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'unknown'
      })
      
      selectProject(project)
      setShowCreateDialog(false)
      setNewProjectData({ name: '', description: '', path: '' })
    } catch (error) {
      // Error handled in context
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  const getProjectIcon = (project: any) => {
    if (project.hasClaudeMd) return <FileText className="h-4 w-4" />
    if (project.optimizationLevel > 0.5) return <Sparkles className="h-4 w-4" />
    return <Code className="h-4 w-4" />
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={currentProject?.id || ''}
          onValueChange={handleProjectChange}
        >
          <SelectTrigger className="w-[200px] h-9">
            <div className="flex items-center gap-2">
              {currentProject ? (
                <>
                  <FolderOpen className="h-4 w-4" />
                  <span className="truncate">{currentProject.name}</span>
                  {currentProject.isDefault && (
                    <Badge variant="secondary" className="ml-auto text-xs px-1 py-0">
                      Default
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Select Project</span>
                </>
              )}
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Your Projects</SelectLabel>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2 w-full">
                    {getProjectIcon(project)}
                    <span className="truncate">{project.name}</span>
                    {project.isDefault && (
                      <Badge variant="secondary" className="ml-auto text-xs px-1 py-0">
                        Default
                      </Badge>
                    )}
                    {project.id === currentProject?.id && (
                      <Check className="h-4 w-4 ml-auto text-primary" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectItem value="new">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Create New Project</span>
                </div>
              </SelectItem>
              <SelectItem value="manage">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Manage Projects</span>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {currentProject && (
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            <span>{currentProject.type}</span>
            {currentProject.optimizationLevel > 0 && (
              <>
                <span>•</span>
                <span>{(currentProject.optimizationLevel * 100).toFixed(0)}% optimized</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your work
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={newProjectData.name}
                onChange={(e) => setNewProjectData(prev => ({
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
                value={newProjectData.description}
                onChange={(e) => setNewProjectData(prev => ({
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
                value={newProjectData.path}
                onChange={(e) => setNewProjectData(prev => ({
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
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectData.name || creating}
            >
              {creating ? (
                <>Creating...</>
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
    </>
  )
}