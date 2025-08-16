/**
 * Hook Management System
 * 
 * Provides a flexible system for registering and executing hooks
 * at various lifecycle points in AWE operations.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import chalk from 'chalk';

const execAsync = promisify(exec);

// Hook types
export enum HookType {
  PRE_BUILD = 'pre-build',
  POST_BUILD = 'post-build',
  PRE_TEST = 'pre-test',
  POST_TEST = 'post-test',
  PRE_DEPLOY = 'pre-deploy',
  POST_DEPLOY = 'post-deploy',
  PRE_COMMIT = 'pre-commit',
  POST_COMMIT = 'post-commit',
  PRE_PUSH = 'pre-push',
  POST_PUSH = 'post-push',
  PRE_ANALYSIS = 'pre-analysis',
  POST_ANALYSIS = 'post-analysis',
  PRE_SCAFFOLD = 'pre-scaffold',
  POST_SCAFFOLD = 'post-scaffold',
  PRE_CONFIG = 'pre-config',
  POST_CONFIG = 'post-config',
  CUSTOM = 'custom'
}

// Hook trigger conditions
export enum HookTrigger {
  ALWAYS = 'always',
  ON_SUCCESS = 'on-success',
  ON_FAILURE = 'on-failure',
  ON_CHANGE = 'on-change',
  MANUAL = 'manual'
}

// Hook configuration schema
export const HookConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.nativeEnum(HookType),
  trigger: z.nativeEnum(HookTrigger).default(HookTrigger.ALWAYS),
  enabled: z.boolean().default(true),
  script: z.string().optional(),
  command: z.string().optional(),
  module: z.string().optional(),
  function: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  timeout: z.number().default(30000),
  retries: z.number().default(0),
  continueOnError: z.boolean().default(false),
  conditions: z.array(z.object({
    type: z.enum(['file-exists', 'env-var', 'pattern', 'custom']),
    value: z.string(),
    operator: z.enum(['equals', 'not-equals', 'contains', 'matches']).optional()
  })).optional(),
  metadata: z.record(z.any()).optional()
});

export type HookConfig = z.infer<typeof HookConfigSchema>;

// Hook execution result
export interface HookResult {
  id: string;
  name: string;
  type: HookType;
  success: boolean;
  duration: number;
  output?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
  timestamp: Date;
}

// Hook execution context
export interface HookContext {
  projectPath: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  data?: Record<string, any>;
  previousResults?: HookResult[];
}

// Hook registry
export class HookRegistry {
  private hooks: Map<string, HookConfig> = new Map();
  private hooksByType: Map<HookType, Set<string>> = new Map();

  constructor() {
    // Initialize type mappings
    for (const type of Object.values(HookType)) {
      this.hooksByType.set(type, new Set());
    }
  }

  /**
   * Register a hook
   */
  register(hook: HookConfig): void {
    // Validate hook
    const validated = HookConfigSchema.parse(hook);
    
    // Store hook
    this.hooks.set(validated.id, validated);
    
    // Update type mapping
    const typeSet = this.hooksByType.get(validated.type);
    if (typeSet) {
      typeSet.add(validated.id);
    }
  }

  /**
   * Unregister a hook
   */
  unregister(id: string): boolean {
    const hook = this.hooks.get(id);
    if (!hook) return false;

    // Remove from registry
    this.hooks.delete(id);
    
    // Remove from type mapping
    const typeSet = this.hooksByType.get(hook.type);
    if (typeSet) {
      typeSet.delete(id);
    }

    return true;
  }

  /**
   * Get hooks by type
   */
  getByType(type: HookType): HookConfig[] {
    const ids = this.hooksByType.get(type) || new Set();
    return Array.from(ids)
      .map(id => this.hooks.get(id))
      .filter((hook): hook is HookConfig => hook !== undefined);
  }

  /**
   * Get all hooks
   */
  getAll(): HookConfig[] {
    return Array.from(this.hooks.values());
  }

  /**
   * Get hook by ID
   */
  get(id: string): HookConfig | undefined {
    return this.hooks.get(id);
  }

  /**
   * Clear all hooks
   */
  clear(): void {
    this.hooks.clear();
    for (const set of this.hooksByType.values()) {
      set.clear();
    }
  }
}

