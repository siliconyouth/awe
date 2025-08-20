import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AnalyzeCommand } from '../src/commands/analyze'
import { InitCommand } from '../src/commands/init'
import { RecommendCommand } from '../src/commands/recommend'
import { PatternsCommand } from '../src/commands/patterns-cli'
import { ResourcesCommand } from '../src/commands/resources'
import * as fs from 'fs/promises'
import * as path from 'path'

// Mock dependencies
vi.mock('@awe/ai', () => ({
  ClaudeAIService: vi.fn(() => ({
    analyzeProject: vi.fn(() => ({
      summary: 'Test project analysis',
      recommendations: ['Use TypeScript', 'Add tests'],
      patterns: [],
      score: 85
    })),
    generateRecommendations: vi.fn(() => ({
      recommendations: ['Add documentation', 'Improve error handling'],
      priority: 'high'
    }))
  })),
  PatternExtractor: vi.fn(() => ({
    extractPatterns: vi.fn(() => [
      {
        name: 'React Hook Pattern',
        type: 'architecture',
        category: 'react',
        confidence: 90,
        occurrences: 5
      }
    ])
  })),
  ResourceManager: vi.fn(() => ({
    importFromDirectory: vi.fn(() => [
      {
        title: 'Test Resource',
        type: 'pattern',
        content: 'test content'
      }
    ]),
    saveResource: vi.fn()
  }))
}))

vi.mock('@awe/database', () => ({
  prisma: {
    project: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    resource: {
      findMany: vi.fn(() => []),
      create: vi.fn()
    },
    extractedPattern: {
      findMany: vi.fn(() => []),
      create: vi.fn()
    }
  }
}))

describe('CLI Commands', () => {
  describe('AnalyzeCommand', () => {
    let command: AnalyzeCommand
    
    beforeEach(() => {
      command = new AnalyzeCommand()
    })
    
    it('should create command with correct configuration', () => {
      const cmd = command.getCommand()
      expect(cmd.name()).toBe('analyze')
      expect(cmd.description()).toContain('AI-powered analysis')
    })
    
    it('should have required options', () => {
      const cmd = command.getCommand()
      const options = cmd.options
      
      expect(options.some(o => o.long === '--output')).toBe(true)
      expect(options.some(o => o.long === '--format')).toBe(true)
      expect(options.some(o => o.long === '--save')).toBe(true)
    })
  })
  
  describe('InitCommand', () => {
    let command: InitCommand
    const testDir = path.join(process.cwd(), 'test-project')
    
    beforeEach(async () => {
      command = new InitCommand()
      await fs.mkdir(testDir, { recursive: true })
    })
    
    afterEach(async () => {
      await fs.rm(testDir, { recursive: true, force: true })
    })
    
    it('should create command with correct configuration', () => {
      const cmd = command.getCommand()
      expect(cmd.name()).toBe('init')
      expect(cmd.description()).toContain('Initialize project')
    })
    
    it('should have template option', () => {
      const cmd = command.getCommand()
      const options = cmd.options
      
      expect(options.some(o => o.long === '--template')).toBe(true)
      expect(options.some(o => o.long === '--force')).toBe(true)
    })
  })
  
  describe('PatternsCommand', () => {
    let command: PatternsCommand
    
    beforeEach(() => {
      command = new PatternsCommand()
    })
    
    it('should create command with subcommands', () => {
      const cmd = command.getCommand()
      expect(cmd.name()).toBe('patterns')
      
      const subcommands = cmd.commands.map(c => c.name())
      expect(subcommands).toContain('extract')
      expect(subcommands).toContain('review')
      expect(subcommands).toContain('export')
      expect(subcommands).toContain('list')
    })
    
    it('should have extract subcommand with options', () => {
      const cmd = command.getCommand()
      const extractCmd = cmd.commands.find(c => c.name() === 'extract')
      
      expect(extractCmd).toBeDefined()
      expect(extractCmd?.options.some(o => o.long === '--types')).toBe(true)
      expect(extractCmd?.options.some(o => o.long === '--output')).toBe(true)
    })
  })
  
  describe('ResourcesCommand', () => {
    let command: ResourcesCommand
    
    beforeEach(() => {
      command = new ResourcesCommand()
    })
    
    it('should create command with subcommands', () => {
      const cmd = command.getCommand()
      expect(cmd.name()).toBe('resources')
      expect(cmd.aliases()).toContain('res')
      
      const subcommands = cmd.commands.map(c => c.name())
      expect(subcommands).toContain('import')
      expect(subcommands).toContain('search')
      expect(subcommands).toContain('get')
      expect(subcommands).toContain('create-collection')
      expect(subcommands).toContain('collections')
    })
    
    it('should have import subcommand with options', () => {
      const cmd = command.getCommand()
      const importCmd = cmd.commands.find(c => c.name() === 'import')
      
      expect(importCmd).toBeDefined()
      expect(importCmd?.options.some(o => o.long === '--type')).toBe(true)
      expect(importCmd?.options.some(o => o.long === '--auto-tag')).toBe(true)
    })
  })
  
  describe('RecommendCommand', () => {
    let command: RecommendCommand
    
    beforeEach(() => {
      command = new RecommendCommand()
    })
    
    it('should create command with correct configuration', () => {
      const cmd = command.getCommand()
      expect(cmd.name()).toBe('recommend')
      expect(cmd.description()).toContain('AI-powered recommendations')
    })
    
    it('should have category and depth options', () => {
      const cmd = command.getCommand()
      const options = cmd.options
      
      expect(options.some(o => o.long === '--category')).toBe(true)
      expect(options.some(o => o.long === '--depth')).toBe(true)
      expect(options.some(o => o.long === '--save')).toBe(true)
    })
  })
})