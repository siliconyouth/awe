/**
 * AWE CLI - TypeScript Entry Point
 * 
 * Modern TypeScript command-line interface for AWE (Awesome Workspace Engineering)
 */

export * from './commands/analyze'
export * from './commands/config'
export * from './commands/init'
export * from './commands/recommend'
export * from './commands/scaffold'
export * from './commands/sync'
export * from './commands/setup'
export * from './commands/chat'
export * from './commands/patterns'
export { GenerateConfigCommand } from './commands/generate-config'

export * from './utils/logger'
export * from './utils/validation'