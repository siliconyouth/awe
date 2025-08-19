/**
 * Legal Documents Management Page
 * 
 * Admin interface for managing Terms of Service, Privacy Policy, and other legal documents
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
// import { protectRoute } from '../../../../lib/auth/rbac' // Not used - page already protected by middleware
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table'
import { useToast } from '../../../../hooks/use-toast'
import { 
  FileText, 
  Shield, 
  Cookie, 
  Scale, 
  Globe,
  Edit, 
  Save, 
  Plus, 
  History,
  Check,
  AlertTriangle,
  Loader2,
  Eye,
  Copy
} from 'lucide-react'
// import { format } from 'date-fns'

// import { Editor } from '../../../../components/ui/editor'

interface LegalDocument {
  id: string
  type: 'terms' | 'privacy' | 'cookie' | 'gdpr' | 'ai-policy'
  version: string
  title: string
  content: string
  contentHtml?: string
  effectiveDate: string
  isActive: boolean
  language: string
  jurisdiction: string
  createdBy?: string
  updatedBy?: string
  approvedBy?: string
  approvalDate?: string
  previousVersionId?: string
  changeSummary?: string
  createdAt: string
  updatedAt: string
}

interface DocumentVersion {
  id: string
  version: string
  effectiveDate: string
  changeSummary?: string
  createdBy?: string
  createdAt: string
}

const DOCUMENT_TYPES = {
  terms: { label: 'Terms of Service', icon: Scale, color: 'blue' },
  privacy: { label: 'Privacy Policy', icon: Shield, color: 'green' },
  cookie: { label: 'Cookie Policy', icon: Cookie, color: 'yellow' },
  gdpr: { label: 'GDPR Notice', icon: Globe, color: 'purple' },
  'ai-policy': { label: 'AI Usage Policy', icon: FileText, color: 'pink' }
}

const JURISDICTIONS = [
  { value: 'global', label: 'Global' },
  { value: 'us', label: 'United States' },
  { value: 'eu', label: 'European Union' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' }
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' }
]

export default function LegalDocumentsPage() {
  // This page is already protected by middleware, but we can add additional checks if needed
  const [documents, setDocuments] = useState<LegalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('terms')
  const [editingDocument, setEditingDocument] = useState<LegalDocument | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null)
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const { toast } = useToast()

  const loadDocuments = useCallback(async () => {
    try {
      // In production, fetch from API
      // const response = await fetch('/api/admin/legal/documents')
      // const data = await response.json()
      // setDocuments(data.documents)
      
      // Mock data for now
      setDocuments([
        {
          id: '1',
          type: 'terms',
          version: '1.0.0',
          title: 'Terms of Service',
          content: 'Current terms content...',
          effectiveDate: '2025-01-16',
          isActive: true,
          language: 'en',
          jurisdiction: 'global',
          createdAt: '2025-01-16',
          updatedAt: '2025-01-16'
        },
        {
          id: '2',
          type: 'privacy',
          version: '1.0.0',
          title: 'Privacy Policy',
          content: 'Current privacy policy content...',
          effectiveDate: '2025-01-16',
          isActive: true,
          language: 'en',
          jurisdiction: 'global',
          createdAt: '2025-01-16',
          updatedAt: '2025-01-16'
        }
      ])
    } catch (error) {
      toast({
        title: 'Error loading documents',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const saveDocument = async () => {
    if (!editingDocument) return
    
    try {
      // Validate required fields
      if (!editingDocument.content || !editingDocument.effectiveDate) {
        toast({
          title: 'Validation error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        })
        return
      }

      // In production, save via API
      // const response = await fetch('/api/admin/legal/documents', {
      //   method: editingDocument.id ? 'PUT' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(editingDocument)
      // })

      toast({
        title: 'Document saved',
        description: 'Legal document has been updated successfully'
      })

      setShowEditor(false)
      setEditingDocument(null)
      loadDocuments()
    } catch (error) {
      toast({
        title: 'Error saving document',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    }
  }

  const activateDocument = async (document: LegalDocument) => {
    try {
      // In production, activate via API
      toast({
        title: 'Document activated',
        description: `${DOCUMENT_TYPES[document.type].label} v${document.version} is now active`
      })
      loadDocuments()
    } catch (error) {
      toast({
        title: 'Error activating document',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    }
  }

  const loadVersionHistory = async (document: LegalDocument) => {
    try {
      // In production, fetch from API
      // const response = await fetch(`/api/admin/legal/documents/${document.id}/versions`)
      // const data = await response.json()
      // setVersions(data.versions)
      
      // Mock data
      setVersions([
        {
          id: '1',
          version: '1.0.0',
          effectiveDate: '2025-01-16',
          changeSummary: 'Initial version',
          createdBy: 'Admin',
          createdAt: '2025-01-16'
        },
        {
          id: '2',
          version: '0.9.0',
          effectiveDate: '2025-01-01',
          changeSummary: 'Beta version',
          createdBy: 'Admin',
          createdAt: '2025-01-01'
        }
      ])
      
      setSelectedDocument(document)
      setShowVersionHistory(true)
    } catch (error) {
      toast({
        title: 'Error loading version history',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    }
  }

  // Currently unused - will implement when export functionality is needed
  // const exportDocument = (document: LegalDocument, format: 'md' | 'html' | 'pdf') => {
  //   // In production, generate export
  //   const blob = new Blob([document.content], { type: 'text/plain' })
  //   const url = URL.createObjectURL(blob)
  //   const a = window.document.createElement('a')
  //   a.href = url
  //   a.download = `${document.type}-${document.version}.${format}`
  //   a.click()
  //   URL.revokeObjectURL(url)
  // }

  const getDocumentsByType = (type: string) => {
    return documents.filter(doc => doc.type === type)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Scale className="h-8 w-8" />
          Legal Documents Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage Terms of Service, Privacy Policy, and compliance documents
        </p>
      </div>

      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Changes to legal documents should be reviewed by legal counsel before activation.
          Always maintain version history and provide notice to users for material changes.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(DOCUMENT_TYPES).map(([type, config]) => {
          const Icon = config.icon
          const activeDoc = documents.find(d => d.type === type && d.isActive)
          return (
            <Card key={type} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setActiveTab(type)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-5 w-5" />
                  {activeDoc && <Badge variant="secondary">v{activeDoc.version}</Badge>}
                </div>
                <p className="font-medium text-sm">{config.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeDoc ? `Active since ${new Date(activeDoc.effectiveDate).toLocaleDateString()}` : 'Not configured'}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          {Object.entries(DOCUMENT_TYPES).map(([type, config]) => (
            <TabsTrigger key={type} value={type}>
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(DOCUMENT_TYPES).map(type => (
          <TabsContent key={type} value={type}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES].label}</CardTitle>
                    <CardDescription>
                      Manage versions and translations
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setEditingDocument({
                      id: '',
                      type: type as 'terms' | 'privacy' | 'cookie' | 'gdpr' | 'ai-policy',
                      version: '1.0.0',
                      title: DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES].label,
                      content: '',
                      effectiveDate: new Date().toISOString().split('T')[0],
                      isActive: false,
                      language: 'en',
                      jurisdiction: 'global',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    })
                    setShowEditor(true)
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Version
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getDocumentsByType(type).map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.version}</TableCell>
                        <TableCell>
                          {LANGUAGES.find(l => l.value === doc.language)?.label}
                        </TableCell>
                        <TableCell>
                          {JURISDICTIONS.find(j => j.value === doc.jurisdiction)?.label}
                        </TableCell>
                        <TableCell>
                          {new Date(doc.effectiveDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {doc.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="outline">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" 
                                    onClick={() => {
                                      setEditingDocument(doc)
                                      setShowEditor(true)
                                    }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost"
                                    onClick={() => loadVersionHistory(doc)}>
                              <History className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!doc.isActive && (
                              <Button size="sm" variant="ghost"
                                      onClick={() => activateDocument(doc)}>
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Document Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDocument?.id ? 'Edit' : 'Create'} {editingDocument && DOCUMENT_TYPES[editingDocument.type].label}
            </DialogTitle>
            <DialogDescription>
              Edit the document content and metadata. Changes will be saved as a new version.
            </DialogDescription>
          </DialogHeader>
          
          {editingDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={editingDocument.version}
                    onChange={(e) => setEditingDocument({
                      ...editingDocument,
                      version: e.target.value
                    })}
                    placeholder="1.0.0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={editingDocument.language}
                    onValueChange={(value) => setEditingDocument({
                      ...editingDocument,
                      language: value
                    })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <Select 
                    value={editingDocument.jurisdiction}
                    onValueChange={(value) => setEditingDocument({
                      ...editingDocument,
                      jurisdiction: value
                    })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JURISDICTIONS.map(jur => (
                        <SelectItem key={jur.value} value={jur.value}>
                          {jur.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="effectiveDate">Effective Date</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={editingDocument.effectiveDate}
                    onChange={(e) => setEditingDocument({
                      ...editingDocument,
                      effectiveDate: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="changeSummary">Change Summary</Label>
                  <Input
                    id="changeSummary"
                    value={editingDocument.changeSummary || ''}
                    onChange={(e) => setEditingDocument({
                      ...editingDocument,
                      changeSummary: e.target.value
                    })}
                    placeholder="Brief description of changes"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="content">Document Content (Markdown)</Label>
                <Textarea
                  id="content"
                  value={editingDocument.content}
                  onChange={(e) => setEditingDocument({
                    ...editingDocument,
                    content: e.target.value
                  })}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Enter document content in Markdown format..."
                />
              </div>
              
              <Alert>
                <AlertDescription>
                  <strong>Tips:</strong> Use Markdown formatting. Headers with #, bold with **, lists with -, etc.
                  The content will be automatically formatted when displayed to users.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button onClick={saveDocument}>
              <Save className="h-4 w-4 mr-2" />
              Save Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              {selectedDocument && `${DOCUMENT_TYPES[selectedDocument.type].label} - ${selectedDocument.language}`}
            </DialogDescription>
          </DialogHeader>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map(version => (
                <TableRow key={version.id}>
                  <TableCell className="font-medium">{version.version}</TableCell>
                  <TableCell>{new Date(version.effectiveDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{version.changeSummary}</TableCell>
                  <TableCell>{version.createdBy}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  )
}