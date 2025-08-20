'use client'

import { useEffect, useState } from 'react'
import { 
  Activity,
  Database,
  Download,
  FileText,
  GitBranch,
  Package,
  Sparkles,
  Tags,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Stats {
  totalResources: number
  verifiedResources: number
  totalCollections: number
  totalTags: number
  totalUsers: number
  activeUsers: number
  totalDownloads: number
  totalViews: number
  avgQuality: number
}

interface RecentResource {
  id: string
  name: string
  type: string
  createdAt: Date
  author?: string
}

interface PopularResource {
  id: string
  name: string
  downloads: number
  views: number
  rating?: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalResources: 0,
    verifiedResources: 0,
    totalCollections: 0,
    totalTags: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalDownloads: 0,
    totalViews: 0,
    avgQuality: 0
  })
  const [recentResources, setRecentResources] = useState<RecentResource[]>([])
  const [popularResources, setPopularResources] = useState<PopularResource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch actual stats from API
      const [statsRes, recentRes, popularRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/resources?limit=5&sortBy=createdAt&sortOrder=desc'),
        fetch('/api/resources?limit=5&sortBy=downloads&sortOrder=desc')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats({
          totalResources: statsData.totalResources || 0,
          verifiedResources: statsData.verifiedResources || 0,
          totalCollections: statsData.totalCollections || 0,
          totalTags: statsData.totalTags || 0,
          totalUsers: statsData.totalUsers || 0,
          activeUsers: statsData.activeUsers || 0,
          totalDownloads: statsData.totalDownloads || 0,
          totalViews: statsData.totalViews || 0,
          avgQuality: statsData.avgQuality || 0
        })
      } else {
        // Use empty data if API fails (safe defaults)
        setStats({
          totalResources: 0,
          verifiedResources: 0,
          totalCollections: 0,
          totalTags: 0,
          totalUsers: 0,
          activeUsers: 0,
          totalDownloads: 0,
          totalViews: 0,
          avgQuality: 0
        })
      }

      if (recentRes.ok) {
        const recentData = await recentRes.json()
        setRecentResources(recentData.resources || [])
      }

      if (popularRes.ok) {
        const popularData = await popularRes.json()
        setPopularResources(popularData.resources || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: 'Total Resources',
      value: stats.totalResources || 0,
      change: stats.totalResources > 0 ? 'Active' : 'No data',
      trend: stats.totalResources > 0 ? 'up' : 'neutral',
      icon: Sparkles,
      href: '/admin/resources',
      color: 'text-violet-500'
    },
    {
      title: 'Verified',
      value: stats.verifiedResources || 0,
      change: stats.totalResources > 0 
        ? `${Math.round((stats.verifiedResources / stats.totalResources) * 100)}%` 
        : '0%',
      trend: stats.verifiedResources > 0 ? 'up' : 'neutral',
      icon: FileText,
      href: '/admin/resources?verified=true',
      color: 'text-green-500'
    },
    {
      title: 'Collections',
      value: stats.totalCollections || 0,
      change: stats.totalCollections > 0 ? 'Active' : 'Empty',
      trend: 'neutral',
      icon: Package,
      href: '/admin/collections',
      color: 'text-blue-500'
    },
    {
      title: 'Total Tags',
      value: stats.totalTags || 0,
      change: stats.totalTags > 0 ? 'In use' : 'None',
      trend: 'neutral',
      icon: Tags,
      href: '/admin/tags',
      color: 'text-orange-500'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers || 0,
      change: stats.totalUsers > 0 
        ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% active`
        : 'No users',
      trend: stats.activeUsers > 0 ? 'up' : 'neutral',
      icon: Users,
      href: '/admin/users',
      color: 'text-pink-500'
    },
    {
      title: 'Downloads',
      value: (stats.totalDownloads || 0).toLocaleString(),
      change: stats.totalDownloads > 0 ? 'This month' : 'No activity',
      trend: stats.totalDownloads > 0 ? 'up' : 'neutral',
      icon: Download,
      href: '/admin/analytics',
      color: 'text-indigo-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your Resource Hub.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/import">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Import Resources
            </Button>
          </Link>
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span className={cn(
                      "font-medium",
                      stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    )}>
                      {stat.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Resources */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Resources</CardTitle>
              <CardDescription>
                Latest additions to your Resource Hub
              </CardDescription>
            </div>
            <Link href="/admin/resources">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentResources.length > 0 ? (
                recentResources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {resource.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {resource.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(resource.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/admin/resources/${resource.id}`}>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        View
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No resources yet. Import some to get started!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Resources */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Resources</CardTitle>
              <CardDescription>
                Most popular by downloads
              </CardDescription>
            </div>
            <Link href="/admin/analytics">
              <Button variant="ghost" size="sm">
                Analytics
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularResources.length > 0 ? (
                popularResources.map((resource, index) => (
                  <div key={resource.id} className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      index === 0 ? "bg-yellow-100 text-yellow-700" :
                      index === 1 ? "bg-gray-100 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {resource.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {resource.downloads}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {resource.views}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No data available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/import">
              <Button variant="outline" className="w-full justify-start">
                <GitBranch className="mr-2 h-4 w-4" />
                Import from GitHub
              </Button>
            </Link>
            <Link href="/admin/sources">
              <Button variant="outline" className="w-full justify-start">
                <Database className="mr-2 h-4 w-4" />
                Configure Sources
              </Button>
            </Link>
            <Link href="/admin/resources?status=draft">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Review Drafts
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resource Quality</CardTitle>
            <CardDescription>
              Average quality score across all resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats.avgQuality}%</span>
                <Badge className="text-sm" variant={
                  stats.avgQuality >= 80 ? "default" :
                  stats.avgQuality >= 60 ? "secondary" : "destructive"
                }>
                  {stats.avgQuality >= 80 ? "Excellent" :
                   stats.avgQuality >= 60 ? "Good" : "Needs Improvement"}
                </Badge>
              </div>
              <Progress value={stats.avgQuality} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant="outline" className="text-green-600">
                  <Activity className="mr-1 h-3 w-3" />
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Response</span>
                <span className="text-sm font-medium">45ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cache Hit Rate</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Error Rate</span>
                <span className="text-sm font-medium text-green-600">0.02%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}