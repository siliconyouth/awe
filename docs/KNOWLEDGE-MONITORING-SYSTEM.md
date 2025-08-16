# AWE Knowledge Monitoring System - Architecture Design

## 🎯 Overview

A comprehensive knowledge management system that continuously monitors web sources, tracks changes, maintains version history, and uses AI to extract, categorize, and refine knowledge for AWE.

## 🏗️ Architecture for Vercel Deployment

```mermaid
graph TB
    subgraph "Vercel Frontend"
        A[Admin Panel] --> B[Source Management UI]
        B --> C[Approval Dashboard]
        C --> D[Knowledge Explorer]
    end
    
    subgraph "Vercel API Routes"
        E[/api/sources] --> F[Source CRUD]
        G[/api/monitor] --> H[Check Changes]
        I[/api/analyze] --> J[AI Analysis]
        K[/api/approve] --> L[Human Review]
    end
    
    subgraph "Background Jobs"
        M[Vercel Cron] --> N[Monitor Schedule]
        N --> O[Change Detection]
        O --> P[Scrape & Version]
    end
    
    subgraph "External Services"
        Q[Supabase DB] --> R[Versions Storage]
        S[Upstash Queue] --> T[Job Processing]
        U[Browserless] --> V[Headless Scraping]
        W[OpenAI/Claude] --> X[Content Analysis]
    end
    
    subgraph "Storage"
        Y[Vector DB] --> Z[Embeddings]
        AA[S3/R2] --> AB[Content Archive]
    end
```

## 📦 Database Schema Extension

```prisma
// Add to existing schema.prisma

model KnowledgeSource {
  id          String   @id @default(cuid())
  url         String   @unique
  name        String
  description String?
  context     String?  // Custom context for AI analysis
  
  // Monitoring settings
  checkFrequency   CheckFrequency @default(DAILY)
  lastChecked      DateTime?
  lastChanged      DateTime?
  contentHash      String?
  
  // Categorization
  category         String
  tags             String[]
  importance       Int @default(5) // 1-10 scale
  
  // Extraction settings
  selectors        Json?     // CSS selectors for specific content
  extractionRules  Json?     // Custom extraction rules
  aiPrompt         String?   // Custom AI analysis prompt
  
  // Status
  status           SourceStatus @default(ACTIVE)
  errorCount       Int @default(0)
  lastError        String?
  
  versions         KnowledgeVersion[]
  patterns         ExtractedPattern[]
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model KnowledgeVersion {
  id          String   @id @default(cuid())
  sourceId    String
  source      KnowledgeSource @relation(fields: [sourceId], references: [id])
  
  // Version info
  version     Int      // Auto-incrementing version number
  timestamp   DateTime @default(now())
  
  // Content
  rawContent  String   @db.Text
  markdown    String   @db.Text
  summary     String?  @db.Text
  
  // Metadata
  title       String
  wordCount   Int
  links       String[]
  images      String[]
  
  // Change detection
  changeType  ChangeType? // MAJOR, MINOR, PATCH
  changelog   String?     // What changed
  
  // Storage
  s3Key       String?     // For large content
  
  @@unique([sourceId, version])
  @@index([sourceId, timestamp])
}

model ExtractedPattern {
  id          String   @id @default(cuid())
  sourceId    String
  source      KnowledgeSource @relation(fields: [sourceId], references: [id])
  versionId   String?
  
  // Pattern info
  type        PatternType
  name        String
  content     Json
  
  // AI Analysis
  aiAnalysis  Json?
  confidence  Float
  
  // Review status
  status      ReviewStatus @default(PENDING)
  approvedAt  DateTime?
  approvedBy  String?
  refinements Json?
  
  // Categorization
  category    String
  tags        String[]
  useCases    String[]
  
  // Embeddings for search
  embedding   Float[]? // Store vector embeddings
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([status])
  @@index([type, category])
}

enum CheckFrequency {
  HOURLY
  DAILY
  WEEKLY
  MONTHLY
}

enum SourceStatus {
  ACTIVE
  PAUSED
  ERROR
  ARCHIVED
}

enum ChangeType {
  MAJOR
  MINOR
  PATCH
}

enum PatternType {
  CODE_EXAMPLE
  CONFIGURATION
  SYSTEM_PROMPT
  BEST_PRACTICE
  USE_CASE
  API_PATTERN
  ERROR_PATTERN
  PERFORMANCE_TIP
  SECURITY_PRACTICE
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
  NEEDS_REFINEMENT
}
```

## 🚀 Implementation Components

### 1. Monitoring Service (`lib/monitoring/service.ts`)

