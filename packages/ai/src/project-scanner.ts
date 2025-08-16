import { readFile, readdir, stat } from 'fs/promises'
import { join, extname, relative } from 'path'
import { existsSync } from 'fs'

export interface FileInfo {
  path: string
  content: string
  size: number
  extension: string
  relativePath: string
}

export interface ProjectScanResult {
  files: FileInfo[]
  packageJson?: object
  dependencies?: string[]
  gitHistory?: string[]
  existingClaudeMd?: string
  existingMemory?: string
  totalFiles: number
  totalSize: number
  languages: string[]
  frameworks: string[]
}

export class ProjectScanner {
  private readonly IMPORTANT_EXTENSIONS = [
    '.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.java', '.cpp', '.c', '.cs',
    '.json', '.md', '.yml', '.yaml', '.toml', '.xml', '.html', '.css', '.scss',
    '.vue', '.svelte', '.astro', '.php', '.rb', '.swift', '.kt', '.dart'
  ]

  private readonly IGNORE_PATTERNS = [
    'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'target',
    'venv', '__pycache__', '.pytest_cache', 'coverage', '.coverage',
    'vendor', 'deps', '_build', '.elixir_ls', '.dart_tool'
  ]

  private readonly MAX_FILE_SIZE = 100000 // 100KB per file
  private readonly MAX_TOTAL_FILES = 50

  async scanProject(projectPath: string): Promise<ProjectScanResult> {
    const files: FileInfo[] = []
    let totalSize = 0
    const languages = new Set<string>()
    const frameworks = new Set<string>()

    // Scan for important files
    await this.scanDirectory(projectPath, projectPath, files, languages, frameworks)
    
    // Sort by importance and limit
    const sortedFiles = this.prioritizeFiles(files).slice(0, this.MAX_TOTAL_FILES)
    
    // Calculate total size
    totalSize = sortedFiles.reduce((sum, file) => sum + file.size, 0)

    // Load package.json if exists
    let packageJson: object | undefined
    let dependencies: string[] | undefined
    const packageJsonPath = join(projectPath, 'package.json')
    if (existsSync(packageJsonPath)) {
      try {
        const packageContent = await readFile(packageJsonPath, 'utf-8')
        packageJson = JSON.parse(packageContent)
        
        // Extract dependencies
        const pkg = packageJson as any
        dependencies = [
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys(pkg.devDependencies || {}),
          ...Object.keys(pkg.peerDependencies || {})
        ]

        // Detect frameworks from dependencies
        this.detectFrameworksFromDependencies(dependencies, frameworks)
      } catch (error) {
        console.warn('Failed to parse package.json:', error)
      }
    }

    // Load existing Claude files
    const existingClaudeMd = await this.loadFileIfExists(join(projectPath, 'CLAUDE.md'))
    const existingMemory = await this.loadFileIfExists(join(projectPath, 'MEMORY.md'))

    // Get git history
    const gitHistory = await this.getGitHistory(projectPath)

    return {
      files: sortedFiles,
      packageJson,
      dependencies,
      gitHistory,
      existingClaudeMd,
      existingMemory,
      totalFiles: files.length,
      totalSize,
      languages: Array.from(languages),
      frameworks: Array.from(frameworks)
    }
  }

