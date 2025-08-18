/**
 * Knowledge Management Admin Page
 * 
 * Interface for managing knowledge sources, patterns, and monitoring
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Badge } from '../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
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
import { Textarea } from '../../../../components/ui/textarea'
import { ChangeAnalytics } from '../../../../components/knowledge/change-analytics'
import { 
  Globe, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Edit,
  Trash,
  Eye,
  FileText,
  TrendingUp,
  Database,
  Search,
  Filter
} from 'lucide-react'
import { useToast } from '../../../../components/ui/use-toast'

interface KnowledgeSource {
  id: string
  name: string
  url: string
  category: string
  status: 'ACTIVE' | 'PAUSED' | 'ERROR'
  checkFrequency: 'HOURLY' | 'DAILY' | 'WEEKLY'
  lastChecked?: string
  lastChanged?: string
  errorCount?: number
  _count?: {
    versions: number
    patterns: number
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
  const [activeTab, setActiveTab] = useState('sources')
  const [showAddSourceDialog, setShowAddSourceDialog] = useState(false)
  const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  // New source form state
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    category: 'DOCUMENTATION',
    checkFrequency: 'DAILY'
  })

  const fetchSources = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      
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
  }

  const fetchPatterns = async () => {
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
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchSources(), fetchPatterns()])
      setLoading(false)
    }
    loadData()
  }, [filterStatus])

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
        category: 'DOCUMENTATION',
        checkFrequency: 'DAILY'
      })
      fetchSources()
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to review pattern',
        variant: 'destructive'
      })
    }
  }

  const triggerMonitoring = async () => {
    try {
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (!response.ok) throw new Error('Failed to trigger monitoring')

      toast({
        title: 'Success',
        description: 'Monitoring triggered successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to trigger monitoring',
        variant: 'destructive'
      })
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
              {sources.filter(s => s.status === 'ACTIVE').length} active
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
              {sources.reduce((sum, s) => sum + (s._count?.versions || 0), 0)}
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
              {sources.filter(s => s.status === 'ERROR').length}
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
                  <Button onClick={triggerMonitoring} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Monitor
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
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={newSource.category} 
                            onValueChange={(value) => setNewSource({ ...newSource, category: value })}
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
                            value={newSource.checkFrequency} 
                            onValueChange={(value) => setNewSource({ ...newSource, checkFrequency: value })}
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
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Last Checked</TableHead>
                      <TableHead>Versions</TableHead>
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
                            <TableCell>{source.category}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(source.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(source.status)}
                                  {source.status}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>{source.checkFrequency}</TableCell>
                            <TableCell>
                              {source.lastChecked 
                                ? new Date(source.lastChecked).toLocaleDateString()
                                : 'Never'}
                            </TableCell>
                            <TableCell>{source._count?.versions || 0}</TableCell>
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