'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Label } from '../ui/label'
import { toast } from '../ui/use-toast'
import { CheckIcon, XIcon, RefreshCwIcon, SparklesIcon } from 'lucide-react'

interface ExtractedPattern {
  id: string
  type: string
  name: string
  content: Record<string, unknown>
  aiAnalysis?: Record<string, unknown>
  confidence: number
  status: string
  category: string
  tags: string[]
  useCases: string[]
  source: {
    id: string
    name: string
    url: string
    category: string
  }
  createdAt: string
}

export function ReviewDashboard() {
  const [patterns, setPatterns] = useState<ExtractedPattern[]>([])
  const [selectedPattern, setSelectedPattern] = useState<ExtractedPattern | null>(null)
  const [refinement, setRefinement] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState({
    status: 'PENDING',
    type: '',
    sourceId: ''
  })

  useEffect(() => {
    fetchPatterns()
  }, [filter])

  const fetchPatterns = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.status) params.append('status', filter.status)
      if (filter.type) params.append('type', filter.type)
      if (filter.sourceId) params.append('sourceId', filter.sourceId)

      const res = await fetch(`/api/patterns?${params}`)
      const data = await res.json()
      setPatterns(data.patterns)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch patterns',
        variant: 'destructive'
      })
    }
  }

  const reviewPattern = async (patternId: string, action: string) => {
    setLoading(true)

    try {
      const res = await fetch('/api/patterns/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternId,
          action,
          refinements: action === 'refine' ? { feedback: refinement, useAI: true } : undefined,
          feedback: action === 'reject' ? refinement : undefined
        })
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: `Pattern ${action}ed successfully`
        })
        setSelectedPattern(null)
        setRefinement('')
        fetchPatterns()
      } else {
        throw new Error('Failed to review pattern')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to review pattern',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getPatternTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CODE_EXAMPLE: 'bg-blue-500',
      CONFIGURATION: 'bg-green-500',
      SYSTEM_PROMPT: 'bg-purple-500',
      BEST_PRACTICE: 'bg-yellow-500',
      USE_CASE: 'bg-pink-500',
      API_PATTERN: 'bg-indigo-500',
      ERROR_PATTERN: 'bg-red-500',
      PERFORMANCE_TIP: 'bg-orange-500',
      SECURITY_PRACTICE: 'bg-gray-500'
    }
    return colors[type] || 'bg-gray-400'
  }

  const formatContent = (content: Record<string, unknown>) => {
    if (typeof content === 'string') return content
    return JSON.stringify(content, null, 2)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Review Queue</CardTitle>
            <CardDescription>
              Patterns pending approval or refinement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patterns.map((pattern) => (
                <Card
                  key={pattern.id}
                  className={`cursor-pointer transition-colors ${
                    selectedPattern?.id === pattern.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPattern(pattern)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getPatternTypeColor(pattern.type)}`} />
                          <Badge variant="outline">{pattern.type}</Badge>
                          <Badge variant="secondary">
                            {Math.round(pattern.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <h4 className="font-medium">{pattern.name}</h4>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-2">
                      {pattern.source.name}
                    </p>
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
                  </CardContent>
                </Card>
              ))}

              {patterns.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No patterns to review
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedPattern && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Details</CardTitle>
              <CardDescription>
                Review and approve, refine, or reject this pattern
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Type</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${getPatternTypeColor(selectedPattern.type)}`} />
                  <Badge>{selectedPattern.type}</Badge>
                </div>
              </div>

              <div>
                <Label>Name</Label>
                <p className="mt-1 font-medium">{selectedPattern.name}</p>
              </div>

              <div>
                <Label>Content</Label>
                <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                  {formatContent(selectedPattern.content)}
                </pre>
              </div>

              {selectedPattern.aiAnalysis && (
                <div>
                  <Label>AI Analysis</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedPattern.aiAnalysis, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <Label>Source</Label>
                <p className="mt-1 text-sm">
                  {selectedPattern.source.name} • {selectedPattern.source.category}
                </p>
                <a
                  href={selectedPattern.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  {selectedPattern.source.url}
                </a>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedPattern.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedPattern.useCases.length > 0 && (
                <div>
                  <Label>Use Cases</Label>
                  <ul className="mt-1 space-y-1">
                    {selectedPattern.useCases.map((useCase, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        • {useCase}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <Label>Confidence Score</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${selectedPattern.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(selectedPattern.confidence * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Decide what to do with this pattern
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Feedback / Refinement Instructions</Label>
                <Textarea
                  className="mt-1"
                  placeholder="Provide feedback or instructions for refinement..."
                  value={refinement}
                  onChange={(e) => setRefinement(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="default"
                  onClick={() => reviewPattern(selectedPattern.id, 'approve')}
                  disabled={loading}
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => reviewPattern(selectedPattern.id, 'refine')}
                  disabled={loading || !refinement}
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Refine with AI
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => reviewPattern(selectedPattern.id, 'reject')}
                  disabled={loading}
                >
                  <XIcon className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}