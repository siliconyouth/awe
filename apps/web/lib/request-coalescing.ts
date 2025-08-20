/**
 * Request Coalescing Service
 * Prevents duplicate API calls by sharing in-flight requests
 */

type RequestKey = string
type RequestPromise<T> = Promise<T>

interface CoalescedRequest<T> {
  promise: RequestPromise<T>
  timestamp: number
  refCount: number
}

class RequestCoalescingService {
  private inFlightRequests = new Map<RequestKey, CoalescedRequest<any>>()
  private readonly maxAge = 5000 // 5 seconds
  
  /**
   * Generate a unique key for a request
   */
  private generateKey(
    url: string,
    options?: RequestInit,
    params?: Record<string, any>
  ): RequestKey {
    const sortedParams = params
      ? Object.keys(params)
          .sort()
          .map(key => `${key}=${params[key]}`)
          .join('&')
      : ''
    
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    
    return `${method}:${url}:${sortedParams}:${body}`
  }
  
  /**
   * Execute a request with coalescing
   */
  async execute<T>(
    key: RequestKey,
    requestFn: () => RequestPromise<T>
  ): Promise<T> {
    // Check if there's an in-flight request
    const existing = this.inFlightRequests.get(key)
    
    if (existing && Date.now() - existing.timestamp < this.maxAge) {
      // Increment reference count
      existing.refCount++
      
      // Return the existing promise
      try {
        return await existing.promise
      } finally {
        // Decrement reference count
        existing.refCount--
        
        // Clean up if no more references
        if (existing.refCount === 0) {
          this.inFlightRequests.delete(key)
        }
      }
    }
    
    // Create new request
    const promise = requestFn()
    
    // Store the in-flight request
    this.inFlightRequests.set(key, {
      promise,
      timestamp: Date.now(),
      refCount: 1
    })
    
    try {
      const result = await promise
      return result
    } finally {
      // Clean up after request completes
      const current = this.inFlightRequests.get(key)
      if (current) {
        current.refCount--
        if (current.refCount === 0) {
          this.inFlightRequests.delete(key)
        }
      }
    }
  }
  
  /**
   * Fetch with request coalescing
   */
  async fetch<T = any>(
    url: string,
    options?: RequestInit,
    params?: Record<string, any>
  ): Promise<T> {
    const key = this.generateKey(url, options, params)
    
    return this.execute(key, async () => {
      // Build URL with params
      const urlObj = new URL(url, window.location.origin)
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          urlObj.searchParams.append(k, String(v))
        })
      }
      
      const response = await fetch(urlObj.toString(), options)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response.json()
    })
  }
  
  /**
   * Clear all in-flight requests
   */
  clear(): void {
    this.inFlightRequests.clear()
  }
  
  /**
   * Get statistics about in-flight requests
   */
  getStats(): {
    inFlightCount: number
    totalRefCount: number
    oldestRequest: number | null
  } {
    let totalRefCount = 0
    let oldestTimestamp: number | null = null
    
    this.inFlightRequests.forEach(request => {
      totalRefCount += request.refCount
      if (!oldestTimestamp || request.timestamp < oldestTimestamp) {
        oldestTimestamp = request.timestamp
      }
    })
    
    return {
      inFlightCount: this.inFlightRequests.size,
      totalRefCount,
      oldestRequest: oldestTimestamp ? Date.now() - oldestTimestamp : null
    }
  }
}

// Create singleton instance
export const requestCoalescing = new RequestCoalescingService()

// React hook for request coalescing
import { useCallback, useRef } from 'react'

export function useCoalescedFetch<T = any>() {
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const fetch = useCallback(async (
    url: string,
    options?: RequestInit,
    params?: Record<string, any>
  ): Promise<T> => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    // Merge abort signal with options
    const fetchOptions = {
      ...options,
      signal: abortControllerRef.current.signal
    }
    
    try {
      return await requestCoalescing.fetch<T>(url, fetchOptions, params)
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled')
      }
      throw error
    }
  }, [])
  
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])
  
  return { fetch, cancel }
}

// Batch request handler
interface BatchRequest {
  id: string
  url: string
  options?: RequestInit
  params?: Record<string, any>
}

interface BatchResponse<T = any> {
  id: string
  data?: T
  error?: Error
}

