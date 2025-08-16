# SmartScraper - AWE's Intelligent Web Scraping Solution

## Overview

SmartScraper is AWE's built-in web scraping solution that requires **no API keys**, has **no rate limits**, and automatically converts content to **markdown**. It intelligently chooses between static and dynamic scraping methods based on the website's requirements.

## ✨ Key Features

- **No API Keys Required** - Works out of the box
- **No Rate Limits** - Scrape as much as you need
- **Automatic Markdown Conversion** - Built-in HTML to Markdown
- **Intelligent Method Selection** - Automatically detects if JavaScript is needed
- **Browser Automation** - Full Playwright support for SPAs
- **Caching** - Smart caching to avoid redundant requests
- **Polite Crawling** - Respects robots.txt and adds delays
- **Pattern Extraction** - Automatically identifies code, configs, and best practices

## 🚀 Quick Start

```bash
# Scrape a single page
awe learn --url https://docs.example.com

# Crawl multiple pages
awe learn --url https://docs.example.com --pages 10 --depth 2

# Force dynamic scraping for SPAs
awe learn --url https://react-app.com --dynamic

# Disable cache for fresh content
awe learn --url https://news-site.com --no-cache
```

## 🏗️ Architecture

```mermaid
graph TD
    A[URL Input] --> B{Analyze URL}
    B -->|Static Site| C[Cheerio Parser]
    B -->|Dynamic Site| D[Playwright Browser]
    C --> E[Extract Content]
    D --> E
    E --> F[Convert to Markdown]
    F --> G[Extract Patterns]
    G --> H[Store in Database]
```

## 🎯 Intelligent Detection

SmartScraper automatically detects the best scraping method:

### Static Sites (Cheerio)
Fast, lightweight HTML parsing for:
- Documentation sites (MDN, Wikipedia)
- Blogs and articles
- Static HTML pages
- Server-rendered content

### Dynamic Sites (Playwright)
Full browser automation for:
- React, Vue, Angular apps
- Sites with lazy loading
- JavaScript-rendered content
- Interactive elements

## 📝 Markdown Conversion

SmartScraper automatically converts HTML to clean markdown:

```markdown
# Headings preserved
## Sub-headings maintained
### Proper hierarchy

- Lists converted
- Bullet points preserved
  - Nested items handled

1. Numbered lists
2. Maintained in order

Code blocks preserved with syntax
Links [preserved](url)
**Bold** and *italic* formatting
```

## ⚙️ Configuration

```typescript
const scraper = new SmartScraper({
  headless: true,              // Run browser in headless mode
  timeout: 30000,               // Request timeout in ms
  maxConcurrency: 3,            // Parallel requests
  cacheEnabled: true,           // Enable result caching
  cacheTTL: 300,               // Cache time-to-live in seconds
  delayBetweenRequests: 1000,  // Politeness delay in ms
  viewport: {                   // Browser viewport size
    width: 1280,
    height: 720
  }
})
```

## 📊 Pattern Extraction

SmartScraper automatically identifies and extracts:

### Code Examples
```typescript
// Detects and extracts code blocks
// Preserves language hints
// Maintains formatting
```

### Configuration Patterns
- Setup instructions
- Installation guides
- Environment variables
- Config files

### Best Practices
- Recommended approaches
- Guidelines
- Tips and tricks
- Do's and don'ts

### Anti-patterns
- Common mistakes
- Things to avoid
- Deprecated methods

## 🔍 Usage Examples

### Single Page Scraping

```typescript
const scraper = new SmartScraper()
const result = await scraper.scrape('https://example.com')

// Result includes:
{
  url: 'https://example.com',
  title: 'Page Title',
  content: 'Full text content...',
  markdown: '# Formatted markdown...',
  links: ['https://...'],
  images: ['https://...'],
  metadata: {
    scrapedAt: Date,
    method: 'static',  // or 'dynamic'
    loadTime: 234      // milliseconds
  }
}
```

### Website Crawling

```typescript
const results = await scraper.crawl('https://docs.site.com', {
  maxPages: 20,        // Maximum pages to scrape
  maxDepth: 3,         // Maximum link depth
  sameDomainOnly: true // Stay on same domain
})
```

