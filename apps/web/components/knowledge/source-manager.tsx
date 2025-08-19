'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { toast } from '../../hooks/use-toast'
import { PlayIcon, PauseIcon, RefreshCwIcon, AlertCircleIcon } from 'lucide-react'

interface KnowledgeSource {
  id: string
  url: string
  name: string
  description?: string
  context?: string
  category: string
  tags: string[]
  checkFrequency: string
  status: string
  lastChecked?: string
  lastChanged?: string
  errorCount: number
  _count?: {
    versions: number
    patterns: number
  }
}

export function SourceManager() {
  const [sources, setSources] = useState<KnowledgeSource[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    description: '',
    context: '',
    category: 'documentation',
    tags: '',
    checkFrequency: 'DAILY',
    aiPrompt: ''
  })

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources')
      const data = await res.json()
      setSources(data.sources)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch sources',
        variant: 'destructive'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          checkNow: true
        })
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Source added and initial check queued'
        })
        setFormData({
          url: '',
          name: '',
          description: '',
          context: '',
          category: 'documentation',
          tags: '',
          checkFrequency: 'DAILY',
          aiPrompt: ''
        })
        fetchSources()
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error)
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleSourceStatus = async (sourceId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    
    try {
      const res = await fetch('/api/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceIds: [sourceId],
          updates: { status: newStatus }
        })
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: `Source ${newStatus.toLowerCase()}`
        })
        fetchSources()
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update source',
        variant: 'destructive'
      })
    }
  }

  const checkSource = async (sourceId: string) => {
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceIds: [sourceId] })
      })

      const data = await res.json()
      toast({
        title: 'Check Complete',
        description: data.results[0]?.status === 'changed' 
          ? 'Changes detected and processed'
          : 'No changes detected'
      })
      fetchSources()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to check source',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Knowledge Source</CardTitle>
          <CardDescription>
            Add a URL to monitor for changes and extract patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="URL to monitor"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
              <Input
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <Textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />

            <Textarea
              placeholder="Context for AI analysis (what to look for)"
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              rows={3}
            />

            <div className="grid grid-cols-3 gap-4">
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="blog">Blog/Articles</SelectItem>
                  <SelectItem value="api">API Reference</SelectItem>
                  <SelectItem value="examples">Code Examples</SelectItem>
                  <SelectItem value="changelog">Changelog</SelectItem>
                  <SelectItem value="prompts">Prompts</SelectItem>
                  <SelectItem value="config">Configuration</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={formData.checkFrequency}
                onValueChange={(value) => setFormData({ ...formData, checkFrequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOURLY">Hourly</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <Textarea
              placeholder="Custom AI prompt for pattern extraction (optional)"
              value={formData.aiPrompt}
              onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
              rows={3}
            />

            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Source'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monitored Sources</CardTitle>
          <CardDescription>
            Manage your knowledge sources and monitoring settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{source.name}</h4>
                    <Badge variant={source.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {source.status}
                    </Badge>
                    <Badge variant="outline">{source.category}</Badge>
                    <Badge variant="outline">{source.checkFrequency}</Badge>
                    {source.errorCount > 0 && (
                      <Badge variant="destructive">
                        <AlertCircleIcon className="w-3 h-3 mr-1" />
                        {source.errorCount} errors
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {source.url}
                  </p>
                  {source.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {source.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {source.lastChecked && (
                      <span>Last checked: {new Date(source.lastChecked).toLocaleString()}</span>
                    )}
                    {source.lastChanged && (
                      <span>Last changed: {new Date(source.lastChanged).toLocaleString()}</span>
                    )}
                    {source._count && (
                      <>
                        <span>{source._count.versions} versions</span>
                        <span>{source._count.patterns} patterns</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => checkSource(source.id)}
                    title="Check now"
                  >
                    <RefreshCwIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleSourceStatus(source.id, source.status)}
                    title={source.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                  >
                    {source.status === 'ACTIVE' ? (
                      <PauseIcon className="w-4 h-4" />
                    ) : (
                      <PlayIcon className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {sources.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No sources added yet. Add your first source above.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}