const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const { getDatabase } = require('../../cli/src/core/database');
const logger = require('../../cli/src/utils/logger');

/**
 * Agent Manager - Core system for managing agent lifecycle, deployment, and coordination
 */
class AgentManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      agentsDir: options.agentsDir || path.join(__dirname, '../examples'),
      workspaceDir: options.workspaceDir || process.cwd(),
      maxConcurrentAgents: options.maxConcurrentAgents || 5,
      defaultTimeout: options.defaultTimeout || 300000, // 5 minutes
      ...options
    };

    this.db = getDatabase();
    this.activeAgents = new Map();
    this.workflows = new Map();
    this.context = new Map();
    
    this.initializeDatabase();
  }

  /**
   * Initialize agent management database tables
   */
  async initializeDatabase() {
    try {
      // Agent executions table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS agent_executions (
          id TEXT PRIMARY KEY,
          agent_name TEXT NOT NULL,
          task TEXT NOT NULL,
          status TEXT NOT NULL,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          duration INTEGER,
          success BOOLEAN,
          input_data TEXT,
          output_data TEXT,
          error_message TEXT,
          context TEXT
        )
      `);

      // Agent statistics table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS agent_stats (
          agent_name TEXT PRIMARY KEY,
          total_executions INTEGER DEFAULT 0,
          successful_executions INTEGER DEFAULT 0,
          failed_executions INTEGER DEFAULT 0,
          avg_duration REAL DEFAULT 0,
          last_execution DATETIME,
          issues_found INTEGER DEFAULT 0,
          issues_resolved INTEGER DEFAULT 0
        )
      `);

      // Workflow executions table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS workflow_executions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          status TEXT NOT NULL,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          duration INTEGER,
          agents TEXT,
          results TEXT,
          error_message TEXT
        )
      `);

      logger.debug('Agent management database initialized');
    } catch (error) {
      logger.error('Failed to initialize agent database:', error.message);
    }
  }

  /**
   * List all available agents
   */
  async listAgents() {
    try {
      const agentFiles = await fs.readdir(this.options.agentsDir);
      const agents = [];

      for (const file of agentFiles) {
        if (file.endsWith('.json')) {
          try {
            const agentPath = path.join(this.options.agentsDir, file);
            const agentData = await fs.readFile(agentPath, 'utf8');
            const agent = JSON.parse(agentData);
            
            // Get agent statistics
            const stats = await this.getAgentStats(agent.name);
            
            agents.push({
              ...agent,
              file: file,
              path: agentPath,
              status: this.activeAgents.has(agent.name) ? 'active' : 'available',
              stats
            });
          } catch (error) {
            logger.warn(`Failed to load agent ${file}:`, error.message);
          }
        }
      }

      return agents;
    } catch (error) {
      logger.error('Failed to list agents:', error.message);
      return [];
    }
  }

  /**
   * Load agent configuration
   */
  async loadAgent(agentName) {
    try {
      const agentPath = path.join(this.options.agentsDir, `${agentName}.json`);
      const agentData = await fs.readFile(agentPath, 'utf8');
      const agent = JSON.parse(agentData);
      
      // Validate agent configuration
      await this.validateAgent(agent);
      
      return agent;
    } catch (error) {
      throw new Error(`Failed to load agent ${agentName}: ${error.message}`);
    }
  }

  /**
   * Deploy an agent for active use
   */
  async deploy(agentName, options = {}) {
    try {
      if (this.activeAgents.has(agentName)) {
        throw new Error(`Agent ${agentName} is already deployed`);
      }

      const agent = await this.loadAgent(agentName);
      
      const deployment = {
        agent,
        options,
        deployedAt: new Date(),
        status: 'deployed',
        executionCount: 0
      };

      this.activeAgents.set(agentName, deployment);
      
      logger.info(`Agent ${agentName} deployed successfully`);
      this.emit('agent:deployed', { agentName, deployment });
      
      return deployment;
    } catch (error) {
      logger.error(`Failed to deploy agent ${agentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Deploy multiple agents
   */
  async deployMultiple(agentNames, options = {}) {
    const results = {};
    
    for (const agentName of agentNames) {
      try {
        results[agentName] = await this.deploy(agentName, options);
      } catch (error) {
        results[agentName] = { error: error.message };
      }
    }
    
    return results;
  }

  /**
   * Execute an agent task
   */
  async execute(agentName, task, input = {}, options = {}) {
    const executionId = this.generateExecutionId();
    
    try {
      // Check if agent is deployed
      if (!this.activeAgents.has(agentName)) {
        await this.deploy(agentName);
      }

      const deployment = this.activeAgents.get(agentName);
      const agent = deployment.agent;

      // Record execution start
      await this.recordExecutionStart(executionId, agentName, task, input);
      
      logger.info(`Executing agent ${agentName} task ${task}`);
      this.emit('agent:execution:start', { agentName, task, executionId, input });

      // Execute agent workflow
      const result = await this.executeAgentWorkflow(agent, task, input, options);
      
      // Record successful execution
      await this.recordExecutionComplete(executionId, true, result);
      
      // Update deployment stats
      deployment.executionCount++;
      deployment.lastExecution = new Date();
      
      logger.info(`Agent ${agentName} task ${task} completed successfully`);
      this.emit('agent:execution:complete', { agentName, task, executionId, result });
      
      return result;
    } catch (error) {
      // Record failed execution
      await this.recordExecutionComplete(executionId, false, null, error.message);
      
      logger.error(`Agent ${agentName} task ${task} failed:`, error.message);
      this.emit('agent:execution:error', { agentName, task, executionId, error });
      
      throw error;
    }
  }

  /**
   * Execute agent workflow based on configuration
   */
  async executeAgentWorkflow(agent, task, input, options) {
    const workflow = agent.workflow || [];
    const results = {};
    
    // If specific task requested, find matching workflow step
    if (task && task !== 'default') {
      const taskStep = workflow.find(step => step.step === task);
      if (taskStep) {
        return await this.executeWorkflowStep(agent, taskStep, input, options);
      } else {
        // Check if task matches a prompt
        if (agent.prompts && agent.prompts[task]) {
          return await this.executePromptTask(agent, task, input, options);
        } else {
          throw new Error(`Task ${task} not found in agent ${agent.name}`);
        }
      }
    }

    // Execute full workflow
    for (const step of workflow) {
      try {
        logger.debug(`Executing workflow step: ${step.step}`);
        results[step.step] = await this.executeWorkflowStep(agent, step, input, options);
      } catch (error) {
        logger.error(`Workflow step ${step.step} failed:`, error.message);
        if (options.continueOnError) {
          results[step.step] = { error: error.message };
        } else {
          throw error;
        }
      }
    }

    return {
      workflow_results: results,
      agent: agent.name,
      completed_steps: Object.keys(results).length,
      total_steps: workflow.length
    };
  }

  /**
   * Execute a single workflow step
   */
  async executeWorkflowStep(agent, step, input, options) {
    const stepContext = {
      agent: agent.name,
      step: step.step,
      description: step.description,
      tools: step.tools || agent.tools || [],
      input,
      options
    };

    // This would integrate with Claude Code's tool execution system
    // For now, return a mock result structure
    return {
      step: step.step,
      status: 'completed',
      description: step.description,
      tools_used: step.tools || [],
      execution_time: Math.random() * 5000, // Mock execution time
      timestamp: new Date().toISOString(),
      context: stepContext
    };
  }

  /**
   * Execute a prompt-based task
   */
  async executePromptTask(agent, task, input, options) {
    const prompt = agent.prompts[task];
    if (!prompt) {
      throw new Error(`Prompt ${task} not found in agent ${agent.name}`);
    }

    // This would integrate with Claude Code's prompt execution
    return {
      task,
      prompt_executed: true,
      input,
      agent: agent.name,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Stop an active agent
   */
  async stop(agentName) {
    if (!this.activeAgents.has(agentName)) {
      throw new Error(`Agent ${agentName} is not deployed`);
    }

    this.activeAgents.delete(agentName);
    
    logger.info(`Agent ${agentName} stopped`);
    this.emit('agent:stopped', { agentName });
    
    return { success: true, message: `Agent ${agentName} stopped` };
  }

  /**
   * Get agent status and statistics
   */
  async getStatus(agentName) {
    const isActive = this.activeAgents.has(agentName);
    const deployment = this.activeAgents.get(agentName);
    const stats = await this.getAgentStats(agentName);

    return {
      name: agentName,
      status: isActive ? 'active' : 'inactive',
      deployment: deployment || null,
      statistics: stats
    };
  }

  /**
   * Get agent statistics from database
   */
  async getAgentStats(agentName) {
    try {
      const stats = this.db.prepare(`
        SELECT * FROM agent_stats WHERE agent_name = ?
      `).get(agentName);

      const recentExecutions = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM agent_executions 
        WHERE agent_name = ? AND started_at > datetime('now', '-24 hours')
      `).get(agentName);

      return {
        ...stats,
        recent_executions_24h: recentExecutions?.count || 0,
        success_rate: stats ? (stats.successful_executions / stats.total_executions * 100).toFixed(1) : 0
      };
    } catch (error) {
      logger.debug(`No stats found for agent ${agentName}`);
      return {
        total_executions: 0,
        successful_executions: 0,
        failed_executions: 0,
        avg_duration: 0,
        success_rate: 0
      };
    }
  }

  /**
   * Create a workflow with multiple coordinated agents
   */
  async createWorkflow(workflowConfig) {
    const workflowId = this.generateWorkflowId();
    
    const workflow = {
      id: workflowId,
      config: workflowConfig,
      status: 'created',
      createdAt: new Date(),
      steps: this.parseWorkflowSteps(workflowConfig),
      context: new Map()
    };

    this.workflows.set(workflowId, workflow);
    
    return {
      id: workflowId,
      execute: () => this.executeWorkflow(workflowId),
      getStatus: () => this.getWorkflowStatus(workflowId),
      cancel: () => this.cancelWorkflow(workflowId)
    };
  }

  /**
   * Execute a coordinated workflow
   */
  async executeWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    try {
      workflow.status = 'running';
      workflow.startedAt = new Date();
      
      const results = {};
      const executionOrder = this.resolveExecutionOrder(workflow.steps);
      
      for (const batch of executionOrder) {
        // Execute batch in parallel
        const batchPromises = batch.map(async (step) => {
          const stepResult = await this.execute(step.agent, step.task, step.input || {}, step.options || {});
          results[step.id || `${step.agent}_${step.task}`] = stepResult;
          return stepResult;
        });
        
        await Promise.all(batchPromises);
      }
      
      workflow.status = 'completed';
      workflow.completedAt = new Date();
      workflow.results = results;
      
      // Record workflow execution
      await this.recordWorkflowExecution(workflowId, true, results);
      
      logger.info(`Workflow ${workflowId} completed successfully`);
      this.emit('workflow:complete', { workflowId, results });
      
      return results;
    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      
      await this.recordWorkflowExecution(workflowId, false, null, error.message);
      
      logger.error(`Workflow ${workflowId} failed:`, error.message);
      this.emit('workflow:error', { workflowId, error });
      
      throw error;
    }
  }

  /**
   * Validate agent configuration
   */
  async validateAgent(agent) {
    const required = ['name', 'version', 'description', 'type'];
    
    for (const field of required) {
      if (!agent[field]) {
        throw new Error(`Agent missing required field: ${field}`);
      }
    }

    // Validate agent type
    const validTypes = ['analysis', 'implementation', 'infrastructure', 'review', 'testing', 'documentation', 'security', 'optimization'];
    if (!validTypes.includes(agent.type)) {
      throw new Error(`Invalid agent type: ${agent.type}. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate tools
    if (agent.tools && !Array.isArray(agent.tools)) {
      throw new Error('Agent tools must be an array');
    }

    // Validate workflow
    if (agent.workflow && !Array.isArray(agent.workflow)) {
      throw new Error('Agent workflow must be an array');
    }

    return true;
  }

  /**
   * Set shared context for agents
   */
  setContext(key, value) {
    this.context.set(key, value);
    this.emit('context:update', { key, value });
  }

  /**
   * Get shared context
   */
  getContext(key) {
    return this.context.get(key);
  }

  /**
   * Send message between agents
   */
  async sendMessage(message) {
    const { from, to, task, data, callback } = message;
    
    logger.debug(`Agent message: ${from} → ${to} (${task})`);
    
    try {
      const result = await this.execute(to, task, data);
      
      if (callback) {
        await this.execute(from, callback, result);
      }
      
      return result;
    } catch (error) {
      logger.error(`Agent message failed: ${from} → ${to}:`, error.message);
      throw error;
    }
  }

  /**
   * Utility methods
   */

  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateWorkflowId() {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  parseWorkflowSteps(config) {
    return config.map((step, index) => ({
      id: step.id || `step_${index}`,
      ...step
    }));
  }

  resolveExecutionOrder(steps) {
    // Simple dependency resolution - returns batches of steps that can run in parallel
    const batches = [];
    const completed = new Set();
    
    while (completed.size < steps.length) {
      const batch = steps.filter(step => {
        if (completed.has(step.id)) return false;
        
        const dependencies = step.depends_on ? 
          (Array.isArray(step.depends_on) ? step.depends_on : [step.depends_on]) : [];
        
        return dependencies.every(dep => completed.has(dep));
      });
      
      if (batch.length === 0) {
        throw new Error('Circular dependency detected in workflow');
      }
      
      batches.push(batch);
      batch.forEach(step => completed.add(step.id));
    }
    
    return batches;
  }

  async recordExecutionStart(executionId, agentName, task, input) {
    try {
      this.db.prepare(`
        INSERT INTO agent_executions 
        (id, agent_name, task, status, input_data, context)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        executionId,
        agentName,
        task,
        'running',
        JSON.stringify(input),
        JSON.stringify(this.getContext('current_feature'))
      );
    } catch (error) {
      logger.debug('Failed to record execution start:', error.message);
    }
  }

  async recordExecutionComplete(executionId, success, result, errorMessage = null) {
    try {
      const duration = Date.now(); // Simplified - should calculate actual duration
      
      this.db.prepare(`
        UPDATE agent_executions 
        SET status = ?, completed_at = CURRENT_TIMESTAMP, duration = ?, 
            success = ?, output_data = ?, error_message = ?
        WHERE id = ?
      `).run(
        success ? 'completed' : 'failed',
        duration,
        success,
        result ? JSON.stringify(result) : null,
        errorMessage,
        executionId
      );

      // Update agent statistics
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO agent_stats 
        (agent_name, total_executions, successful_executions, failed_executions, last_execution)
        VALUES (?, 
          COALESCE((SELECT total_executions FROM agent_stats WHERE agent_name = ?), 0) + 1,
          COALESCE((SELECT successful_executions FROM agent_stats WHERE agent_name = ?), 0) + ?,
          COALESCE((SELECT failed_executions FROM agent_stats WHERE agent_name = ?), 0) + ?,
          CURRENT_TIMESTAMP
        )
      `);
      
      const agentName = this.db.prepare('SELECT agent_name FROM agent_executions WHERE id = ?').get(executionId)?.agent_name;
      
      stmt.run(agentName, agentName, agentName, success ? 1 : 0, agentName, success ? 0 : 1);
      
    } catch (error) {
      logger.debug('Failed to record execution completion:', error.message);
    }
  }

  async recordWorkflowExecution(workflowId, success, results, errorMessage = null) {
    try {
      const workflow = this.workflows.get(workflowId);
      const duration = workflow.completedAt - workflow.startedAt;
      
      this.db.prepare(`
        INSERT INTO workflow_executions 
        (id, name, status, duration, agents, results, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        workflowId,
        workflow.config.name || 'unnamed',
        success ? 'completed' : 'failed',
        duration,
        JSON.stringify(workflow.config.map(step => step.agent)),
        results ? JSON.stringify(results) : null,
        errorMessage
      );
    } catch (error) {
      logger.debug('Failed to record workflow execution:', error.message);
    }
  }
}

module.exports = AgentManager;