```typescript
import { SmartScraper } from '@awe/ai'
import crypto from 'crypto'

export class KnowledgeMonitor {
  private scraper: SmartScraper
  
  async checkSource(source: KnowledgeSource): Promise<ChangeResult> {
    // Scrape current content
    const content = await this.scraper.scrape(source.url)
    
    // Calculate content hash
    const newHash = this.hashContent(content.content)
    
    // Check if changed
    if (newHash !== source.contentHash) {
      return {
        changed: true,
        content,
        newHash,
        changeType: this.detectChangeType(source, content)
      }
    }
    
    return { changed: false }
  }
  
  async processChange(source: KnowledgeSource, change: ChangeResult) {
    // Create new version
    const version = await this.createVersion(source, change.content)
    
    // Extract patterns with AI
    const patterns = await this.extractPatterns(
      change.content,
      source.aiPrompt || this.getDefaultPrompt(source.category)
    )
    
    // Store patterns for review
    await this.storePatterns(source, version, patterns)
    
    // Send notification for review
    await this.notifyForReview(source, version, patterns)
  }
  
  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex')
  }
}
```

### 2. AI Analysis Service (`lib/ai/analyzer.ts`)

```typescript
export class ContentAnalyzer {
  async analyze(content: ScrapedContent, context: AnalysisContext) {
    const prompt = `
    Analyze this content for AWE knowledge base:
    
    Context: ${context.description}
    Category: ${context.category}
    
    Extract:
    1. Code examples with explanations
    2. Configuration patterns
    3. System prompts or templates
    4. Best practices
    5. Common use cases
    6. Performance tips
    7. Security considerations
    
    Content:
    ${content.markdown}
    
    Return structured JSON with:
    - patterns: Array of extracted patterns
    - summary: Brief summary of key changes
    - tags: Relevant tags
    - importance: 1-10 rating
    - useCases: Practical applications
    `
    
    const analysis = await this.ai.analyze(prompt)
    return this.parseAnalysis(analysis)
  }
  
  async refinePattern(pattern: ExtractedPattern, feedback: string) {
    const prompt = `
    Refine this extracted pattern based on feedback:
    
    Pattern: ${JSON.stringify(pattern)}
    Feedback: ${feedback}
    
    Improve:
    1. Clarity and completeness
    2. Practical applicability
    3. Integration with AWE
    4. Documentation quality
    `
    
    return await this.ai.refine(prompt)
  }
}
```

### 3. Admin Panel (`app/admin/page.tsx`)

