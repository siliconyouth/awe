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
import { PageContainer } from '../../../../components/layout/page-container'
import { PageHeader } from '../../../../components/layout/page-header'
import { EmptyState } from '../../../../components/ui/empty-state'
import { designSystem, cn } from '../../../../lib/design-system'
import { 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  Clock,
  Edit,
  Trash,
  Eye,
  Database,
  Brain,
  Sparkles,
  Globe,
  TrendingUp,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Activity,
  Zap,
  Link2
} from 'lucide-react'
import { useToast } from '../../../../hooks/use-toast'

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
        body: JSON.stringify({ all: false })
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

  const extractPatterns = async (sourceId: string, sourceName: string) => {
    try {
      const response = await fetch('/api/patterns/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to extract patterns')
      }

      const result = await response.json()
      
      toast({
        title: 'Pattern Extraction Complete',
        description: `Extracted ${result.stats?.stored || 0} patterns from ${sourceName}`
      })

      if (activeTab === 'patterns') {
        await fetchPatterns()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to extract patterns',
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

  // Stats cards data
  const stats = [
    {
      title: 'Total Sources',
      value: sources.length,
      description: `${sources.filter(s => s.active).length} active`,
      icon: Database,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Pending Patterns',
      value: patterns.length,
      description: 'Awaiting review',
      icon: Brain,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Total Versions',
      value: sources.reduce((sum, s) => sum + (s._count?.updates || 0), 0),
      description: 'Content snapshots',
      icon: FileText,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Error Rate',
      value: sources.filter(s => !s.active).length,
      description: 'Sources with errors',
      icon: AlertCircle,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/20'
    }
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Knowledge Management"
        description="Monitor web sources, track changes, and extract intelligent patterns"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Knowledge' }
        ]}
        actions={
          <div className="flex gap-2">
            <Button 
              onClick={triggerMonitoring} 
              variant="outline" 
              size="sm"
              disabled={isMonitoring}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isMonitoring && "animate-spin")} />
              {isMonitoring ? 'Monitoring...' : 'Run Monitor'}
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowAddSourceDialog(true)}
              className={cn('bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className={cn(
        "grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8",
        designSystem.animations.fadeIn
      )}>
        {stats.map((stat, index) => (
          <Card 
            key={stat.title}
            className={cn(
              designSystem.components.card.default,
              designSystem.animations.fadeIn,
              designSystem.animations.hover.lift
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={cn("p-2 rounded-lg", stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className={designSystem.animations.fadeIn}>
        <TabsList className="mb-6">
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Knowledge Sources
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Pattern Review
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <Card className={cn(designSystem.components.card.default, designSystem.animations.fadeIn)}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    Knowledge Sources
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Manage web sources for monitoring and pattern extraction
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {sources.filter(s => s.active).length} / {sources.length} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="true">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="false">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                        Inactive
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={async () => {
                    toast({
                      title: 'Extracting Patterns',
                      description: 'Processing all active sources...'
                    })
                    for (const source of sources.filter(s => s.active)) {
                      await extractPatterns(source.id, source.name)
                    }
                  }}
                  variant="outline" 
                  size="default"
                  disabled={sources.filter(s => s.active).length === 0}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Extract All
                </Button>
              </div>

              {/* Sources Table */}
              <div className={cn("border rounded-lg overflow-hidden", designSystem.components.card.default)}>
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
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className={cn(
                              "h-12 w-12 rounded-full bg-muted flex items-center justify-center"
                            )}>
                              <Database className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">Loading sources...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : sources.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12">
                          <EmptyState
                            icon={Globe}
                            title="No knowledge sources"
                            description="Add your first source to start monitoring"
                            action={{
                              label: 'Add Source',
                              onClick: () => setShowAddSourceDialog(true)
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      sources
                        .filter(s => searchQuery === '' || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((source, index) => (
                          <TableRow 
                            key={source.id}
                            className={cn(
                              "group hover:bg-muted/50 transition-colors",
                              designSystem.animations.fadeIn
                            )}
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center",
                                  source.active ? "bg-green-100 dark:bg-green-900/20" : "bg-gray-100 dark:bg-gray-900/20"
                                )}>
                                  <Link2 className={cn(
                                    "h-4 w-4",
                                    source.active ? "text-green-600" : "text-gray-600"
                                  )} />
                                </div>
                                <div>
                                  <p className="font-medium">{source.name}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px] font-mono">
                                    {source.url}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {source.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={source.active ? 'default' : 'secondary'}
                                className="font-medium"
                              >
                                <span className="flex items-center gap-1">
                                  {source.active ? (
                                    <>
                                      <CheckCircle className="h-3 w-3" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3" />
                                      Inactive
                                    </>
                                  )}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Activity className="h-3 w-3 text-muted-foreground" />
                                {source.frequency}
                              </div>
                            </TableCell>
                            <TableCell>
                              {source.lastScraped ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <div className="h-2 w-2 rounded-full bg-green-500" />
                                  {new Date(source.lastScraped).toLocaleDateString()}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Never</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {source._count?.updates || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  title="Extract Patterns"
                                  onClick={() => extractPatterns(source.id, source.name)}
                                  className="h-8 w-8"
                                >
                                  <Brain className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  title="View Details"
                                  className="h-8 w-8"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  title="Edit Source"
                                  className="h-8 w-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  title="Delete Source"
                                  onClick={() => handleDeleteSource(source.id)}
                                  className="h-8 w-8"
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
          <Card className={cn(designSystem.components.card.default, designSystem.animations.fadeIn)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <Brain className="h-4 w-4 text-purple-600" />
                    </div>
                    Pattern Review Queue
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Review and approve extracted patterns from knowledge sources
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {patterns.length} pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <EmptyState
                  icon={Zap}
                  title="No patterns pending"
                  description="Extract patterns from your sources to review them here"
                />
              ) : (
                <div className="space-y-4">
                  {patterns.map((pattern, index) => (
                    <div 
                      key={pattern.id} 
                      className={cn(
                        "border rounded-lg p-4 transition-all hover:shadow-md",
                        designSystem.animations.fadeIn,
                        designSystem.animations.hover.lift
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <Badge variant={getStatusColor(pattern.status)} className="text-xs">
                            {pattern.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            From: {pattern.source?.name || 'Unknown'}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(pattern.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg mb-4 border">
                        <p className="text-sm font-mono">{pattern.pattern}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePatternReview(pattern.id, 'approve')}
                          className="hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePatternReview(pattern.id, 'reject')}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePatternReview(pattern.id, 'refine', 'Needs improvement')}
                          className="hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200"
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

      {/* Add Source Dialog */}
      <Dialog open={showAddSourceDialog} onOpenChange={setShowAddSourceDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className={designSystem.typography.heading[3]}>
              Add Knowledge Source
            </DialogTitle>
            <DialogDescription>
              Add a new web source to monitor for changes and patterns
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                placeholder="e.g., Next.js Documentation"
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                placeholder="https://nextjs.org/docs"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
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
            <div className="space-y-2">
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
            <Button 
              onClick={handleAddSource}
              className={cn('bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}