import * as fs from 'fs/promises'
import * as path from 'path'
import { glob } from 'glob'

export interface ProjectScanResult {
  name: string
  path: string
  type: string
  languages: string[]
  frameworks: string[]
  technologies: string[]
  fileCount: number
  structure: ProjectStructure
  dependencies: Record<string, string>
  scripts: Record<string, string>
  hasTests: boolean
  hasDocker: boolean
  hasCI: boolean
  hasClaudeMd: boolean
  existingClaudeMd?: string
  gitInfo?: {
    branch: string
    remoteUrl: string
    lastCommit: string
  }
}

export interface ProjectStructure {
  directories: string[]
  mainFiles: string[]
  configFiles: string[]
  testFiles: string[]
  depth: number
}

export class ProjectScanner {
  private projectPath: string
  private ignorePatterns = [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '.next/**',
    'coverage/**',
    '*.log',
    '.env*'
  ]

  constructor(projectPath: string) {
    this.projectPath = projectPath
  }

  /**
   * Perform a complete project scan
   */
  async scan(): Promise<ProjectScanResult> {
    const [
      packageJson,
      structure,
      languages,
      frameworks,
      hasTests,
      hasDocker,
      hasCI,
      claudeMd,
      gitInfo
    ] = await Promise.all([
      this.readPackageJson(),
      this.analyzeStructure(),
      this.detectLanguages(),
      this.detectFrameworks(),
      this.checkForTests(),
      this.checkForDocker(),
      this.checkForCI(),
      this.findClaudeMd(),
      this.getGitInfo()
    ])

    const technologies = this.extractTechnologies(packageJson, frameworks)
    
    return {
      name: packageJson?.name || path.basename(this.projectPath),
      path: this.projectPath,
      type: this.determineProjectType(packageJson, frameworks, structure),
      languages,
      frameworks,
      technologies,
      fileCount: await this.countFiles(),
      structure,
      dependencies: packageJson?.dependencies || {},
      scripts: packageJson?.scripts || {},
      hasTests,
      hasDocker,
      hasCI,
      hasClaudeMd: !!claudeMd,
      existingClaudeMd: claudeMd,
      gitInfo
    }
  }

