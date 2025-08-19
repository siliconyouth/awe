'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Database, 
  Github, 
  Globe, 
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Settings
} from 'lucide-react'

interface KnowledgeSource {
  id: string
  name: string
  type: string
  url: string
  scrapeConfig: any
  frequency: string
  lastScraped: string | null
  active: boolean
  reliability: number
}

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSource, setEditingSource] = useState<KnowledgeSource | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'github',
    url: '',
    frequency: 'weekly',
    active: true,
    reliability: 0.8,
    scrapeConfig: {}
  })

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/sources')
      const data = await response.json()
      setSources(data)
    } catch (error) {
      console.error('Failed to fetch sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/admin/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      })
      fetchSources()
    } catch (error) {
      console.error('Failed to update source:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this source?')) return
    
    try {
      await fetch(`/api/admin/sources/${id}`, { method: 'DELETE' })
      fetchSources()
    } catch (error) {
      console.error('Failed to delete source:', error)
    }
  }

  const handleSave = async () => {
    try {
      const endpoint = editingSource 
        ? `/api/admin/sources/${editingSource.id}`
        : '/api/admin/sources'
      
      const method = editingSource ? 'PUT' : 'POST'
      
      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      setIsAddDialogOpen(false)
      setEditingSource(null)
      resetForm()
      fetchSources()
    } catch (error) {
      console.error('Failed to save source:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'github',
      url: '',
      frequency: 'weekly',
      active: true,
      reliability: 0.8,
      scrapeConfig: {}
    })
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'github':
        return <Github className="h-5 w-5" />
      case 'website':
        return <Globe className="h-5 w-5" />
      default:
        return <Database className="h-5 w-5" />
    }
  }

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      daily: 'bg-green-500',
      weekly: 'bg-blue-500',
      monthly: 'bg-purple-500',
      manual: 'bg-gray-500'
    }
    
    return (
      <Badge className={`${colors[frequency] || 'bg-gray-500'} text-white`}>
        {frequency}
      </Badge>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Knowledge Sources</h2>
          <p className="text-muted-foreground">
            Configure data sources for resource imports
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {editingSource ? 'Edit Source' : 'Add Knowledge Source'}
              </DialogTitle>
              <DialogDescription>
                Configure a new data source for importing resources
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="awesome-claude-code"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub Repository</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://github.com/user/repo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Update Frequency</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingSource ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sources Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">
            Loading sources...
          </div>
        ) : sources.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground mb-4">No sources configured yet</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Source
            </Button>
          </div>
        ) : (
          sources.map((source) => (
            <Card key={source.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(source.type)}
                    <CardTitle className="text-lg">{source.name}</CardTitle>
                  </div>
                  <Switch
                    checked={source.active}
                    onCheckedChange={(checked) => handleToggleActive(source.id, checked)}
                  />
                </div>
                <CardDescription className="mt-2">
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-xs"
                  >
                    {source.url}
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Frequency</span>
                    {getFrequencyBadge(source.frequency)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reliability</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${source.reliability * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{Math.round(source.reliability * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Scraped</span>
                    <span className="text-sm">
                      {source.lastScraped 
                        ? new Date(source.lastScraped).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingSource(source)
                        setFormData({
                          name: source.name,
                          type: source.type,
                          url: source.url,
                          frequency: source.frequency,
                          active: source.active,
                          reliability: source.reliability,
                          scrapeConfig: source.scrapeConfig
                        })
                        setIsAddDialogOpen(true)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(source.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sources.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sources.filter(s => s.active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">GitHub Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sources.filter(s => s.type === 'github').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Reliability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sources.length > 0 
                ? Math.round((sources.reduce((acc, s) => acc + s.reliability, 0) / sources.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}