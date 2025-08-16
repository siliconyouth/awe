'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUpIcon, TrendingDownIcon, ActivityIcon, ClockIcon, LayersIcon, AlertCircleIcon } from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalSources: number
    activeSources: number
    totalVersions: number
    totalPatterns: number
    pendingReviews: number
    lastDayChanges: number
    lastWeekChanges: number
    errorRate: number
  }
  changeFrequency: Array<{
    date: string
    changes: number
    major: number
    minor: number
    patch: number
  }>
  sourceActivity: Array<{
    name: string
    changes: number
    patterns: number
    lastChange: string
  }>
  patternDistribution: Array<{
    type: string
    count: number
    approved: number
    pending: number
  }>
  errorSources: Array<{
    name: string
    errorCount: number
    lastError: string
  }>
}

export function ChangeAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch from an analytics endpoint
      // For now, we'll use mock data
      const mockData: AnalyticsData = {
        overview: {
          totalSources: 12,
          activeSources: 10,
          totalVersions: 156,
          totalPatterns: 234,
          pendingReviews: 18,
          lastDayChanges: 5,
          lastWeekChanges: 23,
          errorRate: 0.08
        },
        changeFrequency: [
          { date: '2024-01-15', changes: 3, major: 1, minor: 1, patch: 1 },
          { date: '2024-01-16', changes: 5, major: 0, minor: 2, patch: 3 },
          { date: '2024-01-17', changes: 2, major: 0, minor: 1, patch: 1 },
          { date: '2024-01-18', changes: 7, major: 2, minor: 3, patch: 2 },
          { date: '2024-01-19', changes: 4, major: 1, minor: 1, patch: 2 },
          { date: '2024-01-20', changes: 6, major: 0, minor: 4, patch: 2 },
          { date: '2024-01-21', changes: 3, major: 1, minor: 0, patch: 2 }
        ],
        sourceActivity: [
          { name: 'Next.js Docs', changes: 12, patterns: 45, lastChange: '2 hours ago' },
          { name: 'React Docs', changes: 8, patterns: 32, lastChange: '5 hours ago' },
          { name: 'Vercel Blog', changes: 15, patterns: 28, lastChange: '1 day ago' },
          { name: 'TypeScript Handbook', changes: 6, patterns: 24, lastChange: '2 days ago' },
          { name: 'AWS Documentation', changes: 9, patterns: 18, lastChange: '3 hours ago' }
        ],
        patternDistribution: [
          { type: 'CODE_EXAMPLE', count: 45, approved: 38, pending: 7 },
          { type: 'CONFIGURATION', count: 32, approved: 28, pending: 4 },
          { type: 'SYSTEM_PROMPT', count: 28, approved: 25, pending: 3 },
          { type: 'BEST_PRACTICE', count: 24, approved: 20, pending: 4 },
          { type: 'API_PATTERN', count: 18, approved: 15, pending: 3 }
        ],
        errorSources: [
          { name: 'Legacy API Docs', errorCount: 5, lastError: 'Connection timeout' },
          { name: 'Private Repository', errorCount: 3, lastError: 'Authentication failed' }
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground">
        No analytics data available
      </div>
    )
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Monitor your knowledge base activity</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.activeSources}/{data.overview.totalSources}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((data.overview.activeSources / data.overview.totalSources) * 100)}% monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Versions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {data.overview.totalVersions}
              <LayersIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {data.overview.pendingReviews}
              <ClockIcon className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Patterns awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Weekly Changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {data.overview.lastWeekChanges}
              {data.overview.lastWeekChanges > data.overview.lastDayChanges * 7 ? (
                <TrendingUpIcon className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDownIcon className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.overview.lastDayChanges} today
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Change Frequency</CardTitle>
            <CardDescription>
              Track content changes over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.changeFrequency}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="changes" stroke="#8884d8" name="Total" />
                <Line type="monotone" dataKey="major" stroke="#ff8042" name="Major" />
                <Line type="monotone" dataKey="minor" stroke="#00c49f" name="Minor" />
                <Line type="monotone" dataKey="patch" stroke="#ffbb28" name="Patch" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pattern Distribution</CardTitle>
            <CardDescription>
              Types of patterns extracted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.patternDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.type.split('_')[0]}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.patternDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Most Active Sources</CardTitle>
          <CardDescription>
            Sources with the most changes and patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.sourceActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="changes" fill="#8884d8" name="Changes" />
              <Bar dataKey="patterns" fill="#82ca9d" name="Patterns" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {data.errorSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircleIcon className="w-5 h-5 text-red-500" />
              Sources with Errors
            </CardTitle>
            <CardDescription>
              Sources that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.errorSources.map((source) => (
                <div key={source.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {source.lastError}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {source.errorCount} errors
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}