#!/bin/bash

# Test connection to self-hosted Firecrawl

FIRECRAWL_URL="${FIRECRAWL_API_URL:-http://localhost:3002}"

echo "🔍 Testing connection to Firecrawl at $FIRECRAWL_URL"
echo ""

# Test health endpoint
echo "📡 Checking health endpoint..."
if curl -s "$FIRECRAWL_URL/health" > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed - is Firecrawl running?"
    echo "   Run: cd firecrawl && ./start.sh"
    exit 1
fi

# Test scraping a simple page
echo ""
echo "🧪 Testing scrape endpoint..."
RESPONSE=$(curl -s -X POST "$FIRECRAWL_URL/v0/scrape" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "formats": ["markdown"]
  }' 2>&1)

if echo "$RESPONSE" | grep -q "Example Domain"; then
    echo "✅ Scraping test passed"
    echo ""
    echo "🎉 Firecrawl is working! You can now use it with AWE:"
    echo ""
    echo "   export FIRECRAWL_API_URL=$FIRECRAWL_URL"
    echo "   awe learn --url https://example.com"
else
    echo "⚠️  Scraping test returned unexpected response"
    echo "Response: $RESPONSE"
fi