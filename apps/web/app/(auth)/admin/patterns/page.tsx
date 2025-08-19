'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '../../../../components/ui/select'
import { Badge } from '../../../../components/ui/badge'
import { Textarea } from '../../../../components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '../../../../components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs'
import { toast } from '../../../../hooks/use-toast'
import { 
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  TrendingUp,
  Shield,
  Code,
  BookOpen,
  AlertTriangle,
  Zap,
  Database,
  GitBranch,
  Archive,
  Download,
  FileText
} from 'lucide-react'

interface Pattern {
  id: string
  sourceId: string
  pattern: string
  description?: string
  category: string
  status: string
  confidence: number
  relevance: number
  metadata?: any
  extractedBy: string
  extractedAt: string
  approvedAt?: string
  approvedBy?: string
  createdAt: string
  updatedAt: string
  source: {
    id: string
    name: string
    url: string
    type: string
  }
  reviews: Array<{
    id: string
    userId: string
    action: string
    feedback?: string
    createdAt: string
  }>
  _count: {
    reviews: number
  }
}

const categoryIcons: Record<string, any> = {
  API_CHANGE: GitBranch,
  BEST_PRACTICE: ThumbsUp,
  WARNING: AlertTriangle,
  EXAMPLE: Code,
  CONCEPT: BookOpen,
  PERFORMANCE: Zap,
  SECURITY: Shield,
  DEPRECATION: Archive,
  BREAKING_CHANGE: AlertCircle,
  OTHER: Database
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  APPROVED: 'bg-green-500',
  REJECTED: 'bg-red-500',
  NEEDS_REFINEMENT: 'bg-orange-500'
}

