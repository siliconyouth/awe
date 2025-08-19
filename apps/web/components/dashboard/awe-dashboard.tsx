'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  FileText,
  Sparkles,
  Database,
  Brain,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  ChevronRight,
  Zap,
  Shield,
  GitBranch,
  Package
} from 'lucide-react'

interface DashboardStats {
  patterns: {
    total: number
    approved: number
    pending: number
  }
  projects: {
    total: number
    withClaudeMd: number
    optimized: number
  }
  knowledge: {
    sources: number
    updates: number
    lastScrape: string | null
  }
  usage: {
    apiCalls: number
    patternsApplied: number
    recommendations: number
  }
}

export function AWEDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    patterns: { total: 0, approved: 0, pending: 0 },
    projects: { total: 0, withClaudeMd: 0, optimized: 0 },
    knowledge: { sources: 0, updates: 0, lastScrape: null },
    usage: { apiCalls: 0, patternsApplied: 0, recommendations: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // In a real implementation, this would fetch from multiple endpoints
      // For now, we'll use placeholder data
      setStats({
        patterns: { total: 156, approved: 89, pending: 42 },
        projects: { total: 12, withClaudeMd: 8, optimized: 5 },
        knowledge: { sources: 7, updates: 234, lastScrape: new Date().toISOString() },
        usage: { apiCalls: 1842, patternsApplied: 67, recommendations: 124 }
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Generate CLAUDE.md',
      description: 'Create optimized context files',
      icon: FileText,
      href: '/claude-md',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      title: 'Get Recommendations',
      description: 'AI-powered pattern suggestions',
      icon: Sparkles,
      href: '/recommendations',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950'
    },
    {
      title: 'Pattern Library',
      description: 'Browse extracted patterns',
      icon: Database,
      href: '/admin/patterns',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    {
      title: 'Knowledge Base',
      description: 'Manage knowledge sources',
      icon: Brain,
      href: '/admin/knowledge',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950'
    }
  ]

  const features = [
    { icon: Zap, label: 'AI-Powered Analysis', description: 'Claude Opus 4.1 integration' },
    { icon: Shield, label: 'Pattern Recognition', description: 'Automatic best practice extraction' },
    { icon: GitBranch, label: 'Context Engineering', description: 'Optimized CLAUDE.md generation' },
    { icon: Package, label: 'Smart Scraping', description: 'Intelligent web monitoring' }
  ]

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to AWE v2.1</CardTitle>
          <CardDescription className="text-base">
            Your AI-powered Claude Code optimization platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            AWE transforms your development workflow with intelligent pattern recognition, 
            automated CLAUDE.md generation, and AI-powered recommendations.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.label} className="space-y-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <h4 className="font-semibold text-sm">{feature.label}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.href} href={action.href} className="block">
              <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className={`rounded-lg p-3 w-fit ${action.bgColor} mb-4`}>
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <h3 className="font-semibold mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patterns</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.patterns.total}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              {stats.patterns.approved} approved
              <Clock className="h-3 w-3 ml-2 mr-1 text-yellow-500" />
              {stats.patterns.pending} pending
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.projects.withClaudeMd} with CLAUDE.md
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-primary h-1.5 rounded-full"
                style={{ width: `${(stats.projects.optimized / stats.projects.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Sources</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.knowledge.sources}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.knowledge.updates} total updates
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usage.recommendations}</div>
            <div className="text-xs text-muted-foreground mt-1">
              recommendations generated
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Getting Started */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Complete these steps to maximize AWE's potential</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Set up authentication</span>
              </div>
              <Badge variant="secondary" className="text-xs">Complete</Badge>
            </div>
            
            <Link href="/admin/knowledge" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  <span className="text-sm">Add knowledge sources</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
            
            <Link href="/claude-md" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  <span className="text-sm">Generate first CLAUDE.md</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
            
            <Link href="/admin/patterns" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  <span className="text-sm">Review extracted patterns</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Pattern extracted from Next.js Docs</span>
              <span className="text-xs text-muted-foreground ml-auto">2m ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">CLAUDE.md generated for project-x</span>
              <span className="text-xs text-muted-foreground ml-auto">15m ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">5 patterns approved</span>
              <span className="text-xs text-muted-foreground ml-auto">1h ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Knowledge source updated</span>
              <span className="text-xs text-muted-foreground ml-auto">3h ago</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}