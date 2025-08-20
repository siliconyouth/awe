'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Save,
  Sparkles,
  Upload,
  Tags,
  FileText,
  Code,
  Link2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import Link from 'next/link'

const resourceTypes = ['pattern', 'hook', 'agent', 'template', 'guide', 'snippet']
const resourceFormats = ['markdown', 'yaml', 'json', 'typescript', 'shell']
const resourceStatuses = ['draft', 'published', 'archived']

export default function NewResourcePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'pattern',
    format: 'markdown',
    status: 'draft',
    visibility: 'public',
    sourceUrl: '',
    author: '',
    tags: [] as string[],
    enableAI: true,
    qualityCheck: true
  })
  
  const [newTag, setNewTag] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)

  // Handle form changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Add tag
  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      handleChange('tags', [...formData.tags, newTag])
      setNewTag('')
    }
  }

  // Remove tag
  const removeTag = (tag: string) => {
    handleChange('tags', formData.tags.filter(t => t !== tag))
  }

  // Get AI suggestions
  const getAISuggestions = async () => {
    if (!formData.content) {
      toast.error('Please add content first')
      return
    }

    setAiLoading(true)
    try {
      const response = await fetch('/api/resources/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.content,
          type: formData.type
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAiSuggestions(data)
        
        // Auto-fill suggestions
        if (data.title && !formData.title) {
          handleChange('title', data.title)
        }
        if (data.description && !formData.description) {
          handleChange('description', data.description)
        }
        if (data.tags?.length > 0) {
          handleChange('tags', [...new Set([...formData.tags, ...data.tags])])
        }
        
        toast.success('AI suggestions generated!')
      }
    } catch (error) {
      toast.error('Failed to get AI suggestions')
    } finally {
      setAiLoading(false)
    }
  }

  // Import from URL
  const importFromUrl = async () => {
    if (!formData.sourceUrl) {
      toast.error('Please enter a URL')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/resources/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.sourceUrl })
      })
      
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          ...data,
          tags: data.tags || prev.tags
        }))
        toast.success('Content imported successfully!')
      }
    } catch (error) {
      toast.error('Failed to import from URL')
    } finally {
      setLoading(false)
    }
  }

  // Save resource
  const saveResource = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast.success('Resource created successfully!')
        router.push('/admin/resources')
      } else {
        throw new Error('Failed to create resource')
      }
    } catch (error) {
      toast.error('Failed to create resource')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/resources">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Resource</h1>
            <p className="text-muted-foreground">
              Add a new resource to the hub
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={getAISuggestions}
            disabled={aiLoading || !formData.content}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {aiLoading ? 'Analyzing...' : 'AI Suggestions'}
          </Button>
          <Button onClick={saveResource} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Resource'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter resource title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe what this resource does"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select value={formData.format} onValueChange={(v) => handleChange('format', v)}>
                    <SelectTrigger id="format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceFormats.map(format => (
                        <SelectItem key={format} value={format}>
                          {format.charAt(0).toUpperCase() + format.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                Add your resource content directly or import from a URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="editor">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="editor">
                    <FileText className="mr-2 h-4 w-4" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="import">
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="space-y-4">
                  <Textarea
                    value={formData.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="Paste or write your resource content here..."
                    className="font-mono text-sm"
                    rows={20}
                  />
                </TabsContent>
                
                <TabsContent value="import" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourceUrl">Source URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="sourceUrl"
                        value={formData.sourceUrl}
                        onChange={(e) => handleChange('sourceUrl', e.target.value)}
                        placeholder="https://github.com/..."
                        className="flex-1"
                      />
                      <Button onClick={importFromUrl} disabled={loading}>
                        <Link2 className="mr-2 h-4 w-4" />
                        Import
                      </Button>
                    </div>
                  </div>
                  
                  {formData.content && (
                    <div className="rounded-lg border bg-muted p-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Content imported successfully
                      </p>
                      <pre className="text-xs overflow-auto max-h-40">
                        {formData.content.substring(0, 500)}...
                      </pre>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Suggestions */}
          {aiSuggestions && (
            <Card>
              <CardHeader>
                <CardTitle>AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiSuggestions.qualityScore && (
                  <div>
                    <Label>Quality Score</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${aiSuggestions.qualityScore * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(aiSuggestions.qualityScore * 100)}%
                      </span>
                    </div>
                  </div>
                )}
                
                {aiSuggestions.improvements?.length > 0 && (
                  <div>
                    <Label>Suggested Improvements</Label>
                    <ul className="mt-2 space-y-1">
                      {aiSuggestions.improvements.map((improvement: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          • {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button onClick={addTag} size="sm">
                  <Tags className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={formData.visibility} onValueChange={(v) => handleChange('visibility', v)}>
                  <SelectTrigger id="visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => handleChange('author', e.target.value)}
                  placeholder="Resource author"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-features">AI Features</Label>
                <Switch
                  id="ai-features"
                  checked={formData.enableAI}
                  onCheckedChange={(v) => handleChange('enableAI', v)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="quality-check">Quality Check</Label>
                <Switch
                  id="quality-check"
                  checked={formData.qualityCheck}
                  onCheckedChange={(v) => handleChange('qualityCheck', v)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}