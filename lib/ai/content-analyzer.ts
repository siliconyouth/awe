import { ScrapedPage } from '@awe/ai'
import { AIAnalysisService } from '../monitoring/knowledge-monitor'

export interface AnalysisContext {
  description?: string
  category: string
  extractionRules?: any
  aiPrompt?: string
}

export interface ExtractedPattern {
  type: string
  name: string
  content: any
  aiAnalysis?: any
  confidence: number
  category?: string
  tags?: string[]
  useCases?: string[]
}

export interface AnalysisResult {
  patterns: ExtractedPattern[]
  summary: string
  tags: string[]
  importance: number
  useCases: string[]
}

export class ContentAnalyzer implements AIAnalysisService {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = 'gpt-4-turbo-preview') {
    this.apiKey = apiKey
    this.model = model
  }

  async analyze(content: ScrapedPage, options: any): Promise<AnalysisResult> {
    const prompt = options.prompt || this.getDefaultPrompt(options.category)
    
    const systemPrompt = `You are an expert at analyzing web content and extracting valuable patterns for a knowledge base.
    Focus on practical, actionable patterns that can be used in real applications.
    Return your analysis as valid JSON matching the specified structure.`

    const userPrompt = `
    ${prompt}
    
    Context: ${options.context || ''}
    Category: ${options.category}
    ${options.extractionRules ? `Extraction Rules: ${JSON.stringify(options.extractionRules)}` : ''}
    
    Content to analyze:
    Title: ${content.title}
    URL: ${content.url}
    Content:
    ${content.markdown || content.content}
    
    Return a JSON object with this structure:
    {
      "patterns": [
        {
          "type": "CODE_EXAMPLE|CONFIGURATION|SYSTEM_PROMPT|BEST_PRACTICE|USE_CASE|API_PATTERN|ERROR_PATTERN|PERFORMANCE_TIP|SECURITY_PRACTICE",
          "name": "Short descriptive name",
          "content": "The actual pattern content (code, config, text, etc)",
          "aiAnalysis": {
            "description": "What this pattern does",
            "when_to_use": "When to apply this pattern",
            "benefits": ["benefit1", "benefit2"],
            "caveats": ["caveat1", "caveat2"],
            "related": ["related pattern or concept"]
          },
          "confidence": 0.0-1.0,
          "category": "specific category",
          "tags": ["tag1", "tag2"],
          "useCases": ["use case 1", "use case 2"]
        }
      ],
      "summary": "Brief summary of key findings",
      "tags": ["relevant", "tags"],
      "importance": 1-10,
      "useCases": ["practical", "applications"]
    }`

    try {
      const response = await this.callAI(systemPrompt, userPrompt)
      const result = JSON.parse(response)
      
      // Validate and clean the response
      return this.validateAnalysisResult(result)
    } catch (error) {
      console.error('AI analysis failed:', error)
      return this.getFallbackAnalysis(content)
    }
  }

  async summarize(content: string): Promise<string> {
    const prompt = `Summarize the following content in 2-3 sentences, focusing on the key information and main points:

    ${content.substring(0, 5000)}`

    try {
      return await this.callAI(
        'You are a concise summarizer. Provide brief, informative summaries.',
        prompt
      )
    } catch (error) {
      // Fallback to simple truncation
      return content.substring(0, 500) + '...'
    }
  }

  async generateChangelog(oldContent: string, newContent: string): Promise<string> {
    const prompt = `Compare these two versions of content and describe what changed:

    OLD VERSION:
    ${oldContent.substring(0, 3000)}

    NEW VERSION:
    ${newContent.substring(0, 3000)}

    Provide a concise changelog entry describing:
    1. What was added
    2. What was removed
    3. What was modified
    4. The significance of these changes`

    try {
      return await this.callAI(
        'You are a technical writer creating clear, concise changelogs.',
        prompt
      )
    } catch (error) {
      return `Content updated on ${new Date().toISOString()}`
    }
  }

  async refinePattern(pattern: ExtractedPattern, feedback: string): Promise<ExtractedPattern> {
    const prompt = `Refine this extracted pattern based on the feedback:

    Current Pattern:
    ${JSON.stringify(pattern, null, 2)}

    Feedback:
    ${feedback}

    Improve the pattern by:
    1. Making it more clear and complete
    2. Ensuring practical applicability
    3. Adding missing context or details
    4. Improving the documentation quality

    Return the refined pattern in the same JSON structure.`

    try {
      const response = await this.callAI(
        'You are an expert at refining and improving technical patterns.',
        prompt
      )
      const refined = JSON.parse(response)
      return { ...pattern, ...refined }
    } catch (error) {
      console.error('Pattern refinement failed:', error)
      return pattern
    }
  }

  private async callAI(systemPrompt: string, userPrompt: string): Promise<string> {
    // This is a placeholder - implement based on your AI provider
    // Could use OpenAI, Anthropic, or any other AI service
    
    if (this.model.startsWith('gpt')) {
      return this.callOpenAI(systemPrompt, userPrompt)
    } else if (this.model.startsWith('claude')) {
      return this.callAnthropic(systemPrompt, userPrompt)
    } else {
      throw new Error(`Unsupported model: ${this.model}`)
    }
  }

  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()
    return data.choices[0].message.content
  }

  private async callAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000
      })
    })

    const data = await response.json()
    return data.content[0].text
  }

  private validateAnalysisResult(result: any): AnalysisResult {
    // Ensure all required fields are present and valid
    return {
      patterns: Array.isArray(result.patterns) ? result.patterns.map(this.validatePattern) : [],
      summary: result.summary || '',
      tags: Array.isArray(result.tags) ? result.tags : [],
      importance: typeof result.importance === 'number' ? result.importance : 5,
      useCases: Array.isArray(result.useCases) ? result.useCases : []
    }
  }

  private validatePattern(pattern: any): ExtractedPattern {
    return {
      type: pattern.type || 'BEST_PRACTICE',
      name: pattern.name || 'Unnamed Pattern',
      content: pattern.content || '',
      aiAnalysis: pattern.aiAnalysis || {},
      confidence: typeof pattern.confidence === 'number' ? pattern.confidence : 0.7,
      category: pattern.category,
      tags: Array.isArray(pattern.tags) ? pattern.tags : [],
      useCases: Array.isArray(pattern.useCases) ? pattern.useCases : []
    }
  }

  private getFallbackAnalysis(content: ScrapedPage): AnalysisResult {
    // Basic fallback analysis without AI
    return {
      patterns: [{
        type: 'BEST_PRACTICE',
        name: content.title || 'Content from ' + content.url,
        content: content.markdown || content.content.substring(0, 1000),
        confidence: 0.5,
        tags: [],
        useCases: []
      }],
      summary: `Content from ${content.url}`,
      tags: [],
      importance: 5,
      useCases: []
    }
  }

  private getDefaultPrompt(category: string): string {
    const prompts: Record<string, string> = {
      documentation: `
        Extract technical documentation patterns including:
        - API usage examples with complete code
        - Configuration patterns with explanations
        - Best practices with rationale
        - Common pitfalls and how to avoid them
        - Integration guides with step-by-step instructions
      `,
      blog: `
        Extract insights and patterns from blog content:
        - Key concepts with clear explanations
        - Code examples that demonstrate concepts
        - Tutorials broken into actionable steps
        - Tips and tricks with practical applications
        - Author recommendations and opinions
      `,
      api: `
        Extract API patterns:
        - Endpoint structures with parameters
        - Authentication methods and setup
        - Request/response formats with examples
        - Error handling patterns and status codes
        - Rate limiting information and strategies
      `,
      changelog: `
        Extract change information:
        - New features with usage examples
        - Breaking changes and migration paths
        - Bug fixes and their impact
        - Deprecations with alternatives
        - Performance improvements
      `,
      prompts: `
        Extract prompt engineering patterns:
        - System prompts with use cases
        - Prompt templates with variables
        - Chain-of-thought examples
        - Few-shot learning examples
        - Prompt optimization techniques
      `,
      config: `
        Extract configuration patterns:
        - Configuration schemas and structures
        - Environment-specific settings
        - Security configurations
        - Performance tuning options
        - Integration configurations
      `
    }
    
    return prompts[category] || prompts.documentation
  }
}