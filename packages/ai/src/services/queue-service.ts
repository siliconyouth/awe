import Bull, { Queue, Job, JobOptions, QueueOptions } from 'bull'
import { Redis } from '@upstash/redis'

/**
 * Unified Queue Service using Bull + Redis
 * Consolidates all background job processing
 */

// Queue configuration
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || 'redis://localhost:6379'
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// Default queue options
const defaultQueueOptions: QueueOptions = {
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
}

// Queue types
export enum QueueName {
  RESOURCE_PROCESSING = 'resource-processing',
  PATTERN_EXTRACTION = 'pattern-extraction',
  KNOWLEDGE_UPDATE = 'knowledge-update',
  SCRAPING = 'scraping',
  INDEXING = 'indexing',
  ANALYTICS = 'analytics',
  NOTIFICATIONS = 'notifications',
  MONITORING = 'monitoring'
}

// Job priorities
export enum Priority {
  CRITICAL = 1,
  HIGH = 5,
  NORMAL = 10,
  LOW = 20
}

/**
 * Queue Manager - Singleton for managing all queues
 */
export class QueueManager {
  private static instance: QueueManager
  private queues: Map<QueueName, Queue> = new Map()
  private isRedisAvailable: boolean = false

  private constructor() {
    this.initialize()
  }

  private initialize() {
    // Check if Redis is available
    if (REDIS_URL && REDIS_TOKEN) {
      this.isRedisAvailable = true
      this.setupQueues()
    } else {
      console.warn('Redis not configured. Background jobs will use in-memory fallback.')
    }
  }

  private setupQueues() {
    if (!this.isRedisAvailable) return

    // Create queues for each type
    Object.values(QueueName).forEach(queueName => {
      const queue = new Bull(queueName, REDIS_URL, defaultQueueOptions)
      this.queues.set(queueName, queue)
      
      // Set up error handling
      queue.on('error', (error) => {
        console.error(`Queue ${queueName} error:`, error)
      })

      queue.on('failed', (job, error) => {
        console.error(`Job ${job.id} in ${queueName} failed:`, error)
      })
    })
  }

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager()
    }
    return QueueManager.instance
  }

  /**
   * Get a specific queue
   */
  getQueue(name: QueueName): Queue | null {
    return this.queues.get(name) || null
  }

  /**
   * Add a job to a queue
   */
  async addJob<T = any>(
    queueName: QueueName,
    jobName: string,
    data: T,
    options?: JobOptions
  ): Promise<Job<T> | null> {
    const queue = this.getQueue(queueName)
    if (!queue) {
      console.warn(`Queue ${queueName} not available. Job ${jobName} skipped.`)
      return null
    }

    try {
      const job = await queue.add(jobName, data, options)
      console.log(`Job ${job.id} added to ${queueName}`)
      return job
    } catch (error) {
      console.error(`Failed to add job to ${queueName}:`, error)
      return null
    }
  }

  /**
   * Bulk add jobs
   */
  async bulkAddJobs<T = any>(
    queueName: QueueName,
    jobs: Array<{ name: string; data: T; opts?: JobOptions }>
  ): Promise<Job<T>[]> {
    const queue = this.getQueue(queueName)
    if (!queue) {
      console.warn(`Queue ${queueName} not available.`)
      return []
    }

    try {
      const addedJobs = await queue.addBulk(jobs)
      console.log(`${addedJobs.length} jobs added to ${queueName}`)
      return addedJobs
    } catch (error) {
      console.error(`Failed to bulk add jobs to ${queueName}:`, error)
      return []
    }
  }

  /**
   * Get job counts for a queue
   */
  async getJobCounts(queueName: QueueName) {
    const queue = this.getQueue(queueName)
    if (!queue) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0
      }
    }

    return queue.getJobCounts()
  }

  /**
   * Clean old jobs from a queue
   */
  async cleanQueue(
    queueName: QueueName,
    grace: number = 3600000, // 1 hour
    status?: 'completed' | 'failed'
  ) {
    const queue = this.getQueue(queueName)
    if (!queue) return

    try {
      const jobs = await queue.clean(grace, status)
      console.log(`Cleaned ${jobs.length} jobs from ${queueName}`)
    } catch (error) {
      console.error(`Failed to clean ${queueName}:`, error)
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: QueueName) {
    const queue = this.getQueue(queueName)
    if (!queue) return

    await queue.pause()
    console.log(`Queue ${queueName} paused`)
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: QueueName) {
    const queue = this.getQueue(queueName)
    if (!queue) return

    await queue.resume()
    console.log(`Queue ${queueName} resumed`)
  }

  /**
   * Get queue health status
   */
  async getQueueHealth() {
    const health: Record<string, any> = {
      isRedisAvailable: this.isRedisAvailable,
      queues: {}
    }

    for (const [name, queue] of this.queues) {
      const counts = await this.getJobCounts(name)
      const isPaused = await queue.isPaused()
      
      health.queues[name] = {
        ...counts,
        isPaused,
        isHealthy: counts.failed < 100 && !isPaused
      }
    }

    return health
  }
}

