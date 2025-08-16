# Self-Hosted Firecrawl for AWE

This directory contains the configuration for running a self-hosted Firecrawl instance for AWE, eliminating rate limits and providing full control over web scraping infrastructure.

## 🚀 Quick Start

1. **Configure environment**:
   ```bash
   cp .env.sample .env
   # Edit .env with your settings
   ```

2. **Start Firecrawl**:
   ```bash
   ./start.sh
   ```

3. **Update AWE configuration**:
   ```bash
   # In your root .env.local or apps/web/.env.local
   FIRECRAWL_API_URL=http://localhost:3002
   # Remove or comment out FIRECRAWL_API_KEY for self-hosted
   ```

## 📋 Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 3002 (API) available

## 🏗️ Architecture

The self-hosted Firecrawl stack includes:

- **API Server**: Main Firecrawl API (port 3002)
- **Worker**: Background job processor
- **Playwright Service**: Browser automation for JavaScript-heavy sites
- **Redis**: Queue and caching

## 🔧 Configuration Options

### Basic Setup (No Auth)

For local development with no authentication:

```env
USE_DB_AUTHENTICATION=false
BULL_AUTH_KEY=your-admin-password
```

### With AI Extraction

To enable AI-powered extraction features:

**Option 1: OpenAI**
```env
OPENAI_API_KEY=sk-...
```

**Option 2: Anthropic Claude**
```env
OPENAI_BASE_URL=https://api.anthropic.com/v1
OPENAI_API_KEY=sk-ant-...
MODEL_NAME=claude-3-opus-20240229
```

**Option 3: Local Ollama**
```env
OLLAMA_BASE_URL=http://host.docker.internal:11434/api
MODEL_NAME=llama3
```

### With Search API

For the `/search` endpoint:

```env
# Option 1: Use Serper
SERPER_API_KEY=your-key

# Option 2: Use SearchAPI
SEARCHAPI_API_KEY=your-key

# Option 3: Self-hosted SearXNG
SEARXNG_ENDPOINT=http://your-searxng:8080
```

## 🔌 Connecting AWE to Self-Hosted Firecrawl

Update your AWE Firecrawl configuration:

```typescript
// In packages/ai/src/firecrawl-scraper.ts
const scraper = new FirecrawlScraper({
  apiUrl: process.env.FIRECRAWL_API_URL || 'http://localhost:3002'
  // No API key needed for self-hosted without auth
})
```

Or set in environment:
```bash
export FIRECRAWL_API_URL=http://localhost:3002
```

## 📊 Admin Panel

Access the Bull Queue admin panel:
- URL: http://localhost:3002/admin
- Username: `bull`
- Password: Value of `BULL_AUTH_KEY` in .env

## 🛠️ Management Commands

**Start services**:
```bash
docker-compose up -d
```

**Stop services**:
```bash
docker-compose down
```

**View logs**:
```bash
docker-compose logs -f
```

**Restart a service**:
```bash
docker-compose restart api
```

**Update to latest version**:
```bash
docker-compose pull
docker-compose up -d
```

## 🚨 Troubleshooting

### Port already in use
Change `FIRECRAWL_PORT` in .env to a different port

### Out of memory
Increase Docker memory allocation or add swap space

### Slow scraping
- Enable `BLOCK_MEDIA=true` to skip images/videos
- Configure a proxy if being rate-limited by target sites
- Scale workers: `docker-compose up -d --scale worker=3`

### Connection refused
Ensure Docker network allows connection from host:
```bash
docker network inspect firecrawl_firecrawl-network
```

## 🔒 Security Considerations

1. **Change default passwords**: Always change `BULL_AUTH_KEY`
2. **Firewall**: Don't expose port 3002 publicly without authentication
3. **API Keys**: Keep AI API keys secure
4. **Updates**: Regularly update Firecrawl for security patches

## 📈 Performance Tuning

For production workloads:

1. **Increase workers**:
   ```yaml
   # In docker-compose.yaml
   worker:
     deploy:
       replicas: 3
   ```

2. **Redis persistence**:
   ```yaml
   redis:
     command: redis-server --bind 0.0.0.0 --appendonly yes
   ```

3. **Resource limits**:
   ```yaml
   api:
     deploy:
       resources:
         limits:
           cpus: '2'
           memory: 2G
   ```

## 🔄 Backup & Recovery

Backup Redis data:
```bash
docker-compose exec redis redis-cli BGSAVE
docker cp awe-firecrawl_redis_1:/data/dump.rdb ./backup/
```

Restore:
```bash
docker cp ./backup/dump.rdb awe-firecrawl_redis_1:/data/
docker-compose restart redis
```

## 📚 Additional Resources

- [Firecrawl Documentation](https://docs.firecrawl.dev)
- [Firecrawl GitHub](https://github.com/mendableai/firecrawl)
- [AWE Documentation](../docs/README.md)

## 💡 Tips

1. **Development**: Use self-hosted for unlimited scraping during development
2. **Production**: Consider Firecrawl Cloud for managed infrastructure
3. **Hybrid**: Use self-hosted for internal sites, cloud for public web
4. **Caching**: Redis caches results - same URL won't re-scrape immediately