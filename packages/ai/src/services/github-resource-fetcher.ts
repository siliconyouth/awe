/**
 * GitHub Resource Fetcher
 * Fetches resources from GitHub repositories for the Resource Hub
 */

import { Octokit } from '@octokit/rest'
import * as yaml from 'js-yaml'

export interface GitHubResource {
  name: string
  path: string
  content: string
  url: string
  repo: string
  author?: string
  authorGithub?: string
  license?: string
}

export class GitHubResourceFetcher {
  private octokit: Octokit
  
  constructor(authToken?: string) {
    this.octokit = new Octokit({
      auth: authToken || process.env.GITHUB_TOKEN
    })
  }
  
  /**
   * Fetch resources from awesome-claude-code repository
   */
  async fetchAwesomeClaudeCode(): Promise<GitHubResource[]> {
    console.log('Fetching resources from awesome-claude-code...')
    const resources: GitHubResource[] = []
    
    try {
      // First, get the README to understand the structure
      const readme = await this.fetchFile(
        'hesreallyhim',
        'awesome-claude-code',
        'README.md'
      )
      
      if (readme) {
        // Parse the README to extract resource links
        const resourceLinks = this.parseAwesomeReadme(readme.content)
        
        // Fetch actual resource files from the repo
        const folders = [
          'slash-commands',
          'hooks',
          'workflows',
          'statusline',
          'tooling',
          'CLAUDE_files'
        ]
        
        for (const folder of folders) {
          try {
            const folderResources = await this.fetchFolder(
              'hesreallyhim',
              'awesome-claude-code',
              folder
            )
            resources.push(...folderResources)
          } catch (error) {
            console.warn(`Could not fetch folder ${folder}:`, error.message)
          }
        }
      }
      
      // Also fetch the CSV data if available
      const csvData = await this.fetchFile(
        'hesreallyhim',
        'awesome-claude-code',
        'THE_RESOURCES_TABLE.csv'
      )
      
      if (csvData) {
        const csvResources = this.parseResourcesCsv(csvData.content)
        // These are metadata about external resources, not the resources themselves
        // We'll use this to enrich our data
        console.log(`Found ${csvResources.length} resource references in CSV`)
      }
      
    } catch (error) {
      console.error('Error fetching awesome-claude-code:', error)
    }
    
    return resources
  }
  
  /**
   * Fetch a single file from GitHub
   */
  async fetchFile(
    owner: string,
    repo: string,
    path: string
  ): Promise<GitHubResource | null> {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      })
      
      if ('content' in response.data && response.data.type === 'file') {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8')
        
        return {
          name: response.data.name,
          path: response.data.path,
          content,
          url: response.data.html_url,
          repo: `${owner}/${repo}`,
          license: await this.getRepoLicense(owner, repo)
        }
      }
    } catch (error) {
      console.error(`Error fetching file ${path}:`, error.message)
    }
    
    return null
  }
  
  /**
   * Fetch all files from a folder
   */
  async fetchFolder(
    owner: string,
    repo: string,
    path: string
  ): Promise<GitHubResource[]> {
    const resources: GitHubResource[] = []
    
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      })
      
      if (Array.isArray(response.data)) {
        for (const item of response.data) {
          if (item.type === 'file') {
            const file = await this.fetchFile(owner, repo, item.path)
            if (file) {
              resources.push(file)
            }
          } else if (item.type === 'dir') {
            // Recursively fetch subdirectories
            const subResources = await this.fetchFolder(owner, repo, item.path)
            resources.push(...subResources)
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching folder ${path}:`, error.message)
    }
    
    return resources
  }
  
  /**
   * Get repository license
   */
  async getRepoLicense(owner: string, repo: string): Promise<string | undefined> {
    try {
      const response = await this.octokit.repos.get({
        owner,
        repo
      })
      
      return response.data.license?.spdx_id || response.data.license?.name
    } catch (error) {
      console.error(`Error fetching license:`, error.message)
      return undefined
    }
  }
  
  /**
   * Parse awesome-claude-code README to extract resource information
   */
  private parseAwesomeReadme(content: string): any[] {
    const resources = []
    
    // Parse markdown links that point to resources
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let match
    
    while ((match = linkRegex.exec(content)) !== null) {
      const [_, title, url] = match
      
      // Filter for relevant resource links
      if (url.includes('github.com') && !url.includes('awesome-claude-code')) {
        resources.push({
          title,
          url,
          type: this.inferTypeFromUrl(url)
        })
      }
    }
    
    return resources
  }
  
  /**
   * Parse the CSV file containing resource metadata
   */
  private parseResourcesCsv(content: string): any[] {
    const resources = []
    const lines = content.split('\n')
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Simple CSV parsing (might need more robust solution)
      const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
      
      if (parts.length >= 4) {
        resources.push({
          id: parts[0],
          name: parts[1],
          category: parts[2],
          url: parts[3],
          author: parts[4],
          description: parts[5]
        })
      }
    }
    
    return resources
  }
  
  /**
   * Infer resource type from URL
   */
  private inferTypeFromUrl(url: string): string {
    const urlLower = url.toLowerCase()
    
    if (urlLower.includes('command')) return 'command'
    if (urlLower.includes('hook')) return 'hook'
    if (urlLower.includes('workflow')) return 'workflow'
    if (urlLower.includes('template')) return 'template'
    if (urlLower.includes('claude.md')) return 'template'
    
    return 'guide'
  }
  
  /**
   * Fetch resources from any GitHub repository
   */
  async fetchFromRepo(
    owner: string,
    repo: string,
    paths?: string[]
  ): Promise<GitHubResource[]> {
    const resources: GitHubResource[] = []
    
    if (paths && paths.length > 0) {
      // Fetch specific paths
      for (const path of paths) {
        if (path.includes('**')) {
          // Handle glob patterns
          const basePath = path.split('**')[0]
          const folderResources = await this.fetchFolder(owner, repo, basePath)
          resources.push(...folderResources)
        } else if (path.endsWith('/')) {
          // Fetch folder
          const folderResources = await this.fetchFolder(owner, repo, path)
          resources.push(...folderResources)
        } else {
          // Fetch single file
          const file = await this.fetchFile(owner, repo, path)
          if (file) {
            resources.push(file)
          }
        }
      }
    } else {
      // Fetch common Claude-related files
      const commonPaths = [
        'CLAUDE.md',
        'claude.md',
        '.claude/config.yml',
        '.claude/commands',
        '.claude/hooks'
      ]
      
      for (const path of commonPaths) {
        const file = await this.fetchFile(owner, repo, path)
        if (file) {
          resources.push(file)
        }
      }
    }
    
    return resources
  }
}