export class BatchRequestHandler {
  private queue: BatchRequest[] = []
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly batchDelay = 10 // 10ms delay to collect requests
  private readonly maxBatchSize = 10
  
  /**
   * Add a request to the batch queue
   */
  async add<T = any>(
    url: string,
    options?: RequestInit,
    params?: Record<string, any>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9)
      
      this.queue.push({
        id,
        url,
        options,
        params
      })
      
      // Store resolve/reject for later
      const handlers = { resolve, reject }
      ;(this.queue[this.queue.length - 1] as any).handlers = handlers
      
      // Schedule batch processing
      this.scheduleBatch()
    })
  }
  
  /**
   * Schedule batch processing
   */
  private scheduleBatch(): void {
    if (this.batchTimeout) return
    
    this.batchTimeout = setTimeout(() => {
      this.processBatch()
    }, this.batchDelay)
  }
  
  /**
   * Process the batch queue
   */
  private async processBatch(): Promise<void> {
    this.batchTimeout = null
    
    if (this.queue.length === 0) return
    
    // Take up to maxBatchSize requests
    const batch = this.queue.splice(0, this.maxBatchSize)
    
    // Process requests in parallel
    const results = await Promise.allSettled(
      batch.map(async (request) => {
        try {
          const data = await requestCoalescing.fetch(
            request.url,
            request.options,
            request.params
          )
          return { id: request.id, data }
        } catch (error) {
          return { id: request.id, error }
        }
      })
    )
    
    // Resolve/reject promises
    results.forEach((result, index) => {
      const request = batch[index] as any
      if (result.status === 'fulfilled') {
        const { data, error } = result.value as BatchResponse
        if (error) {
          request.handlers.reject(error)
        } else {
          request.handlers.resolve(data)
        }
      } else {
        request.handlers.reject(result.reason)
      }
    })
    
    // Process remaining requests if any
    if (this.queue.length > 0) {
      this.scheduleBatch()
    }
  }
}

// Export batch handler instance
export const batchRequests = new BatchRequestHandler()

// Deduplicated subscription manager
export class SubscriptionManager<T = any> {
  private subscriptions = new Map<string, Set<(data: T) => void>>()
  private dataCache = new Map<string, T>()
  private updateTimers = new Map<string, NodeJS.Timeout>()
  
  /**
   * Subscribe to updates for a key
   */
  subscribe(
    key: string,
    callback: (data: T) => void,
    fetchFn: () => Promise<T>,
    refreshInterval?: number
  ): () => void {
    // Get or create subscription set
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set())
      
      // Initial fetch
      this.refresh(key, fetchFn)
      
      // Set up refresh interval if specified
      if (refreshInterval) {
        const timer = setInterval(() => {
          this.refresh(key, fetchFn)
        }, refreshInterval)
        this.updateTimers.set(key, timer)
      }
    }
    
    // Add callback to subscriptions
    const callbacks = this.subscriptions.get(key)!
    callbacks.add(callback)
    
    // Send cached data if available
    if (this.dataCache.has(key)) {
      callback(this.dataCache.get(key)!)
    }
    
    // Return unsubscribe function
    return () => {
      callbacks.delete(callback)
      
      // Clean up if no more subscribers
      if (callbacks.size === 0) {
        this.subscriptions.delete(key)
        this.dataCache.delete(key)
        
        // Clear update timer
        const timer = this.updateTimers.get(key)
        if (timer) {
          clearInterval(timer)
          this.updateTimers.delete(key)
        }
      }
    }
  }
  
  /**
   * Refresh data for a key
   */
  private async refresh(key: string, fetchFn: () => Promise<T>): Promise<void> {
    try {
      const data = await fetchFn()
      this.dataCache.set(key, data)
      
      // Notify all subscribers
      const callbacks = this.subscriptions.get(key)
      if (callbacks) {
        callbacks.forEach(callback => callback(data))
      }
    } catch (error) {
      console.error(`Failed to refresh data for key ${key}:`, error)
    }
  }
  
  /**
   * Manually trigger a refresh
   */
  async forceRefresh(key: string, fetchFn: () => Promise<T>): Promise<void> {
    await this.refresh(key, fetchFn)
  }
}

// Export subscription manager instance
export const subscriptions = new SubscriptionManager()