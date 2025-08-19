'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Database, 
  Github, 
  Globe, 
  FileText, 
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Clock,
  Activity
} from 'lucide-react'

interface KnowledgeSource {
  id: string
  name: string
  type: string
  url: string
  lastScraped: string | null
  active: boolean
  reliability: number
}

interface ImportResult {
  success: boolean
  imported: number
  failed: number
  resources: any[]
  errors?: any[]
}

export default function AdminImportPage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([])
  const [selectedSource, setSelectedSource] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [fetchingPreview, setFetchingPreview] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewResources, setPreviewResources] = useState<any[]>([])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/admin/sources')
      const data = await response.json()
      setSources(data)
      if (data.length > 0 && !selectedSource) {
        setSelectedSource(data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error)
    }
  }

  const fetchPreview = async () => {
    if (!selectedSource) return
    
    setFetchingPreview(true)
    setPreviewResources([])
    
    try {
      const source = sources.find(s => s.id === selectedSource)
      if (!source) return
      
      // Simulate fetching resources from the source
      // In production, this would call the actual GitHub fetcher
      const mockResources = [
        {
          name: 'example-template.md',
          path: 'templates/example-template.md',
          type: 'template',
          description: 'Example CLAUDE.md template for Next.js projects'
        },
        {
          name: 'test-command.md',
          path: 'commands/test-command.md',
          type: 'command',
          description: 'Test-driven development slash command'
        },
        {
          name: 'performance-hook.sh',
          path: 'hooks/performance-hook.sh',
          type: 'hook',
          description: 'Pre-commit hook for performance optimization'
        }
      ]
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      setPreviewResources(mockResources)
    } catch (error) {
      console.error('Failed to fetch preview:', error)
    } finally {
      setFetchingPreview(false)
    }
  }

  const handleImport = async () => {
    if (!selectedSource || previewResources.length === 0) return
    
    setImporting(true)
    setProgress(0)
    setImportResult(null)
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      const response = await fetch('/api/resources/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: selectedSource,
          resources: previewResources.map(r => ({
            ...r,
            content: `# ${r.name}\n\n${r.description}\n\n\`\`\`\nExample content\n\`\`\``
          }))
        })
      })
      
      clearInterval(progressInterval)
      setProgress(100)
      
      const result = await response.json()
      setImportResult(result)
      
      // Clear preview after successful import
      if (result.success) {
        setPreviewResources([])
      }
    } catch (error) {
      console.error('Import failed:', error)
      setImportResult({
        success: false,
        imported: 0,
        failed: previewResources.length,
        resources: [],
        errors: [{ error: 'Import failed', message: error.message }]
      })
    } finally {
      setImporting(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const currentSource = sources.find(s => s.id === selectedSource)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Import Hub</h2>
        <p className="text-muted-foreground">
          Import resources from configured knowledge sources
        </p>
      </div>

      {/* Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Source</CardTitle>
          <CardDescription>
            Choose a knowledge source to import resources from
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    <div className="flex items-center gap-2">
                      {source.type === 'github' && <Github className="h-4 w-4" />}
                      {source.type === 'website' && <Globe className="h-4 w-4" />}
                      <span>{source.name}</span>
                      {source.active && (
                        <Badge variant="outline" className="ml-2">Active</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={fetchSources} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          {currentSource && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">URL:</span>
                <a 
                  href={currentSource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {currentSource.url}
                </a>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reliability:</span>
                <div className="flex items-center gap-2">
                  <Progress value={currentSource.reliability * 100} className="w-24" />
                  <span>{Math.round(currentSource.reliability * 100)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Scraped:</span>
                <span>
                  {currentSource.lastScraped 
                    ? new Date(currentSource.lastScraped).toLocaleString()
                    : 'Never'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Process */}
      <Tabs defaultValue="preview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preview">
            <FileText className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="mr-2 h-4 w-4" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          {/* Fetch Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Preview</CardTitle>
              <CardDescription>
                Preview resources available for import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={fetchPreview} 
                  disabled={!selectedSource || fetchingPreview}
                  className="w-full"
                >
                  {fetchingPreview ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching Resources...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Fetch Available Resources
                    </>
                  )}
                </Button>

                {previewResources.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Found {previewResources.length} resources
                    </div>
                    <div className="rounded-md border">
                      <div className="max-h-64 overflow-y-auto p-4 space-y-2">
                        {previewResources.map((resource, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-accent">
                            <div className="flex-1">
                              <div className="font-medium">{resource.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {resource.type} • {resource.path}
                              </div>
                            </div>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {importing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Importing resources...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                {previewResources.length > 0 && !importing && (
                  <Button 
                    onClick={handleImport}
                    className="w-full"
                    variant="default"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Import {previewResources.length} Resources
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Import Result */}
          {importResult && (
            <Alert variant={importResult.success ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {importResult.success ? 'Import Successful' : 'Import Failed'}
              </AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <div>Imported: {importResult.imported} resources</div>
                  {importResult.failed > 0 && (
                    <div>Failed: {importResult.failed} resources</div>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="text-sm text-red-500">
                      {importResult.errors.map((err, i) => (
                        <div key={i}>{err.resource}: {err.error}</div>
                      ))}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                Recent import operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Import history will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Source Monitoring</CardTitle>
              <CardDescription>
                Monitor source health and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Source monitoring data will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}