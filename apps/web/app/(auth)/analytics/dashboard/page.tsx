'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Activity,
  Download,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'

interface AnalyticsData {
  overview: {
    totalResources: number
    totalUsers: number
    totalPatterns: number
    activeUsers: number
    growthRate: number
    healthScore: number
  }
  resourceMetrics: {
    byType: Array<{ type: string; count: number }>
    byStatus: Array<{ status: string; count: number }>
    trending: Array<{ id: string; title: string; views: number; growth: number }>
  }
  userMetrics: {
    dailyActive: Array<{ date: string; count: number }>
    engagement: number
    retention: number
    newUsers: Array<{ date: string; count: number }>
  }
  systemMetrics: {
    apiRequests: Array<{ time: string; count: number; errors: number }>
    responseTime: Array<{ time: string; avg: number; p95: number; p99: number }>
    errorRate: number
    uptime: number
    queueHealth: Array<{ queue: string; waiting: number; active: number; completed: number; failed: number }>
  }
  searchMetrics: {
    topQueries: Array<{ query: string; count: number }>
    searchVolume: Array<{ date: string; searches: number }>
    clickThrough: number
    avgPosition: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/analytics/dashboard?range=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [timeRange])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights and metrics for your platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
              <TabsTrigger value="90d">90d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalResources.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className={data.overview.growthRate > 0 ? 'text-green-500' : 'text-red-500'}>
                {data.overview.growthRate > 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                {Math.abs(data.overview.growthRate)}%
              </span>
              {' '}from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((data.overview.activeUsers / data.overview.totalUsers) * 100).toFixed(1)}% of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.healthScore}%</div>
            <Progress value={data.overview.healthScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {data.systemMetrics.errorRate < 0.01 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : data.systemMetrics.errorRate < 0.05 ? (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.systemMetrics.errorRate < 0.01 ? 'Healthy' : data.systemMetrics.errorRate < 0.05 ? 'Degraded' : 'Critical'}
            </div>
            <p className="text-xs text-muted-foreground">
              {(data.systemMetrics.errorRate * 100).toFixed(2)}% error rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resources by Type</CardTitle>
                <CardDescription>Distribution of resource types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.resourceMetrics.byType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.resourceMetrics.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trending Resources</CardTitle>
                <CardDescription>Most viewed resources this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.resourceMetrics.trending.map((resource, index) => (
                    <div key={resource.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{resource.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {resource.views.toLocaleString()} views
                          </p>
                        </div>
                      </div>
                      <Badge variant={resource.growth > 0 ? 'default' : 'secondary'}>
                        {resource.growth > 0 ? '+' : ''}{resource.growth}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Daily active users and new signups</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.userMetrics.dailyActive}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Active Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.userMetrics.engagement}%</div>
                <Progress value={data.userMetrics.engagement} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.userMetrics.retention}%</div>
                <Progress value={data.userMetrics.retention} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.userMetrics.newUsers.reduce((sum, day) => sum + day.count, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">This period</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>API Performance</CardTitle>
                <CardDescription>Response times (ms)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.systemMetrics.responseTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avg" stroke="#8884d8" name="Average" />
                    <Line type="monotone" dataKey="p95" stroke="#82ca9d" name="P95" />
                    <Line type="monotone" dataKey="p99" stroke="#ffc658" name="P99" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Queue Health</CardTitle>
                <CardDescription>Background job processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.systemMetrics.queueHealth.map((queue) => (
                    <div key={queue.queue} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{queue.queue}</span>
                        <span className="text-muted-foreground">
                          {queue.completed} completed
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <div className="flex-1 bg-green-500 h-2 rounded" style={{ flex: queue.completed }} />
                        <div className="flex-1 bg-yellow-500 h-2 rounded" style={{ flex: queue.active }} />
                        <div className="flex-1 bg-blue-500 h-2 rounded" style={{ flex: queue.waiting }} />
                        {queue.failed > 0 && (
                          <div className="flex-1 bg-red-500 h-2 rounded" style={{ flex: queue.failed }} />
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      Completed
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded" />
                      Active
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      Waiting
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded" />
                      Failed
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>API Requests</CardTitle>
              <CardDescription>Request volume and errors</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.systemMetrics.apiRequests}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Requests" />
                  <Bar dataKey="errors" fill="#ff8042" name="Errors" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Volume</CardTitle>
                <CardDescription>Number of searches over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.searchMetrics.searchVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="searches" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Search Queries</CardTitle>
                <CardDescription>Most popular search terms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.searchMetrics.topQueries.map((query, index) => (
                    <div key={query.query} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                        <span className="text-sm font-medium">{query.query}</span>
                      </div>
                      <Badge variant="outline">{query.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Click-Through Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.searchMetrics.clickThrough}%</div>
                <Progress value={data.searchMetrics.clickThrough} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Percentage of searches resulting in clicks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.searchMetrics.avgPosition.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Average position of clicked results
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}