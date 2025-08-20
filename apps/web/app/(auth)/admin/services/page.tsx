'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
  Database,
  Search,
  Globe,
  Lock,
  Zap,
  Server,
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3
} from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'down' | 'unknown'
  latency?: number
  uptime?: number
  lastCheck?: string
  error?: string
  metrics?: {
    requests?: number
    errors?: number
    cacheHit?: number
    queueDepth?: number
  }
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical'
  services: ServiceStatus[]
  timestamp: string
}

export default function ServicesHealthDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealth = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/services/health')
      if (!response.ok) throw new Error('Failed to fetch health status')
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      console.error('Error fetching service health:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      operational: 'default',
      degraded: 'secondary',
      down: 'destructive',
      unknown: 'outline'
    }
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getServiceIcon = (name: string) => {
    const icons: Record<string, any> = {
      'Upstash Redis': Database,
      'Upstash Vector': Search,
      'Algolia Search': Search,
      'Browserless': Globe,
      'Clerk Auth': Lock,
      'Supabase': Database,
      'WebSocket': Wifi,
      'Edge Config': Zap,
      'Queue System': Server
    }
    
    const Icon = icons[name] || Activity
    return <Icon className="h-5 w-5" />
  }

  if (loading || !health) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading service health...</p>
        </div>
      </div>
    )
  }

  const operationalCount = health.services.filter(s => s.status === 'operational').length
  const healthPercentage = (operationalCount / health.services.length) * 100

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Service Health Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor the status of all integrated services
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <WifiOff className="h-4 w-4 mr-2" /> : <Wifi className="h-4 w-4 mr-2" />}
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealth}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            System Status
            {health.overall === 'healthy' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {health.overall === 'degraded' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
            {health.overall === 'critical' && <XCircle className="h-6 w-6 text-red-500" />}
          </CardTitle>
          <CardDescription>
            Last updated: {new Date(health.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Service Health</span>
                <span className="text-sm text-muted-foreground">
                  {operationalCount}/{health.services.length} Operational
                </span>
              </div>
              <Progress value={healthPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {health.services.filter(s => s.status === 'operational').length}
                </div>
                <div className="text-xs text-muted-foreground">Operational</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-500">
                  {health.services.filter(s => s.status === 'degraded').length}
                </div>
                <div className="text-xs text-muted-foreground">Degraded</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {health.services.filter(s => s.status === 'down').length}
                </div>
                <div className="text-xs text-muted-foreground">Down</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Services</TabsTrigger>
          <TabsTrigger value="core">Core</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="external">External</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {health.services.map((service) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="core" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {health.services
              .filter(s => ['Upstash Redis', 'Supabase', 'Clerk Auth', 'WebSocket'].includes(s.name))
              .map((service) => (
                <ServiceCard key={service.name} service={service} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {health.services
              .filter(s => ['Upstash Vector', 'Algolia Search'].includes(s.name))
              .map((service) => (
                <ServiceCard key={service.name} service={service} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="external" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {health.services
              .filter(s => ['Browserless', 'Edge Config', 'Queue System'].includes(s.name))
              .map((service) => (
                <ServiceCard key={service.name} service={service} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ServiceCard({ service }: { service: ServiceStatus }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getServiceIcon = (name: string) => {
    const icons: Record<string, any> = {
      'Upstash Redis': Database,
      'Upstash Vector': Search,
      'Algolia Search': Search,
      'Browserless': Globe,
      'Clerk Auth': Lock,
      'Supabase': Database,
      'WebSocket': Wifi,
      'Edge Config': Zap,
      'Queue System': Server
    }
    
    const Icon = icons[name] || Activity
    return <Icon className="h-5 w-5" />
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getServiceIcon(service.name)}
            <CardTitle className="text-base">{service.name}</CardTitle>
          </div>
          {getStatusIcon(service.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge 
            variant={
              service.status === 'operational' ? 'default' :
              service.status === 'degraded' ? 'secondary' :
              'destructive'
            }
          >
            {service.status}
          </Badge>
        </div>

        {service.latency !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Latency</span>
            <span className="text-sm font-medium">
              {service.latency}ms
              {service.latency < 100 && <TrendingDown className="inline h-3 w-3 ml-1 text-green-500" />}
              {service.latency > 500 && <TrendingUp className="inline h-3 w-3 ml-1 text-red-500" />}
            </span>
          </div>
        )}

        {service.uptime !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Uptime</span>
            <span className="text-sm font-medium">{service.uptime.toFixed(2)}%</span>
          </div>
        )}

        {service.metrics && (
          <div className="pt-2 border-t space-y-2">
            {service.metrics.requests !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Requests</span>
                <span className="text-xs">{service.metrics.requests.toLocaleString()}</span>
              </div>
            )}
            {service.metrics.errors !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Errors</span>
                <span className="text-xs text-red-500">{service.metrics.errors}</span>
              </div>
            )}
            {service.metrics.cacheHit !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Cache Hit</span>
                <span className="text-xs">{service.metrics.cacheHit}%</span>
              </div>
            )}
            {service.metrics.queueDepth !== undefined && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Queue Depth</span>
                <span className="text-xs">{service.metrics.queueDepth}</span>
              </div>
            )}
          </div>
        )}

        {service.error && (
          <div className="pt-2 border-t">
            <p className="text-xs text-red-500">{service.error}</p>
          </div>
        )}

        {service.lastCheck && (
          <div className="pt-2 border-t flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last check: {new Date(service.lastCheck).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}