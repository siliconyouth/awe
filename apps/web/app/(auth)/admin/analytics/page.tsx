'use client'

import { useState, useEffect } from 'react'
import { PageContainer } from '../../../../components/layout/page-container'
import { PageHeader } from '../../../../components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Progress } from '../../../../components/ui/progress'
import { cn } from '../../../../lib/utils'
import { designSystem } from '../../../../lib/design-system'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Activity, 
  Clock, 
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Brain,
  Zap,
  Globe,
  Database
} from 'lucide-react'

// Default empty data structure
const getEmptyData = () => ({
  overview: {
    totalUsers: 0,
    activeUsers: 0,
    totalResources: 0,
    totalPatterns: 0,
    totalProjects: 0,
    avgResponseTime: 0,
    apiCalls: 0,
    errorRate: 0,
    cacheHitRate: 0
  },
  trends: {
    users: { current: 0, previous: 0, change: 0 },
    resources: { current: 0, previous: 0, change: 0 },
    patterns: { current: 0, previous: 0, change: 0 },
    apiCalls: { current: 0, previous: 0, change: 0 }
  },
  performance: {
    uptime: 100,
    avgResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    errorRate: 0,
    requestsPerMinute: 0
  },
  aiUsage: {
    totalRequests: 0,
    claudeRequests: 0,
    openaiRequests: 0,
    tokensUsed: 0,
    costEstimate: 0,
    avgTokensPerRequest: 0
  },
  topResources: []
})

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          setData(result.data)
        } else {
          // Use empty data if API fails
          setData(getEmptyData())
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        // Use empty data on error
        setData(getEmptyData())
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to refresh analytics:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer className={designSystem.animations.fadeIn}>
      <PageHeader
        title="Analytics Dashboard"
        description="Monitor system performance, usage patterns, and key metrics"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Analytics' }
        ]}
        actions={
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className={cn(designSystem.components.card.hover, designSystem.animations.slideUp)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.totalUsers)}</div>
            <div className="flex items-center mt-2">
              {getTrendIcon(data.trends.users.change)}
              <span className={cn(
                "text-xs ml-1",
                data.trends.users.change > 0 ? "text-green-500" : "text-red-500"
              )}>
                {Math.abs(data.trends.users.change)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(designSystem.components.card.hover, designSystem.animations.slideUp, "delay-100")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Resources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.totalResources)}</div>
            <div className="flex items-center mt-2">
              {getTrendIcon(data.trends.resources.change)}
              <span className={cn(
                "text-xs ml-1",
                data.trends.resources.change > 0 ? "text-green-500" : "text-red-500"
              )}>
                {Math.abs(data.trends.resources.change)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(designSystem.components.card.hover, designSystem.animations.slideUp, "delay-200")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.apiCalls)}</div>
            <div className="flex items-center mt-2">
              {getTrendIcon(data.trends.apiCalls.change)}
              <span className={cn(
                "text-xs ml-1",
                data.trends.apiCalls.change > 0 ? "text-green-500" : "text-red-500"
              )}>
                {Math.abs(data.trends.apiCalls.change)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(designSystem.components.card.hover, designSystem.animations.slideUp, "delay-300")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgResponseTime}ms</div>
            <div className="flex items-center mt-2">
              <Badge variant={data.overview.avgResponseTime < 300 ? "default" : "destructive"}>
                {data.overview.avgResponseTime < 300 ? "Healthy" : "Slow"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="performance" className={designSystem.animations.slideUp}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analytics
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Real-time system performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm text-muted-foreground">{data.performance.uptime}%</span>
                  </div>
                  <Progress value={data.performance.uptime} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Cache Hit Rate</span>
                    <span className="text-sm text-muted-foreground">{(data.overview.cacheHitRate * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={data.overview.cacheHitRate * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Error Rate</span>
                    <span className="text-sm text-muted-foreground">{(data.overview.errorRate * 100).toFixed(2)}%</span>
                  </div>
                  <Progress value={100 - (data.overview.errorRate * 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>API response time percentiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Average</span>
                    <Badge variant="outline">{data.performance.avgResponseTime}ms</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">P95</span>
                    <Badge variant="outline">{data.performance.p95ResponseTime}ms</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">P99</span>
                    <Badge variant="outline">{data.performance.p99ResponseTime}ms</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Requests/min</span>
                    <Badge variant="outline">{data.performance.requestsPerMinute}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
              <CardDescription>Platform usage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <LineChart className="h-16 w-16" />
                <span className="ml-4">Chart visualization would go here</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Usage Statistics</CardTitle>
                <CardDescription>Token usage and costs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Requests</span>
                    <span className="font-medium">{formatNumber(data.aiUsage.totalRequests)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Claude Requests</span>
                    <span className="font-medium">{formatNumber(data.aiUsage.claudeRequests)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">OpenAI Requests</span>
                    <span className="font-medium">{formatNumber(data.aiUsage.openaiRequests)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Tokens</span>
                    <span className="font-medium">{formatNumber(data.aiUsage.tokensUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Tokens/Request</span>
                    <span className="font-medium">{data.aiUsage.avgTokensPerRequest}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Estimated Cost</span>
                    <Badge variant="secondary" className="text-lg">
                      ${data.aiUsage.costEstimate.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Provider Distribution</CardTitle>
                <CardDescription>Request distribution by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <PieChart className="h-16 w-16" />
                  <span className="ml-4">Pie chart would go here</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Resources</CardTitle>
              <CardDescription>Most viewed resources in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topResources && data.topResources.length > 0 ? (
                  data.topResources.map((resource: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium">{resource.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatNumber(resource.views)} views
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">⭐ {resource.rating.toFixed(1)}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No resources found yet</p>
                    <p className="text-sm mt-1">Resources will appear here once published</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}