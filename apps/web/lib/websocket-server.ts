import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@awe/database'
import { Redis } from '@upstash/redis'

/**
 * WebSocket Server for Real-time Features
 * Provides real-time updates, notifications, and collaboration
 */

// Initialize Redis for pub/sub if available
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    })
  : null

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
  
  // Collaboration events
  PRESENCE_JOIN = 'presence:join',
  PRESENCE_LEAVE = 'presence:leave',
  PRESENCE_UPDATE = 'presence:update',
  
  // Analytics events
  METRICS_UPDATE = 'metrics:update',
  SYSTEM_STATUS = 'system:status'
}

// Room types for different features
export enum RoomType {
  USER = 'user', // Personal notifications
  PROJECT = 'project', // Project-specific updates
  RESOURCE = 'resource', // Resource collaboration
  ADMIN = 'admin', // Admin broadcasts
  SYSTEM = 'system' // System-wide updates
}

// WebSocket message interface
export interface WSMessage<T = any> {
  id: string
  type: WSEventType
  room?: string
  data: T
  timestamp: Date
  userId?: string
}

// Presence data
interface PresenceData {
  userId: string
  userName?: string
  userImage?: string
  location?: string // Current page/resource
  cursor?: { x: number; y: number }
  selection?: string
  status?: 'active' | 'idle' | 'away'
}

/**
 * WebSocket Manager
 */
export class WebSocketManager {
  private io: SocketIOServer | null = null
  private rooms = new Map<string, Set<string>>() // room -> socketIds
  private userSockets = new Map<string, Set<string>>() // userId -> socketIds
  private presence = new Map<string, PresenceData>() // socketId -> presence
  private subscriptions = new Map<string, any>() // Redis subscriptions

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    this.setupEventHandlers()
    this.setupRedisPubSub()

    console.log('✅ WebSocket server initialized')
    return this.io
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return