export default function PatternsPage() {
  const { user } = useUser()
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPatterns, setTotalPatterns] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<string>('')
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [exportFormat, setExportFormat] = useState('json')

  const fetchPatterns = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '20',
        offset: (currentPage * 20).toString()
      })
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }

      const response = await fetch(`/api/patterns?${params}`)
      const data = await response.json()

      if (data.success) {
        setPatterns(data.patterns)
        setTotalPatterns(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch patterns:', error)
      toast({
        title: 'Error',
        description: 'Failed to load patterns',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, categoryFilter])

  useEffect(() => {
    fetchPatterns()
  }, [fetchPatterns])

  const handleReview = async () => {
    if (!selectedPattern || !reviewAction) return

    try {
      const response = await fetch('/api/patterns/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternId: selectedPattern.id,
          action: reviewAction,
          feedback: reviewFeedback
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: `Pattern ${reviewAction.toLowerCase()}ed successfully`
        })
        setReviewDialogOpen(false)
        setReviewFeedback('')
        fetchPatterns()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to review pattern',
        variant: 'destructive'
      })
    }
  }

  const openReviewDialog = (pattern: Pattern, action: string) => {
    setSelectedPattern(pattern)
    setReviewAction(action)
    setReviewDialogOpen(true)
    
    // Track pattern view
    trackPatternUsage(pattern.id, 'viewed', { reviewAction: action })
  }

  const trackPatternUsage = async (patternId: string, action: string, context?: any) => {
    try {
      await fetch('/api/patterns/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternId,
          action,
          context,
          sessionId: window.sessionStorage.getItem('sessionId') || Math.random().toString(36)
        })
      })
    } catch (error) {
      console.error('Failed to track usage:', error)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        status: statusFilter === 'all' ? 'all' : statusFilter.toUpperCase(),
        category: categoryFilter === 'all' ? '' : categoryFilter
      }).toString()

      const response = await fetch(`/api/patterns/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Handle different response types
      if (exportFormat === 'json') {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `patterns-export-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `patterns-export-${Date.now()}.${exportFormat === 'markdown' ? 'md' : exportFormat}`
        a.click()
        URL.revokeObjectURL(url)
      }

      toast({
        title: 'Export Successful',
        description: `Patterns exported as ${exportFormat.toUpperCase()}`
      })
      
      // Track export usage for each pattern
      const exportedPatterns = getFilteredPatterns()
      for (const pattern of exportedPatterns) {
        await trackPatternUsage(pattern.id, 'exported', { format: exportFormat })
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export patterns',
        variant: 'destructive'
      })
    }
  }

  const getFilteredPatterns = () => {
    let filtered = patterns

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.source.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (activeTab !== 'all') {
      filtered = filtered.filter(p => p.status === activeTab.toUpperCase())
    }

    return filtered
  }

  const PatternCard = ({ pattern }: { pattern: Pattern }) => {
    const Icon = categoryIcons[pattern.category] || Database
    const statusColor = statusColors[pattern.status] || 'bg-gray-500'

    return (
      <Card className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-gray-600" />
            <Badge variant="outline">{pattern.category.replace('_', ' ')}</Badge>
          </div>
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
        </div>

        <h3 className="font-semibold text-lg mb-2">{pattern.pattern}</h3>
        
        {pattern.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {pattern.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {(pattern.confidence * 100).toFixed(0)}% confidence
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {(pattern.relevance * 100).toFixed(0)}% relevance
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {pattern._count.reviews} reviews
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">
            From: {pattern.source.name}
          </span>
          <span className="text-xs text-gray-500">
            <Clock className="inline h-3 w-3 mr-1" />
            {new Date(pattern.extractedAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex gap-2">
          {pattern.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => openReviewDialog(pattern, 'APPROVE')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => openReviewDialog(pattern, 'REJECT')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => openReviewDialog(pattern, 'REFINE')}
              >
                <Edit className="h-4 w-4 mr-1" />
                Refine
              </Button>
            </>
          )}
          {pattern.status === 'APPROVED' && (
            <Badge className="w-full justify-center" variant="default">
              <CheckCircle className="h-4 w-4 mr-1" />
              Approved
            </Badge>
          )}
          {pattern.status === 'REJECTED' && (
            <Badge className="w-full justify-center" variant="destructive">
              <XCircle className="h-4 w-4 mr-1" />
              Rejected
            </Badge>
          )}
          {pattern.status === 'NEEDS_REFINEMENT' && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => openReviewDialog(pattern, 'APPROVE')}
            >
              <Edit className="h-4 w-4 mr-1" />
              Review Again
            </Button>
          )}
        </div>
      </Card>
    )
  }

  const stats = {
    total: totalPatterns,
    pending: patterns.filter(p => p.status === 'PENDING').length,
    approved: patterns.filter(p => p.status === 'APPROVED').length,
    rejected: patterns.filter(p => p.status === 'REJECTED').length,
    needsRefinement: patterns.filter(p => p.status === 'NEEDS_REFINEMENT').length
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Pattern Library</h1>
        <p className="text-gray-600">
          Review and manage extracted patterns from knowledge sources
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Patterns</div>
        </Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending Review</div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </Card>
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="text-2xl font-bold text-orange-700">{stats.needsRefinement}</div>
          <div className="text-sm text-gray-600">Needs Refinement</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patterns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="API_CHANGE">API Change</SelectItem>
              <SelectItem value="BEST_PRACTICE">Best Practice</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="EXAMPLE">Example</SelectItem>
              <SelectItem value="CONCEPT">Concept</SelectItem>
              <SelectItem value="PERFORMANCE">Performance</SelectItem>
              <SelectItem value="SECURITY">Security</SelectItem>
              <SelectItem value="DEPRECATION">Deprecation</SelectItem>
              <SelectItem value="BREAKING_CHANGE">Breaking Change</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="NEEDS_REFINEMENT">Needs Refinement</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchPatterns} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <div className="flex gap-2 items-center">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-[140px]">
                <FileText className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="claude">Claude AI</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Patterns</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="needs_refinement">Needs Refinement</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Pattern Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getFilteredPatterns().map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && getFilteredPatterns().length === 0 && (
        <Card className="p-12 text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No patterns found</h3>
          <p className="text-gray-600">
            Try adjusting your filters or search query
          </p>
        </Card>
      )}

      {/* Pagination */}
      {totalPatterns > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage + 1} of {Math.ceil(totalPatterns / 20)}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={(currentPage + 1) * 20 >= totalPatterns}
          >
            Next
          </Button>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Pattern</DialogTitle>
            <DialogDescription>
              Provide feedback for this pattern extraction
            </DialogDescription>
          </DialogHeader>
          
          {selectedPattern && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Pattern</label>
                <p className="text-sm text-gray-600 mt-1">{selectedPattern.pattern}</p>
              </div>
              
              {selectedPattern.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedPattern.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedPattern.category.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Source</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedPattern.source.name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Confidence</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {(selectedPattern.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Relevance</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {(selectedPattern.relevance * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Review Action</label>
                <Badge className="mt-1" variant={
                  reviewAction === 'APPROVE' ? 'default' :
                  reviewAction === 'REJECT' ? 'destructive' :
                  'secondary'
                }>
                  {reviewAction}
                </Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium">Feedback (Optional)</label>
                <Textarea
                  placeholder="Provide feedback or suggestions..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReview}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}