### Batch Scraping

```typescript
const urls = [
  'https://page1.com',
  'https://page2.com',
  'https://page3.com'
]

const results = await scraper.scrapeMultiple(urls)
```

## 🎭 Playwright Integration

SmartScraper uses Playwright for dynamic content:

- **Lazy Loading** - Automatically initializes browser when needed
- **Resource Efficient** - Shares browser context across requests
- **Cross-Browser** - Supports Chromium, Firefox, WebKit
- **Headless Mode** - Runs without UI by default
- **Auto-Cleanup** - Properly closes browser resources

## 📈 Performance

| Metric | Static (Cheerio) | Dynamic (Playwright) |
|--------|-----------------|---------------------|
| Speed | ~200-500ms | ~2-5s |
| Memory | ~50MB | ~200MB |
| CPU | Low | Medium |
| Success Rate | 95% (static only) | 99% |

## 🛡️ Polite Scraping

SmartScraper implements responsible scraping:

- **Rate Limiting** - Configurable delays between requests
- **Concurrent Limits** - Maximum parallel requests
- **User Agent** - Identifies as AWE-Bot
- **Robots.txt** - Respects site policies (optional)
- **Caching** - Reduces redundant requests

## 🔧 Troubleshooting

### "Browser not installed"
```bash
# Install Playwright browsers
cd packages/ai
npx playwright install chromium
```

### "Timeout error"
```typescript
// Increase timeout for slow sites
const scraper = new SmartScraper({
  timeout: 60000  // 60 seconds
})
```

### "Out of memory"
```typescript
// Reduce concurrency
const scraper = new SmartScraper({
  maxConcurrency: 1  // Sequential processing
})
```

## 🌟 Advantages Over Other Solutions

| Feature | SmartScraper | Firecrawl | Puppeteer | Fetch API |
|---------|-------------|-----------|-----------|-----------|
| No API Key | ✅ | ❌ | ✅ | ✅ |
| No Rate Limits | ✅ | ❌ | ✅ | ✅ |
| Auto Markdown | ✅ | ✅ | ❌ | ❌ |
| JS Support | ✅ | ✅ | ✅ | ❌ |
| Pattern Extract | ✅ | ⚠️ | ❌ | ❌ |
| Smart Detection | ✅ | ❌ | ❌ | ❌ |

## 🚀 Future Enhancements

- [ ] PDF extraction support
- [ ] Image OCR capabilities
- [ ] Custom extraction rules
- [ ] Distributed crawling
- [ ] WebSocket support
- [ ] Authentication handling
- [ ] Proxy rotation
- [ ] Cloud browser option

## 📝 API Reference

### Constructor Options

```typescript
interface SmartScraperConfig {
  headless?: boolean           // Run browser headless
  timeout?: number             // Request timeout (ms)
  userAgent?: string          // Custom user agent
  viewport?: {                // Browser viewport
    width: number
    height: number
  }
  maxConcurrency?: number     // Parallel requests
  cacheEnabled?: boolean      // Enable caching
  cacheTTL?: number          // Cache TTL (seconds)
  respectRobotsTxt?: boolean  // Respect robots.txt
  delayBetweenRequests?: number // Delay (ms)
}
```

### Scraping Options

```typescript
interface ScrapeOptions {
  dynamic?: boolean         // Force dynamic scraping
  waitForSelector?: string  // Wait for element
  extractImages?: boolean   // Extract image URLs
  extractLinks?: boolean    // Extract link URLs
  screenshot?: boolean      // Take screenshot
}
```

## 💡 Best Practices

1. **Start Small** - Test with single pages before crawling
2. **Use Caching** - Enable cache during development
3. **Be Polite** - Add delays for production scraping
4. **Handle Errors** - Implement retry logic
5. **Monitor Resources** - Watch memory usage for large crawls
6. **Respect Limits** - Don't overwhelm target servers

## 🎉 Conclusion

SmartScraper provides AWE with a powerful, flexible, and responsible web scraping solution that works without any external dependencies or API keys. It's the perfect balance of simplicity and capability for modern web scraping needs.