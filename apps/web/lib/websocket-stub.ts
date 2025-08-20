/**
 * WebSocket Stub Implementation
 * TODO: Install socket.io package to enable real WebSocket functionality
 */

// Event types
export enum WSEventType {
  // System events
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  
  // User events
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  USER_TYPING = 'user:typing',
  
  // Resource events
  RESOURCE_CREATED = 'resource:created',
  RESOURCE_UPDATED = 'resource:updated',
  RESOURCE_DELETED = 'resource:deleted',
  
  // Pattern events
  PATTERN_EXTRACTED = 'pattern:extracted',
  PATTERN_REVIEWED = 'pattern:reviewed',
  
  // Notification events
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  
  // Progress events
  TASK_STARTED = 'task:started',
  TASK_PROGRESS = 'task:progress',
  TASK_COMPLETED = 'task:completed',
  TASK_FAILED = 'task:failed',
  
  // AI events
  AI_RESPONSE = 'ai:response',
  AI_ERROR = 'ai:error',
  
  // Performance events
  PERFORMANCE_WARNING = 'performance:warning',
  PERFORMANCE_METRICS = 'performance:metrics'
}

/**
 * Stub WebSocket Manager
 * Provides no-op implementations until socket.io is installed
 */
class WebSocketManagerStub {
  sendNotification(userId: string, notification: any): void {
    console.log('WebSocket stub: Would send notification to', userId)
  }

  broadcast(event: WSEventType, data: any): void {
    console.log('WebSocket stub: Would broadcast', event, 'with data', data)
  }

  sendToUser(userId: string, event: WSEventType, data: any): void {
    console.log('WebSocket stub: Would send', event, 'to user', userId)
  }

  sendToRoom(room: string, event: WSEventType, data: any): void {
    console.log('WebSocket stub: Would send', event, 'to room', room)
  }

  joinRoom(userId: string, room: string): void {
    console.log('WebSocket stub: User', userId, 'would join room', room)
  }

  leaveRoom(userId: string, room: string): void {
    console.log('WebSocket stub: User', userId, 'would leave room', room)
  }

  trackProgress(taskId: string, progress: number, message?: string): void {
    console.log('WebSocket stub: Task', taskId, 'progress:', progress)
  }

  notifyTaskComplete(taskId: string, result: any): void {
    console.log('WebSocket stub: Task', taskId, 'completed')
  }

  notifyTaskFailed(taskId: string, error: string): void {
    console.log('WebSocket stub: Task', taskId, 'failed:', error)
  }
}

// Export singleton instance
export const wsManager = new WebSocketManagerStub()