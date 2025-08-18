/**
 * Analytics Dashboard Page
 * 
 * Comprehensive analytics for the AWE platform
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
// import { Button } from '../../../components/ui/button' // Currently unused
import { Alert, AlertDescription } from '../../../components/ui/alert'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  AreaChart, Area, // RadarChart, Radar, PolarGrid, PolarAngleAxis, // Currently unused
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  TrendingUpIcon, ActivityIcon, 
  UsersIcon, BrainIcon, ShieldIcon,
  CheckCircleIcon, AlertCircleIcon,
  CpuIcon, DatabaseIcon
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalUsers: number
    activeUsers: number
    totalProjects: number
    totalAnalyses: number
    totalRecommendations: number
    aiCalls: number
    averageResponseTime: number
    errorRate: number
    userGrowth: number
    projectGrowth: number
  }
  userActivity: Array<{
    date: string
    users: number
    sessions: number
    newUsers: number
  }>
  aiUsage: Array<{
    date: string
    analyses: number
    recommendations: number
    generations: number
    tokens: number
  }>
  commandUsage: Array<{
    command: string
    count: number
    successRate: number
  }>
  projectTypes: Array<{
    type: string
    count: number
    percentage: number
  }>
  performanceMetrics: Array<{
    metric: string
    value: number
    target: number
    unit: string
  }>
  errorDistribution: Array<{
    type: string
    count: number
    severity: 'low' | 'medium' | 'high'
  }>
  geographicDistribution: Array<{
    region: string
    users: number
    projects: number
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Mock data for demonstration
      const mockData: AnalyticsData = {
        overview: {
          totalUsers: 1247,
          activeUsers: 892,
          totalProjects: 3456,
          totalAnalyses: 12893,
          totalRecommendations: 45678,
          aiCalls: 234567,
          averageResponseTime: 1.8,
          errorRate: 0.02,
          userGrowth: 0.15,
          projectGrowth: 0.23
        },
        userActivity: [
          { date: '2024-01-15', users: 180, sessions: 420, newUsers: 25 },
          { date: '2024-01-16', users: 195, sessions: 465, newUsers: 32 },
          { date: '2024-01-17', users: 210, sessions: 502, newUsers: 28 },
          { date: '2024-01-18', users: 225, sessions: 548, newUsers: 35 },
          { date: '2024-01-19', users: 205, sessions: 489, newUsers: 22 },
          { date: '2024-01-20', users: 190, sessions: 445, newUsers: 18 },
          { date: '2024-01-21', users: 215, sessions: 512, newUsers: 30 }
        ],
        aiUsage: [
          { date: '2024-01-15', analyses: 450, recommendations: 820, generations: 230, tokens: 125000 },
          { date: '2024-01-16', analyses: 480, recommendations: 890, generations: 260, tokens: 138000 },
          { date: '2024-01-17', analyses: 520, recommendations: 950, generations: 280, tokens: 145000 },
          { date: '2024-01-18', analyses: 560, recommendations: 1020, generations: 310, tokens: 158000 },
          { date: '2024-01-19', analyses: 490, recommendations: 880, generations: 250, tokens: 132000 },
          { date: '2024-01-20', analyses: 440, recommendations: 800, generations: 220, tokens: 118000 },
          { date: '2024-01-21', analyses: 510, recommendations: 920, generations: 270, tokens: 140000 }
        ],
        commandUsage: [
          { command: 'analyze', count: 3456, successRate: 0.98 },
          { command: 'recommend', count: 2890, successRate: 0.96 },
          { command: 'scaffold', count: 1234, successRate: 0.99 },
          { command: 'init', count: 987, successRate: 0.97 },
          { command: 'optimize', count: 765, successRate: 0.95 },
          { command: 'sync', count: 543, successRate: 0.94 }
        ],
        projectTypes: [
          { type: 'Next.js', count: 890, percentage: 25.8 },
          { type: 'React', count: 756, percentage: 21.9 },
          { type: 'Node.js', count: 623, percentage: 18.0 },
          { type: 'TypeScript', count: 534, percentage: 15.5 },
          { type: 'Python', count: 345, percentage: 10.0 },
          { type: 'Other', count: 308, percentage: 8.8 }
        ],
        performanceMetrics: [
          { metric: 'API Response Time', value: 125, target: 200, unit: 'ms' },
          { metric: 'AI Processing Time', value: 1800, target: 2000, unit: 'ms' },
          { metric: 'Database Query Time', value: 45, target: 100, unit: 'ms' },
          { metric: 'Cache Hit Rate', value: 92, target: 90, unit: '%' },
          { metric: 'Uptime', value: 99.9, target: 99.5, unit: '%' }
        ],
        errorDistribution: [
          { type: 'Rate Limit', count: 23, severity: 'low' },
          { type: 'Authentication', count: 12, severity: 'medium' },
          { type: 'Database Connection', count: 5, severity: 'high' },
          { type: 'API Timeout', count: 18, severity: 'medium' },
          { type: 'Validation', count: 34, severity: 'low' }
        ],
        geographicDistribution: [
          { region: 'North America', users: 456, projects: 1234 },
          { region: 'Europe', users: 389, projects: 987 },
          { region: 'Asia', users: 234, projects: 678 },
          { region: 'South America', users: 89, projects: 234 },
          { region: 'Africa', users: 45, projects: 123 },
          { region: 'Oceania', users: 34, projects: 89 }
        ]
      }
      setData(mockData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <Alert>
        <AlertCircleIcon className="h-4 w-4" />
        <AlertDescription>
          Failed to load analytics data. Please try again later.
        </AlertDescription>
      </Alert>
    )
  }

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1']

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor platform performance and usage metrics
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              Active Users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.activeUsers.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
              <TrendingUpIcon className="w-3 h-3" />
              {(data.overview.userGrowth * 100).toFixed(1)}% growth
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BrainIcon className="w-4 h-4" />
              AI Analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalAnalyses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.overview.totalRecommendations.toLocaleString()} recommendations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ActivityIcon className="w-4 h-4" />
              Response Time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.averageResponseTime}s
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
              <CheckCircleIcon className="w-3 h-3" />
              Within target
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4" />
              Error Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.overview.errorRate * 100).toFixed(2)}%
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
              <CheckCircleIcon className="w-3 h-3" />
              Low error rate
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="ai">AI Metrics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Daily active users and sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.userActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="users" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" />
                    <Area type="monotone" dataKey="newUsers" stackId="1" stroke="#10B981" fill="#10B981" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Command Usage</CardTitle>
                <CardDescription>Most used CLI commands</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.commandUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="command" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Types Distribution</CardTitle>
              <CardDescription>Breakdown of project technologies</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.projectTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type} (${percentage}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.projectTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Usage Trends</CardTitle>
              <CardDescription>Analyses, recommendations, and token usage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.aiUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="analyses" stroke="#8B5CF6" name="Analyses" />
                  <Line yAxisId="left" type="monotone" dataKey="recommendations" stroke="#3B82F6" name="Recommendations" />
                  <Line yAxisId="left" type="monotone" dataKey="generations" stroke="#10B981" name="Generations" />
                  <Line yAxisId="right" type="monotone" dataKey="tokens" stroke="#F59E0B" name="Tokens" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total AI Calls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.overview.aiCalls.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Tokens/Call</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(data.aiUsage.reduce((acc, curr) => acc + curr.tokens, 0) / data.aiUsage.length / 500)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per request
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Success Rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  98.5%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  AI operations
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>System performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.performanceMetrics.map((metric) => (
                  <div key={metric.metric} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{metric.metric}</span>
                      <span className="font-medium">
                        {metric.value}{metric.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          metric.value <= metric.target ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min((metric.value / metric.target) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Target: {metric.target}{metric.unit}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <CpuIcon className="w-4 h-4" />
                  CPU Usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">32%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average utilization
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DatabaseIcon className="w-4 h-4" />
                  Database Load
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Connection pool usage
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Distribution</CardTitle>
              <CardDescription>Types and severity of errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.errorDistribution.map((error) => (
                  <div key={error.type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={
                          error.severity === 'high' ? 'destructive' :
                          error.severity === 'medium' ? 'secondary' :
                          'outline'
                        }
                      >
                        {error.severity}
                      </Badge>
                      <span className="font-medium">{error.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {error.count} occurrences
                      </span>
                      {error.severity === 'high' && (
                        <AlertCircleIcon className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Users and projects by region</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.geographicDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#8B5CF6" name="Users" />
                  <Bar dataKey="projects" fill="#3B82F6" name="Projects" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}