/**
 * Clerk Webhook Handler
 * 
 * This webhook is called by Clerk when user events occur.
 * It's used to initialize user roles when they sign up.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Clerk Dashboard → Webhooks
 * 2. Add endpoint: https://your-domain.com/api/webhooks/clerk
 * 3. Select events: user.created, user.updated, organization.member.created
 * 4. Copy the signing secret to CLERK_WEBHOOK_SECRET env var
 */

import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { initializeUserRole } from '../../../../lib/auth/rbac'
import type { Roles } from '../../../../types/globals'

// Get the webhook secret from environment
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

if (!webhookSecret) {
  console.warn('CLERK_WEBHOOK_SECRET not set - webhooks will not work')
}

export async function POST(request: NextRequest) {
  try {
    // Get headers
    const headerPayload = await headers()
    const svixId = headerPayload.get('svix-id')
    const svixTimestamp = headerPayload.get('svix-timestamp')
    const svixSignature = headerPayload.get('svix-signature')

    // Verify webhook signature
    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      )
    }

    // Get body
    const payload = await request.json()
    const body = JSON.stringify(payload)

    // Verify the webhook
    const wh = new Webhook(webhookSecret || '')
    let event: WebhookEvent

    try {
      event = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as WebhookEvent
    } catch (err) {
      console.error('Webhook verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event)
        break
        
      case 'user.updated':
        await handleUserUpdated(event)
        break
        
      default:
        // Handle organization events as well (using string type for extended events)
        const eventType = event.type as string
        if (eventType === 'organization.member.created') {
          await handleOrganizationMemberCreated(event)
        } else if (eventType === 'organization.member.updated') {
          await handleOrganizationMemberUpdated(event)
        } else {
          console.log(`Unhandled webhook event: ${event.type}`)
        }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle user.created event
 * Initialize role for new users
 */
async function handleUserCreated(event: WebhookEvent) {
  if (event.type !== 'user.created') return

  const { id, email_addresses, first_name, last_name } = event.data

  console.log(`New user created: ${id}`)

  // Get primary email
  const primaryEmail = email_addresses?.find(e => e.id === event.data.primary_email_address_id)?.email_address

  // Determine initial role
  let initialRole: Roles = 'user'
  
  // Check if user is first user (make them admin)
  // Or check if email is in VIP list
  if (primaryEmail && isVIPUser(primaryEmail)) {
    initialRole = 'admin'
  }

  // Initialize user role in Clerk metadata
  await initializeUserRole(id, initialRole)

  // Store user in your database if needed
  await storeUserInDatabase({
    clerkId: id,
    email: primaryEmail,
    firstName: first_name,
    lastName: last_name,
    role: initialRole,
  })
}

/**
 * Handle user.updated event
 * Sync user data changes
 */
async function handleUserUpdated(event: WebhookEvent) {
  if (event.type !== 'user.updated') return

  const { id, email_addresses, first_name, last_name, public_metadata } = event.data

  console.log(`User updated: ${id}`)

  // Update user in your database if needed
  await updateUserInDatabase({
    clerkId: id,
    email: email_addresses?.find(e => e.id === event.data.primary_email_address_id)?.email_address,
    firstName: first_name,
    lastName: last_name,
    metadata: public_metadata,
  })
}

/**
 * Check if email is in VIP list
 */
function isVIPUser(email: string): boolean {
  const vipEmails = [
    // Add VIP emails here
    'vip@example.com',
    'special@partner.com',
  ]
  
  return vipEmails.includes(email)
}

/**
 * Store user in your database
 */
async function storeUserInDatabase(userData: {
  clerkId: string
  email?: string
  firstName?: string | null
  lastName?: string | null
  role?: Roles
}) {
  try {
    // Import your database client
    // const { PrismaClient } = await import('@awe/database')
    // const prisma = new PrismaClient()

    // Store user (example - adjust to your schema)
    // await prisma.user.create({
    //   data: {
    //     clerkId: userData.clerkId,
    //     email: userData.email,
    //     firstName: userData.firstName,
    //     lastName: userData.lastName,
    //     role: userData.role,
    //   }
    // })

    // await prisma.$disconnect()
    
    console.log('Storing user in database:', userData)
  } catch (error) {
    console.error('Failed to store user in database:', error)
  }
}

/**
 * Update user in your database
 */
async function updateUserInDatabase(userData: {
  clerkId: string
  email?: string
  firstName?: string | null
  lastName?: string | null
  metadata?: Record<string, unknown>
}) {
  try {
    // Import your database client
    // const { PrismaClient } = await import('@awe/database')
    // const prisma = new PrismaClient()

    // Update user (example - adjust to your schema)
    // await prisma.user.update({
    //   where: { clerkId: userData.clerkId },
    //   data: {
    //     email: userData.email,
    //     firstName: userData.firstName,
    //     lastName: userData.lastName,
    //     metadata: userData.metadata,
    //   }
    // })

    // await prisma.$disconnect()
    
    console.log('Updating user in database:', userData)
  } catch (error) {
    console.error('Failed to update user in database:', error)
  }
}

/**
 * Handle organization.member.created event
 * Set organization-specific roles
 */
interface OrganizationMemberEvent {
  type: string
  data: {
    organization: { id: string }
    public_user_data?: { user_id: string }
    role: string
  }
}

async function handleOrganizationMemberCreated(event: WebhookEvent) {
  if ((event.type as string) !== 'organization.member.created') return

  const orgEvent = event as unknown as OrganizationMemberEvent
  const eventData = orgEvent.data
  const { organization, public_user_data, role } = eventData

  console.log(`User ${public_user_data?.user_id} joined organization ${organization.id} as ${role}`)

  // Map Clerk organization role to app role
  let appRole: Roles = 'user'
  
  if (role === 'org:admin') {
    appRole = 'admin'
  } else if (role === 'org:moderator') {
    appRole = 'moderator'
  }

  // Update user's organization-specific role
  if (public_user_data?.user_id) {
    await updateUserOrganizationRole(
      public_user_data.user_id,
      organization.id,
      appRole
    )
  }
}

/**
 * Handle organization.member.updated event
 */
async function handleOrganizationMemberUpdated(event: WebhookEvent) {
  if ((event.type as string) !== 'organization.member.updated') return

  const orgEvent = event as unknown as OrganizationMemberEvent
  const eventData = orgEvent.data
  const { organization, public_user_data, role } = eventData

  console.log(`User ${public_user_data?.user_id} role updated in organization ${organization.id} to ${role}`)

  // Update organization role mapping
  let appRole: Roles = 'user'
  
  if (role === 'org:admin') {
    appRole = 'admin'
  } else if (role === 'org:moderator') {
    appRole = 'moderator'
  }

  if (public_user_data?.user_id) {
    await updateUserOrganizationRole(
      public_user_data.user_id,
      organization.id,
      appRole
    )
  }
}

/**
 * Update user's organization-specific role
 */
async function updateUserOrganizationRole(
  userId: string,
  organizationId: string,
  role: Roles
) {
  try {
    // You can store organization-specific roles in your database
    // or update Clerk metadata with organization roles
    console.log(`Setting ${role} role for user ${userId} in org ${organizationId}`)
    
    // TODO: Implement database storage for organization roles
    // const db = await getDatabase()
    // if (db) {
    //   await db.organizationMember.upsert({
    //     where: { userId_organizationId: { userId, organizationId } },
    //     update: { role },
    //     create: { userId, organizationId, role }
    //   })
    // }
  } catch (error) {
    console.error('Failed to update organization role:', error)
  }
}