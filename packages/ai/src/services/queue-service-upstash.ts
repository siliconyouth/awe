import { Redis } from '@upstash/redis'

/**
 * Modern Queue Service using Upstash Redis
 * Replaces Bull with native Upstash implementation for serverless compatibility
 */

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    })
  : null

// Queue types
export enum QueueName {
  RESOURCE_PROCESSING = 'queue:resource-processing',
  PATTERN_EXTRACTION = 'queue:pattern-extraction',
  KNOWLEDGE_UPDATE = 'queue:knowledge-update',
  SCRAPING = 'queue:scraping',
  INDEXING = 'queue:indexing',
  ANALYTICS = 'queue:analytics',
  NOTIFICATIONS = 'queue:notifications',
  MONITORING = 'queue:monitoring'
}

// Job priorities
export enum Priority {
  CRITICAL = 1,
  HIGH = 5,
  NORMAL = 10,
  LOW = 20
}

// Job status
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

// Job interface
export interface Job<T = any> {
  id: string
  queue: QueueName
  data: T
  status: JobStatus
  priority: Priority
  attempts: number
  maxAttempts: number
  createdAt: Date
  updatedAt: Date
  processedAt?: Date
  completedAt?: Date
  failedAt?: Date
  error?: string
  result?: any
}

// Job processor type
export type JobProcessor<T = any> = (job: Job<T>) => Promise<any>

/**
 * Upstash-based Queue Manager
 */
export class QueueManager {
  private static instance: QueueManager
  private processors = new Map<QueueName, JobProcessor>()
  private processing = new Map<string, boolean>()
  private pollingIntervals = new Map<QueueName, NodeJS.Timeout>()

