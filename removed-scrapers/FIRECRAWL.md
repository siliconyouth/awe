# Firecrawl Integration

AWE now includes integrated support for Firecrawl, a powerful web scraping service that provides reliable extraction of web content.

## Setup

### Option 1: Self-Host Firecrawl (No Rate Limits!)

Run your own Firecrawl instance with no rate limits:

```bash
# Start self-hosted Firecrawl
cd firecrawl
./start.sh

# Configure AWE to use it
export FIRECRAWL_API_URL=http://localhost:3002
```

See [firecrawl/README.md](../firecrawl/README.md) for detailed setup instructions.

### Option 2: Use Firecrawl Cloud API

1. Sign up for a Firecrawl account at https://firecrawl.dev
2. Get your API key from the dashboard
3. Set the environment variable:

```bash
export FIRECRAWL_API_KEY="your-api-key-here"
# or
export AWE_FIRECRAWL_API_KEY="your-api-key-here"
```

### Option 3: Use Legacy Scraper

If you don't have Firecrawl configured, AWE will automatically fall back to the built-in legacy scraper.

## Usage

### Scrape a specific URL

```bash
# With Firecrawl (if API key is set)
awe learn --url https://docs.anthropic.com/en/docs/claude-code

# With specific depth and page limits
awe learn --url https://claudelog.com/ --depth 3 --pages 20

# Force legacy scraper
awe learn --url https://example.com --legacy
```

### Command Options

- `--url <url>` - URL to scrape
- `--depth <number>` - Crawl depth (default: 2)
- `--pages <number>` - Max pages to crawl (default: 10)
- `--source <name>` - Source name for database storage
- `--firecrawl` - Force use of Firecrawl API
- `--legacy` - Force use of legacy scraper

## Features

### Firecrawl Scraper
- **Crawl websites** - Follow links and scrape multiple pages
- **Batch scraping** - Efficiently scrape multiple URLs
- **Map websites** - Discover all URLs on a site
- **Extract structured data** - Use LLM to extract specific information
- **Pattern recognition** - Automatically identify:
  - Configuration patterns
  - Best practices
  - Code examples
  - Anti-patterns
  - Documentation

### Legacy Scraper
- Basic HTML parsing
- Code block extraction
- Simple link following
- Pattern detection

## Pattern Extraction

AWE automatically extracts various patterns from scraped content:

1. **Documentation** - References to Claude Code, CLAUDE.md
2. **Configuration** - Setup instructions, configuration files
3. **Code Examples** - Code snippets and examples
4. **Best Practices** - Recommended approaches
5. **Anti-patterns** - Practices to avoid

## Database Storage

Scraped content and patterns are stored in the database for later retrieval:

- `KnowledgeSource` - Tracked documentation sources
- `KnowledgeUpdate` - Scraped content snapshots
- `KnowledgePattern` - Extracted patterns and insights

## Performance

- **Self-Hosted Firecrawl**: No rate limits, full control, requires Docker
- **Cloud Firecrawl**: Fast, managed, has rate limits based on plan
- **Legacy Scraper**: Basic, works offline, limited JavaScript support

## Troubleshooting

### No Configuration Warning
```
⚠️  Firecrawl not configured. Falling back to legacy scraper.
```

Solution: Either:
- Set `FIRECRAWL_API_URL` for self-hosted instance
- Set `FIRECRAWL_API_KEY` for cloud API

### Rate Limiting
Firecrawl has rate limits based on your plan. The scraper will automatically wait between requests.

### CORS Issues (Legacy Scraper)
The legacy scraper may fail on some sites due to CORS restrictions. Use Firecrawl for better compatibility.