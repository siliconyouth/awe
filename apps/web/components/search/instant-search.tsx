'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Loader2, X, Filter, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchResult {
  objectID: string
  title: string
  description?: string
  type: string
  tags?: string[]
  _highlightResult?: {
    title: { value: string; matchLevel: string }
    description?: { value: string; matchLevel: string }
  }
}

interface InstantSearchProps {
  onSelect?: (result: SearchResult) => void
  placeholder?: string
  className?: string
  showFilters?: boolean
  autoFocus?: boolean
}

export function InstantSearch({
  onSelect,
  placeholder = 'Search resources...',
  className,
  showFilters = true,
  autoFocus = false
}: InstantSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [facets, setFacets] = useState<any>({})
  const [source, setSource] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Fetch search results
  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSuggestions([])
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '10'
      })
      
      if (selectedType) params.append('type', selectedType)
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','))

      const response = await fetch(`/api/search/instant?${params}`, {
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      setResults(data.hits || [])
      setFacets(data.facets || {})
      setSource(data.source || '')
      
      // Also fetch suggestions for autocomplete
      if (searchQuery.length >= 2) {
        const suggestResponse = await fetch(`/api/search/instant?q=${searchQuery}&mode=suggest&limit=5`, {
          signal: abortControllerRef.current.signal
        })
        
        if (suggestResponse.ok) {
          const suggestData = await suggestResponse.json()
          setSuggestions(suggestData.suggestions || [])
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedType, selectedTags])

  // Fetch facet values
  const fetchFacets = useCallback(async () => {
    try {
      const response = await fetch('/api/search/instant?mode=facets&facet=tags&limit=20')
      if (response.ok) {
        const data = await response.json()
        // Process facet values
      }
    } catch (error) {
      console.error('Failed to fetch facets:', error)
    }
  }, [])

  // Effect for search
  useEffect(() => {
    fetchResults(debouncedQuery)
  }, [debouncedQuery, fetchResults])

  // Effect for initial facets
  useEffect(() => {
    if (showFilters) {
      fetchFacets()
    }
  }, [showFilters, fetchFacets])

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    setQuery('')
    setResults([])
    setSuggestions([])
    setOpen(false)
    onSelect?.(result)
  }

  // Handle clear
  const handleClear = () => {
    setQuery('')
    setResults([])
    setSuggestions([])
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Render highlighted text
  const renderHighlight = (highlight: any) => {
    if (!highlight) return null
    return (
      <span dangerouslySetInnerHTML={{ __html: highlight.value }} />
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            autoFocus={autoFocus}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {loading && (
            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedType === null}
                onCheckedChange={() => setSelectedType(null)}
              >
                All Types
              </DropdownMenuCheckboxItem>
              {['PATTERN', 'SNIPPET', 'HOOK', 'AGENT', 'TEMPLATE', 'GUIDE'].map(type => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedType === type}
                  onCheckedChange={(checked) => setSelectedType(checked ? type : null)}
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Popular Tags</DropdownMenuLabel>
              {facets.tags && Object.entries(facets.tags).slice(0, 5).map(([tag, count]: [string, any]) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTags([...selectedTags, tag])
                    } else {
                      setSelectedTags(selectedTags.filter(t => t !== tag))
                    }
                  }}
                >
                  {tag} ({count})
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Search Results Dropdown */}
      {open && (results.length > 0 || suggestions.length > 0 || loading) && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-auto">
          {/* Search source indicator */}
          {source && (
            <div className="px-3 py-1 text-xs text-muted-foreground border-b">
              Powered by {source === 'algolia' ? 'Algolia' : source === 'vector' ? 'Semantic Search' : 'Database'}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="border-b">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                Suggestions
              </div>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.objectID}
                  onClick={() => handleSelect(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <div className="font-medium text-sm">{suggestion.title}</div>
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                Results
              </div>
              {results.map((result) => (
                <button
                  key={result.objectID}
                  onClick={() => handleSelect(result)}
                  className="w-full px-3 py-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {result._highlightResult?.title ? (
                          renderHighlight(result._highlightResult.title)
                        ) : (
                          result.title
                        )}
                      </div>
                      {result.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {result._highlightResult?.description ? (
                            renderHighlight(result._highlightResult.description)
                          ) : (
                            result.description
                          )}
                        </div>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {result.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {result.type}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Loading state */}
          {loading && results.length === 0 && (
            <div className="px-3 py-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          )}

          {/* Empty state */}
          {!loading && query && results.length === 0 && suggestions.length === 0 && (
            <div className="px-3 py-8 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}

      {/* Active filters */}
      {(selectedType || selectedTags.length > 0) && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {selectedType && (
            <Badge variant="secondary" className="gap-1">
              Type: {selectedType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSelectedType(null)}
              />
            </Badge>
          )}
          {selectedTags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// Export a hook for programmatic search
export function useInstantSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (query: string, options?: any) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: query, ...options })
      const response = await fetch(`/api/search/instant?${params}`)
      
      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      setResults(data.hits || [])
      return data
    } catch (error) {
      console.error('Search error:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { search, results, loading }
}