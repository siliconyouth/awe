/**
 * Knowledge Management Admin Page
 * 
 * Interface for managing knowledge sources, patterns, and monitoring
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Badge } from '../../../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Label } from '../../../../components/ui/label'
import { ChangeAnalytics } from '../../../../components/knowledge/change-analytics'
import { 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Edit,
  Trash,
  Eye,
  Database
} from 'lucide-react'
import { useToast } from '../../../../components/ui/use-toast'

interface KnowledgeSource {
  id: string
  name: string
  url: string
  type: string
  frequency: string
  active: boolean
  reliability: number
  lastScraped?: string
  createdAt: string
  updatedAt: string
  _count?: {
    updates: number
  }
}

interface ExtractedPattern {
  id: string
  sourceId: string
  source?: {
    name: string
    url: string
    category: string
  }
  type: string
  pattern: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REFINEMENT'
  createdAt: string
  approvedAt?: string
  approvedBy?: string
}

export default function KnowledgeAdmin() {
  const [sources, setSources] = useState<KnowledgeSource[]>([])
  const [patterns, setPatterns] = useState<ExtractedPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [activeTab, setActiveTab] = useState('sources')
  const [showAddSourceDialog, setShowAddSourceDialog] = useState(false)
  // const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(null) // Currently unused
  const [filterActive, setFilterActive] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  // New source form state
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    type: 'DOCUMENTATION',
    frequency: 'DAILY'
  })

  const fetchSources = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterActive !== 'all') params.append('active', filterActive)
      
      const response = await fetch(`/api/sources?${params}`)
      if (!response.ok) throw new Error('Failed to fetch sources')
      
      const data = await response.json()
      setSources(data.sources || [])
    } catch (error) {
      console.error('Error fetching sources:', error)
      toast({
        title: 'Error',
        description: 'Failed to load knowledge sources',
        variant: 'destructive'
      })
    }
  }, [filterActive, toast])

  const fetchPatterns = useCallback(async () => {
    try {
      const response = await fetch('/api/patterns?status=PENDING')
      if (!response.ok) throw new Error('Failed to fetch patterns')
      
      const data = await response.json()
      setPatterns(data.patterns || [])
    } catch (error) {
      console.error('Error fetching patterns:', error)
      toast({
        title: 'Error',
        description: 'Failed to load patterns',
        variant: 'destructive'
      })
    }
  }, [toast])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchSources(), fetchPatterns()])
      setLoading(false)
    }
    loadData()
  }, [filterActive, fetchSources, fetchPatterns])

  const handleAddSource = async () => {
    try {
      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      })

      if (!response.ok) throw new Error('Failed to add source')

      toast({
        title: 'Success',
        description: 'Knowledge source added successfully'
      })
      
      setShowAddSourceDialog(false)
      setNewSource({
        name: '',
        url: '',
        type: 'DOCUMENTATION',
        frequency: 'DAILY'
      })
      fetchSources()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add knowledge source',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteSource = async (sourceId: string) => {
    try {
      const response = await fetch(`/api/sources?id=${sourceId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete source')

      toast({
        title: 'Success',
        description: 'Knowledge source deleted successfully'
      })
      
      fetchSources()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete knowledge source',
        variant: 'destructive'
      })
    }
  }

  const handlePatternReview = async (patternId: string, action: 'approve' | 'reject' | 'refine', feedback?: string) => {
    try {
      const response = await fetch('/api/patterns/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternId,
          action,
          feedback
        })
      })

      if (!response.ok) throw new Error('Failed to review pattern')

      toast({
        title: 'Success',
        description: `Pattern ${action}d successfully`
      })
      
      fetchPatterns()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to review pattern',
        variant: 'destructive'
      })
    }
  }

  const triggerMonitoring = async () => {
    try {
      setIsMonitoring(true)
      const response = await fetch('/api/monitor/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: false }) // Monitor sources that need updating
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to trigger monitoring')
      }

      const result = await response.json()
      
      toast({
        title: 'Monitoring Complete',
        description: `Monitored ${result.monitored} sources. ${result.stats?.changed || 0} changes detected.`
      })

      // Refresh the sources list
      await fetchSources()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to trigger monitoring',
        variant: 'destructive'
      })
    } finally {
      setIsMonitoring(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'ERROR': return 'destructive'
      case 'PAUSED': return 'secondary'
      case 'APPROVED': return 'default'
      case 'REJECTED': return 'destructive'
      case 'PENDING': return 'outline'
      case 'NEEDS_REFINEMENT': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />
      case 'ERROR':
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4" />
      case 'PAUSED':
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          Knowledge Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor web sources, track changes, and extract patterns
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sources.length}</div>
            <p className="text-xs text-muted-foreground">
              {sources.filter(s => s.active).length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patterns.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sources.reduce((sum, s) => sum + (s._count?.updates || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Content snapshots</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sources.filter(s => !s.active).length}
            </div>
            <p className="text-xs text-muted-foreground">Sources with errors</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="sources">Knowledge Sources</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Review</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Knowledge Sources</CardTitle>
                  <CardDescription>
                    Manage web sources for monitoring and pattern extraction
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={triggerMonitoring} 
                    variant="outline" 
                    size="sm"
                    disabled={isMonitoring}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isMonitoring ? 'animate-spin' : ''}`} />
                    {isMonitoring ? 'Monitoring...' : 'Run Monitor'}
                  </Button>
                  <Dialog open={showAddSourceDialog} onOpenChange={setShowAddSourceDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Source
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Knowledge Source</DialogTitle>
                        <DialogDescription>
                          Add a new web source to monitor for changes and patterns
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={newSource.name}
                            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                            placeholder="e.g., Next.js Documentation"
                          />
                        </div>
                        <div>
                          <Label htmlFor="url">URL</Label>
                          <Input
                            id="url"
                            value={newSource.url}
                            onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                            placeholder="https://nextjs.org/docs"
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Type</Label>
                          <Select 
                            value={newSource.type} 
                            onValueChange={(value) => setNewSource({ ...newSource, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                              <SelectItem value="BLOG">Blog</SelectItem>
                              <SelectItem value="TUTORIAL">Tutorial</SelectItem>
                              <SelectItem value="API_REFERENCE">API Reference</SelectItem>
                              <SelectItem value="CHANGELOG">Changelog</SelectItem>
                              <SelectItem value="FORUM">Forum</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="frequency">Check Frequency</Label>
                          <Select 
                            value={newSource.frequency} 
                            onValueChange={(value) => setNewSource({ ...newSource, frequency: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HOURLY">Hourly</SelectItem>
                              <SelectItem value="DAILY">Daily</SelectItem>
                              <SelectItem value="WEEKLY">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddSourceDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddSource}>Add Source</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Search sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Last Scraped</TableHead>
                      <TableHead>Updates</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading sources...
                        </TableCell>
                      </TableRow>
                    ) : sources.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No knowledge sources found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sources
                        .filter(s => searchQuery === '' || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((source) => (
                          <TableRow key={source.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{source.name}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {source.url}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{source.type}</TableCell>
                            <TableCell>
                              <Badge variant={source.active ? 'default' : 'secondary'}>
                                <span className="flex items-center gap-1">
                                  {source.active ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                  {source.active ? 'Active' : 'Inactive'}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>{source.frequency}</TableCell>
                            <TableCell>
                              {source.lastScraped 
                                ? new Date(source.lastScraped).toLocaleDateString()
                                : 'Never'}
                            </TableCell>
                            <TableCell>{source._count?.updates || 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="icon" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => handleDeleteSource(source.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Review Queue</CardTitle>
              <CardDescription>
                Review and approve extracted patterns from knowledge sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No patterns pending review
                </div>
              ) : (
                <div className="space-y-4">
                  {patterns.map((pattern) => (
                    <div key={pattern.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Badge variant={getStatusColor(pattern.status)}>
                            {pattern.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            From: {pattern.source?.name || 'Unknown'}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(pattern.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-muted p-3 rounded mb-3">
                        <p className="text-sm font-mono">{pattern.pattern}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePatternReview(pattern.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePatternReview(pattern.id, 'reject')}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePatternReview(pattern.id, 'refine', 'Needs improvement')}
                        >
                          Refine
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <ChangeAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}