```tsx
export default function KnowledgeAdmin() {
  return (
    <div className="p-6">
      <Tabs defaultValue="sources">
        <TabsList>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="review">Review Queue</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sources">
          <SourceManager />
        </TabsContent>
        
        <TabsContent value="review">
          <ReviewDashboard />
        </TabsContent>
        
        <TabsContent value="patterns">
          <PatternExplorer />
        </TabsContent>
        
        <TabsContent value="analytics">
          <ChangeAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 4. Source Manager Component

```tsx
function SourceManager() {
  const [sources, setSources] = useState<KnowledgeSource[]>([])
  
  return (
    <div className="space-y-6">
      {/* Add Source Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Knowledge Source</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <Input 
              placeholder="URL to monitor"
              name="url"
            />
            <Input 
              placeholder="Name"
              name="name"
            />
            <Textarea 
              placeholder="Context for AI analysis"
              name="context"
            />
            <Select name="category">
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="blog">Blog/Articles</SelectItem>
                <SelectItem value="api">API Reference</SelectItem>
                <SelectItem value="examples">Code Examples</SelectItem>
                <SelectItem value="changelog">Changelog</SelectItem>
              </SelectContent>
            </Select>
            <Select name="frequency">
              <SelectTrigger>
                <SelectValue placeholder="Check frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOURLY">Hourly</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Textarea 
              placeholder="Custom AI prompt (optional)"
              name="aiPrompt"
            />
            <Button type="submit">Add Source</Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Source List */}
      <Card>
        <CardHeader>
          <CardTitle>Monitored Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <SourceList sources={sources} />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 5. Review Dashboard

```tsx
function ReviewDashboard() {
  const [patterns, setPatterns] = useState<ExtractedPattern[]>([])
  const [selectedPattern, setSelectedPattern] = useState(null)
  
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Pattern Queue */}
      <div className="space-y-4">
        <h3>Pending Review</h3>
        {patterns.map(pattern => (
          <Card 
            key={pattern.id}
            className="cursor-pointer"
            onClick={() => setSelectedPattern(pattern)}
          >
            <CardHeader>
              <Badge>{pattern.type}</Badge>
              <CardTitle>{pattern.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {pattern.source.name} • {pattern.confidence}% confidence
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Pattern Detail & Actions */}
      {selectedPattern && (
        <Card>
          <CardHeader>
            <CardTitle>Review Pattern</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Content</Label>
              <CodeBlock>{selectedPattern.content}</CodeBlock>
            </div>
            
            <div>
              <Label>AI Analysis</Label>
              <pre className="text-sm">
                {JSON.stringify(selectedPattern.aiAnalysis, null, 2)}
              </pre>
            </div>
            
            <div>
              <Label>Refinement</Label>
              <Textarea 
                placeholder="Suggest improvements..."
                value={refinement}
                onChange={(e) => setRefinement(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="success"
                onClick={() => approvePattern(selectedPattern.id)}
              >
                Approve
              </Button>
              <Button 
                variant="warning"
                onClick={() => refinePattern(selectedPattern.id, refinement)}
              >
                Refine with AI
              </Button>
              <Button 
                variant="destructive"
                onClick={() => rejectPattern(selectedPattern.id)}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

### 6. Vercel Cron Jobs (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/monitor/hourly",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/monitor/daily",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/monitor/weekly",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

### 7. API Routes

```typescript
// app/api/monitor/[frequency]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { frequency: string } }
) {
  const sources = await db.knowledgeSource.findMany({
    where: {
      checkFrequency: params.frequency.toUpperCase(),
      status: 'ACTIVE'
    }
  })
  
  // Queue monitoring jobs
  for (const source of sources) {
    await queue.push('monitor-source', { sourceId: source.id })
  }
  
  return Response.json({ 
    queued: sources.length,
    frequency: params.frequency 
  })
}

// app/api/sources/[id]/check/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const source = await db.knowledgeSource.findUnique({
    where: { id: params.id }
  })
  
  const monitor = new KnowledgeMonitor()
  const result = await monitor.checkSource(source)
  
  if (result.changed) {
    await monitor.processChange(source, result)
  }
  
  return Response.json(result)
}
```

## 🔄 Workflow

1. **Source Addition**
   - Admin adds URL with context
   - Sets monitoring frequency
   - Defines extraction rules

2. **Continuous Monitoring**
   - Cron jobs trigger checks
   - SmartScraper fetches content
   - System detects changes via hash

3. **Version Control**
   - Every change creates new version
   - Maintains complete history
   - Tracks change types (major/minor)

4. **AI Analysis**
   - Extracts patterns automatically
   - Categorizes content
   - Generates embeddings for search

5. **Human Review**
   - Admin reviews extracted patterns
   - Can refine with AI assistance
   - Approves for knowledge base

6. **Knowledge Utilization**
   - Vector search across versions
   - Semantic similarity matching
   - Trend analysis over time
   - Integration with AWE commands

## 🚀 Deployment on Vercel

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Queue (Upstash)
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...

# Storage (S3/R2)
S3_BUCKET=awe-knowledge
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# Scraping Service (Browserless)
BROWSERLESS_API_KEY=...
BROWSERLESS_URL=https://...

# Vector DB (Pinecone/Weaviate)
VECTOR_DB_URL=...
VECTOR_DB_API_KEY=...
```

### External Services Setup

1. **Browserless** (for Playwright in serverless)
   - Sign up at browserless.io
   - Get API key
   - No local browser needed

2. **Upstash** (job queue)
   - Create Redis database
   - Enable REST API
   - Set up queue

3. **Supabase** (existing DB)
   - Run migrations for new schema
   - Enable RLS policies

4. **S3/Cloudflare R2** (content storage)
   - Store large content versions
   - Archive historical data

5. **Pinecone/Weaviate** (vector search)
   - Store embeddings
   - Enable semantic search

## 📊 Features

### Version Comparison
```typescript
// Compare two versions
const diff = await compareVersions(v1, v2)
// Shows what changed, additions, deletions

// Track trending changes
const trends = await analyzeTrends(sourceId, timeRange)
// Identifies emerging patterns
```

### Semantic Search
```typescript
// Search across all knowledge
const results = await searchKnowledge({
  query: "Claude system prompts",
  similarity: 0.8,
  filters: {
    category: "prompts",
    status: "APPROVED"
  }
})
```

### Pattern Evolution
```typescript
// Track how patterns evolve
const evolution = await trackPatternEvolution(patternType)
// Shows how best practices change over time
```

## 🎯 Benefits

1. **Never Miss Updates** - Continuous monitoring
2. **Complete History** - All versions preserved
3. **AI-Powered** - Automatic extraction & analysis
4. **Human Oversight** - Review & refinement
5. **Searchable** - Vector & semantic search
6. **Trend Analysis** - See how knowledge evolves
7. **Vercel Native** - Serverless architecture
8. **Scalable** - Handles unlimited sources

This system transforms AWE into a living knowledge base that continuously learns and improves!