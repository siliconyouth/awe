# AWE Knowledge Monitoring System - Setup Guide

## 🚀 Quick Start

### 1. Environment Variables

Add these to your `.env.local`:

```env
# Required: Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Required: Authentication
ADMIN_TOKEN=your-secure-admin-token
CRON_SECRET=your-secure-cron-secret

# Optional: AI Services (for pattern extraction)
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Notifications
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/...

# Optional: External Services
BROWSERLESS_API_KEY=...  # For serverless Playwright
UPSTASH_REDIS_URL=...     # For job queue
S3_BUCKET=...              # For large content storage
```

### 2. Database Setup

Run the migrations to add knowledge monitoring tables:

```bash
cd apps/web
npm run db:generate
npm run db:push
```

### 3. Deploy to Vercel

```bash
vercel --prod
```

### 4. Configure Cron Jobs

Vercel will automatically detect the `vercel.json` and set up cron jobs.

To verify cron jobs are working:
```bash
vercel cron ls
```

## 📖 Usage

### Access Admin Panel

1. Navigate to `https://your-domain.vercel.app/admin/knowledge`
2. Use your admin token to authenticate
3. Start adding knowledge sources

### Add a Knowledge Source

1. Go to the Sources tab
2. Fill in:
   - **URL**: Web page to monitor
   - **Name**: Friendly name
   - **Description**: What this source contains
   - **Context**: Tell AI what to look for
   - **Category**: Type of content
   - **Check Frequency**: How often to check
   - **Custom AI Prompt**: (Optional) Specific extraction instructions

3. Click "Add Source"

### Review Patterns

1. Go to the Review Queue tab
2. See patterns extracted by AI
3. For each pattern:
   - **Approve**: Add to knowledge base
   - **Refine with AI**: Improve with feedback
   - **Reject**: Discard pattern

### Explore Approved Patterns

1. Go to the Patterns tab
2. Search and filter patterns
3. Click to view details
4. Copy to use in your projects

### Monitor Analytics

1. Go to the Analytics tab
2. View:
   - Change frequency over time
   - Most active sources
   - Pattern distribution
   - Error tracking

## 🔧 Configuration

### Categories

Default categories available:
- `documentation` - Technical docs
- `blog` - Blog posts and articles
- `api` - API references
- `examples` - Code examples
- `changelog` - Release notes
- `prompts` - AI prompts
- `config` - Configuration files

### Check Frequencies

- `HOURLY` - Every hour
- `DAILY` - Once per day
- `WEEKLY` - Once per week
- `MONTHLY` - Once per month

### Pattern Types

Patterns are automatically categorized as:
- `CODE_EXAMPLE` - Code snippets
- `CONFIGURATION` - Config files
- `SYSTEM_PROMPT` - AI prompts
- `BEST_PRACTICE` - Recommended approaches
- `USE_CASE` - Example applications
- `API_PATTERN` - API usage patterns
- `ERROR_PATTERN` - Common errors
- `PERFORMANCE_TIP` - Optimization tips
- `SECURITY_PRACTICE` - Security recommendations

## 🔌 External Services

### Browserless (Optional)

For sites requiring JavaScript rendering:

1. Sign up at [browserless.io](https://browserless.io)
2. Get API key
3. Add to environment variables

### Upstash Redis (Optional)

For job queue management:

1. Create database at [upstash.com](https://upstash.com)
2. Enable REST API
3. Add credentials to environment

### S3/R2 Storage (Optional)

For large content storage:

1. Set up S3 bucket or Cloudflare R2
2. Configure access keys
3. Add to environment variables

## 🛠️ API Endpoints

### Public Endpoints

- `GET /api/sources` - List sources
- `POST /api/sources` - Add source
- `GET /api/patterns` - List patterns
- `POST /api/patterns/review` - Review pattern
- `GET /api/monitor` - Get monitoring status
- `POST /api/monitor` - Trigger manual check

### Protected Cron Endpoints

- `GET /api/monitor/cron/hourly` - Hourly checks
- `GET /api/monitor/cron/daily` - Daily checks
- `GET /api/monitor/cron/weekly` - Weekly checks

## 📊 Database Schema

The system uses these main tables:

- `KnowledgeSource` - Monitored URLs
- `KnowledgeVersion` - Historical versions
- `ExtractedPattern` - AI-extracted patterns

## 🔍 Troubleshooting

### Sources Not Being Checked

1. Verify source status is `ACTIVE`
2. Check cron jobs are running: `vercel cron ls`
3. Check logs: `vercel logs`

### AI Extraction Not Working

1. Verify AI API keys are set
2. Check AI service quotas
3. Review custom prompts for errors

### Admin Panel Access Issues

1. Verify `ADMIN_TOKEN` is set
2. Clear browser cookies
3. Check middleware configuration

## 🚀 Advanced Features

### Custom Extraction Rules

Add JSON rules to a source:

```json
{
  "selectors": {
    "title": "h1",
    "content": ".main-content",
    "code": "pre code"
  },
  "exclude": [".sidebar", ".footer"],
  "patterns": {
    "api_endpoints": "regex:/\\/api\\/[\\w-]+/g"
  }
}
```

### AI Prompt Customization

Example custom prompt:

```
Focus on React hooks and components.
Extract:
1. Hook patterns with dependencies
2. Component composition patterns
3. Performance optimization techniques
4. Common pitfalls and solutions

Ignore styling and CSS-related content.
```

### Webhook Notifications

Set up Slack/Discord webhooks for:
- New patterns ready for review
- Source errors
- Daily summaries

## 📈 Monitoring & Metrics

Track system health:

```sql
-- Patterns pending review
SELECT COUNT(*) FROM "ExtractedPattern" 
WHERE status = 'PENDING';

-- Sources with errors
SELECT name, "errorCount", "lastError" 
FROM "KnowledgeSource" 
WHERE "errorCount" > 0;

-- Daily change rate
SELECT DATE("timestamp"), COUNT(*) 
FROM "KnowledgeVersion" 
GROUP BY DATE("timestamp") 
ORDER BY DATE("timestamp") DESC;
```

## 🔐 Security

1. Always use environment variables for secrets
2. Implement proper authentication for admin panel
3. Use HTTPS in production
4. Regularly rotate API keys
5. Monitor for scraping errors and rate limits

## 📝 License

Part of the AWE project - MIT License