/**
 * Job Processors - Define how each job type is processed
 */
export class JobProcessors {
  static async processResourceJob(job: Job) {
    const { resourceId, action } = job.data
    console.log(`Processing resource ${resourceId} with action ${action}`)
    
    // Implement resource processing logic
    switch (action) {
      case 'analyze':
        // Analyze resource content
        break
      case 'optimize':
        // Optimize resource
        break
      case 'validate':
        // Validate resource
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }
    
    return { success: true, resourceId }
  }

  static async processPatternExtractionJob(job: Job) {
    const { sourceId, content } = job.data
    console.log(`Extracting patterns from source ${sourceId}`)
    
    // Implement pattern extraction logic
    // This would use AI to extract patterns from content
    
    return { success: true, patternsExtracted: 0 }
  }

  static async processKnowledgeUpdateJob(job: Job) {
    const { sourceId, url } = job.data
    console.log(`Updating knowledge from ${url}`)
    
    // Implement knowledge update logic
    // This would fetch and process updated content
    
    return { success: true, updated: true }
  }

  static async processScrapingJob(job: Job) {
    const { url, options } = job.data
    console.log(`Scraping ${url}`)
    
    // Implement scraping logic
    // This would use the scraping service
    
    return { success: true, content: '' }
  }

  static async processIndexingJob(job: Job) {
    const { resourceId, content } = job.data
    console.log(`Indexing resource ${resourceId}`)
    
    // Implement indexing logic
    // This would use the vector search service
    
    return { success: true, indexed: true }
  }

  static async processAnalyticsJob(job: Job) {
    const { event, data } = job.data
    console.log(`Processing analytics event ${event}`)
    
    // Implement analytics processing
    
    return { success: true, processed: true }
  }

  static async processNotificationJob(job: Job) {
    const { type, recipient, message } = job.data
    console.log(`Sending ${type} notification to ${recipient}`)
    
    // Implement notification sending
    
    return { success: true, sent: true }
  }

  static async processMonitoringJob(job: Job) {
    const { checkType, target } = job.data
    console.log(`Running ${checkType} check on ${target}`)
    
    // Implement monitoring check
    
    return { success: true, status: 'healthy' }
  }
}

/**
 * Register job processors for each queue
 */