  /**
   * Read and parse package.json
   */
  private async readPackageJson(): Promise<any> {
    try {
      const content = await fs.readFile(
        path.join(this.projectPath, 'package.json'),
        'utf-8'
      )
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  /**
   * Analyze project structure
   */
  private async analyzeStructure(): Promise<ProjectStructure> {
    const directories: Set<string> = new Set()
    const mainFiles: string[] = []
    const configFiles: string[] = []
    const testFiles: string[] = []
    
    const files = await glob('**/*', {
      cwd: this.projectPath,
      ignore: this.ignorePatterns,
      nodir: false
    })

    let maxDepth = 0

    for (const file of files) {
      const fullPath = path.join(this.projectPath, file)
      const stat = await fs.stat(fullPath).catch(() => null)
      
      if (stat?.isDirectory()) {
        directories.add(file)
        const depth = file.split(path.sep).length
        maxDepth = Math.max(maxDepth, depth)
      } else if (stat?.isFile()) {
        const basename = path.basename(file)
        
        // Categorize files
        if (basename.match(/\.(ts|tsx|js|jsx|py|java|go|rs)$/)) {
          if (file.includes('test') || file.includes('spec')) {
            testFiles.push(file)
          } else {
            mainFiles.push(file)
          }
        } else if (basename.match(/\.(json|yaml|yml|toml|ini|env|config\.)/) || 
                   basename === 'Dockerfile' || 
                   basename.startsWith('.')) {
          configFiles.push(file)
        }
      }
    }

    return {
      directories: Array.from(directories).sort(),
      mainFiles: mainFiles.slice(0, 100), // Limit to prevent huge arrays
      configFiles,
      testFiles,
      depth: maxDepth
    }
  }

  /**
   * Detect programming languages
   */
  private async detectLanguages(): Promise<string[]> {
    const languages = new Set<string>()
    
    const extensions = await glob('**/*.{ts,tsx,js,jsx,py,java,go,rs,cpp,c,cs,rb,php,swift}', {
      cwd: this.projectPath,
      ignore: this.ignorePatterns
    })

    for (const file of extensions) {
      const ext = path.extname(file).slice(1)
      switch (ext) {
        case 'ts':
        case 'tsx':
          languages.add('TypeScript')
          break
        case 'js':
        case 'jsx':
          languages.add('JavaScript')
          break
        case 'py':
          languages.add('Python')
          break
        case 'java':
          languages.add('Java')
          break
        case 'go':
          languages.add('Go')
          break
        case 'rs':
          languages.add('Rust')
          break
        case 'cpp':
        case 'c':
          languages.add('C/C++')
          break
        case 'cs':
          languages.add('C#')
          break
        case 'rb':
          languages.add('Ruby')
          break
        case 'php':
          languages.add('PHP')
          break
        case 'swift':
          languages.add('Swift')
          break
      }
    }

    return Array.from(languages)
  }

  /**
   * Detect frameworks
   */
  private async detectFrameworks(): Promise<string[]> {
    const frameworks = new Set<string>()
    const packageJson = await this.readPackageJson()

    if (packageJson) {
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      }

      // React/Next.js
      if (deps.react) frameworks.add('React')
      if (deps.next) frameworks.add('Next.js')
      if (deps.gatsby) frameworks.add('Gatsby')
      
      // Vue
      if (deps.vue || deps.nuxt) frameworks.add('Vue')
      if (deps.nuxt) frameworks.add('Nuxt')
      
      // Angular
      if (deps['@angular/core']) frameworks.add('Angular')
      
      // Backend
      if (deps.express) frameworks.add('Express')
      if (deps.fastify) frameworks.add('Fastify')
      if (deps.nestjs || deps['@nestjs/core']) frameworks.add('NestJS')
      if (deps.koa) frameworks.add('Koa')
      
      // Testing
      if (deps.jest) frameworks.add('Jest')
      if (deps.vitest) frameworks.add('Vitest')
      if (deps.mocha) frameworks.add('Mocha')
      if (deps.playwright) frameworks.add('Playwright')
      
      // Build tools
      if (deps.webpack) frameworks.add('Webpack')
      if (deps.vite) frameworks.add('Vite')
      if (deps.turbo) frameworks.add('Turborepo')
    }

    // Check for other framework files
    const files = await glob('*', {
      cwd: this.projectPath
    })

    for (const file of files) {
      if (file === 'django-admin.py' || file === 'manage.py') frameworks.add('Django')
      if (file === 'requirements.txt' && !frameworks.has('Django')) frameworks.add('Python')
      if (file === 'Gemfile') frameworks.add('Ruby on Rails')
      if (file === 'go.mod') frameworks.add('Go Modules')
      if (file === 'Cargo.toml') frameworks.add('Rust/Cargo')
    }

    return Array.from(frameworks)
  }

  /**
   * Extract technologies from dependencies
   */
  private extractTechnologies(packageJson: any, frameworks: string[]): string[] {
    const technologies = new Set<string>(frameworks)
    
    if (packageJson) {
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      }

      // Databases
      if (deps.prisma || deps['@prisma/client']) technologies.add('Prisma')
      if (deps.mongoose) technologies.add('MongoDB')
      if (deps.pg || deps.postgres) technologies.add('PostgreSQL')
      if (deps.mysql || deps.mysql2) technologies.add('MySQL')
      if (deps.redis) technologies.add('Redis')
      
      // State management
      if (deps.redux || deps['@reduxjs/toolkit']) technologies.add('Redux')
      if (deps.mobx) technologies.add('MobX')
      if (deps.zustand) technologies.add('Zustand')
      if (deps.recoil) technologies.add('Recoil')
      
      // Styling
      if (deps.tailwindcss) technologies.add('Tailwind CSS')
      if (deps['styled-components']) technologies.add('Styled Components')
      if (deps.emotion || deps['@emotion/react']) technologies.add('Emotion')
      
      // GraphQL
      if (deps.graphql) technologies.add('GraphQL')
      if (deps.apollo || deps['@apollo/client']) technologies.add('Apollo')
      
      // Auth
      if (deps['@clerk/nextjs'] || deps['@clerk/clerk-react']) technologies.add('Clerk')
      if (deps['next-auth']) technologies.add('NextAuth')
      if (deps['@supabase/supabase-js']) technologies.add('Supabase')
    }

    return Array.from(technologies)
  }

