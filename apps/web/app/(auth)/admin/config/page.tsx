/**
 * Configuration Management Admin Page
 * 
 * Visual interface for managing AWE configuration
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Switch } from '../../../../components/ui/switch'
import { Textarea } from '../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { PageContainer } from '../../../../components/layout/page-container'
import { PageHeader } from '../../../../components/layout/page-header'
import { designSystem, cn } from '../../../../lib/design-system'
import { useToast } from '../../../../hooks/use-toast'
import { Loader2, Save, Download, Upload, RefreshCw, Settings, Database, Globe, Shield, Brain, AlertTriangle } from 'lucide-react'
import type { 
  ConfigSection, 
  SystemConfig,
  AppConfigSectionProps,
  ScraperConfigSectionProps,
  KnowledgeConfigSectionProps,
  ApiConfigSectionProps,
  AuthConfigSectionProps,
  FeaturesConfigSectionProps
} from '../../../../types/config'

// Default configuration structure
const getDefaultConfig = (): SystemConfig => ({
  app: {
    name: 'AWE Platform',
    version: '2.5.0',
    debug: false,
    logging: {
      level: 'info',
      format: 'json'
    },
    metrics: {
      enabled: false
    }
  },
  scraper: {
    engine: {
      defaultEngine: 'auto',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000
    },
    rateLimit: {
      enabled: true,
      default: {
        requests: 10,
        window: 60000
      }
    },
    proxy: {
      enabled: false,
      rotation: {
        enabled: false
      }
    }
  },
  knowledge: {
    monitoring: {
      enabled: false,
      intervals: {
        hourly: 3600000,
        daily: 86400000
      }
    },
    moderation: {
      enabled: false,
      provider: 'anthropic'
    },
    processing: {
      enrichment: {
        enabled: false
      },
      transformation: {
        toMarkdown: true
      }
    }
  },
  api: {
    port: 3000,
    timeout: {
      request: 10000
    },
    cors: {
      enabled: true,
      origins: ['*']
    },
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000
    }
  },
  auth: {
    provider: 'clerk',
    clerk: {
      signInUrl: '/sign-in',
      signUpUrl: '/sign-up',
      afterSignInUrl: '/dashboard',
      afterSignUpUrl: '/projects'
    },
    session: {
      maxAge: 86400000,
      sameSite: 'lax',
      secure: true,
      httpOnly: true
    }
  },
  features: {
    flags: {
      'advanced-scraping': false,
      'distributed-crawling': false,
      'ai-moderation': false,
      'pattern-extraction': true,
      'hot-reloading': false,
      'metrics-collection': false,
      'email-notifications': false,
      'webhook-integration': false
    }
  }
})

const configSections: ConfigSection[] = [
  {
    id: 'app',
    title: 'Application',
    icon: Settings,
    description: 'Core application settings and environment configuration'
  },
  {
    id: 'scraper',
    title: 'Scraper',
    icon: Globe,
    description: 'Web scraping engine, proxy, and extraction settings'
  },
  {
    id: 'knowledge',
    title: 'Knowledge Base',
    icon: Brain,
    description: 'Content sources, monitoring, and moderation settings'
  },
  {
    id: 'api',
    title: 'API',
    icon: Database,
    description: 'API endpoints, rate limiting, and CORS configuration'
  },
  {
    id: 'auth',
    title: 'Authentication',
    icon: Shield,
    description: 'Authentication providers and security settings'
  },
  {
    id: 'features',
    title: 'Feature Flags',
    icon: Settings,
    description: 'Enable or disable features across the application'
  }
]

export default function ConfigPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('app')
  const [environment, setEnvironment] = useState('development')
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const { toast } = useToast()

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/config')
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.data || getDefaultConfig())
        setEnvironment(data.environment || 'development')
      } else if (response.status === 403) {
        // Permission denied - show default config in read-only mode
        setConfig(getDefaultConfig())
        setEnvironment('development')
        toast({
          title: 'Limited Access',
          description: 'Viewing configuration in read-only mode',
          variant: 'default'
        })
      } else {
        // Use default config on error
        setConfig(getDefaultConfig())
        setEnvironment('development')
      }
    } catch (error) {
      // Use default config on error
      setConfig(getDefaultConfig())
      setEnvironment('development')
      console.error('Config load error:', error)
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Load configuration
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const saveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Configuration saved',
          description: 'Changes have been applied successfully'
        })
        setUnsavedChanges(false)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error saving configuration',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const updateConfigValue = (path: string, value: unknown) => {
    const newConfig = { ...config }
    const keys = path.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let obj: any = newConfig
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in obj)) {
        obj[keys[i]] = {}
      }
      obj = obj[keys[i]]
    }
    
    obj[keys[keys.length - 1]] = value
    setConfig(newConfig)
    setUnsavedChanges(true)
  }

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `awe-config-${environment}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const imported = JSON.parse(text) as SystemConfig
      setConfig(imported)
      setUnsavedChanges(true)
      
      toast({
        title: 'Configuration imported',
        description: 'Review and save changes to apply'
      })
    } catch {
      toast({
        title: 'Import failed',
        description: 'Invalid configuration file',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className={cn(
            designSystem.animations.fadeIn,
            'flex flex-col items-center gap-4'
          )}>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading configuration...</p>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer className={cn(designSystem.animations.fadeIn)}>
      <PageHeader
        title="Configuration Management"
        description="Manage AWE system configuration across all services"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Configuration' }
        ]}
        actions={
          <div className={cn(
            'flex items-center gap-4',
            designSystem.animations.slideLeft
          )}>
            <Badge variant={environment === 'production' ? 'destructive' : 'secondary'} 
                   className={designSystem.components.badge.default}>
              {environment.toUpperCase()}
            </Badge>
            
            {unsavedChanges && (
              <Badge variant="destructive" className={cn(
                designSystem.components.badge.default,
                'animate-pulse'
              )}>
                Unsaved Changes
              </Badge>
            )}
          </div>
        }
      />

      {environment === 'production' && (
        <Alert className={cn(
          designSystem.components.card.default,
          designSystem.animations.slideUp,
          'mb-6 border-destructive/50 text-destructive'
        )}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Production Mode:</strong> Configuration changes are disabled for safety.
            Use environment variables or database settings to modify production configuration.
          </AlertDescription>
        </Alert>
      )}

      <div className={cn(
        'flex gap-4 mb-8',
        designSystem.animations.slideUp
      )}>
        <div className="relative">
          <div className={cn(
            'absolute -inset-2 rounded-lg opacity-25 blur',
            unsavedChanges && 'bg-gradient-to-r from-green-400 to-blue-500'
          )} />
          <Button 
            onClick={saveConfig} 
            disabled={saving || !unsavedChanges || environment === 'production'}
            className={cn(
              'relative',
              designSystem.animations.hover.lift
            )}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
        
        <Button variant="outline" onClick={loadConfig} className={designSystem.animations.hover.lift}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload
        </Button>
        
        <Button variant="outline" onClick={exportConfig} className={designSystem.animations.hover.lift}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        
        <label htmlFor="import-config">
          <Button variant="outline" asChild className={designSystem.animations.hover.lift}>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </span>
          </Button>
          <input
            id="import-config"
            type="file"
            accept=".json"
            className="hidden"
            onChange={importConfig}
          />
        </label>
      </div>

      <div className={cn(designSystem.animations.slideUp, 'delay-200')}>
        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className={cn(
            'grid grid-cols-6 w-full',
            designSystem.components.card.default,
            'p-1 h-auto'
          )}>
            {configSections.map(section => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className={cn(
                  'data-[state=active]:bg-background data-[state=active]:shadow-sm',
                  designSystem.animations.hover.lift,
                  'flex-col gap-1 px-3 py-3'
                )}
              >
                <section.icon className="h-4 w-4" />
                <span className="text-xs">{section.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="app" className={designSystem.animations.fadeIn}>
            <Card className={cn(
              designSystem.components.card.hover,
              'overflow-hidden'
            )}>
              <CardHeader className="relative">
                <div className={cn(
                  'absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 blur-xl',
                  'bg-gradient-to-br from-blue-400 to-purple-600'
                )} />
                <CardTitle className={cn(
                  designSystem.typography.heading[3],
                  'flex items-center gap-2'
                )}>
                  <Settings className="h-5 w-5" />
                  Application Configuration
                </CardTitle>
                <CardDescription>Core application settings and environment configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <AppConfigSection config={config?.app} onChange={updateConfigValue} />
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="scraper">
          <Card>
            <CardHeader>
              <CardTitle>Scraper Configuration</CardTitle>
              <CardDescription>Web scraping engine, proxy, and extraction settings</CardDescription>
            </CardHeader>
            <CardContent>
              <ScraperConfigSection config={config?.scraper} onChange={updateConfigValue} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Configuration</CardTitle>
              <CardDescription>Content sources, monitoring, and moderation settings</CardDescription>
            </CardHeader>
            <CardContent>
              <KnowledgeConfigSection config={config?.knowledge} onChange={updateConfigValue} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>API endpoints, rate limiting, and CORS configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <ApiConfigSection config={config?.api} onChange={updateConfigValue} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Configuration</CardTitle>
              <CardDescription>Authentication providers and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <AuthConfigSection config={config?.auth} onChange={updateConfigValue} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags Configuration</CardTitle>
              <CardDescription>Enable or disable features across the application</CardDescription>
            </CardHeader>
            <CardContent>
              <FeaturesConfigSection config={config?.features} onChange={updateConfigValue} />
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  )
}

// App Configuration Section
function AppConfigSection({ config, onChange }: AppConfigSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="app-name">Application Name</Label>
          <Input
            id="app-name"
            value={config?.name || ''}
            onChange={(e) => onChange('app.name', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="app-version">Version</Label>
          <Input
            id="app-version"
            value={config?.version || ''}
            onChange={(e) => onChange('app.version', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="log-level">Log Level</Label>
          <Select value={config?.logging?.level || 'info'} onValueChange={(v) => onChange('app.logging.level', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
              <SelectItem value="trace">Trace</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="log-format">Log Format</Label>
          <Select value={config?.logging?.format || 'pretty'} onValueChange={(v) => onChange('app.logging.format', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="pretty">Pretty</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="debug-mode"
          checked={config?.debug || false}
          onCheckedChange={(v) => onChange('app.debug', v)}
        />
        <Label htmlFor="debug-mode">Debug Mode</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="metrics-enabled"
          checked={config?.metrics?.enabled || false}
          onCheckedChange={(v) => onChange('app.metrics.enabled', v)}
        />
        <Label htmlFor="metrics-enabled">Enable Metrics</Label>
      </div>
    </div>
  )
}

// Scraper Configuration Section
function ScraperConfigSection({ config, onChange }: ScraperConfigSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Engine Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="default-engine">Default Engine</Label>
            <Select value={config?.engine?.defaultEngine || 'auto'} onValueChange={(v) => onChange('scraper.engine.defaultEngine', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="playwright">Playwright</SelectItem>
                <SelectItem value="puppeteer">Puppeteer</SelectItem>
                <SelectItem value="cheerio">Cheerio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="timeout">Timeout (ms)</Label>
            <Input
              id="timeout"
              type="number"
              value={config?.engine?.timeout || 30000}
              onChange={(e) => onChange('scraper.engine.timeout', parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <Label htmlFor="retries">Retries</Label>
            <Input
              id="retries"
              type="number"
              value={config?.engine?.retries || 3}
              onChange={(e) => onChange('scraper.engine.retries', parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <Label htmlFor="retry-delay">Retry Delay (ms)</Label>
            <Input
              id="retry-delay"
              type="number"
              value={config?.engine?.retryDelay || 1000}
              onChange={(e) => onChange('scraper.engine.retryDelay', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Rate Limiting</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rate-requests">Requests per Window</Label>
            <Input
              id="rate-requests"
              type="number"
              value={config?.rateLimit?.default?.requests || 10}
              onChange={(e) => onChange('scraper.rateLimit.default.requests', parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <Label htmlFor="rate-window">Window Size (ms)</Label>
            <Input
              id="rate-window"
              type="number"
              value={config?.rateLimit?.default?.window || 60000}
              onChange={(e) => onChange('scraper.rateLimit.default.window', parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors mt-4">
          <div className="space-y-0.5">
            <Label htmlFor="rate-enabled" className="text-base font-medium cursor-pointer">
              Enable Rate Limiting
            </Label>
            <p className="text-sm text-muted-foreground">
              Prevent overwhelming target servers with requests
            </p>
          </div>
          <Switch
            id="rate-enabled"
            checked={config?.rateLimit?.enabled || false}
            onCheckedChange={(v) => onChange('scraper.rateLimit.enabled', v)}
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Proxy Configuration</h3>
        <div className="flex items-center space-x-2">
          <Switch
            id="proxy-enabled"
            checked={config?.proxy?.enabled || false}
            onCheckedChange={(v) => onChange('scraper.proxy.enabled', v)}
          />
          <Label htmlFor="proxy-enabled">Enable Proxy</Label>
        </div>
        
        <div className="flex items-center space-x-2 mt-2">
          <Switch
            id="proxy-rotation"
            checked={config?.proxy?.rotation?.enabled || false}
            onCheckedChange={(v) => onChange('scraper.proxy.rotation.enabled', v)}
          />
          <Label htmlFor="proxy-rotation">Enable Proxy Rotation</Label>
        </div>
      </div>
    </div>
  )
}

// Knowledge Configuration Section
function KnowledgeConfigSection({ config, onChange }: KnowledgeConfigSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Monitoring Settings</h3>
        <div className="flex items-center space-x-2">
          <Switch
            id="monitoring-enabled"
            checked={config?.monitoring?.enabled || false}
            onCheckedChange={(v) => onChange('knowledge.monitoring.enabled', v)}
          />
          <Label htmlFor="monitoring-enabled">Enable Monitoring</Label>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="hourly-interval">Hourly Check (ms)</Label>
            <Input
              id="hourly-interval"
              type="number"
              value={config?.monitoring?.intervals?.hourly || 3600000}
              onChange={(e) => onChange('knowledge.monitoring.intervals.hourly', parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <Label htmlFor="daily-interval">Daily Check (ms)</Label>
            <Input
              id="daily-interval"
              type="number"
              value={config?.monitoring?.intervals?.daily || 86400000}
              onChange={(e) => onChange('knowledge.monitoring.intervals.daily', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">AI Moderation</h3>
        <div className="flex items-center space-x-2">
          <Switch
            id="moderation-enabled"
            checked={config?.moderation?.enabled || false}
            onCheckedChange={(v) => onChange('knowledge.moderation.enabled', v)}
          />
          <Label htmlFor="moderation-enabled">Enable AI Moderation</Label>
        </div>
        
        <div className="mt-4">
          <Label htmlFor="moderation-provider">AI Provider</Label>
          <Select value={config?.moderation?.provider || 'anthropic'} onValueChange={(v) => onChange('knowledge.moderation.provider', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">Anthropic Claude</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Content Processing</h3>
        <div className="flex items-center space-x-2">
          <Switch
            id="enrichment-enabled"
            checked={config?.processing?.enrichment?.enabled || false}
            onCheckedChange={(v) => onChange('knowledge.processing.enrichment.enabled', v)}
          />
          <Label htmlFor="enrichment-enabled">Enable Content Enrichment</Label>
        </div>
        
        <div className="flex items-center space-x-2 mt-2">
          <Switch
            id="markdown-conversion"
            checked={config?.processing?.transformation?.toMarkdown || true}
            onCheckedChange={(v) => onChange('knowledge.processing.transformation.toMarkdown', v)}
          />
          <Label htmlFor="markdown-conversion">Convert to Markdown</Label>
        </div>
      </div>
    </div>
  )
}

// API Configuration Section
function ApiConfigSection({ config, onChange }: ApiConfigSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="api-port">Port</Label>
          <Input
            id="api-port"
            type="number"
            value={config?.port || 3000}
            onChange={(e) => onChange('api.port', parseInt(e.target.value))}
          />
        </div>
        
        <div>
          <Label htmlFor="api-timeout">Timeout (ms)</Label>
          <Input
            id="api-timeout"
            type="number"
            value={config?.timeout?.request || 10000}
            onChange={(e) => onChange('api.timeout.request', parseInt(e.target.value))}
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">CORS Settings</h3>
        <div className="flex items-center space-x-2">
          <Switch
            id="cors-enabled"
            checked={config?.cors?.enabled || true}
            onCheckedChange={(v) => onChange('api.cors.enabled', v)}
          />
          <Label htmlFor="cors-enabled">Enable CORS</Label>
        </div>
        
        <div className="mt-4">
          <Label htmlFor="cors-origins">Allowed Origins</Label>
          <Textarea
            id="cors-origins"
            value={config?.cors?.origins?.join('\n') || '*'}
            onChange={(e) => onChange('api.cors.origins', e.target.value.split('\n').filter(Boolean))}
            placeholder="One origin per line"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Rate Limiting</h3>
        <div className="flex items-center space-x-2">
          <Switch
            id="api-rate-enabled"
            checked={config?.rateLimit?.enabled || true}
            onCheckedChange={(v) => onChange('api.rateLimit.enabled', v)}
          />
          <Label htmlFor="api-rate-enabled">Enable Rate Limiting</Label>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="api-rate-max">Max Requests</Label>
            <Input
              id="api-rate-max"
              type="number"
              value={config?.rateLimit?.maxRequests || 100}
              onChange={(e) => onChange('api.rateLimit.maxRequests', parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <Label htmlFor="api-rate-window">Window (ms)</Label>
            <Input
              id="api-rate-window"
              type="number"
              value={config?.rateLimit?.windowMs || 60000}
              onChange={(e) => onChange('api.rateLimit.windowMs', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Auth Configuration Section
function AuthConfigSection({ config, onChange }: AuthConfigSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="auth-provider">Authentication Provider</Label>
        <Select value={config?.provider || 'clerk'} onValueChange={(v) => onChange('auth.provider', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clerk">Clerk</SelectItem>
            <SelectItem value="auth0">Auth0</SelectItem>
            <SelectItem value="supabase">Supabase</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {config?.provider === 'clerk' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Clerk Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clerk-signin">Sign In URL</Label>
              <Input
                id="clerk-signin"
                value={config?.clerk?.signInUrl || '/sign-in'}
                onChange={(e) => onChange('auth.clerk.signInUrl', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="clerk-signup">Sign Up URL</Label>
              <Input
                id="clerk-signup"
                value={config?.clerk?.signUpUrl || '/sign-up'}
                onChange={(e) => onChange('auth.clerk.signUpUrl', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="clerk-after-signin">After Sign In URL</Label>
              <Input
                id="clerk-after-signin"
                value={config?.clerk?.afterSignInUrl || '/dashboard'}
                onChange={(e) => onChange('auth.clerk.afterSignInUrl', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="clerk-after-signup">After Sign Up URL</Label>
              <Input
                id="clerk-after-signup"
                value={config?.clerk?.afterSignUpUrl || '/dashboard'}
                onChange={(e) => onChange('auth.clerk.afterSignUpUrl', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Session Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="session-maxage">Max Age (ms)</Label>
            <Input
              id="session-maxage"
              type="number"
              value={config?.session?.maxAge || 86400000}
              onChange={(e) => onChange('auth.session.maxAge', parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <Label htmlFor="session-samesite">Same Site</Label>
            <Select value={config?.session?.sameSite || 'lax'} onValueChange={(v) => onChange('auth.session.sameSite', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lax">Lax</SelectItem>
                <SelectItem value="strict">Strict</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <Switch
            id="session-secure"
            checked={config?.session?.secure || true}
            onCheckedChange={(v) => onChange('auth.session.secure', v)}
          />
          <Label htmlFor="session-secure">Secure Cookies</Label>
        </div>
        
        <div className="flex items-center space-x-2 mt-2">
          <Switch
            id="session-httponly"
            checked={config?.session?.httpOnly || true}
            onCheckedChange={(v) => onChange('auth.session.httpOnly', v)}
          />
          <Label htmlFor="session-httponly">HTTP Only Cookies</Label>
        </div>
      </div>
    </div>
  )
}

// Features Configuration Section
function FeaturesConfigSection({ config, onChange }: FeaturesConfigSectionProps) {
  const features = config?.flags || {}
  const featureList = [
    { key: 'advanced-scraping', label: 'Advanced Scraping', description: 'Enable PDF, OCR, and WebSocket scraping' },
    { key: 'distributed-crawling', label: 'Distributed Crawling', description: 'Enable multi-worker crawling with Redis' },
    { key: 'ai-moderation', label: 'AI Moderation', description: 'Enable AI-powered content moderation' },
    { key: 'pattern-extraction', label: 'Pattern Extraction', description: 'Automatically extract patterns from content' },
    { key: 'hot-reloading', label: 'Hot Reloading', description: 'Enable configuration hot-reloading' },
    { key: 'metrics-collection', label: 'Metrics Collection', description: 'Collect performance and usage metrics' },
    { key: 'email-notifications', label: 'Email Notifications', description: 'Send email alerts and reports' },
    { key: 'webhook-integration', label: 'Webhook Integration', description: 'Enable webhook event notifications' },
  ]
  
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Enable or disable features across the application. Changes take effect immediately.
        </p>
      </div>
      
      {featureList.map(feature => (
        <Card key={feature.key}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex-1">
              <div className="font-medium">{feature.label}</div>
              <div className="text-sm text-muted-foreground">{feature.description}</div>
            </div>
            <Switch
              checked={features[feature.key] || false}
              onCheckedChange={(v) => onChange(`features.flags.${feature.key}`, v)}
            />
          </CardContent>
        </Card>
      ))}
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Custom Feature Flags</h3>
        <div className="text-sm text-muted-foreground mb-4">
          Add custom feature flags as needed
        </div>
        <Textarea
          value={JSON.stringify(features, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              onChange('features.flags', parsed)
            } catch {
              // Invalid JSON, ignore
            }
          }}
          className="font-mono"
          rows={10}
        />
      </div>
    </div>
  )
}