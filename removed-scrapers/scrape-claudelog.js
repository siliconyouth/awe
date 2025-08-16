#!/usr/bin/env node

/**
 * Advanced scraper for claudelog.com to extract Claude Code best practices
 */

async function scrapeClaudeLog() {
  console.log('🧠 Advanced ClaudeLog Scraping for AWE Knowledge Base\n');
  
  // Pages to scrape for Claude Code knowledge
  const pages = [
    { url: 'https://claudelog.com/', name: 'Home' },
    { url: 'https://claudelog.com/install', name: 'Installation' },
    { url: 'https://claudelog.com/tutorial', name: 'Tutorial' },
    { url: 'https://claudelog.com/configuration', name: 'Configuration' },
    { url: 'https://claudelog.com/claude-md', name: 'CLAUDE.md Best Practices' },
    { url: 'https://claudelog.com/agents', name: 'Agents' },
    { url: 'https://claudelog.com/performance', name: 'Performance' },
    { url: 'https://claudelog.com/ultrathink', name: 'Ultrathink++' },
    { url: 'https://claudelog.com/bash-scripts', name: 'Bash Scripts' },
    { url: 'https://claudelog.com/context-depletion', name: 'Context Management' },
    { url: 'https://claudelog.com/tactical-model-selection', name: 'Model Selection' },
    { url: 'https://claudelog.com/sub-agent-tactics', name: 'Sub-agent Tactics' },
    { url: 'https://claudelog.com/mcps', name: 'MCPs & Add-ons' },
    { url: 'https://claudelog.com/vault', name: 'Vault' }
  ];
  
  const knowledge = {
    patterns: [],
    bestPractices: [],
    configurations: [],
    tips: []
  };
  
  for (const page of pages) {
    try {
      console.log(`📄 Fetching ${page.name}...`);
      
      const response = await fetch(page.url, {
        headers: {
          'User-Agent': 'AWE-KnowledgeGatherer/1.0',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });
      
      if (!response.ok) {
        console.log(`  ⚠️  Failed: ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      
      // Extract useful patterns
      const patterns = extractPatterns(html, page.name);
      knowledge.patterns.push(...patterns);
      
      console.log(`  ✅ Found ${patterns.length} patterns`);
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n📊 Knowledge Extraction Summary:');
  console.log(`  • Patterns discovered: ${knowledge.patterns.length}`);
  console.log(`  • Pages processed: ${pages.length}`);
  
  // Display sample patterns
  if (knowledge.patterns.length > 0) {
    console.log('\n🎯 Sample Patterns Found:');
    knowledge.patterns.slice(0, 5).forEach((pattern, i) => {
      console.log(`\n[${i + 1}] ${pattern.type}: ${pattern.name}`);
      console.log(`    ${pattern.description.substring(0, 100)}...`);
    });
  }
  
  // Save to file for analysis
  const fs = require('fs');
  fs.writeFileSync(
    'claudelog-knowledge.json',
    JSON.stringify(knowledge, null, 2)
  );
  console.log('\n💾 Knowledge saved to claudelog-knowledge.json');
  
  return knowledge;
}

function extractPatterns(html, pageName) {
  const patterns = [];
  
  // Remove scripts and styles
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Extract code blocks (these often contain examples)
  const codeBlocks = cleanHtml.match(/<code[^>]*>(.*?)<\/code>/gi) || [];
  codeBlocks.forEach(block => {
    const code = block.replace(/<[^>]+>/g, '').trim();
    if (code.length > 20) {
      patterns.push({
        type: 'code-example',
        name: `Code from ${pageName}`,
        description: code,
        source: pageName,
        confidence: 0.7
      });
    }
  });
  
  // Extract headings and their content (often contain tips)
  const headings = cleanHtml.match(/<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi) || [];
  headings.forEach(heading => {
    const title = heading.replace(/<[^>]+>/g, '').trim();
    if (title && !title.includes('Cookie') && !title.includes('Privacy')) {
      patterns.push({
        type: 'topic',
        name: title,
        description: `Important topic from ${pageName}: ${title}`,
        source: pageName,
        confidence: 0.8
      });
    }
  });
  
  // Look for Claude-specific patterns
  const claudePatterns = [
    { regex: /CLAUDE\.md/gi, type: 'claude-md' },
    { regex: /context\s+(window|depletion|management)/gi, type: 'context-management' },
    { regex: /sub[\s-]?agent/gi, type: 'sub-agents' },
    { regex: /ultrathink/gi, type: 'ultrathinking' },
    { regex: /MCP\s|Model\s+Context\s+Protocol/gi, type: 'mcp' },
    { regex: /performance|optimization/gi, type: 'performance' },
    { regex: /bash\s+script/gi, type: 'bash-scripting' },
    { regex: /memory|vault/gi, type: 'memory-management' }
  ];
  
  claudePatterns.forEach(({ regex, type }) => {
    const matches = cleanHtml.match(regex);
    if (matches && matches.length > 0) {
      patterns.push({
        type: 'pattern',
        name: `${type} pattern`,
        description: `Found ${matches.length} references to ${type} in ${pageName}`,
        source: pageName,
        confidence: 0.9
      });
    }
  });
  
  return patterns;
}

// Run the scraper
scrapeClaudeLog().catch(console.error);