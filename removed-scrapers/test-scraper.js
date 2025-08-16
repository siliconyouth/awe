#!/usr/bin/env node

/**
 * Test the web scraper on claudelog.com
 */

const { DocumentationScraper } = require('./packages/ai/dist/index.js');

async function testScraper() {
  console.log('🧠 Testing AWE Web Scraper on claudelog.com\n');
  
  // Create scraper without database (for testing)
  const scraper = new DocumentationScraper();
  
  // Test configuration for claudelog.com
  const config = {
    url: 'https://claudelog.com/',
    selectors: {
      title: 'h1, h2, h3',
      content: 'main, article, .content, body',
      code: 'pre code, code, .code-block',
      links: 'a[href]'
    },
    frequency: 'daily',
    maxDepth: 2
  };
  
  try {
    console.log('📊 Scraping claudelog.com...\n');
    
    // Scrape the main page
    const result = await scraper.scrapeUrl('https://claudelog.com/', config);
    
    console.log('✅ Scraping successful!\n');
    console.log('📄 Page Title:', result.title);
    console.log('📝 Content Length:', result.content.length, 'characters');
    console.log('💬 Word Count:', result.metadata.wordCount, 'words');
    console.log('🔢 Code Examples Found:', result.codeExamples.length);
    
    if (result.codeExamples.length > 0) {
      console.log('\n📦 Sample Code Snippets:');
      result.codeExamples.slice(0, 3).forEach((code, i) => {
        console.log(`\n[${i + 1}] ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}`);
      });
    }
    
    // Extract key information
    console.log('\n🔍 Content Preview:');
    const preview = result.content.substring(0, 500).trim();
    console.log(preview + '...\n');
    
    // Check for Claude-specific patterns
    const claudePatterns = [
      'Claude',
      'Anthropic',
      'AI',
      'assistant',
      'prompt',
      'conversation'
    ];
    
    console.log('🎯 Claude-Related Keywords Found:');
    claudePatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = result.content.match(regex);
      if (matches) {
        console.log(`  • "${pattern}": ${matches.length} occurrences`);
      }
    });
    
  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
    console.error('\nThis might be due to:');
    console.error('  • CORS restrictions (if running in browser)');
    console.error('  • Network issues');
    console.error('  • Site structure changes');
    console.error('  • Rate limiting');
  }
}

// Run the test
testScraper().catch(console.error);