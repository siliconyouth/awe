/**
 * File Configuration Provider
 * 
 * Loads configuration from JSON, YAML, or JS/TS files
 */

import { BaseConfigProvider } from './base'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { watch } from 'chokidar'

export interface FileProviderOptions {
  paths?: string[]
  format?: 'json' | 'yaml' | 'js' | 'auto'
  watch?: boolean
}

/**
 * File-based configuration provider
 */
export class FileProvider extends BaseConfigProvider {
  name = 'file'
  priority = 10 // Lower priority than env
  
  private options: FileProviderOptions
  private watcher?: any
  private filePaths: string[] = []
  
  constructor(options: FileProviderOptions = {}) {
    super()
    this.options = {
      paths: [
        'config.json',
        'config.yaml',
        'config.yml',
        'config.js',
        'config.ts',
        '.awe/config.json',
        '.awe/config.yaml',
      ],
      format: 'auto',
      watch: false,
      ...options
    }
  }
  
  /**
   * Load configuration from files
   */
  async load(): Promise<Record<string, any>> {
    let config: Record<string, any> = {}
    
    // Find and load configuration files
    for (const configPath of this.options.paths || []) {
      const fullPath = path.resolve(process.cwd(), configPath)
      
      try {
        const exists = await this.fileExists(fullPath)
        if (!exists) continue
        
        const fileConfig = await this.loadFile(fullPath)
        config = this.deepMerge(config, fileConfig)
        this.filePaths.push(fullPath)
        
      } catch (error) {
        console.warn(`Failed to load config from ${fullPath}:`, error)
      }
    }
    
    // Set up file watching if enabled
    if (this.options.watch && this.filePaths.length > 0) {
      this.setupWatcher()
    }
    
    this.config = config
    return config
  }
  
  /**
   * Save configuration to file
   */
  async save(config: Record<string, any>): Promise<void> {
    if (this.filePaths.length === 0) {
      // Create default config file
      const defaultPath = path.resolve(process.cwd(), '.awe/config.json')
      await this.ensureDir(path.dirname(defaultPath))
      this.filePaths.push(defaultPath)
    }
    
    const primaryPath = this.filePaths[0]
    const format = this.detectFormat(primaryPath)
    
    let content: string
    
    switch (format) {
      case 'yaml':
        content = yaml.dump(config, { indent: 2 })
        break
      case 'json':
      default:
        content = JSON.stringify(config, null, 2)
        break
    }
    
    await fs.writeFile(primaryPath, content, 'utf-8')
  }
  
  /**
   * Watch for configuration file changes
   */
  watch(callback: (config: Record<string, any>) => void): void {
    if (this.watcher) return
    
    this.setupWatcher()
    
    this.on('change', async () => {
      const config = await this.load()
      callback(config)
    })
  }
  
  /**
   * Stop watching for changes
   */
  unwatch(): void {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = undefined
    }
    this.watching = false
  }
  
  /**
   * Load a single configuration file
   */
  private async loadFile(filePath: string): Promise<Record<string, any>> {
    const format = this.options.format === 'auto' 
      ? this.detectFormat(filePath) 
      : this.options.format
    
    const content = await fs.readFile(filePath, 'utf-8')
    
    switch (format) {
      case 'json':
        return JSON.parse(content)
        
      case 'yaml':
        return yaml.load(content) as Record<string, any>
        
      case 'js':
        // Clear require cache for hot-reloading
        delete require.cache[require.resolve(filePath)]
        const module = require(filePath)
        return module.default || module
        
      default:
        throw new Error(`Unsupported config format: ${format}`)
    }
  }
  
  /**
   * Detect file format from extension
   */
  private detectFormat(filePath: string): 'json' | 'yaml' | 'js' {
    const ext = path.extname(filePath).toLowerCase()
    
    switch (ext) {
      case '.json':
        return 'json'
      case '.yaml':
      case '.yml':
        return 'yaml'
      case '.js':
      case '.ts':
        return 'js'
      default:
        return 'json'
    }
  }
  
  /**
   * Set up file watcher
   */
  private setupWatcher(): void {
    if (this.watcher) return
    
    this.watcher = watch(this.filePaths, {
      persistent: true,
      ignoreInitial: true,
    })
    
    this.watcher.on('change', async () => {
      this.emit('change')
    })
    
    this.watching = true
  }
  
  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
  
  /**
   * Ensure directory exists
   */
  private async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true })
  }
}