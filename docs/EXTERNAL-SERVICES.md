# External Services Configuration

## Overview

AWE integrates with several external services to provide enhanced functionality:

1. **Browserless** - Headless Chrome automation for web scraping
2. **Upstash** - Serverless Redis for caching and rate limiting
3. **Clerk** - Authentication and user management (already configured)

## Browserless Configuration

### What is Browserless?

Browserless is a headless Chrome service that allows you to run browser automation tasks without managing Chrome instances. It's perfect for:
- Web scraping dynamic content
- Taking screenshots
- Generating PDFs
- Form automation
- Testing

### Setup Options

#### Option 1: Cloud Service (Recommended for Production)

1. Sign up at [browserless.io](https://www.browserless.io/)
2. Get your API key from the dashboard
3. Add to your `.env.local`:
   ```bash
   BROWSERLESS_API_KEY=your-api-key
   BROWSERLESS_URL=https://chrome.browserless.io
   ```

#### Option 2: Self-Hosted (Free)

Run Browserless locally with Docker:

```bash
docker run -p 3000:3000 browserless/chrome
```

Then configure:
```bash
BROWSERLESS_URL=http://localhost:3000
# No API key needed for local instance
```

### Usage Example

```typescript
import { browserless } from '@/lib/browserless';

// Take a screenshot
const screenshot = await browserless.screenshot('https://example.com', {
  fullPage: true,
  type: 'png'
});

// Scrape content
const content = await browserless.scrape('https://example.com', {
  selector: '.main-content',
  waitForSelector: '.loaded'
});

// Generate PDF
const pdf = await browserless.pdf('https://example.com', {
  format: 'A4',
  landscape: false
});
```

## Upstash Configuration

### What is Upstash?

Upstash provides serverless Redis that's perfect for:
- Rate limiting API endpoints
- Caching expensive operations
- Session storage
- Queue management
- Distributed locks

### Setup

1. Sign up at [upstash.com](https://upstash.com/)
2. Create a new Redis database
3. Copy your credentials
4. Add to your `.env.local`:
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

### Rate Limiting Configuration

The system includes pre-configured rate limiters:

| Limiter | Limit | Window | Use Case |
|---------|-------|--------|----------|
| API | 10 requests | 10 seconds | General API endpoints |
| Scraper | 5 requests | 1 minute | Web scraping operations |
| AI | 20 requests | 1 minute | AI model calls |
| Auth | 5 attempts | 15 minutes | Authentication attempts |

### Usage Examples

#### Rate Limiting

```typescript
import { rateLimited } from '@/lib/rate-limit';

// Protect an API route
export const POST = rateLimited(async (request) => {
  // Your handler code
}, 'api');
```

#### Caching

```typescript
import { cache } from '@/lib/upstash';

// Get or set cache
const data = await cache.getOrSet(
  'expensive-operation',
  async () => {
    // Expensive operation
    return await fetchData();
  },
  3600 // TTL in seconds
);

// Simple get/set
await cache.set('key', value, 3600);
const value = await cache.get('key');
```

#### Session Storage

```typescript
import { sessionStore } from '@/lib/upstash';

// Store session data
await sessionStore.set(sessionId, userData);

// Retrieve session
const userData = await sessionStore.get(sessionId);

// Extend session
await sessionStore.extend(sessionId);
```

#### Queue Management

```typescript
import { Queue } from '@/lib/upstash';

const jobQueue = new Queue('jobs');

// Add to queue
await jobQueue.push({ task: 'process', data: payload });

// Process queue
const job = await jobQueue.pop();
```

## API Endpoints

### `/api/scrape` - Web Scraping Endpoint

Protected endpoint for web scraping using Browserless.

**Method:** POST  
**Authentication:** Required  
**Rate Limit:** 5 requests per minute

**Request Body:**
```json
{
  "url": "https://example.com",
  "type": "content", // or "screenshot", "pdf"
  "options": {
    // Type-specific options
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "content",
    "data": "scraped content"
  },
  "cached": false
}
```

## Monitoring and Debugging

### Rate Limit Headers

All rate-limited endpoints return headers:
- `X-RateLimit-Limit` - Total request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp
- `Retry-After` - Seconds until reset (on 429 responses)

### Cache Monitoring

Check cache status:
```typescript
const exists = await cache.exists('key');
const size = await queue.size();
```

### Error Handling

Both services gracefully degrade when not configured:
- Without Browserless: Scraping endpoints return configuration error
- Without Upstash: Rate limiting is bypassed, caching is disabled

## Cost Considerations

### Browserless
- **Free tier:** Self-hosted with Docker
- **Paid plans:** Start at $59/month for 1,000 minutes

### Upstash
- **Free tier:** 10,000 requests/day, 256MB storage
- **Paid plans:** Pay-per-request model, very cost-effective

## Security Best Practices

1. **API Keys:** Never commit API keys to version control
2. **Rate Limiting:** Always implement rate limiting on public endpoints
3. **Caching:** Be careful with sensitive data in cache
4. **Validation:** Always validate URLs before scraping
5. **Timeouts:** Set appropriate timeouts for scraping operations

## Troubleshooting

### Browserless Issues

**Connection Failed:**
- Check API key is valid
- Verify BROWSERLESS_URL is accessible
- For self-hosted, ensure Docker container is running

**Timeout Errors:**
- Increase timeout in browserless config
- Check if target site is blocking automated browsers

### Upstash Issues

**Rate Limit Not Working:**
- Verify Redis credentials are correct
- Check if Redis instance is active
- Ensure middleware is properly configured

**Cache Misses:**
- Check TTL values
- Verify Redis connection
- Monitor Redis memory usage

## Local Development

For local development without external services:

1. **Mock Mode:** Services work in degraded mode when not configured
2. **Docker Compose:** Use provided docker-compose for local services
3. **Environment Variables:** Use `.env.local` for development

```yaml
# docker-compose.yml for local services
version: '3'
services:
  browserless:
    image: browserless/chrome
    ports:
      - "3000:3000"
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## Next Steps

1. Sign up for services and add credentials to `.env.local`
2. Test the `/api/scrape` endpoint
3. Monitor rate limits in production
4. Set up alerts for service failures
5. Implement caching strategies for expensive operations