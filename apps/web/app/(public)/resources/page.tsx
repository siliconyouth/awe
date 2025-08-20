'use client'

import { useEffect, useState } from 'react'
import { ResourceCard } from '@/components/resources/ResourceCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

const resourceTypes = ['all', 'template', 'command', 'pattern', 'guide', 'hook']

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [seeded, setSeeded] = useState(false)

  // Fetch resources
  const fetchResources = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedType !== 'all') params.append('type', selectedType)
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/resources?${params}`)
      const data = await response.json()
      setResources(data)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    } finally {
      setLoading(false)
    }
  }

  // Seed database if empty
  const seedDatabase = async () => {
    try {
      const response = await fetch('/api/resources/seed', { method: 'POST' })
      const data = await response.json()
      console.log(data.message)
      setSeeded(true)
      fetchResources()
    } catch (error) {
      console.error('Failed to seed:', error)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [selectedType])

  useEffect(() => {
    // Check if we need to seed
    if (!loading && resources.length === 0 && !seeded) {
      seedDatabase()
    }
  }, [loading, resources, seeded])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AWE Resource Hub</h1>
        <p className="text-muted-foreground">
          Find and share patterns, templates, and tools to optimize Claude Code for your projects
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchResources()}
              className="pl-10"
            />
          </div>
          <Button onClick={fetchResources}>Search</Button>
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 flex-wrap">
          {resourceTypes.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="capitalize"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No resources found</p>
          {!seeded && (
            <Button onClick={seedDatabase} className="mt-4">
              Load Sample Resources
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onClick={() => setSelectedResource(resource)}
            />
          ))}
        </div>
      )}

      {/* Resource Detail Dialog */}
      <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <Badge className="mb-2">
                {selectedResource?.type}
              </Badge>
            </div>
            <DialogTitle>{selectedResource?.title}</DialogTitle>
            <DialogDescription>
              {selectedResource?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1">
              {selectedResource?.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {selectedResource?.content}
              </pre>
            </ScrollArea>
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Author: {selectedResource?.author}</span>
              <span>{selectedResource?.downloads} downloads</span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(selectedResource?.content || '')
                }}
                className="flex-1"
              >
                Copy to Clipboard
              </Button>
              <Button variant="outline" className="flex-1">
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}