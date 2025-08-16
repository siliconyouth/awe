import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Upstash Redis Configuration
 * Provides serverless Redis for caching and rate limiting
 */

// Initialize Redis client
const getRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Upstash Redis credentials not configured. Some features may be limited.');
    return null;
  }

  return new Redis({
    url,
    token,
  });
};

export const redis = getRedisClient();

/**
 * Rate Limiting Configurations
 */

// Rate limiter for API endpoints (10 requests per 10 seconds)
export const apiRateLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: '@upstash/ratelimit/api',
}) : null;

// Rate limiter for scraping (5 requests per minute)
export const scraperRateLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/scraper',
}) : null;

// Rate limiter for AI requests (20 requests per minute)
export const aiRateLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/ai',
}) : null;

// Rate limiter for authentication attempts (5 attempts per 15 minutes)
export const authRateLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, '15 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/auth',
}) : null;

/**
 * Cache Utilities
 */

export class Cache {
  private static instance: Cache;
  private redis: Redis | null;
  private defaultTTL: number = 3600; // 1 hour default

  private constructor() {
    this.redis = getRedisClient();
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    
    try {
      const value = await this.redis.get(key);
      return value as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      await this.redis.set(key, value, {
        ex: ttl || this.defaultTTL,
      });
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Set value with expiration
   */
  async setex(key: string, seconds: number, value: any): Promise<boolean> {
    return this.set(key, value, seconds);
  }

  /**
   * Get and delete (pop) a value
   */
  async pop<T = any>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    
    try {
      const value = await this.get<T>(key);
      if (value !== null) {
        await this.delete(key);
      }
      return value;
    } catch (error) {
      console.error('Cache pop error:', error);
      return null;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number | null> {
    if (!this.redis) return null;
    
    try {
      return await this.redis.incr(key);
    } catch (error) {
      console.error('Cache incr error:', error);
      return null;
    }
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number | null> {
    if (!this.redis) return null;
    
    try {
      return await this.redis.decr(key);
    } catch (error) {
      console.error('Cache decr error:', error);
      return null;
    }
  }

  /**
   * Get multiple values
   */
  async mget<T = any>(...keys: string[]): Promise<(T | null)[]> {
    if (!this.redis) return keys.map(() => null);
    
    try {
      const values = await this.redis.mget(...keys);
      return values as (T | null)[];
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Cache with automatic refresh
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetcher();
    
    // Store in cache
    await this.set(key, fresh, ttl);
    
    return fresh;
  }

  /**
   * Clear all cache (use with caution)
   */
  async flush(): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
}

// Export cache singleton
export const cache = Cache.getInstance();

/**
 * Session Store
 */
export class SessionStore {
  private redis: Redis | null;
  private prefix = 'session:';
  private ttl = 86400; // 24 hours

  constructor() {
    this.redis = getRedisClient();
  }

  async get(sessionId: string): Promise<any> {
    if (!this.redis) return null;
    
    try {
      return await this.redis.get(`${this.prefix}${sessionId}`);
    } catch (error) {
      console.error('Session get error:', error);
      return null;
    }
  }

  async set(sessionId: string, data: any, ttl?: number): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      await this.redis.set(`${this.prefix}${sessionId}`, data, {
        ex: ttl || this.ttl,
      });
      return true;
    } catch (error) {
      console.error('Session set error:', error);
      return false;
    }
  }

  async delete(sessionId: string): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      await this.redis.del(`${this.prefix}${sessionId}`);
      return true;
    } catch (error) {
      console.error('Session delete error:', error);
      return false;
    }
  }

  async extend(sessionId: string, ttl?: number): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      await this.redis.expire(`${this.prefix}${sessionId}`, ttl || this.ttl);
      return true;
    } catch (error) {
      console.error('Session extend error:', error);
      return false;
    }
  }
}

export const sessionStore = new SessionStore();

/**
 * Queue Implementation
 */
export class Queue<T = any> {
  private redis: Redis | null;
  private name: string;

  constructor(name: string) {
    this.redis = getRedisClient();
    this.name = `queue:${name}`;
  }

  async push(item: T): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      await this.redis.rpush(this.name, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Queue push error:', error);
      return false;
    }
  }

  async pop(): Promise<T | null> {
    if (!this.redis) return null;
    
    try {
      const item = await this.redis.lpop(this.name);
      return item ? JSON.parse(item as string) : null;
    } catch (error) {
      console.error('Queue pop error:', error);
      return null;
    }
  }

  async peek(): Promise<T | null> {
    if (!this.redis) return null;
    
    try {
      const items = await this.redis.lrange(this.name, 0, 0);
      return items.length > 0 ? JSON.parse(items[0] as string) : null;
    } catch (error) {
      console.error('Queue peek error:', error);
      return null;
    }
  }

  async size(): Promise<number> {
    if (!this.redis) return 0;
    
    try {
      return await this.redis.llen(this.name);
    } catch (error) {
      console.error('Queue size error:', error);
      return 0;
    }
  }

  async clear(): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      await this.redis.del(this.name);
      return true;
    } catch (error) {
      console.error('Queue clear error:', error);
      return false;
    }
  }
}

/**
 * Distributed Lock
 */
export class Lock {
  private redis: Redis | null;
  private name: string;
  private ttl: number;

  constructor(name: string, ttl: number = 30) {
    this.redis = getRedisClient();
    this.name = `lock:${name}`;
    this.ttl = ttl;
  }

  async acquire(timeout: number = 5000): Promise<boolean> {
    if (!this.redis) return true; // No Redis, no locking
    
    const start = Date.now();
    const lockId = Math.random().toString(36);
    
    while (Date.now() - start < timeout) {
      try {
        const result = await this.redis.set(this.name, lockId, {
          nx: true,
          ex: this.ttl,
        });
        
        if (result === 'OK') {
          return true;
        }
      } catch (error) {
        console.error('Lock acquire error:', error);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }

  async release(): Promise<boolean> {
    if (!this.redis) return true;
    
    try {
      await this.redis.del(this.name);
      return true;
    } catch (error) {
      console.error('Lock release error:', error);
      return false;
    }
  }

  async extend(ttl?: number): Promise<boolean> {
    if (!this.redis) return true;
    
    try {
      await this.redis.expire(this.name, ttl || this.ttl);
      return true;
    } catch (error) {
      console.error('Lock extend error:', error);
      return false;
    }
  }
}