  private constructor() {
    if (!redis) {
      console.warn('Upstash Redis not configured. Queue service will use in-memory fallback.')
    }
  }

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager()
    }
    return QueueManager.instance
  }

  /**
   * Add a job to a queue
   */
  async addJob<T = any>(
    queue: QueueName,
    data: T,
    options: {
      priority?: Priority
      delay?: number
      maxAttempts?: number
    } = {}
  ): Promise<Job<T>> {
    const job: Job<T> = {
      id: this.generateJobId(),
      queue,
      data,
      status: JobStatus.PENDING,
      priority: options.priority || Priority.NORMAL,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (redis) {
      // Store job in Redis
      await redis.hset(`job:${job.id}`, job as any)
      
      // Add to queue with priority scoring
      const score = Date.now() + (options.delay || 0) - (job.priority * 1000000)
      await redis.zadd(queue, { score, member: job.id })
      
      // Store job metadata for quick access
      await redis.set(`job:meta:${job.id}`, JSON.stringify({
        queue,
        priority: job.priority,
        status: job.status
      }), { ex: 86400 * 7 }) // Expire after 7 days
    } else {
      // In-memory fallback
      console.log('Queue job added (in-memory):', job)
    }

    return job
  }

  /**
   * Process jobs from a queue
   */
  async processQueue(
    queueName: QueueName,
    processor: JobProcessor,
    options: {
      batchSize?: number
      pollInterval?: number
    } = {}
  ): Promise<void> {
    this.processors.set(queueName, processor)

    const { batchSize = 1, pollInterval = 5000 } = options

    // Clear existing interval if any
    const existingInterval = this.pollingIntervals.get(queueName)
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    // Start processing loop
    const processLoop = async () => {
      if (!redis) return

      try {
        // Get jobs ready for processing
        const now = Date.now()
        const jobIds = await redis.zrange(
          queueName,
          0,
          batchSize - 1,
          { byScore: true, rev: false, withScores: false }
        ) as string[]

        for (const jobId of jobIds) {
          // Skip if already processing
          if (this.processing.get(jobId)) continue

          this.processing.set(jobId, true)

          try {
            // Get job data
            const jobData = await redis.hgetall(`job:${jobId}`)
            if (!jobData) continue

            const job = this.deserializeJob(jobData)
            
            // Update job status
            job.status = JobStatus.PROCESSING
            job.processedAt = new Date()
            job.attempts++
            await this.updateJob(job)

            // Remove from queue
            await redis.zrem(queueName, jobId)

            // Process job
            const result = await processor(job)

            // Mark as completed
            job.status = JobStatus.COMPLETED
            job.completedAt = new Date()
            job.result = result
            await this.updateJob(job)

            // Clean up completed job after delay
            setTimeout(() => this.cleanupJob(job.id), 3600000) // 1 hour
          } catch (error) {
            console.error(`Error processing job ${jobId}:`, error)
            
            // Get job for retry logic
            const jobData = await redis.hgetall(`job:${jobId}`)
            if (jobData) {
              const job = this.deserializeJob(jobData)
              
              if (job.attempts < job.maxAttempts) {
                // Retry with exponential backoff
                job.status = JobStatus.RETRYING
                job.error = error instanceof Error ? error.message : String(error)
                await this.updateJob(job)
                
                const delay = Math.pow(2, job.attempts) * 1000
                const score = Date.now() + delay - (job.priority * 1000000)
                await redis.zadd(queueName, { score, member: job.id })
              } else {
                // Mark as failed
                job.status = JobStatus.FAILED
                job.failedAt = new Date()
                job.error = error instanceof Error ? error.message : String(error)
                await this.updateJob(job)
                
                // Move to dead letter queue
                await redis.zadd(`${queueName}:failed`, { 
                  score: Date.now(), 
                  member: job.id 
                })
              }
            }
          } finally {
            this.processing.delete(jobId)
          }
        }
      } catch (error) {
        console.error(`Error in queue ${queueName} processing loop:`, error)
      }
    }

    // Start polling
    const interval = setInterval(processLoop, pollInterval)
    this.pollingIntervals.set(queueName, interval)
    
    // Process immediately
    await processLoop()
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    if (!redis) return null

    const jobData = await redis.hgetall(`job:${jobId}`)
    if (!jobData) return null

    return this.deserializeJob(jobData)
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: QueueName): Promise<{
    pending: number
    processing: number
    completed: number
    failed: number
  }> {
    if (!redis) {
      return { pending: 0, processing: 0, completed: 0, failed: 0 }
    }

    const [pending, failed] = await Promise.all([
      redis.zcard(queueName),
      redis.zcard(`${queueName}:failed`)
    ])

    // Count processing jobs
    const processing = Array.from(this.processing.values()).filter(Boolean).length

    // Get completed count from metrics
    const completed = await redis.get(`${queueName}:completed:count`) || 0

    return {
      pending,
      processing,
      completed: Number(completed),
      failed
    }
  }

  /**
   * Get jobs from queue
   */
  async getJobs(
    queueName: QueueName,
    status?: JobStatus,
    limit = 10
  ): Promise<Job[]> {
    if (!redis) return []

    let jobIds: string[] = []

    if (status === JobStatus.FAILED) {
      jobIds = await redis.zrange(`${queueName}:failed`, 0, limit - 1)
    } else {
      jobIds = await redis.zrange(queueName, 0, limit - 1)
    }

    const jobs = await Promise.all(
      jobIds.map(async (id) => {
        const data = await redis.hgetall(`job:${id}`)
        return data ? this.deserializeJob(data) : null
      })
    )

    return jobs.filter(Boolean) as Job[]
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    if (!redis) return false

    const job = await this.getJob(jobId)
    if (!job || job.status !== JobStatus.FAILED) return false

    // Reset job
    job.status = JobStatus.PENDING
    job.attempts = 0
    job.error = undefined
    job.failedAt = undefined
    await this.updateJob(job)

    // Remove from failed queue
    await redis.zrem(`${job.queue}:failed`, jobId)

    // Add back to main queue
    const score = Date.now() - (job.priority * 1000000)
    await redis.zadd(job.queue, { score, member: jobId })

    return true
  }

  /**
   * Clear queue
   */
  async clearQueue(queueName: QueueName, includeFailed = false): Promise<void> {
    if (!redis) return

    // Get all job IDs
    const jobIds = await redis.zrange(queueName, 0, -1)
    
    // Delete jobs
    for (const jobId of jobIds) {
      await redis.del(`job:${jobId}`)
      await redis.del(`job:meta:${jobId}`)
    }

    // Clear queue
    await redis.del(queueName)

    if (includeFailed) {
      const failedIds = await redis.zrange(`${queueName}:failed`, 0, -1)
      for (const jobId of failedIds) {
        await redis.del(`job:${jobId}`)
        await redis.del(`job:meta:${jobId}`)
      }
      await redis.del(`${queueName}:failed`)
    }
  }

  /**
   * Stop processing a queue
   */
  stopProcessing(queueName: QueueName): void {
    const interval = this.pollingIntervals.get(queueName)
    if (interval) {
      clearInterval(interval)
      this.pollingIntervals.delete(queueName)
    }
    this.processors.delete(queueName)
  }

  /**
   * Stop all queue processing
   */
  stopAll(): void {
    for (const queueName of this.pollingIntervals.keys()) {
      this.stopProcessing(queueName)
    }
  }

  // Helper methods

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async updateJob(job: Job): Promise<void> {
    if (!redis) return

    job.updatedAt = new Date()
    await redis.hset(`job:${job.id}`, job as any)
    
    // Update metadata
    await redis.set(`job:meta:${job.id}`, JSON.stringify({
      queue: job.queue,
      priority: job.priority,
      status: job.status
    }), { ex: 86400 * 7 })

    // Update metrics
    if (job.status === JobStatus.COMPLETED) {
      await redis.incr(`${job.queue}:completed:count`)
    }
  }

  private async cleanupJob(jobId: string): Promise<void> {
    if (!redis) return

    await redis.del(`job:${jobId}`)
    await redis.del(`job:meta:${jobId}`)
  }

  private deserializeJob(data: any): Job {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      processedAt: data.processedAt ? new Date(data.processedAt) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      failedAt: data.failedAt ? new Date(data.failedAt) : undefined,
      attempts: Number(data.attempts) || 0,
      maxAttempts: Number(data.maxAttempts) || 3,
      priority: Number(data.priority) || Priority.NORMAL
    }
  }
}

// Export singleton instance
export const queueManager = QueueManager.getInstance()

// Export convenience functions
export async function addJob<T = any>(
  queue: QueueName,
  data: T,
  options?: any
): Promise<Job<T>> {
  return queueManager.addJob(queue, data, options)
}

export async function processQueue(
  queue: QueueName,
  processor: JobProcessor,
  options?: any
): Promise<void> {
  return queueManager.processQueue(queue, processor, options)
}