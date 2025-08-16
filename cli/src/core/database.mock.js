/**
 * Mock Database module for testing without SQLite dependencies
 */

class MockAWEDatabase {
  constructor(options = {}) {
    this.options = options;
    this.isInitialized = false;
    this.mockData = {
      templates: [],
      projects: [],
      interactions: []
    };
  }

  async initialize() {
    this.isInitialized = true;
    return Promise.resolve();
  }

  getTemplates(category = null) {
    return this.mockData.templates.filter(t => !category || t.category === category);
  }

  getTemplate(name) {
    return this.mockData.templates.find(t => t.name === name) || null;
  }

  saveProject(projectData) {
    this.mockData.projects.push(projectData);
    return { lastInsertRowid: this.mockData.projects.length };
  }

  getProject(projectPath) {
    return this.mockData.projects.find(p => p.path === projectPath) || null;
  }

  recordInteraction(interaction) {
    this.mockData.interactions.push(interaction);
    return { lastInsertRowid: this.mockData.interactions.length };
  }

  incrementTemplateUsage(templateId) {
    return { changes: 1 };
  }

  close() {
    this.isInitialized = false;
  }

  async sync() {
    return { synced: 0, updated: new Date().toISOString() };
  }
}

let mockDatabaseInstance = null;

async function initializeDatabase(options = {}) {
  if (!mockDatabaseInstance) {
    mockDatabaseInstance = new MockAWEDatabase(options);
    await mockDatabaseInstance.initialize();
  }
  return mockDatabaseInstance;
}

function getDatabase() {
  if (!mockDatabaseInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return mockDatabaseInstance;
}

module.exports = {
  AWEDatabase: MockAWEDatabase,
  initializeDatabase,
  getDatabase
};