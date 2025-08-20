/**
 * Database module for AWE CLI
 * 
 * Manages the local SQLite database with vector embeddings for:
 * - Templates and patterns storage
 * - Project analysis caching
 * - Learning from user interactions
 * - Similarity search capabilities
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra');
const { logger } = require('../utils/logger');

class AWEDatabase {
  constructor(options = {}) {
    this.options = options;
    this.dataDir = options.dataDir || process.env.AWE_DATA_DIR || `${require('os').homedir()}/.awe`;
    this.dbPath = path.join(this.dataDir, 'awe.db');
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize database connection and schema
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Ensure data directory exists
      await fs.ensureDir(this.dataDir);

      // Open database connection
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = memory');

      // Create tables
      await this.createTables();
      await this.seedInitialData();

      this.isInitialized = true;
      logger.info('Database initialized:', this.dbPath);
    } catch (error) {
      logger.error('Failed to initialize database:', error.message);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  async createTables() {
    const statements = [
      // Templates table
      `CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        metadata TEXT, -- JSON
        usage_count INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Projects table
      `CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT,
        language TEXT,
        framework TEXT,
        features TEXT, -- JSON
        template_id INTEGER,
        analysis_data TEXT, -- JSON
        performance_metrics TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES templates(id)
      )`,

      // Patterns table
      `CREATE TABLE IF NOT EXISTS patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        code_pattern TEXT,
        category TEXT NOT NULL,
        effectiveness_score REAL DEFAULT 0,
        usage_examples TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Embeddings table for vector similarity
      `CREATE TABLE IF NOT EXISTS embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL, -- 'template', 'project', 'pattern'
        entity_id INTEGER NOT NULL,
        embedding BLOB, -- Vector embedding as binary
        model_version TEXT DEFAULT 'v1',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Interactions table for learning
      `CREATE TABLE IF NOT EXISTS interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        project_path TEXT,
        action TEXT NOT NULL,
        context TEXT, -- JSON
        result TEXT, -- JSON
        success BOOLEAN DEFAULT 1,
        feedback_score INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Recommendations table
      `CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        template_id INTEGER,
        confidence_score REAL,
        reasoning TEXT,
        accepted BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (template_id) REFERENCES templates(id)
      )`,

      // Optimizations table
      `CREATE TABLE IF NOT EXISTS optimizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium',
        impact TEXT,
        applied BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        applied_at DATETIME,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )`
    ];

    for (const statement of statements) {
      this.db.exec(statement);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category)',
      'CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type)',
      'CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns(category)',
      'CREATE INDEX IF NOT EXISTS idx_embeddings_entity ON embeddings(entity_type, entity_id)',
      'CREATE INDEX IF NOT EXISTS idx_interactions_project ON interactions(project_path)',
      'CREATE INDEX IF NOT EXISTS idx_recommendations_project ON recommendations(project_id)'
    ];

    for (const index of indexes) {
      this.db.exec(index);
    }
  }

  /**
   * Seed initial data
   */
  async seedInitialData() {
    const templateCount = this.db.prepare('SELECT COUNT(*) as count FROM templates').get().count;
    
    if (templateCount === 0) {
      logger.info('Seeding initial template data...');
      
      const initialTemplates = [
        {
          name: 'general-template',
          category: 'general',
          description: 'General purpose CLAUDE.md template for any project type',
          content: await this.loadTemplateContent('general-template.md')
        },
        {
          name: 'web-react',
          category: 'web',
          description: 'React web application template with TypeScript and modern tooling',
          content: await this.generateWebReactTemplate()
        },
        {
          name: 'nodejs-api',
          category: 'backend',
          description: 'Node.js API service template with Express and best practices',
          content: await this.generateNodeApiTemplate()
        },
        {
          name: 'python-data',
          category: 'data-science',
          description: 'Python data science project template with Jupyter and ML libraries',
          content: await this.generatePythonDataTemplate()
        }
      ];

      const insertTemplate = this.db.prepare(`
        INSERT INTO templates (name, category, description, content, metadata)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const template of initialTemplates) {
        try {
          insertTemplate.run(
            template.name,
            template.category,
            template.description,
            template.content,
            JSON.stringify({ version: '1.0', auto_generated: true })
          );
        } catch (error) {
          logger.error(`Failed to insert template ${template.name}:`, error.message);
        }
      }

      logger.info(`Seeded ${initialTemplates.length} initial templates`);
    }
  }

  /**
   * Load template content from file
   */
  async loadTemplateContent(filename) {
    try {
      const templatePath = path.join(__dirname, '../../../templates/claude-md', filename);
      if (await fs.pathExists(templatePath)) {
        return await fs.readFile(templatePath, 'utf8');
      }
    } catch (error) {
      logger.debug(`Could not load template file ${filename}:`, error.message);
    }
    
    return this.getDefaultTemplate();
  }

  /**
   * Generate React web template
   */
  async generateWebReactTemplate() {
    return `# React Web Application - Claude Code Configuration

## Project Overview
Modern React web application with TypeScript, modern tooling, and best practices.

## Project Structure
\`\`\`
src/
├── components/          # Reusable UI components
├── pages/              # Page-level components
├── hooks/              # Custom React hooks
├── services/           # API and external services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── styles/             # Global styles and themes
\`\`\`

## Key Technologies
- **Language**: TypeScript
- **Framework**: React 18+
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library
- **Styling**: CSS Modules / Styled Components

## Development Guidelines

### Component Patterns
- Use functional components with hooks
- Prefer TypeScript interfaces for props
- Keep components small and focused
- Use custom hooks for shared logic

### State Management
- React Context for global state
- useState/useReducer for local state
- Consider Zustand or Redux Toolkit for complex apps

### Performance
- Use React.memo for expensive components
- Implement code splitting with lazy loading
- Optimize bundle size with tree shaking

## Common Commands
\`\`\`bash
npm run dev             # Start development server
npm run build          # Build for production
npm run test           # Run tests
npm run lint           # Run ESLint
npm run typecheck      # Run TypeScript checker
\`\`\`

## Claude Code Specific Instructions

### Preferred Behaviors
- Always run tests after component changes
- Follow React hooks rules and best practices
- Use TypeScript strictly - no \`any\` types
- Maintain consistent file naming (PascalCase for components)

### Component Creation
1. Create component file with proper TypeScript interface
2. Add corresponding test file
3. Update exports in index files
4. Consider accessibility requirements

### Performance Guidelines
- Use React DevTools to identify re-renders
- Implement proper dependency arrays in hooks
- Monitor bundle size and loading performance`;
  }

  /**
   * Generate Node.js API template
   */
  async generateNodeApiTemplate() {
    return `# Node.js API Service - Claude Code Configuration

## Project Overview
RESTful API service built with Node.js, Express, and modern backend practices.

## Project Structure
\`\`\`
src/
├── controllers/        # Route handlers
├── middleware/         # Express middleware
├── models/            # Data models
├── routes/            # Route definitions
├── services/          # Business logic
├── utils/             # Utility functions
└── validators/        # Request validation
\`\`\`

## Key Technologies
- **Language**: JavaScript/TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL/MongoDB
- **Testing**: Jest + Supertest
- **Validation**: Joi/Yup

## Development Guidelines

### API Design
- Follow RESTful conventions
- Use proper HTTP status codes
- Implement comprehensive error handling
- Add request validation and sanitization

### Security
- Use helmet for security headers
- Implement rate limiting
- Validate and sanitize all inputs
- Use HTTPS in production

### Performance
- Implement caching strategies
- Use database indexing appropriately
- Monitor API response times
- Implement pagination for large datasets

## Common Commands
\`\`\`bash
npm run dev             # Start development server
npm run build          # Build for production
npm run test           # Run tests
npm run lint           # Run ESLint
npm start              # Start production server
\`\`\`

## Claude Code Specific Instructions

### Preferred Behaviors
- Always validate inputs before processing
- Implement proper error handling for all routes
- Use middleware for cross-cutting concerns
- Follow REST API conventions strictly

### Security Practices
- Never commit secrets or credentials
- Use environment variables for configuration
- Implement proper authentication/authorization
- Log security events appropriately`;
  }

  /**
   * Generate Python data science template
   */
  async generatePythonDataTemplate() {
    return `# Python Data Science Project - Claude Code Configuration

## Project Overview
Data science project with Python, Jupyter notebooks, and machine learning capabilities.

## Project Structure
\`\`\`
├── data/              # Raw and processed data
├── notebooks/         # Jupyter notebooks
├── src/               # Python modules
├── models/            # Trained models
├── reports/           # Analysis reports
└── requirements.txt   # Dependencies
\`\`\`

## Key Technologies
- **Language**: Python 3.8+
- **Data**: Pandas, NumPy
- **ML**: Scikit-learn, TensorFlow/PyTorch
- **Visualization**: Matplotlib, Seaborn, Plotly
- **Notebooks**: Jupyter Lab

## Development Guidelines

### Data Handling
- Keep raw data immutable
- Document data preprocessing steps
- Use version control for datasets
- Implement data validation

### ML Practices
- Split data properly (train/validation/test)
- Track experiments and model performance
- Use cross-validation for model selection
- Document model assumptions and limitations

### Code Quality
- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Write docstrings for functions
- Implement unit tests for utility functions

## Common Commands
\`\`\`bash
jupyter lab            # Start Jupyter Lab
python -m pytest      # Run tests
pip install -r requirements.txt  # Install dependencies
python src/train.py    # Train models
\`\`\`

## Claude Code Specific Instructions

### Preferred Behaviors
- Always validate data before analysis
- Document analysis steps clearly
- Use meaningful variable names
- Comment complex data transformations

### ML Workflow
1. Explore data thoroughly before modeling
2. Establish baseline performance
3. Iterate on feature engineering
4. Validate results with domain experts
5. Document model performance and limitations`;
  }

  /**
   * Get default template
   */
  getDefaultTemplate() {
    return `# Project Context for Claude Code

## Project Overview
[Brief description of your project, its purpose, and main goals]

## Key Technologies
- **Language**: [Primary language]
- **Framework**: [Main framework]
- **Database**: [Database system]

## Development Guidelines
- Follow established coding standards
- Write comprehensive tests
- Document important decisions
- Use consistent naming conventions

## Claude Code Specific Instructions

### Preferred Behaviors
- Always run tests after making changes
- Check for existing implementations before creating new ones
- Follow established patterns in the codebase
- Provide clear, actionable responses

### Restrictions
- Don't modify core configuration files without confirmation
- Don't remove existing functionality without explicit approval
- Don't commit sensitive information`;
  }

  /**
   * Get all templates
   */
  getTemplates(category = null) {
    let query = 'SELECT * FROM templates';
    let params = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY usage_count DESC, rating DESC';

    return this.db.prepare(query).all(...params);
  }

  /**
   * Get template by name
   */
  getTemplate(name) {
    return this.db.prepare('SELECT * FROM templates WHERE name = ?').get(name);
  }

  /**
   * Save project analysis
   */
  saveProject(projectData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO projects 
      (path, name, type, language, framework, features, analysis_data, template_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      projectData.path,
      projectData.name,
      projectData.type,
      projectData.language,
      projectData.framework,
      JSON.stringify(projectData.features || {}),
      JSON.stringify(projectData.analysis || {}),
      projectData.templateId || null
    );
  }

  /**
   * Get project by path
   */
  getProject(projectPath) {
    return this.db.prepare('SELECT * FROM projects WHERE path = ?').get(projectPath);
  }

  /**
   * Record user interaction for learning
   */
  recordInteraction(interaction) {
    const stmt = this.db.prepare(`
      INSERT INTO interactions 
      (session_id, project_path, action, context, result, success, feedback_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      interaction.sessionId,
      interaction.projectPath,
      interaction.action,
      JSON.stringify(interaction.context || {}),
      JSON.stringify(interaction.result || {}),
      interaction.success ? 1 : 0,
      interaction.feedbackScore || null
    );
  }

  /**
   * Update template usage count
   */
  incrementTemplateUsage(templateId) {
    const stmt = this.db.prepare(`
      UPDATE templates 
      SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    return stmt.run(templateId);
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * Sync with remote knowledge base (placeholder)
   */
  async sync() {
    logger.info('Syncing knowledge base...');
    // This would implement actual syncing logic
    return { synced: 0, updated: new Date().toISOString() };
  }
}

let databaseInstance = null;

/**
 * Initialize global database instance
 */
async function initializeDatabase(options = {}) {
  if (!databaseInstance) {
    databaseInstance = new AWEDatabase(options);
    await databaseInstance.initialize();
  }
  return databaseInstance;
}

/**
 * Get global database instance
 */
function getDatabase() {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return databaseInstance;
}

module.exports = {
  AWEDatabase,
  initializeDatabase,
  getDatabase
};