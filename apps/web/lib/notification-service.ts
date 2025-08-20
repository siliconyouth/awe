import { prisma } from '@awe/database'
import { cache } from './upstash'
import { wsManager, WSEventType } from './websocket-server'
import { queueManager, QueueName } from '@awe/ai/services/queue-service-upstash'

/**
 * Unified Notification Service
 * Handles all types of notifications: in-app, email, push, webhooks
 */

// Notification types
export enum NotificationType {
  // System notifications
  SYSTEM_UPDATE = 'system_update',
  MAINTENANCE = 'maintenance',
  
  // Resource notifications
  RESOURCE_CREATED = 'resource_created',
  RESOURCE_UPDATED = 'resource_updated',
  RESOURCE_SHARED = 'resource_shared',
  
  // Pattern notifications
  PATTERN_EXTRACTED = 'pattern_extracted',
  PATTERN_APPROVED = 'pattern_approved',
  PATTERN_REJECTED = 'pattern_rejected',
  
  // Collaboration notifications
  MENTION = 'mention',
  COMMENT = 'comment',
  INVITE = 'invite',
  
  // Task notifications
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  
  // Analytics notifications
  MILESTONE_REACHED = 'milestone_reached',
  USAGE_LIMIT = 'usage_limit',
  
  // Security notifications
  LOGIN_NEW_DEVICE = 'login_new_device',
  PASSWORD_CHANGED = 'password_changed',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

// Notification channels
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  SLACK = 'slack',
  DISCORD = 'discord',
  WEBHOOK = 'webhook'
}

// Notification priority
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Notification interface
export interface Notification {
  id?: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
  priority: NotificationPriority
  channels: NotificationChannel[]
  read?: boolean
  readAt?: Date
  createdAt?: Date
  expiresAt?: Date
  actionUrl?: string
  actionLabel?: string
  icon?: string
  image?: string
}

// User notification preferences
export interface NotificationPreferences {
  userId: string
  channels: {
    [key in NotificationChannel]?: {
      enabled: boolean
      types?: NotificationType[]
      quiet_hours?: {
        start: string // "22:00"
        end: string   // "08:00"
      }
    }
  }
  email?: string
  phone?: string
  slackWebhook?: string
  discordWebhook?: string
  pushSubscription?: any
}

/**
 * Notification Service Class
 */