// Hook executor
export class HookExecutor {
  private registry: HookRegistry;
  private results: HookResult[] = [];

  constructor(registry: HookRegistry) {
    this.registry = registry;
  }

  /**
   * Execute hooks of a specific type
   */
  async executeType(
    type: HookType,
    context: HookContext,
    options: {
      parallel?: boolean;
      stopOnError?: boolean;
      filter?: (hook: HookConfig) => boolean;
    } = {}
  ): Promise<HookResult[]> {
    const hooks = this.registry.getByType(type)
      .filter(hook => hook.enabled)
      .filter(options.filter || (() => true));

    if (hooks.length === 0) {
      return [];
    }

    const results: HookResult[] = [];

    if (options.parallel) {
      // Execute hooks in parallel
      const promises = hooks.map(hook => this.executeHook(hook, context));
      const parallelResults = await Promise.allSettled(promises);
      
      for (const result of parallelResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Handle rejected promise
          results.push({
            id: 'unknown',
            name: 'Unknown Hook',
            type,
            success: false,
            duration: 0,
            error: result.reason?.message || 'Unknown error',
            timestamp: new Date()
          });
        }
      }
    } else {
      // Execute hooks sequentially
      for (const hook of hooks) {
        try {
          const result = await this.executeHook(hook, context);
          results.push(result);
          
          if (!result.success && options.stopOnError && !hook.continueOnError) {
            break;
          }
        } catch (error) {
          const errorResult: HookResult = {
            id: hook.id,
            name: hook.name,
            type: hook.type,
            success: false,
            duration: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
          };
          results.push(errorResult);
          
          if (options.stopOnError && !hook.continueOnError) {
            break;
          }
        }
      }
    }

    // Store results
    this.results.push(...results);
    