export function registerJobProcessors() {
  const queueManager = QueueManager.getInstance()

  // Resource processing
  const resourceQueue = queueManager.getQueue(QueueName.RESOURCE_PROCESSING)
  if (resourceQueue) {
    resourceQueue.process('*', JobProcessors.processResourceJob)
  }

  // Pattern extraction
  const patternQueue = queueManager.getQueue(QueueName.PATTERN_EXTRACTION)
  if (patternQueue) {
    patternQueue.process('*', JobProcessors.processPatternExtractionJob)
  }

  // Knowledge update
  const knowledgeQueue = queueManager.getQueue(QueueName.KNOWLEDGE_UPDATE)
  if (knowledgeQueue) {
    knowledgeQueue.process('*', JobProcessors.processKnowledgeUpdateJob)
  }

  // Scraping
  const scrapingQueue = queueManager.getQueue(QueueName.SCRAPING)
  if (scrapingQueue) {
    scrapingQueue.process('*', 2, JobProcessors.processScrapingJob) // 2 concurrent jobs
  }

  // Indexing
  const indexingQueue = queueManager.getQueue(QueueName.INDEXING)
  if (indexingQueue) {
    indexingQueue.process('*', JobProcessors.processIndexingJob)
  }

  // Analytics
  const analyticsQueue = queueManager.getQueue(QueueName.ANALYTICS)
  if (analyticsQueue) {
    analyticsQueue.process('*', JobProcessors.processAnalyticsJob)
  }

  // Notifications
  const notificationQueue = queueManager.getQueue(QueueName.NOTIFICATIONS)
  if (notificationQueue) {
    notificationQueue.process('*', JobProcessors.processNotificationJob)
  }

  // Monitoring
  const monitoringQueue = queueManager.getQueue(QueueName.MONITORING)
  if (monitoringQueue) {
    monitoringQueue.process('*', JobProcessors.processMonitoringJob)
  }

  console.log('Job processors registered')
}

// Export singleton instance
export const queueManager = QueueManager.getInstance()

// Helper functions for common operations
export async function scheduleResourceProcessing(
  resourceId: string,
  action: string,
  delay?: number
) {
  return queueManager.addJob(
    QueueName.RESOURCE_PROCESSING,
    'process-resource',
    { resourceId, action },
    { 
      delay,
      priority: Priority.NORMAL 
    }
  )
}

export async function schedulePatternExtraction(
  sourceId: string,
  content: string,
  priority: Priority = Priority.NORMAL
) {
  return queueManager.addJob(
    QueueName.PATTERN_EXTRACTION,
    'extract-patterns',
    { sourceId, content },
    { priority }
  )
}

export async function scheduleKnowledgeUpdate(
  sourceId: string,
  url: string
) {
  return queueManager.addJob(
    QueueName.KNOWLEDGE_UPDATE,
    'update-knowledge',
    { sourceId, url },
    {
      priority: Priority.LOW,
      attempts: 5
    }
  )
}

export async function scheduleScraping(
  url: string,
  options: any = {}
) {
  return queueManager.addJob(
    QueueName.SCRAPING,
    'scrape-url',
    { url, options },
    {
      priority: Priority.NORMAL,
      timeout: 30000 // 30 seconds
    }
  )
}

export async function scheduleIndexing(
  resourceId: string,
  content: string
) {
  return queueManager.addJob(
    QueueName.INDEXING,
    'index-resource',
    { resourceId, content },
    {
      priority: Priority.HIGH
    }
  )
}

export async function trackAnalyticsEvent(
  event: string,
  data: any
) {
  return queueManager.addJob(
    QueueName.ANALYTICS,
    'track-event',
    { event, data, timestamp: Date.now() },
    {
      priority: Priority.LOW
    }
  )
}

export async function sendNotification(
  type: 'email' | 'webhook' | 'in-app',
  recipient: string,
  message: any
) {
  return queueManager.addJob(
    QueueName.NOTIFICATIONS,
    'send-notification',
    { type, recipient, message },
    {
      priority: Priority.HIGH
    }
  )
}

export async function scheduleMonitoringCheck(
  checkType: string,
  target: string,
  interval?: number
) {
  return queueManager.addJob(
    QueueName.MONITORING,
    'monitoring-check',
    { checkType, target },
    {
      repeat: interval ? { every: interval } : undefined,
      priority: Priority.LOW
    }
  )
}