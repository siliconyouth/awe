'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useProject } from '../../../contexts/project-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { designSystem, cn } from '../../../lib/design-system'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  Code,
  Database,
  FileText,
  FolderOpen,
  GitBranch,
  BarChart3,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2,
  Package,
  Cpu,
} from 'lucide-react'

interface DashboardStats {
  projects: number
  patterns: number
  recommendations: number
  claudeMdGenerated: number
  optimizationScore: number
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: Date
    icon: React.ElementType
  }>
}

export default function ModernDashboardPage() {
  const { user } = useUser()
  const { currentProject, projects } = useProject()
  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    patterns: 0,
    recommendations: 0,
    claudeMdGenerated: 0,
    optimizationScore: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading stats
    setTimeout(() => {
      setStats({
        projects: projects.length,
        patterns: 156,
        recommendations: 24,
        claudeMdGenerated: 8,
        optimizationScore: 78,
        recentActivity: [
          {
            id: '1',
            type: 'pattern',
            message: 'New pattern extracted from React documentation',
            timestamp: new Date(),
            icon: Database,
          },
          {
            id: '2',
            type: 'project',
            message: 'Project "NextJS App" analysis completed',
            timestamp: new Date(Date.now() - 3600000),
            icon: CheckCircle2,
          },
          {
            id: '3',
            type: 'recommendation',
            message: '5 new optimization suggestions available',
            timestamp: new Date(Date.now() - 7200000),
            icon: Sparkles,
          },
        ],
      })
      setLoading(false)
    }, 1000)
  }, [projects])

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className={cn(designSystem.typography.heading[1], 'mb-2')}>
          Welcome back, {user?.firstName || 'Developer'}
        </h1>
        <p className={cn(designSystem.typography.body.large, designSystem.typography.muted)}>
          {currentProject 
            ? `Working on ${currentProject.name}`
            : 'Select a project to get started'
          }
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <QuickAction
          href="/projects"
          icon={FolderOpen}
          title="New Project"
          description="Create or import"
          variant="default"
        />
        <QuickAction
          href="/claude-md"
          icon={FileText}
          title="Generate CLAUDE.md"
          description="Optimize context"
          variant="secondary"
        />
        <QuickAction
          href="/recommendations"
          icon={Sparkles}
          title="View Suggestions"
          description={`${stats.recommendations} available`}
          variant="secondary"
        />
        <QuickAction
          href="/admin/patterns"
          icon={Database}
          title="Pattern Library"
          description="Browse patterns"
          variant="secondary"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={stats.projects.toString()}
          description="+2 this week"
          icon={FolderOpen}
          trend="up"
          trendValue={12}
        />
        <StatCard
          title="Patterns Available"
          value={stats.patterns.toString()}
          description="From global library"
          icon={Database}
          trend="up"
          trendValue={8}
        />
        <StatCard
          title="Optimization Score"
          value={`${stats.optimizationScore}%`}
          description="Above average"
          icon={TrendingUp}
          trend="up"
          trendValue={5}
        />
        <StatCard
          title="Context Files"
          value={stats.claudeMdGenerated.toString()}
          description="Generated this month"
          icon={FileText}
          trend="neutral"
          trendValue={0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity - 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <ActivityItem key={activity.id} {...activity} />
              ))}
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/activity">
                  View All Activity
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Project Health - 1 column */}
        <Card>
          <CardHeader>
            <CardTitle>Project Health</CardTitle>
            <CardDescription>
              {currentProject ? currentProject.name : 'Overall status'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <HealthMetric
                label="Code Quality"
                value={85}
                status="good"
              />
              <HealthMetric
                label="Test Coverage"
                value={72}
                status="warning"
              />
              <HealthMetric
                label="Performance"
                value={91}
                status="good"
              />
              <HealthMetric
                label="Security"
                value={88}
                status="good"
              />
              <div className="pt-4">
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/analytics">
                    View Detailed Analytics
                    <BarChart3 className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Personalized suggestions for your projects</CardDescription>
            </div>
            <Badge variant="secondary">
              <Sparkles className="mr-1 h-3 w-3" />
              {stats.recommendations} new
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <RecommendationCard
              title="Optimize Bundle Size"
              description="Reduce your bundle by 23% with code splitting"
              impact="high"
              icon={Package}
            />
            <RecommendationCard
              title="Improve Type Safety"
              description="Add TypeScript strict mode for better reliability"
              impact="medium"
              icon={Code}
            />
            <RecommendationCard
              title="Update Dependencies"
              description="3 packages have security updates available"
              impact="high"
              icon={AlertCircle}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Quick Action Component
function QuickAction({ 
  href, 
  icon: Icon, 
  title, 
  description, 
  variant = 'secondary' 
}: {
  href: string
  icon: React.ElementType
  title: string
  description: string
  variant?: 'default' | 'secondary'
}) {
  return (
    <Link href={href}>
      <Card className={cn(
        'group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5',
        variant === 'default' && 'border-primary bg-primary/5'
      )}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center transition-colors',
            variant === 'default' 
              ? 'bg-primary/10 group-hover:bg-primary/20' 
              : 'bg-muted group-hover:bg-muted/80'
          )}>
            <Icon className={cn(
              'h-5 w-5',
              variant === 'default' ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          <div className="flex-1">
            <div className="font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  )
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendValue 
}: {
  title: string
  value: string
  description: string
  icon: React.ElementType
  trend: 'up' | 'down' | 'neutral'
  trendValue: number
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          {trend !== 'neutral' && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trendValue}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// Activity Item Component
function ActivityItem({ 
  type, 
  message, 
  timestamp, 
  icon: Icon 
}: {
  type: string
  message: string
  timestamp: Date
  icon: React.ElementType
}) {
  const timeAgo = getTimeAgo(timestamp)
  
  return (
    <div className="flex gap-4">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm">{message}</p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  )
}

// Health Metric Component
function HealthMetric({ 
  label, 
  value, 
  status 
}: {
  label: string
  value: number
  status: 'good' | 'warning' | 'error'
}) {
  const statusColors = {
    good: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}

// Recommendation Card Component
function RecommendationCard({ 
  title, 
  description, 
  impact, 
  icon: Icon 
}: {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  icon: React.ElementType
}) {
  const impactColors = {
    high: 'text-red-600 bg-red-100 dark:bg-red-900/20',
    medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
    low: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  }
  
  return (
    <div className="group cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
          <Badge 
            variant="secondary" 
            className={cn('text-xs', impactColors[impact])}
          >
            {impact} impact
          </Badge>
        </div>
      </div>
    </div>
  )
}

// Helper function
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}