  /**
   * Determine project type
   */
  private determineProjectType(
    packageJson: any,
    frameworks: string[],
    structure: ProjectStructure
  ): string {
    // Check for monorepo
    if (packageJson?.workspaces || structure.directories.includes('packages')) {
      return 'monorepo'
    }
    
    // Next.js app
    if (frameworks.includes('Next.js')) {
      return structure.directories.includes('app') ? 'nextjs-app-router' : 'nextjs-pages'
    }
    
    // React app
    if (frameworks.includes('React')) {
      return frameworks.includes('Vite') ? 'react-vite' : 'react-app'
    }
    
    // Node.js API
    if (frameworks.includes('Express') || frameworks.includes('Fastify')) {
      return 'node-api'
    }
    
    // NestJS
    if (frameworks.includes('NestJS')) {
      return 'nestjs-api'
    }
    
    // CLI tool
    if (packageJson?.bin) {
      return 'cli-tool'
    }
    
    // Library
    if (packageJson?.main || packageJson?.module) {
      return 'library'
    }
    
    return 'unknown'
  }

  /**
   * Check for tests
   */
  private async checkForTests(): Promise<boolean> {
    const testPatterns = [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      '**/test/**/*.{js,jsx,ts,tsx}',
      '**/__tests__/**/*.{js,jsx,ts,tsx}'
    ]

    for (const pattern of testPatterns) {
      const files = await glob(pattern, {
        cwd: this.projectPath,
        ignore: this.ignorePatterns
      })
      if (files.length > 0) return true
    }

    return false
  }

  /**
   * Check for Docker
   */
  private async checkForDocker(): Promise<boolean> {
    try {
      await fs.access(path.join(this.projectPath, 'Dockerfile'))
      return true
    } catch {
      try {
        await fs.access(path.join(this.projectPath, 'docker-compose.yml'))
        return true
      } catch {
        return false
      }
    }
  }

  /**
   * Check for CI/CD
   */
  private async checkForCI(): Promise<boolean> {
    const ciPaths = [
      '.github/workflows',
      '.gitlab-ci.yml',
      '.circleci/config.yml',
      'Jenkinsfile',
      '.travis.yml',
      'azure-pipelines.yml'
    ]

    for (const ciPath of ciPaths) {
      try {
        await fs.access(path.join(this.projectPath, ciPath))
        return true
      } catch {
        // Continue checking
      }
    }

    return false
  }

  /**
   * Find existing CLAUDE.md
   */
  private async findClaudeMd(): Promise<string | undefined> {
    const possiblePaths = [
      'CLAUDE.md',
      'claude.md',
      '.claude/CLAUDE.md',
      'docs/CLAUDE.md'
    ]

    for (const claudePath of possiblePaths) {
      try {
        const content = await fs.readFile(
          path.join(this.projectPath, claudePath),
          'utf-8'
        )
        return content
      } catch {
        // Continue checking
      }
    }

    return undefined
  }

  /**
   * Get Git information
   */
  private async getGitInfo(): Promise<ProjectScanResult['gitInfo']> {
    try {
      const gitPath = path.join(this.projectPath, '.git')
      await fs.access(gitPath)
      
      // This is a simplified version - in production you'd use a git library
      return {
        branch: 'main',
        remoteUrl: '',
        lastCommit: ''
      }
    } catch {
      return undefined
    }
  }

  /**
   * Count total files
   */
  private async countFiles(): Promise<number> {
    const files = await glob('**/*', {
      cwd: this.projectPath,
      ignore: this.ignorePatterns,
      nodir: true
    })
    return files.length
  }
}