export class NotificationService {
  private static instance: NotificationService

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Send notification through multiple channels
   */
  async send(notification: Notification): Promise<void> {
    try {
      // Validate notification
      if (!notification.userId || !notification.type || !notification.title) {
        throw new Error('Invalid notification data')
      }

      // Generate notification ID if not provided
      if (!notification.id) {
        notification.id = this.generateNotificationId()
      }

      // Set timestamps
      notification.createdAt = new Date()
      if (!notification.expiresAt) {
        // Default expiry: 30 days
        notification.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }

      // Get user preferences
      const preferences = await this.getUserPreferences(notification.userId)

      // Filter channels based on user preferences
      const enabledChannels = notification.channels.filter(channel => 
        this.isChannelEnabled(channel, notification.type, preferences)
      )

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        // Queue for later delivery unless urgent
        if (notification.priority !== NotificationPriority.URGENT) {
          await this.queueForLater(notification)
          return
        }
      }

      // Send through each enabled channel
      const sendPromises = enabledChannels.map(channel => 
        this.sendToChannel(notification, channel, preferences)
      )

      await Promise.allSettled(sendPromises)

      // Store notification in database
      await this.storeNotification(notification)

      // Update notification count in cache
      await this.updateNotificationCount(notification.userId)

      console.log(`✅ Notification sent: ${notification.id}`)
    } catch (error) {
      console.error('Failed to send notification:', error)
      throw error
    }
  }

  /**
   * Send to specific channel
   */
  private async sendToChannel(
    notification: Notification,
    channel: NotificationChannel,
    preferences: NotificationPreferences
  ): Promise<void> {
    switch (channel) {
      case NotificationChannel.IN_APP:
        await this.sendInApp(notification)
        break
      
      case NotificationChannel.EMAIL:
        await this.sendEmail(notification, preferences.email)
        break
      
      case NotificationChannel.PUSH:
        await this.sendPush(notification, preferences.pushSubscription)
        break
      
      case NotificationChannel.SLACK:
        await this.sendSlack(notification, preferences.slackWebhook)
        break
      
      case NotificationChannel.DISCORD:
        await this.sendDiscord(notification, preferences.discordWebhook)
        break
      
      case NotificationChannel.WEBHOOK:
        await this.sendWebhook(notification)
        break
      
      default:
        console.warn(`Unsupported channel: ${channel}`)
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInApp(notification: Notification): Promise<void> {
    // Send via WebSocket for real-time delivery
    wsManager.sendNotification(notification.userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority,
      actionUrl: notification.actionUrl,
      actionLabel: notification.actionLabel,
      icon: notification.icon,
      createdAt: notification.createdAt
    })

    // Store in Redis for offline delivery
    if (cache) {
      const key = `notifications:${notification.userId}:unread`
      await cache.lpush(key, JSON.stringify(notification))
      await cache.expire(key, 86400 * 7) // 7 days
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: Notification, email?: string): Promise<void> {
    if (!email) {
      console.warn('No email address for user:', notification.userId)
      return
    }

    // Queue email job
    await queueManager.addJob(QueueName.NOTIFICATIONS, {
      type: 'email',
      to: email,
      subject: notification.title,
      body: notification.message,
      template: this.getEmailTemplate(notification.type),
      data: {
        ...notification.data,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel
      }
    })
  }

  /**
   * Send push notification
   */
  private async sendPush(notification: Notification, subscription?: any): Promise<void> {
    if (!subscription) {
      console.warn('No push subscription for user:', notification.userId)
      return
    }

    // Queue push notification job
    await queueManager.addJob(QueueName.NOTIFICATIONS, {
      type: 'push',
      subscription,
      payload: {
        title: notification.title,
        body: notification.message,
        icon: notification.icon || '/icon-192.png',
        badge: '/badge-72.png',
        image: notification.image,
        data: {
          id: notification.id,
          type: notification.type,
          url: notification.actionUrl
        }
      }
    })
  }

  /**
   * Send Slack notification
   */
  private async sendSlack(notification: Notification, webhook?: string): Promise<void> {
    if (!webhook) return

    const payload = {
      text: notification.title,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${notification.title}*\n${notification.message}`
          }
        }
      ],
      attachments: notification.actionUrl ? [
        {
          fallback: notification.actionLabel || 'View',
          actions: [
            {
              type: 'button',
              text: notification.actionLabel || 'View',
              url: notification.actionUrl
            }
          ]
        }
      ] : undefined
    }

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  /**
   * Send Discord notification
   */
  private async sendDiscord(notification: Notification, webhook?: string): Promise<void> {
    if (!webhook) return

    const payload = {
      content: notification.title,
      embeds: [
        {
          title: notification.title,
          description: notification.message,
          color: this.getPriorityColor(notification.priority),
          timestamp: new Date().toISOString(),
          footer: {
            text: 'AWE Platform'
          },
          fields: notification.data ? Object.entries(notification.data).map(([key, value]) => ({
            name: key,
            value: String(value),
            inline: true
          })) : undefined
        }
      ]
    }

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(notification: Notification): Promise<void> {
    const webhook = process.env.NOTIFICATION_WEBHOOK_URL
    if (!webhook) return

    await fetch(webhook, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Notification-Type': notification.type,
        'X-Notification-Priority': notification.priority
      },
      body: JSON.stringify(notification)
    })
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    // Try cache first
    if (cache) {
      const cached = await cache.get(`preferences:notifications:${userId}`)
      if (cached) return cached as NotificationPreferences
    }

    // Get from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        notificationPreferences: true
      }
    })

    const preferences: NotificationPreferences = {
      userId,
      channels: {
        [NotificationChannel.IN_APP]: { enabled: true },
        [NotificationChannel.EMAIL]: { enabled: !!user?.email },
        [NotificationChannel.PUSH]: { enabled: false },
        [NotificationChannel.SLACK]: { enabled: false },
        [NotificationChannel.DISCORD]: { enabled: false }
      },
      email: user?.email || undefined,
      ...(user?.notificationPreferences as any || {})
    }

    // Cache for 1 hour
    if (cache) {
      await cache.set(`preferences:notifications:${userId}`, preferences, 3600)
    }

    return preferences
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: preferences as any
      }
    })

    // Clear cache
    if (cache) {
      await cache.del(`preferences:notifications:${userId}`)
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    // Update in database
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    // Update cache
    if (cache) {
      const key = `notifications:${userId}:unread`
      const notifications = await cache.lrange(key, 0, -1)
      
      const updated = notifications.filter((n: string) => {
        const parsed = JSON.parse(n)
        return parsed.id !== notificationId
      })

      await cache.del(key)
      if (updated.length > 0) {
        await cache.lpush(key, ...updated)
      }
    }

    // Send WebSocket update
    wsManager.broadcast(WSEventType.NOTIFICATION_READ, { 
      notificationId,
      userId 
    }, `user:${userId}`)
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean
      limit?: number
      offset?: number
    } = {}
  ): Promise<Notification[]> {
    const { unreadOnly = false, limit = 20, offset = 0 } = options

    // Try cache for unread notifications
    if (unreadOnly && cache) {
      const key = `notifications:${userId}:unread`
      const cached = await cache.lrange(key, offset, offset + limit - 1)
      
      if (cached && cached.length > 0) {
        return cached.map((n: string) => JSON.parse(n))
      }
    }

    // Get from database
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    return notifications as any
  }

  /**
   * Get notification count
   */
  async getNotificationCount(userId: string, unreadOnly = true): Promise<number> {
    if (cache) {
      const cached = await cache.get(`notifications:${userId}:count`)
      if (cached !== null) return cached as number
    }

    const count = await prisma.notification.count({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
        expiresAt: { gt: new Date() }
      }
    })

    if (cache) {
      await cache.set(`notifications:${userId}:count`, count, 60)
    }

    return count
  }

  // Helper methods

  private isChannelEnabled(
    channel: NotificationChannel,
    type: NotificationType,
    preferences: NotificationPreferences
  ): boolean {
    const channelPrefs = preferences.channels[channel]
    if (!channelPrefs?.enabled) return false

    // Check if this notification type is allowed for this channel
    if (channelPrefs.types && !channelPrefs.types.includes(type)) {
      return false
    }

    return true
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    // Check quiet hours for all channels
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    for (const channel of Object.values(preferences.channels)) {
      if (channel?.quiet_hours) {
        const { start, end } = channel.quiet_hours
        
        if (start < end) {
          // Same day quiet hours
          if (currentTime >= start && currentTime < end) return true
        } else {
          // Overnight quiet hours
          if (currentTime >= start || currentTime < end) return true
        }
      }
    }

    return false
  }

  private async queueForLater(notification: Notification): Promise<void> {
    // Calculate next delivery time (end of quiet hours)
    const preferences = await this.getUserPreferences(notification.userId)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Find earliest end time of quiet hours
    let deliveryTime = tomorrow
    for (const channel of Object.values(preferences.channels)) {
      if (channel?.quiet_hours?.end) {
        const [hours, minutes] = channel.quiet_hours.end.split(':').map(Number)
        const endTime = new Date()
        endTime.setHours(hours, minutes, 0, 0)
        
        if (endTime < deliveryTime) {
          deliveryTime = endTime
        }
      }
    }

    // Queue notification for later delivery
    await queueManager.addJob(
      QueueName.NOTIFICATIONS,
      { type: 'delayed', notification },
      { 
        delay: deliveryTime.getTime() - Date.now(),
        priority: notification.priority === NotificationPriority.HIGH ? 5 : 10
      }
    )
  }

  private async storeNotification(notification: Notification): Promise<void> {
    await prisma.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        read: false,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
        icon: notification.icon,
        image: notification.image,
        createdAt: notification.createdAt,
        expiresAt: notification.expiresAt
      }
    })
  }

  private async updateNotificationCount(userId: string): Promise<void> {
    if (!cache) return

    const key = `notifications:${userId}:count`
    await cache.incr(key)
    await cache.expire(key, 60)
  }

  private getEmailTemplate(type: NotificationType): string {
    const templates: Record<NotificationType, string> = {
      [NotificationType.SYSTEM_UPDATE]: 'system-update',
      [NotificationType.RESOURCE_CREATED]: 'resource-created',
      [NotificationType.PATTERN_EXTRACTED]: 'pattern-extracted',
      [NotificationType.MENTION]: 'mention',
      [NotificationType.TASK_COMPLETED]: 'task-completed',
      // Add more templates as needed
    }

    return templates[type] || 'default'
  }

  private getPriorityColor(priority: NotificationPriority): number {
    const colors = {
      [NotificationPriority.LOW]: 0x808080,    // Gray
      [NotificationPriority.NORMAL]: 0x0099ff, // Blue
      [NotificationPriority.HIGH]: 0xffaa00,   // Orange
      [NotificationPriority.URGENT]: 0xff0000  // Red
    }

    return colors[priority] || colors[NotificationPriority.NORMAL]
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()

// Export convenience functions
export async function sendNotification(notification: Notification): Promise<void> {
  return notificationService.send(notification)
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  return notificationService.markAsRead(notificationId, userId)
}

export async function getUserNotifications(
  userId: string,
  options?: any
): Promise<Notification[]> {
  return notificationService.getUserNotifications(userId, options)
}