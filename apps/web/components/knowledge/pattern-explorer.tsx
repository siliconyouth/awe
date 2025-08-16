'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { toast } from '../ui/use-toast'
import { SearchIcon, FilterIcon, DownloadIcon, CopyIcon } from 'lucide-react'

interface Pattern {
  id: string
  type: string
  name: string
  content: any
  category: string
  tags: string[]
  useCases: string[]
  status: string
  confidence: number
  source: {
    name: string
    url: string
  }
  approvedAt?: string
  approvedBy?: string
}

export function PatternExplorer() {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [filteredPatterns, setFilteredPatterns] = useState<Pattern[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchApprovedPatterns()
  }, [])

  useEffect(() => {
    filterPatterns()
  }, [patterns, searchQuery, selectedType, selectedCategory])

  const fetchApprovedPatterns = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/patterns?status=APPROVED&limit=100')
      const data = await res.json()
      setPatterns(data.patterns)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch patterns',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterPatterns = () => {
    let filtered = patterns

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        JSON.stringify(p.content).toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType)
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    setFilteredPatterns(filtered)
  }

  const copyToClipboard = (content: any) => {
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Pattern copied to clipboard'
    })
  }

  const exportPatterns = () => {
    const data = JSON.stringify(filteredPatterns, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `awe-patterns-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      CODE_EXAMPLE: '📝',
      CONFIGURATION: '⚙️',
      SYSTEM_PROMPT: '🤖',
      BEST_PRACTICE: '✨',
      USE_CASE: '💡',
      API_PATTERN: '🔌',
      ERROR_PATTERN: '⚠️',
      PERFORMANCE_TIP: '⚡',
      SECURITY_PRACTICE: '🔒'
    }
    return icons[type] || '📄'
  }

  const categories = Array.from(new Set(patterns.map(p => p.category)))
  const types = Array.from(new Set(patterns.map(p => p.type)))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pattern Library</CardTitle>
          <CardDescription>
            Explore and use approved patterns in your AWE configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search patterns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <FilterIcon className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(type => (
                    <SelectItem key={type} value={type}>
                      {getTypeIcon(type)} {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <FilterIcon className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={exportPatterns} variant="outline">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredPatterns.length} of {patterns.length} patterns
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatterns.map((pattern) => (
          <Card
            key={pattern.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedPattern(pattern)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getTypeIcon(pattern.type)}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{pattern.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {pattern.source.name}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(pattern.confidence * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {pattern.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {pattern.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{pattern.tags.length - 3}
                    </Badge>
                  )}
                </div>
                {pattern.useCases.length > 0 && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {pattern.useCases[0]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPattern && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={() => setSelectedPattern(null)}
        >
          <div
            className="fixed left-[50%] top-[50%] z-50 w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{getTypeIcon(selectedPattern.type)}</span>
                      {selectedPattern.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedPattern.source.name} • {selectedPattern.category}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(selectedPattern.content)}
                  >
                    <CopyIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <div>
                    <h4 className="font-semibold mb-2">Content</h4>
                    <pre className="p-3 bg-muted rounded-md text-sm overflow-x-auto">
                      {typeof selectedPattern.content === 'string'
                        ? selectedPattern.content
                        : JSON.stringify(selectedPattern.content, null, 2)}
                    </pre>
                  </div>

                  {selectedPattern.useCases.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Use Cases</h4>
                      <ul className="space-y-1">
                        {selectedPattern.useCases.map((useCase, i) => (
                          <li key={i} className="text-sm">
                            • {useCase}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Metadata</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge>{selectedPattern.type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{selectedPattern.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span>{Math.round(selectedPattern.confidence * 100)}%</span>
                      </div>
                      {selectedPattern.approvedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Approved:</span>
                          <span>{new Date(selectedPattern.approvedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source:</span>
                        <a
                          href={selectedPattern.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View Source
                        </a>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedPattern.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}