    this.io.on(WSEventType.CONNECTION, async (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`)

      // Authenticate socket
      const userId = await this.authenticateSocket(socket)
      if (!userId) {
        socket.disconnect()
        return
      }

      // Track user socket
      this.addUserSocket(userId, socket.id)

      // Join user's personal room
      const userRoom = `${RoomType.USER}:${userId}`
      socket.join(userRoom)
      this.addToRoom(userRoom, socket.id)

      // Join project rooms
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { projects: true }
      })

      if (user?.projects) {
        for (const project of user.projects) {
          const projectRoom = `${RoomType.PROJECT}:${project.id}`
          socket.join(projectRoom)
          this.addToRoom(projectRoom, socket.id)
        }
      }

      // Notify user online
      this.broadcast(WSEventType.USER_ONLINE, { userId }, userRoom)

      // Handle client events
      this.setupClientHandlers(socket, userId)

      // Handle disconnect
      socket.on(WSEventType.DISCONNECT, () => {
        console.log(`Client disconnected: ${socket.id}`)
        this.handleDisconnect(socket, userId)
      })
    })
  }

  /**
   * Set up client event handlers
   */
  private setupClientHandlers(socket: Socket, userId: string): void {
    // Join room
    socket.on('join:room', (room: string) => {
      // Validate room access
      if (this.canJoinRoom(userId, room)) {
        socket.join(room)
        this.addToRoom(room, socket.id)
        
        // Send current presence in room
        const roomPresence = this.getRoomPresence(room)
        socket.emit('room:presence', { room, presence: roomPresence })
      }
    })

    // Leave room
    socket.on('leave:room', (room: string) => {
      socket.leave(room)
      this.removeFromRoom(room, socket.id)
    })

    // Update presence
    socket.on('presence:update', (data: Partial<PresenceData>) => {
      const presence = this.presence.get(socket.id) || { userId }
      this.presence.set(socket.id, { ...presence, ...data })
      
      // Broadcast to rooms
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit(WSEventType.PRESENCE_UPDATE, {
            socketId: socket.id,
            ...presence,
            ...data
          })
        }
      }
    })

    // Handle typing indicator
    socket.on('typing:start', (data: { room: string; message?: string }) => {
      socket.to(data.room).emit(WSEventType.USER_TYPING, {
        userId,
        typing: true,
        message: data.message
      })
    })

    socket.on('typing:stop', (data: { room: string }) => {
      socket.to(data.room).emit(WSEventType.USER_TYPING, {
        userId,
        typing: false
      })
    })

    // Handle custom events
    socket.on('custom:event', async (data: WSMessage) => {
      // Validate and process custom events
      if (data.room && this.canSendToRoom(userId, data.room)) {
        this.broadcast(data.type, data.data, data.room)
        
        // Store in Redis for offline users
        if (redis) {
          await redis.lpush(`events:${data.room}`, JSON.stringify({
            ...data,
            userId,
            timestamp: new Date()
          }))
          await redis.expire(`events:${data.room}`, 86400) // 24 hours
        }
      }
    })
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(socket: Socket, userId: string): void {
    // Remove from tracking
    this.removeUserSocket(userId, socket.id)
    this.presence.delete(socket.id)

    // Remove from all rooms
    for (const [room, sockets] of this.rooms.entries()) {
      sockets.delete(socket.id)
      if (sockets.size === 0) {
        this.rooms.delete(room)
      }
    }

    // Notify user offline if no more sockets
    const userSockets = this.userSockets.get(userId)
    if (!userSockets || userSockets.size === 0) {
      this.broadcast(WSEventType.USER_OFFLINE, { userId })
    }
  }

  /**
   * Set up Redis pub/sub for cross-server communication
   */
  private setupRedisPubSub(): void {
    if (!redis) return

    // Subscribe to global events channel
    this.subscribeToChannel('global:events', (message: WSMessage) => {
      this.handleRedisMessage(message)
    })
  }

  /**
   * Handle Redis pub/sub messages
   */
  private handleRedisMessage(message: WSMessage): void {
    if (!this.io) return

    // Broadcast to appropriate room
    if (message.room) {
      this.io.to(message.room).emit(message.type, message.data)
    } else {
      this.io.emit(message.type, message.data)
    }
  }

  /**
   * Authenticate socket connection
   */
  private async authenticateSocket(socket: Socket): Promise<string | null> {
    try {
      // Get auth token from handshake
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization

      if (!token) {
        socket.emit(WSEventType.ERROR, { message: 'Authentication required' })
        return null
      }

      // Verify with Clerk
      // Note: In production, implement proper JWT verification
      const userId = socket.handshake.auth.userId
      
      if (!userId) {
        socket.emit(WSEventType.ERROR, { message: 'Invalid authentication' })
        return null
      }

      return userId
    } catch (error) {
      console.error('Socket authentication error:', error)
      socket.emit(WSEventType.ERROR, { message: 'Authentication failed' })
      return null
    }
  }

  /**
   * Check if user can join room
   */
  private canJoinRoom(userId: string, room: string): boolean {
    // Implement room access control
    const [type, id] = room.split(':')

    switch (type) {
      case RoomType.USER:
        return id === userId
      case RoomType.PROJECT:
        // Check if user belongs to project
        return true // TODO: Implement project membership check
      case RoomType.ADMIN:
        // Check if user is admin
        return true // TODO: Implement admin check
      default:
        return false
    }
  }

  /**
   * Check if user can send to room
   */
  private canSendToRoom(userId: string, room: string): boolean {
    return this.canJoinRoom(userId, room)
  }

  /**
   * Get presence data for a room
   */
  private getRoomPresence(room: string): PresenceData[] {
    const roomSockets = this.rooms.get(room)
    if (!roomSockets) return []

    const presence: PresenceData[] = []
    for (const socketId of roomSockets) {
      const data = this.presence.get(socketId)
      if (data) {
        presence.push(data)
      }
    }

    return presence
  }

  /**
   * Subscribe to Redis channel
   */
  private async subscribeToChannel(channel: string, callback: (message: any) => void): Promise<void> {
    if (!redis) return

    // Store subscription
    this.subscriptions.set(channel, callback)

    // Poll for messages (Upstash doesn't support pub/sub directly)
    const pollMessages = async () => {
      try {
        const messages = await redis.lrange(`channel:${channel}`, 0, -1)
        
        for (const message of messages) {
          const parsed = JSON.parse(message)
          callback(parsed)
        }

        // Clear processed messages
        if (messages.length > 0) {
          await redis.del(`channel:${channel}`)
        }
      } catch (error) {
        console.error(`Error polling channel ${channel}:`, error)
      }
    }

    // Poll every second
    setInterval(pollMessages, 1000)
  }

  // Helper methods

  private addUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set())
    }
    this.userSockets.get(userId)!.add(socketId)
  }

  private removeUserSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.delete(socketId)
      if (sockets.size === 0) {
        this.userSockets.delete(userId)
      }
    }
  }

  private addToRoom(room: string, socketId: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set())
    }
    this.rooms.get(room)!.add(socketId)
  }

  private removeFromRoom(room: string, socketId: string): void {
    const sockets = this.rooms.get(room)
    if (sockets) {
      sockets.delete(socketId)
      if (sockets.size === 0) {
        this.rooms.delete(room)
      }
    }
  }

  // Public methods

  /**
   * Broadcast message to room or all clients
   */
  broadcast<T = any>(type: WSEventType, data: T, room?: string): void {
    if (!this.io) return

    const message: WSMessage<T> = {
      id: this.generateMessageId(),
      type,
      room,
      data,
      timestamp: new Date()
    }

    if (room) {
      this.io.to(room).emit(type, message)
    } else {
      this.io.emit(type, message)
    }

    // Store in Redis for cross-server communication
    if (redis && room) {
      redis.lpush(`channel:global:events`, JSON.stringify(message))
      redis.expire(`channel:global:events`, 10) // Short TTL for real-time
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(userId: string, notification: any): Promise<void> {
    const room = `${RoomType.USER}:${userId}`
    this.broadcast(WSEventType.NOTIFICATION_NEW, notification, room)

    // Store for offline delivery
    if (redis) {
      await redis.lpush(`notifications:${userId}`, JSON.stringify({
        ...notification,
        timestamp: new Date()
      }))
      await redis.expire(`notifications:${userId}`, 86400 * 7) // 7 days
    }
  }

  /**
   * Send task progress update
   */
  sendProgress(taskId: string, progress: number, message?: string): void {
    this.broadcast(WSEventType.TASK_PROGRESS, {
      taskId,
      progress,
      message
    })
  }

  /**
   * Get online users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys())
  }

  /**
   * Get room members
   */
  getRoomMembers(room: string): string[] {
    const sockets = this.rooms.get(room)
    if (!sockets) return []

    const users = new Set<string>()
    for (const socketId of sockets) {
      const presence = this.presence.get(socketId)
      if (presence?.userId) {
        users.add(presence.userId)
      }
    }

    return Array.from(users)
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager()

// Export convenience functions
export function broadcast<T = any>(type: WSEventType, data: T, room?: string): void {
  wsManager.broadcast(type, data, room)
}

export async function sendNotification(userId: string, notification: any): Promise<void> {
  return wsManager.sendNotification(userId, notification)
}

export function sendProgress(taskId: string, progress: number, message?: string): void {
  wsManager.sendProgress(taskId, progress, message)
}