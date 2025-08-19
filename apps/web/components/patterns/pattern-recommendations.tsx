'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { toast } from '../../hooks/use-toast'
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  BookOpen,
  Code,
  Shield,
  Zap,
  GitBranch,
  ChevronRight,
  Loader2,
  ThumbsUp,
  Info
} from 'lucide-react'

interface PatternRecommendation {
  patternId: string
  pattern: string
  relevanceScore: number
  priority: 'high' | 'medium' | 'low'
  reasoning: string
  applicationGuide: string
  considerations: string
  fullPattern?: {
    id: string
    pattern: string
    description: string
    category: string
    source: {
      name: string
    }
  }
  usageCount?: number
}

const categoryIcons: Record<string, any> = {
  API_CHANGE: GitBranch,
  BEST_PRACTICE: ThumbsUp,
  WARNING: AlertCircle,
  EXAMPLE: Code,
  CONCEPT: BookOpen,
  PERFORMANCE: Zap,
  SECURITY: Shield,
  OTHER: Info
}

const priorityColors = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary'
} as const

export function PatternRecommendations() {
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<PatternRecommendation[]>([])
  const [projectContext, setProjectContext] = useState('')
  const [problemDescription, setProblemDescription] = useState('')
  const [codeSnippet, setCodeSnippet] = useState('')
  const [technologies, setTechnologies] = useState('')
  const [category, setCategory] = useState('all')
  const [showPopular, setShowPopular] = useState(true)

  // Fetch popular recommendations on mount
  useEffect(() => {
    if (showPopular) {
      fetchPopularRecommendations()
    }
  }, [showPopular, category])

  const fetchPopularRecommendations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (category !== 'all') params.append('category', category)
      params.append('limit', '5')

      const response = await fetch(`/api/patterns/recommend?${params}`)
      const data = await response.json()

      if (data.success) {
        setRecommendations(data.recommendations.map((rec: any) => ({
          patternId: rec.pattern.id,
          pattern: rec.pattern.name,
          relevanceScore: rec.metrics.relevance,
          priority: rec.recommendation.priority,
          reasoning: rec.recommendation.reason,
          applicationGuide: rec.pattern.description || 'Apply this pattern to improve your code',
          considerations: `Used ${rec.metrics.usageCount} times`,
          fullPattern: {
            id: rec.pattern.id,
            pattern: rec.pattern.name,
            description: rec.pattern.description,
            category: rec.pattern.category,
            source: { name: rec.pattern.source }
          },
          usageCount: rec.metrics.usageCount
        })))
      }
    } catch (error) {
      console.error('Failed to fetch popular recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPersonalizedRecommendations = async () => {
    if (!projectContext && !problemDescription && !codeSnippet) {
      toast({
        title: 'Input Required',
        description: 'Please provide project context, problem description, or code snippet',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      setShowPopular(false)

      const response = await fetch('/api/patterns/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectContext,
          problemDescription,
          codeSnippet,
          technologies: technologies ? technologies.split(',').map(t => t.trim()) : [],
          category: category === 'all' ? undefined : category
        })
      })

      const data = await response.json()

      if (data.success) {
        setRecommendations(data.recommendations)
        toast({
          title: 'Recommendations Generated',
          description: `Found ${data.recommendations.length} relevant patterns for your context`
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate recommendations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const applyPattern = async (recommendation: PatternRecommendation) => {
    // Track pattern application
    try {
      await fetch('/api/patterns/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternId: recommendation.patternId,
          action: 'applied',
          context: { fromRecommendation: true }
        })
      })

      toast({
        title: 'Pattern Applied',
        description: `${recommendation.pattern} has been marked as applied`
      })
    } catch (error) {
      console.error('Failed to track pattern application:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Pattern Recommendations
          </CardTitle>
          <CardDescription>
            Get AI-powered pattern recommendations based on your project context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Project Context</label>
              <Textarea
                placeholder="Describe your project (e.g., Next.js e-commerce site with TypeScript)"
                value={projectContext}
                onChange={(e) => setProjectContext(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Problem Description</label>
              <Textarea
                placeholder="What are you trying to solve?"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Code Snippet (Optional)</label>
            <Textarea
              placeholder="Paste relevant code here..."
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              rows={5}
              className="font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Technologies</label>
              <Input
                placeholder="React, TypeScript, Prisma (comma-separated)"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category Focus</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="BEST_PRACTICE">Best Practices</SelectItem>
                  <SelectItem value="PERFORMANCE">Performance</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                  <SelectItem value="API_CHANGE">API Changes</SelectItem>
                  <SelectItem value="WARNING">Warnings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={getPersonalizedRecommendations}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Get Recommendations
            </Button>
            <Button 
              variant="outline"
              onClick={fetchPopularRecommendations}
              disabled={loading}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Show Popular
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {showPopular ? 'Popular Patterns' : 'Recommended Patterns'}
          </h3>
          
          {recommendations.map((rec) => {
            const Icon = rec.fullPattern 
              ? categoryIcons[rec.fullPattern.category] || Info
              : Info
            
            return (
              <Card key={rec.patternId} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <h4 className="font-semibold">{rec.pattern}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={priorityColors[rec.priority]}>
                        {rec.priority} priority
                      </Badge>
                      {rec.relevanceScore && (
                        <Badge variant="outline">
                          {(rec.relevanceScore * 100).toFixed(0)}% match
                        </Badge>
                      )}
                    </div>
                  </div>

                  {rec.fullPattern?.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {rec.fullPattern.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-3">
                    <div className="text-sm">
                      <span className="font-medium">Why relevant: </span>
                      <span className="text-gray-600">{rec.reasoning}</span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">How to apply: </span>
                      <span className="text-gray-600">{rec.applicationGuide}</span>
                    </div>
                    
                    {rec.considerations && (
                      <div className="text-sm">
                        <span className="font-medium">Note: </span>
                        <span className="text-gray-600">{rec.considerations}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {rec.fullPattern?.source && (
                        <span>Source: {rec.fullPattern.source.name}</span>
                      )}
                      {rec.usageCount !== undefined && (
                        <span className="ml-2">• Used {rec.usageCount} times</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyPattern(rec)}
                    >
                      Apply Pattern
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && recommendations.length === 0 && !showPopular && (
        <Card className="p-8 text-center">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
          <p className="text-gray-600">
            Provide project context to get personalized pattern recommendations
          </p>
        </Card>
      )}
    </div>
  )
}