  private async scanDirectory(
    dirPath: string, 
    rootPath: string, 
    files: FileInfo[], 
    languages: Set<string>,
    frameworks: Set<string>
  ): Promise<void> {
    try {
      const entries = await readdir(dirPath)
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry)
        const relativePath = relative(rootPath, fullPath)
        
        // Skip ignored patterns
        if (this.shouldIgnore(relativePath)) {
          continue
        }

        try {
          const stats = await stat(fullPath)
          
          if (stats.isDirectory()) {
            await this.scanDirectory(fullPath, rootPath, files, languages, frameworks)
          } else if (stats.isFile()) {
            const extension = extname(entry).toLowerCase()
            
            // Only include important file types
            if (this.IMPORTANT_EXTENSIONS.includes(extension)) {
              // Skip if file is too large
              if (stats.size > this.MAX_FILE_SIZE) {
                continue
              }

              const content = await readFile(fullPath, 'utf-8')
              
              files.push({
                path: fullPath,
                content,
                size: stats.size,
                extension,
                relativePath
              })

              // Track languages
              this.detectLanguage(extension, languages)
              
              // Detect frameworks from file content
              this.detectFrameworksFromContent(content, extension, frameworks)
            }
          }
        } catch (error) {
          // Skip files we can't read
          continue
        }
      }
    } catch (error) {
      // Skip directories we can't read
      return
    }
  }

  private shouldIgnore(path: string): boolean {
    return this.IGNORE_PATTERNS.some(pattern => 
      path.includes(pattern) || path.startsWith(pattern)
    )
  }

  private detectLanguage(extension: string, languages: Set<string>): void {
    const languageMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.js': 'JavaScript', 
      '.jsx': 'JavaScript',
      '.py': 'Python',
      '.rs': 'Rust',
      '.go': 'Go',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.dart': 'Dart',
      '.vue': 'Vue.js',
      '.svelte': 'Svelte'
    }

    if (languageMap[extension]) {
      languages.add(languageMap[extension])
    }
  }

  private detectFrameworksFromDependencies(dependencies: string[], frameworks: Set<string>): void {
    const frameworkMap: Record<string, string> = {
      'react': 'React',
      'next': 'Next.js',
      'vue': 'Vue.js',
      'nuxt': 'Nuxt.js',
      'angular': 'Angular',
      'svelte': 'Svelte',
      'express': 'Express.js',
      'fastify': 'Fastify',
      'koa': 'Koa.js',
      'nest': 'NestJS',
      'gatsby': 'Gatsby',
      'remix': 'Remix',
      'astro': 'Astro',
      'vite': 'Vite',
      'webpack': 'Webpack',
      'rollup': 'Rollup',
      'prisma': 'Prisma',
      'drizzle-orm': 'Drizzle',
      'mongoose': 'Mongoose',
      'sequelize': 'Sequelize',
      'tailwindcss': 'Tailwind CSS',
      'styled-components': 'Styled Components',
      'emotion': 'Emotion',
      'mui': 'Material-UI',
      'chakra-ui': 'Chakra UI'
    }

    for (const dep of dependencies) {
      for (const [key, framework] of Object.entries(frameworkMap)) {
        if (dep.includes(key)) {
          frameworks.add(framework)
        }
      }
    }
  }

  private detectFrameworksFromContent(content: string, extension: string, frameworks: Set<string>): void {
    // React patterns
    if (content.includes('import React') || content.includes('from "react"') || content.includes('jsx')) {
      frameworks.add('React')
    }
    
    // Next.js patterns
    if (content.includes('next/') || content.includes('getServerSideProps') || content.includes('getStaticProps')) {
      frameworks.add('Next.js')
    }
    
    // Vue patterns
    if (extension === '.vue' || content.includes('vue')) {
      frameworks.add('Vue.js')
    }
    
    // Express patterns
    if (content.includes('express()') || content.includes('app.get(') || content.includes('app.post(')) {
      frameworks.add('Express.js')
    }
    
    // Fastify patterns
    if (content.includes('fastify(') || content.includes('fastify.get(')) {
      frameworks.add('Fastify')
    }
  }

  private prioritizeFiles(files: FileInfo[]): FileInfo[] {
    return files.sort((a, b) => {
      // Priority scoring
      let scoreA = this.getFileScore(a)
      let scoreB = this.getFileScore(b)
      
      return scoreB - scoreA
    })
  }

  private getFileScore(file: FileInfo): number {
    let score = 0
    
    // Important files get higher scores
    const fileName = file.relativePath.toLowerCase()
    
    if (fileName.includes('package.json')) score += 100
    if (fileName.includes('tsconfig') || fileName.includes('jsconfig')) score += 90
    if (fileName.includes('next.config') || fileName.includes('vite.config')) score += 80
    if (fileName.includes('tailwind.config') || fileName.includes('webpack.config')) score += 70
    if (fileName.includes('readme') || fileName.includes('claude.md')) score += 60
    if (fileName.includes('index.') || fileName.includes('main.') || fileName.includes('app.')) score += 50
    
    // Source files in important directories
    if (file.relativePath.includes('src/')) score += 30
    if (file.relativePath.includes('pages/')) score += 25
    if (file.relativePath.includes('components/')) score += 20
    if (file.relativePath.includes('utils/') || file.relativePath.includes('lib/')) score += 15
    
    // File type preferences
    const ext = file.extension
    if (['.ts', '.tsx'].includes(ext)) score += 15
    if (['.js', '.jsx'].includes(ext)) score += 10
    if (['.vue', '.svelte'].includes(ext)) score += 12
    if (ext === '.json') score += 8
    if (ext === '.md') score += 5
    
    // Penalize large files slightly
    if (file.size > 50000) score -= 5
    if (file.size > 20000) score -= 2
    
    return score
  }

  private async loadFileIfExists(filePath: string): Promise<string | undefined> {
    try {
      if (existsSync(filePath)) {
        return await readFile(filePath, 'utf-8')
      }
    } catch (error) {
      // File doesn't exist or can't be read
    }
    return undefined
  }

  private async getGitHistory(projectPath: string): Promise<string[] | undefined> {
    try {
      const { execSync } = await import('child_process')
      const output = execSync('git log --oneline -10', { 
        cwd: projectPath, 
        encoding: 'utf-8',
        timeout: 5000
      })
      return output.trim().split('\n').filter(line => line.length > 0)
    } catch (error) {
      // Git not available or not a git repo
      return undefined
    }
  }
}