    return results;
  }

  /**
   * Execute a single hook
   */
  async executeHook(hook: HookConfig, context: HookContext): Promise<HookResult> {
    const startTime = Date.now();
    
    // Check conditions
    if (hook.conditions && hook.conditions.length > 0) {
      const shouldRun = await this.checkConditions(hook.conditions, context);
      if (!shouldRun) {
        return {
          id: hook.id,
          name: hook.name,
          type: hook.type,
          success: true,
          duration: 0,
          skipped: true,
          skipReason: 'Conditions not met',
          timestamp: new Date()
        };
      }
    }

    // Check trigger
    if (hook.trigger === HookTrigger.MANUAL) {
      return {
        id: hook.id,
        name: hook.name,
        type: hook.type,
        success: true,
        duration: 0,
        skipped: true,
        skipReason: 'Manual trigger required',
        timestamp: new Date()
      };
    }

    try {
      let output: string = '';
      
      // Execute based on hook configuration
      if (hook.command) {
        // Execute shell command
        output = await this.executeCommand(hook, context);
      } else if (hook.script) {
        // Execute script file
        output = await this.executeScript(hook, context);
      } else if (hook.module && hook.function) {
        // Execute module function
        output = await this.executeModule(hook, context);
      } else {
        throw new Error('No execution method specified');
      }

      const duration = Date.now() - startTime;
      
      return {
        id: hook.id,
        name: hook.name,
        type: hook.type,
        success: true,
        duration,
        output,
        timestamp: new Date()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Handle retries
      if (hook.retries > 0) {
        console.log(chalk.yellow(`Retrying hook ${hook.name}...`));
        const retryHook = { ...hook, retries: hook.retries - 1 };
        return this.executeHook(retryHook, context);
      }
      
      return {
        id: hook.id,
        name: hook.name,
        type: hook.type,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Execute shell command
   */
  private async executeCommand(hook: HookConfig, context: HookContext): Promise<string> {
    if (!hook.command) {
      throw new Error('No command specified');
    }

    // Prepare command with arguments
    let command = hook.command;
    if (hook.args && hook.args.length > 0) {
      command += ' ' + hook.args.join(' ');
    }

    // Prepare environment
    const env = {
      ...process.env,
      ...context.env,
      ...hook.env,
      AWE_HOOK_ID: hook.id,
      AWE_HOOK_TYPE: hook.type,
      AWE_PROJECT_PATH: context.projectPath
    };

    // Execute command
    const { stdout, stderr } = await execAsync(command, {
      cwd: context.projectPath,
      env,
      timeout: hook.timeout
    });

    if (stderr && !hook.continueOnError) {
      throw new Error(stderr);
    }

    return stdout;
  }

  /**
   * Execute script file
   */
  private async executeScript(hook: HookConfig, context: HookContext): Promise<string> {
    if (!hook.script) {
      throw new Error('No script specified');
    }

    const scriptPath = path.isAbsolute(hook.script) 
      ? hook.script 
      : path.join(context.projectPath, hook.script);

    // Check if script exists
    try {
      await fs.access(scriptPath);
    } catch {
      throw new Error(`Script not found: ${scriptPath}`);
    }

    // Determine interpreter based on extension
    const ext = path.extname(scriptPath);
    let interpreter = 'node';
    
    switch (ext) {
      case '.py':
        interpreter = 'python';
        break;
      case '.sh':
        interpreter = 'bash';
        break;
      case '.rb':
        interpreter = 'ruby';
        break;
      case '.js':
      case '.ts':
        interpreter = 'node';
        break;
    }

    // Execute script
    const command = `${interpreter} ${scriptPath}`;
    return this.executeCommand({ ...hook, command }, context);
  }

  /**
   * Execute module function
   */
  private async executeModule(hook: HookConfig, context: HookContext): Promise<string> {
    if (!hook.module || !hook.function) {
      throw new Error('Module and function must be specified');
    }

    const modulePath = path.isAbsolute(hook.module)
      ? hook.module
      : path.join(context.projectPath, hook.module);

    try {
      // Dynamic import
      const module = await import(modulePath);
      
      // Get function
      const fn = module[hook.function];
      if (typeof fn !== 'function') {
        throw new Error(`Function ${hook.function} not found in module`);
      }

      // Execute function
      const result = await fn(context, hook.args);
      
      // Convert result to string
      if (typeof result === 'string') {
        return result;
      } else if (result !== undefined && result !== null) {
        return JSON.stringify(result, null, 2);
      } else {
        return '';
      }
    } catch (error) {
      throw new Error(`Failed to execute module: ${error}`);
    }
  }

  /**
   * Check hook conditions
   */
  private async checkConditions(
    conditions: HookConfig['conditions'],
    context: HookContext
  ): Promise<boolean> {
    if (!conditions) return true;

    for (const condition of conditions) {
      let met = false;

      switch (condition.type) {
        case 'file-exists':
          try {
            const filePath = path.isAbsolute(condition.value)
              ? condition.value
              : path.join(context.projectPath, condition.value);
            await fs.access(filePath);
            met = true;
          } catch {
            met = false;
          }
          break;

        case 'env-var':
          const envValue = process.env[condition.value] || context.env?.[condition.value];
          if (condition.operator === 'equals' && envValue) {
            met = envValue === condition.value;
          } else if (condition.operator === 'not-equals' && envValue) {
            met = envValue !== condition.value;
          } else if (condition.operator === 'contains' && envValue) {
            met = envValue.includes(condition.value);
          } else {
            met = !!envValue;
          }
          break;

        case 'pattern':
          // Check if pattern exists in project
          met = await this.checkPattern(condition.value, context.projectPath);
          break;

        case 'custom':
          // Execute custom condition check
          try {
            const result = await execAsync(condition.value, {
              cwd: context.projectPath,
              env: { ...process.env, ...context.env }
            });
            met = result.stdout.trim() === 'true';
          } catch {
            met = false;
          }
          break;
      }

      if (!met) return false;
    }

    return true;
  }

  /**
   * Check if pattern exists in project
   */
  private async checkPattern(pattern: string, projectPath: string): Promise<boolean> {
    try {
      const { PatternRecognitionEngine } = await import('./pattern-recognition.js');
      const engine = new PatternRecognitionEngine();
      const patterns = await engine.analyzeCodebase(projectPath, {
        patterns: [pattern]
      });
      return patterns.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get execution results
   */
  getResults(): HookResult[] {
    return this.results;
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results = [];
  }
}

// Hook manager
export class HookManager {
  private registry: HookRegistry;
  private executor: HookExecutor;
  private configPath?: string;

  constructor(configPath?: string) {
    this.registry = new HookRegistry();
    this.executor = new HookExecutor(this.registry);
    this.configPath = configPath;
  }

  /**
   * Load hooks from configuration file
   */
  async loadConfig(configPath?: string): Promise<void> {
    const path = configPath || this.configPath;
    if (!path) {
      throw new Error('No configuration path specified');
    }

    try {
      const content = await fs.readFile(path, 'utf-8');
      const config = JSON.parse(content);
      
      if (Array.isArray(config.hooks)) {
        for (const hook of config.hooks) {
          this.registry.register(hook);
        }
      }
    } catch (error) {
      throw new Error(`Failed to load hook configuration: ${error}`);
    }
  }

  /**
   * Save hooks to configuration file
   */
  async saveConfig(configPath?: string): Promise<void> {
    const path = configPath || this.configPath;
    if (!path) {
      throw new Error('No configuration path specified');
    }

    const config = {
      version: '1.0.0',
      hooks: this.registry.getAll()
    };

    await fs.writeFile(path, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * Register a hook
   */
  register(hook: HookConfig): void {
    this.registry.register(hook);
  }

  /**
   * Execute hooks
   */
  async execute(
    type: HookType,
    context: HookContext,
    options?: Parameters<HookExecutor['executeType']>[2]
  ): Promise<HookResult[]> {
    return this.executor.executeType(type, context, options);
  }

  /**
   * Get registry
   */
  getRegistry(): HookRegistry {
    return this.registry;
  }

  /**
   * Get executor
   */
  getExecutor(): HookExecutor {
    return this.executor;
  }

  /**
   * Create default hooks for a project
   */
  createDefaultHooks(): HookConfig[] {
    return [
      {
        id: 'lint-pre-commit',
        name: 'Lint Before Commit',
        description: 'Run linting before committing code',
        type: HookType.PRE_COMMIT,
        trigger: HookTrigger.ALWAYS,
        enabled: true,
        command: 'npm run lint',
        timeout: 30000,
        retries: 0,
        continueOnError: false
      },
      {
        id: 'test-pre-push',
        name: 'Test Before Push',
        description: 'Run tests before pushing to remote',
        type: HookType.PRE_PUSH,
        trigger: HookTrigger.ALWAYS,
        enabled: true,
        command: 'npm test',
        timeout: 30000,
        retries: 0,
        continueOnError: false
      },
      {
        id: 'build-verify',
        name: 'Verify Build',
        description: 'Verify build succeeds before deployment',
        type: HookType.PRE_DEPLOY,
        trigger: HookTrigger.ALWAYS,
        enabled: true,
        command: 'npm run build',
        timeout: 60000,
        retries: 0,
        continueOnError: false
      },
      {
        id: 'notify-deploy-success',
        name: 'Deployment Notification',
        description: 'Send notification after successful deployment',
        type: HookType.POST_DEPLOY,
        trigger: HookTrigger.ON_SUCCESS,
        enabled: false,
        command: 'echo "Deployment successful!"',
        timeout: 30000,
        retries: 0,
        continueOnError: true
      }
    ];
  }
}