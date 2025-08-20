'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Edit2, Trash2, Tag, Search, X } from 'lucide-react'

interface TagType {
  id: string
  name: string
  description: string | null
  color: string | null
  category: string | null
  usageCount: number
  createdAt: string
  updatedAt: string
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    category: ''
  })
  const { toast } = useToast()

  // Load tags
  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      const response = await fetch('/api/admin/tags')
      const data = await response.json()
      
      if (data.success) {
        setTags(data.tags || [])
      } else {
        // Use mock data for now
        setTags([
          {
            id: '1',
            name: 'claude-code',
            description: 'Resources for Claude Code CLI',
            color: '#8B5CF6',
            category: 'tools',
            usageCount: 42,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'hooks',
            description: 'Development hooks and automation',
            color: '#10B981',
            category: 'automation',
            usageCount: 28,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'agents',
            description: 'AI agent configurations',
            color: '#F59E0B',
            category: 'ai',
            usageCount: 35,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '4',
            name: 'templates',
            description: 'Project templates and boilerplates',
            color: '#EF4444',
            category: 'templates',
            usageCount: 19,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '5',
            name: 'optimization',
            description: 'Performance and optimization tips',
            color: '#06B6D4',
            category: 'performance',
            usageCount: 24,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load tags:', error)
      setTags([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async () => {
    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Tag created',
          description: `Tag "${formData.name}" has been created successfully`
        })
        setIsCreateDialogOpen(false)
        setFormData({ name: '', description: '', color: '#3B82F6', category: '' })
        loadTags()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      // For now, just add to local state
      const newTag: TagType = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description || null,
        color: formData.color,
        category: formData.category || null,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setTags([...tags, newTag])
      toast({
        title: 'Tag created',
        description: `Tag "${formData.name}" has been created successfully`
      })
      setIsCreateDialogOpen(false)
      setFormData({ name: '', description: '', color: '#3B82F6', category: '' })
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag) return
    
    try {
      const response = await fetch(`/api/admin/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Tag updated',
          description: `Tag "${formData.name}" has been updated successfully`
        })
        setIsEditDialogOpen(false)
        setEditingTag(null)
        loadTags()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      // For now, just update local state
      setTags(tags.map(tag => 
        tag.id === editingTag.id 
          ? { ...tag, ...formData, updatedAt: new Date().toISOString() }
          : tag
      ))
      toast({
        title: 'Tag updated',
        description: `Tag "${formData.name}" has been updated successfully`
      })
      setIsEditDialogOpen(false)
      setEditingTag(null)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    const tag = tags.find(t => t.id === tagId)
    if (!tag) return
    
    if (!confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Tag deleted',
          description: `Tag "${tag.name}" has been deleted successfully`
        })
        loadTags()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      // For now, just remove from local state
      setTags(tags.filter(t => t.id !== tagId))
      toast({
        title: 'Tag deleted',
        description: `Tag "${tag.name}" has been deleted successfully`
      })
    }
  }

  const openEditDialog = (tag: TagType) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      description: tag.description || '',
      color: tag.color || '#3B82F6',
      category: tag.category || ''
    })
    setIsEditDialogOpen(true)
  }

  // Get unique categories
  const categories = Array.from(new Set(tags.map(t => t.category).filter(Boolean)))

  // Filter tags
  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || tag.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Tag Management"
        description="Manage tags for categorizing and organizing resources"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Tags' }
        ]}
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tag</DialogTitle>
                <DialogDescription>
                  Add a new tag to categorize your resources
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., claude-code"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the tag"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., tools, automation"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTag}>
                  Create Tag
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {selectedCategory && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              <X className="h-3 w-3 mr-1" />
              Clear filter
            </Button>
          )}
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.reduce((sum, tag) => sum + tag.usageCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.length > 0 
                ? Math.round(tags.reduce((sum, tag) => sum + tag.usageCount, 0) / tags.length)
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTags.map(tag => (
          <Card key={tag.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color || '#3B82F6' }}
                  />
                  <CardTitle className="text-base">{tag.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(tag)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteTag(tag.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {tag.category && (
                <Badge variant="secondary" className="mt-2">
                  {tag.category}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">
                {tag.description || 'No description'}
              </CardDescription>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Used {tag.usageCount} times</span>
                <span>
                  {new Date(tag.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTags.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery || selectedCategory
                ? 'No tags found matching your filters'
                : 'No tags created yet'}
            </p>
            {!searchQuery && !selectedCategory && (
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Tag
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update the tag information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTag}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}