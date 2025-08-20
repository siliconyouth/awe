# AWE Services Integration Guide

## Overview

This document provides comprehensive documentation for all integrated services in the AWE platform. These services have been modernized to provide optimal performance, reliability, and scalability.

## Table of Contents

1. [Core Infrastructure](#core-infrastructure)
2. [Caching System](#caching-system)
3. [Search Services](#search-services)
4. [Queue Management](#queue-management)
5. [Monitoring System](#monitoring-system)
6. [Service Configuration](#service-configuration)
7. [API Endpoints](#api-endpoints)
8. [Troubleshooting](#troubleshooting)

## Core Infrastructure

### Technology Stack

- **Redis**: Upstash Redis for caching and rate limiting
- **Vector DB**: Upstash Vector for semantic search
- **Queue**: Bull + Redis for background jobs
- **Monitoring**: Vercel Cron jobs with comprehensive health checks
- **Database**: PostgreSQL with Prisma ORM

### Service Status

| Service | Status | Required | Graceful Degradation |
|---------|--------|----------|---------------------|
| Upstash Redis | ✅ Active | Optional | Yes - Falls back to no cache |
| Upstash Vector | ✅ Active | Optional | Yes - Falls back to keyword search |
| Bull Queues | ✅ Active | Optional | Yes - Jobs skipped if unavailable |
| Monitoring | ✅ Active | Recommended | Yes - Continues without metrics |
| Clerk Auth | ✅ Active | Required | No - Core functionality |
| PostgreSQL | ✅ Active | Required | No - Core functionality |

## Caching System

### Implementation

The caching system uses Upstash Redis with automatic fallback when unavailable.

#### Cache Middleware

```typescript
import { withCache } from '@/lib/cache-middleware'

// Wrap API routes with caching
export async function GET(request: NextRequest) {
  return withCache(async (req) => {
    // Your API logic here
    return NextResponse.json(data)
  }, {
    ttl: 300, // Cache for 5 minutes
    keyPrefix: 'resources',
    includeAuth: false // Public endpoint
  })(request)
}
```

#### Cache Options

- `ttl`: Time to live in seconds (default: 3600)
- `keyPrefix`: Prefix for cache keys (default: 'api')
- `includeAuth`: Include user ID in cache key (default: false)
- `revalidateOnMutation`: Endpoints that invalidate this cache

### Cache Management

```typescript
import { cache, invalidateCache, invalidateUserCache } from '@/lib/upstash'

// Get/Set cache values
const value = await cache.get('key')
await cache.set('key', value, 3600) // TTL in seconds

// Invalidate cache
await invalidateCache('pattern:*')
await invalidateUserCache('userId')

// Increment counters
await cache.incr('counter')
await cache.decr('counter')
```

### Rate Limiting

Multiple rate limiters are configured:

- **API**: 10 requests per 10 seconds
- **Scraper**: 5 requests per minute
- **AI**: 20 requests per minute
- **Auth**: 5 attempts per 15 minutes

## Search Services

### Semantic Search

The platform uses Upstash Vector for semantic search with OpenAI embeddings.

#### Indexing Resources

```typescript
import { indexResource, batchIndexResources } from '@/lib/vector-search'

// Index single resource
await indexResource({
  id: 'resource-id',
  title: 'Resource Title',
  description: 'Description',
  content: 'Full content',
  type: 'PATTERN',
  tags: ['tag1', 'tag2']
})

// Batch index multiple resources
await batchIndexResources(resources)
```

#### Searching

```typescript
import { searchSimilar, findSimilarResources, hybridSearch } from '@/lib/vector-search'

// Semantic search
const results = await searchSimilar('query text', {
  limit: 10,
  filter: { type: 'PATTERN' }
})

// Find similar to existing resource
const similar = await findSimilarResources('resource-id', 5)

// Hybrid search (keyword + semantic)
const hybrid = await hybridSearch('query', keywordResults, {
  semanticWeight: 0.4, // 40% semantic, 60% keyword
  limit: 20
})
```

### Search API Endpoints

#### GET /api/resources/search

Search resources with multiple modes:

```bash
# Hybrid search (default)
GET /api/resources/search?q=your+query

# Pure semantic search
GET /api/resources/search?q=your+query&mode=semantic

# Pure keyword search
GET /api/resources/search?q=your+query&mode=keyword

# Filter by type
GET /api/resources/search?q=your+query&type=PATTERN

# Limit results
GET /api/resources/search?q=your+query&limit=50
```

#### POST /api/resources/reindex

Reindex all resources for semantic search (admin only):

```bash
POST /api/resources/reindex
Authorization: Bearer <token>
```

## Queue Management

### Unified Queue Service

All background jobs are managed through a centralized queue service using Bull + Redis.

#### Queue Types

```typescript
enum QueueName {
  RESOURCE_PROCESSING = 'resource-processing',
  PATTERN_EXTRACTION = 'pattern-extraction',
  KNOWLEDGE_UPDATE = 'knowledge-update',
  SCRAPING = 'scraping',
  INDEXING = 'indexing',
  ANALYTICS = 'analytics',
  NOTIFICATIONS = 'notifications',
  MONITORING = 'monitoring'
}
```

#### Adding Jobs

```typescript
import { 
  queueManager, 
  QueueName, 
  Priority,
  scheduleResourceProcessing,
  schedulePatternExtraction,
  scheduleScraping,
  trackAnalyticsEvent
} from '@awe/ai/services/queue-service'

// Add job to queue
await queueManager.addJob(
  QueueName.RESOURCE_PROCESSING,
  'process-resource',
  { resourceId: 'id', action: 'analyze' },
  { 
    priority: Priority.NORMAL,
    delay: 5000, // Delay 5 seconds
    attempts: 3
  }
)

// Helper functions
await scheduleResourceProcessing('resource-id', 'optimize')
await schedulePatternExtraction('source-id', 'content')
await scheduleScraping('https://example.com', { depth: 2 })
await trackAnalyticsEvent('user_action', { userId: 'id' })
```

#### Queue Management

```typescript
// Get queue health
const health = await queueManager.getQueueHealth()

// Get job counts
const counts = await queueManager.getJobCounts(QueueName.RESOURCE_PROCESSING)
// { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 1 }

// Pause/Resume queues
await queueManager.pauseQueue(QueueName.SCRAPING)
await queueManager.resumeQueue(QueueName.SCRAPING)

// Clean old jobs
await queueManager.cleanQueue(QueueName.ANALYTICS, 3600000, 'completed')
```

## Monitoring System

### Cron Jobs

The monitoring system runs on Vercel Cron with three schedules:

#### Hourly Monitoring (/api/monitor/cron/hourly)

Runs every hour to:
- Check resource freshness
- Monitor knowledge sources
- Check system health
- Capture analytics snapshots
- Send alerts for critical issues

#### Daily Monitoring (/api/monitor/cron/daily)

Runs once per day to:
- Aggregate daily analytics
- Clean up old data (30+ days)
- Re-index resources for search
- Generate daily reports
- Optimize database (ANALYZE)
- Check metrics and send notifications

#### Weekly Monitoring (/api/monitor/cron/weekly)

Runs once per week to:
- Generate weekly summaries
- Deep system analysis
- Long-term trend analysis
- Capacity planning metrics

### Health Checks

System health is monitored across multiple dimensions:

```typescript
{
  database: 'healthy' | 'degraded' | 'unhealthy',
  cache: 'healthy' | 'degraded' | 'unhealthy',
  queues: 'healthy' | 'degraded' | 'unhealthy',
  issues: string[],
  hasIssues: boolean
}
```

### Metrics Collection

Analytics are collected and aggregated:

- **Hourly**: Active users, resource creation, API usage
- **Daily**: Comprehensive metrics, trends, recommendations
- **Weekly**: Long-term patterns, growth metrics

## Service Configuration

### Environment Variables

```env
# Upstash Redis (Optional but recommended)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Upstash Vector (Optional for semantic search)
UPSTASH_VECTOR_REST_URL=https://your-vector.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your-token

# OpenAI (Optional for embeddings)
OPENAI_API_KEY=sk-your-key

# Monitoring
CRON_SECRET=your-secret
NOTIFICATION_WEBHOOK_URL=https://your-webhook.com

# Browserless (Optional for scraping)
BROWSERLESS_API_KEY=your-key
BROWSERLESS_URL=https://chrome.browserless.io
```

### Graceful Degradation

All optional services gracefully degrade when unavailable:

1. **No Redis**: API works without caching
2. **No Vector DB**: Falls back to keyword search
3. **No OpenAI**: Uses simple embedding fallback
4. **No Queues**: Background jobs are skipped
5. **No Browserless**: Scraping features disabled

## API Endpoints

### Resource Management

- `GET /api/resources` - List resources (cached 5min)
- `GET /api/resources/search` - Search resources (hybrid/semantic/keyword)
- `POST /api/resources` - Create resource
- `POST /api/resources/reindex` - Reindex for search (admin)
- `POST /api/resources/seed` - Seed sample data

### Collections

- `GET /api/collections` - List collections
- `POST /api/collections` - Create collection
- `GET /api/collections/[id]` - Get collection
- `PUT /api/collections/[id]` - Update collection
- `DELETE /api/collections/[id]` - Delete collection

### Monitoring

- `GET /api/monitor/cron/hourly` - Hourly monitoring (Cron)
- `GET /api/monitor/cron/daily` - Daily monitoring (Cron)
- `GET /api/monitor/cron/weekly` - Weekly monitoring (Cron)
- `GET /api/health` - Health check endpoint

### Analytics

- `GET /api/analytics` - Get analytics data
- `POST /api/analytics/track` - Track event

## Troubleshooting

### Common Issues

#### Cache Not Working

```typescript
// Check if Redis is connected
if (!cache) {
  console.log('Cache not available - check UPSTASH_REDIS_* env vars')
}

// Test cache
await cache.set('test', 'value')
const value = await cache.get('test')
console.log('Cache test:', value)
```

#### Search Not Working

```typescript
// Check if Vector DB is connected
if (!vectorIndex) {
  console.log('Vector search not available - check UPSTASH_VECTOR_* env vars')
}

// Test indexing
await indexResource({
  id: 'test-id',
  title: 'Test',
  content: 'Test content',
  type: 'PATTERN'
})
```

#### Queues Not Processing

```typescript
// Check queue health
const health = await queueManager.getQueueHealth()
console.log('Queue health:', health)

// Check specific queue
const counts = await queueManager.getJobCounts(QueueName.RESOURCE_PROCESSING)
console.log('Queue counts:', counts)
```

#### Monitoring Not Running

1. Check CRON_SECRET is set
2. Verify Vercel Cron configuration in vercel.json
3. Check logs in Vercel dashboard
4. Test endpoint manually with correct auth header

### Debug Mode

Enable debug logging:

```typescript
// In your API route
console.log('Cache available:', !!cache)
console.log('Vector available:', !!vectorIndex)
console.log('Queue available:', !!queueManager)
```

### Performance Monitoring

Monitor key metrics:

```typescript
// Response time
const start = Date.now()
// ... your code ...
const duration = Date.now() - start
if (cache) {
  await cache.set('metrics:response_time:last', duration)
}

// Error rate
try {
  // ... your code ...
} catch (error) {
  if (cache) {
    await cache.incr('errors:api:count')
  }
  throw error
}
```

## Migration Guide

### From Old System to New

1. **Caching**: Wrap existing endpoints with `withCache`
2. **Search**: Call `/api/resources/reindex` to index existing resources
3. **Queues**: Replace direct function calls with queue jobs
4. **Monitoring**: Ensure cron jobs are configured in Vercel

### Data Migration

```bash
# Reindex all resources for search
curl -X POST https://your-app.com/api/resources/reindex \
  -H "Authorization: Bearer <admin-token>"

# Test search
curl "https://your-app.com/api/resources/search?q=test&mode=hybrid"

# Check monitoring
curl https://your-app.com/api/monitor/cron/hourly \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

## Best Practices

1. **Always check service availability** before using
2. **Use appropriate cache TTL** for different data types
3. **Batch operations** when possible (indexing, queue jobs)
4. **Monitor queue health** regularly
5. **Set up alerts** for critical metrics
6. **Use semantic search** for better user experience
7. **Implement retry logic** for external services
8. **Log important events** for debugging

## Future Enhancements

- [ ] Algolia search integration for instant search
- [ ] Real-time features with WebSocket
- [ ] Advanced analytics dashboard
- [ ] A/B testing framework
- [ ] Machine learning recommendations
- [ ] Distributed tracing
- [ ] Custom metrics dashboards

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in Vercel dashboard
3. Check service health endpoints
4. Contact support with error details

---

*Last updated: August 2025*
*Version: 2.5.0*