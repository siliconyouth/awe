import { Command } from 'commander'
import { createLogger } from '../utils/logger'

export abstract class BaseCommand {
  protected logger = createLogger(this.constructor.name)
  
  abstract getCommand(): Command
  
  protected handleError(error: unknown, context?: string) {
    const message = error instanceof Error ? error.message : String(error)
    this.logger.error(`${context ? `${context}: ` : ''}${message}`)
    
    if (error instanceof Error && error.stack) {
      this.logger.debug('Stack trace:', error.stack)
    }
  }
}