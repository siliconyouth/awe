const { getPrisma } = require('./packages/database/dist');

async function testDb() {
  try {
    const db = getPrisma();
    
    // Try to create a source
    const source = await db.knowledgeSource.create({
      data: {
        name: 'Claude Documentation',
        url: 'https://docs.anthropic.com',
        type: 'DOCUMENTATION',
        frequency: 'DAILY',
        scrapeConfig: {},
        active: true,
        reliability: 1.0
      }
    });
    
    console.log('Created source:', source);
    
    // List all sources
    const sources = await db.knowledgeSource.findMany();
    console.log('All sources:', sources);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testDb();