/**
 * Resource Browser Component
 * Complete resource discovery and management interface
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  Filter, 
  Grid3x3, 
  List, 
  Plus,
  TrendingUp,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { ResourceCard } from './resource-card'
import { TagSelector } from './tag-selector'
import { 
  Resource, 
  ResourceType, 
  ResourceStatus,
  ResourceVisibility,
  Tag,
  ResourceSearchParams,
  ResourceSearchResult,
  ResourceRecommendation
} from '@awe/shared'

interface ResourceBrowserProps {
  projectId?: string
  workspaceId?: string
  initialFilters?: Partial<ResourceSearchParams>
  onResourceSelect?: (resource: Resource) => void
  className?: string
}

export function ResourceBrowser({
  projectId,
  workspaceId,
  initialFilters = {},
  onResourceSelect,
  className
}: ResourceBrowserProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState('all')
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(initialFilters.query || '')
  const [selectedTypes, setSelectedTypes] = useState<ResourceType[]>(initialFilters.types || [])
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFilters.tags || [])
  const [sortBy, setSortBy] = useState<string>(initialFilters.sortBy || 'createdAt')
  const [sortOrder, setSortOrder] = useState<string>(initialFilters.sortOrder || 'desc')
  
  // Data state
  const [resources, setResources] = useState<Resource[]>([])
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>([])
  const [trending, setTrending] = useState<Resource[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch resources
  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(searchQuery && { query: searchQuery }),
        ...(selectedTypes.length && { types: selectedTypes.join(',') }),
        ...(selectedTags.length && { tags: selectedTags.join(',') }),
        ...(projectId && { projectId }),
        ...(workspaceId && { workspaceId }),
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: '12'
      })

      const response = await fetch(`/api/resources?${params}`)
      const data: ResourceSearchResult = await response.json()
      
      setResources(data.resources)
      setTotalPages(data.pages || 1)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedTypes, selectedTags, projectId, workspaceId, sortBy, sortOrder, page])

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        ...(projectId && { projectId }),
        limit: '6'
      })

      const response = await fetch(`/api/resources/recommendations?${params}`)
      const data = await response.json()
      
      setRecommendations(data.recommendations)
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    }
  }, [projectId])

  // Fetch trending resources
  const fetchTrending = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        sortBy: 'usageCount',
        sortOrder: 'desc',
        limit: '6'
      })

      const response = await fetch(`/api/resources?${params}`)
      const data: ResourceSearchResult = await response.json()
      
      setTrending(data.resources)
    } catch (error) {
      console.error('Failed to fetch trending:', error)
    }
  }, [])

  // Fetch all tags
  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags')
      const data = await response.json()
      setAllTags(data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchTags()
    fetchResources()
    fetchRecommendations()
    fetchTrending()
  }, [])

  // Refetch when filters change
  useEffect(() => {
    fetchResources()
  }, [searchQuery, selectedTypes, selectedTags, sortBy, sortOrder, page])

  const handleResourceAction = (resource: Resource, action: string) => {
    if (action === 'view' && onResourceSelect) {
      onResourceSelect(resource)
    }
    // Handle other actions...
  }

  const resourceTypeOptions: ResourceType[] = Object.values(ResourceType)

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar Filters */}
      <div className="w-64 border-r bg-muted/10 p-4">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Resource Types</h3>
            <div className="space-y-1">
              {resourceTypeOptions.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTypes([...selectedTypes, type])
                      } else {
                        setSelectedTypes(selectedTypes.filter(t => t !== type))
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span>{type.toLowerCase()}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-semibold">Tags</h3>
            <TagSelector
              tags={allTags}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              placeholder="Filter by tags..."
            />
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-semibold">Sort By</h3>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="updatedAt">Date Updated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="quality">Quality Score</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="usageCount">Usage Count</SelectItem>
                <SelectItem value="downloads">Downloads</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSearchQuery('')
              setSelectedTypes([])
              setSelectedTags([])
              setSortBy('createdAt')
              setPage(1)
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Resource
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6">
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="recommended">
              <Sparkles className="mr-2 h-4 w-4" />
              Recommended
            </TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="all" className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-muted-foreground">Loading resources...</div>
                </div>
              ) : resources.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="text-muted-foreground mb-4">No resources found</div>
                  <Button variant="outline">Create your first resource</Button>
                </div>
              ) : (
                <div className={cn(
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-4'
                )}>
                  {resources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onView={(r) => handleResourceAction(r, 'view')}
                      onDownload={(r) => handleResourceAction(r, 'download')}
                      onShare={(r) => handleResourceAction(r, 'share')}
                      onApply={(r) => handleResourceAction(r, 'apply')}
                      compact={viewMode === 'list'}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommended" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((rec) => rec.resource && (
                  <div key={rec.resource.id} className="space-y-2">
                    <ResourceCard
                      resource={rec.resource}
                      onView={(r) => handleResourceAction(r, 'view')}
                      onApply={(r) => handleResourceAction(r, 'apply')}
                    />
                    <p className="text-xs text-muted-foreground px-2">
                      {rec.reason}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trending" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trending.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onView={(r) => handleResourceAction(r, 'view')}
                    onApply={(r) => handleResourceAction(r, 'apply')}
                  />
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}