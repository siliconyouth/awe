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
        category: 'DOCUMENTATION',
        frequency: 'DAILY',
        priority: 1,
        extractPatterns: true,
        scrapeConfig: {},
        active: true,
        status: 'ACTIVE',
        reliability: 1.0,
        metadata: {
          addedAt: new Date().toISOString()
        }
      }
    });
    
    console.log('Created source:', source);
    
    // List all sources
    const sources = await db.knowledgeSource.findMany();
    console.log('All sources:', sources);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

testDb();