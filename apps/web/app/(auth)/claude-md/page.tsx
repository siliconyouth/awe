'use client'

import { useState, useCallback, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Switch } from '../../../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import { toast } from '../../../hooks/use-toast'
import {
  FileText,
  Download,
  Eye,
  Save,
  Settings,
  FolderOpen,
  Sparkles,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  Code,
  GitBranch,
  Package,
  Terminal,
  Loader2,
  History,
  ChevronRight,
  Copy,
  FileDown
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Project {
  id: string
  name: string
  path: string
  type: string
  hasClaudeMd: boolean
  optimizationLevel: number
  updatedAt: string
}

interface GenerationOptions {
  usePatterns: boolean
  optimize: boolean
  includeSections: string[]
  excludeSections: string[]
  customInstructions: string
}

const SECTIONS = [
  { id: 'overview', label: 'Project Overview', icon: Info },
  { id: 'architecture', label: 'Architecture', icon: GitBranch },
  { id: 'patterns', label: 'Applied Patterns', icon: Sparkles },
  { id: 'guidelines', label: 'Development Guidelines', icon: FileText },
  { id: 'workflows', label: 'Workflows', icon: Terminal },
  { id: 'tools', label: 'Tools & Commands', icon: Package }
]

export default function ClaudeMdPage() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectPath, setProjectPath] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('generate')
  const [previewMode, setPreviewMode] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [outputPath, setOutputPath] = useState('CLAUDE.md')
  
  const [options, setOptions] = useState<GenerationOptions>({
    usePatterns: true,
    optimize: false,
    includeSections: [],
    excludeSections: [],
    customInstructions: ''
  })

  // Fetch existing projects
  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const generateClaudeMd = async () => {
    if (!projectPath && !selectedProject) {
      toast({
        title: 'Project Required',
        description: 'Please enter a project path or select a project',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      setGeneratedContent('')

      const response = await fetch('/api/claude-md/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: projectPath || selectedProject?.path,
          projectId: selectedProject?.id,
          usePatterns: options.usePatterns,
          customInstructions: options.customInstructions,
          includeSections: options.includeSections.length > 0 ? options.includeSections : undefined,
          excludeSections: options.excludeSections.length > 0 ? options.excludeSections : undefined,
          optimize: options.optimize
        })
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedContent(data.content)
        setActiveTab('preview')
        toast({
          title: 'CLAUDE.md Generated',
          description: `Applied ${data.metadata.patternsApplied} patterns to ${data.metadata.projectName}`
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate CLAUDE.md',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveClaudeMd = async () => {
    if (!generatedContent) return

    try {
      const response = await fetch('/api/claude-md/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: projectPath || selectedProject?.path,
          projectId: selectedProject?.id,
          outputPath,
          usePatterns: false // Skip regeneration, just save
        })
      })

      if (response.ok) {
        toast({
          title: 'File Saved',
          description: `CLAUDE.md saved to ${outputPath}`
        })
        setSaveDialogOpen(false)
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save CLAUDE.md file',
        variant: 'destructive'
      })
    }
  }

  const downloadClaudeMd = () => {
    if (!generatedContent) return

    const blob = new Blob([generatedContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CLAUDE-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Downloaded',
      description: 'CLAUDE.md downloaded successfully'
    })
  }

  const copyToClipboard = async () => {
    if (!generatedContent) return

    try {
      await navigator.clipboard.writeText(generatedContent)
      toast({
        title: 'Copied',
        description: 'CLAUDE.md content copied to clipboard'
      })
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      })
    }
  }

  const toggleSection = (sectionId: string) => {
    if (options.includeSections.includes(sectionId)) {
      setOptions(prev => ({
        ...prev,
        includeSections: prev.includeSections.filter(s => s !== sectionId)
      }))
    } else {
      setOptions(prev => ({
        ...prev,
        includeSections: [...prev.includeSections, sectionId],
        excludeSections: prev.excludeSections.filter(s => s !== sectionId)
      }))
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          CLAUDE.md Generator
        </h1>
        <p className="text-gray-600 mt-2">
          Generate optimized context files for Claude Code with AI-powered insights
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedContent}>
            Preview {generatedContent && <CheckCircle className="h-4 w-4 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Selection */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Selection</CardTitle>
                  <CardDescription>
                    Choose a project or enter a custom path
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recent Projects */}
                  {projects.length > 0 && (
                    <div>
                      <Label>Recent Projects</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {projects.slice(0, 4).map(project => (
                          <Button
                            key={project.id}
                            variant={selectedProject?.id === project.id ? 'default' : 'outline'}
                            className="justify-start"
                            onClick={() => {
                              setSelectedProject(project)
                              setProjectPath(project.path)
                              setOptions(prev => ({
                                ...prev,
                                optimize: project.hasClaudeMd
                              }))
                            }}
                          >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            <span className="truncate">{project.name}</span>
                            {project.hasClaudeMd && (
                              <Badge variant="secondary" className="ml-auto">
                                Has CLAUDE.md
                              </Badge>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Path */}
                  <div>
                    <Label htmlFor="projectPath">Project Path</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="projectPath"
                        placeholder="/path/to/your/project"
                        value={projectPath}
                        onChange={(e) => {
                          setProjectPath(e.target.value)
                          setSelectedProject(null)
                        }}
                      />
                      <Button variant="outline" size="icon">
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Custom Instructions */}
                  <div>
                    <Label htmlFor="customInstructions">
                      Custom Instructions (Optional)
                    </Label>
                    <Textarea
                      id="customInstructions"
                      placeholder="Add any specific instructions or context for CLAUDE.md generation..."
                      value={options.customInstructions}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        customInstructions: e.target.value
                      }))}
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Section Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Sections</CardTitle>
                  <CardDescription>
                    Choose which sections to include in your CLAUDE.md
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SECTIONS.map(section => {
                      const Icon = section.icon
                      const isIncluded = options.includeSections.length === 0 || 
                                        options.includeSections.includes(section.id)
                      
                      return (
                        <Button
                          key={section.id}
                          variant={isIncluded ? 'default' : 'outline'}
                          className="justify-start"
                          onClick={() => toggleSection(section.id)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {section.label}
                          {isIncluded && <CheckCircle className="h-4 w-4 ml-auto" />}
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Options */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generation Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="usePatterns">Use Patterns</Label>
                      <p className="text-xs text-gray-500">
                        Apply learned patterns from knowledge base
                      </p>
                    </div>
                    <Switch
                      id="usePatterns"
                      checked={options.usePatterns}
                      onCheckedChange={(checked) => setOptions(prev => ({
                        ...prev,
                        usePatterns: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="optimize">Optimize Existing</Label>
                      <p className="text-xs text-gray-500">
                        Enhance existing CLAUDE.md if found
                      </p>
                    </div>
                    <Switch
                      id="optimize"
                      checked={options.optimize}
                      onCheckedChange={(checked) => setOptions(prev => ({
                        ...prev,
                        optimize: checked
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={generateClaudeMd}
                disabled={loading || (!projectPath && !selectedProject)}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate CLAUDE.md
                  </>
                )}
              </Button>

              {/* Stats */}
              {selectedProject && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Project Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline">{selectedProject.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Optimization:</span>
                      <span>{(selectedProject.optimizationLevel * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Has CLAUDE.md:</span>
                      <span>{selectedProject.hasClaudeMd ? 'Yes' : 'No'}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          {generatedContent && (
            <div className="space-y-4">
              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button onClick={downloadClaudeMd} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={copyToClipboard} variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button onClick={() => setSaveDialogOpen(true)} variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save to Project
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    {previewMode ? (
                      <>
                        <Code className="h-4 w-4 mr-2" />
                        View Source
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Content */}
              <Card>
                <CardContent className="p-6">
                  {previewMode ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {generatedContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-[600px]">
                      {generatedContent}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Generation History</CardTitle>
              <CardDescription>
                Your recent CLAUDE.md generations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Generation history coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save CLAUDE.md</DialogTitle>
            <DialogDescription>
              Choose where to save the generated file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="outputPath">File Path</Label>
              <Input
                id="outputPath"
                value={outputPath}
                onChange={(e) => setOutputPath(e.target.value)}
                placeholder="CLAUDE.md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Relative to project root or absolute path
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveClaudeMd}>
              <Save className="h-4 w-4 mr-2" />
              Save File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}