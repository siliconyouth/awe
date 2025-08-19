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
import { getPrisma } from '@awe/database'

const prisma = getPrisma()

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
  // Retry logic for database operations
  const maxRetries = 3
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Upsert user to handle race conditions
      await prisma.user.upsert({
        where: { clerkId: userData.clerkId },
        update: {
          email: userData.email || '',
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || 'user',
          lastSignIn: new Date(),
        },
        create: {
          clerkId: userData.clerkId,
          email: userData.email || '',
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || 'user',
          tier: 'free',
          onboardingCompleted: false,
        },
      })
      
      console.log(`✅ User ${userData.clerkId} stored in database`)
      return // Success - exit function
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, error)
      
      // Exponential backoff: wait before retrying
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }
    }
  }
  
  // All retries failed
  console.error(`❌ Failed to store user ${userData.clerkId} after ${maxRetries} attempts:`, lastError)
  // Could implement dead letter queue here for manual processing
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
  const maxRetries = 3
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Extract role and tier from metadata
      const role = (userData.metadata?.role as Roles) || undefined
      const tier = (userData.metadata?.tier as string) || undefined
      const onboardingCompleted = userData.metadata?.onboardingCompleted as boolean | undefined
      
      // Check if user exists first
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: userData.clerkId },
      })
      
      if (!existingUser) {
        // User doesn't exist, create them
        await prisma.user.create({
          data: {
            clerkId: userData.clerkId,
            email: userData.email || '',
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: role || 'user',
            tier: tier || 'free',
            onboardingCompleted: onboardingCompleted || false,
            lastSignIn: new Date(),
          },
        })
        console.log(`✅ User ${userData.clerkId} created in database`)
      } else {
        // Update existing user
        await prisma.user.update({
          where: { clerkId: userData.clerkId },
          data: {
            ...(userData.email && { email: userData.email }),
            ...(userData.firstName !== undefined && { firstName: userData.firstName }),
            ...(userData.lastName !== undefined && { lastName: userData.lastName }),
            ...(role && { role }),
            ...(tier && { tier }),
            ...(onboardingCompleted !== undefined && { onboardingCompleted }),
            lastSignIn: new Date(),
          },
        })
        console.log(`✅ User ${userData.clerkId} updated in database`)
      }
      
      return // Success - exit function
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, error)
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }
    }
  }
  
  console.error(`❌ Failed to update user ${userData.clerkId} after ${maxRetries} attempts:`, lastError)
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
  const maxRetries = 3
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // First ensure the user exists in the database
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      })
      
      if (!user) {
        // Create basic user record if doesn't exist
        await prisma.user.create({
          data: {
            clerkId: userId,
            email: '',
            role: role,
            tier: 'free',
            onboardingCompleted: false,
          },
        })
      }
      
      // Check if organization exists, create if not
      await prisma.organization.upsert({
        where: { clerkOrgId: organizationId },
        update: {},
        create: {
          clerkOrgId: organizationId,
          name: `Organization ${organizationId}`,
          slug: organizationId.toLowerCase(),
          plan: 'free',
        },
      })
      
      // Get the user's database ID
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      })
      
      if (!dbUser) {
        throw new Error(`User ${userId} not found in database`)
      }
      
      // Get the organization's database ID
      const dbOrg = await prisma.organization.findUnique({
        where: { clerkOrgId: organizationId },
        select: { id: true },
      })
      
      if (!dbOrg) {
        throw new Error(`Organization ${organizationId} not found in database`)
      }
      
      // Update or create organization membership
      await prisma.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId: dbUser.id,
            organizationId: dbOrg.id,
          },
        },
        update: {
          role: role === 'admin' ? 'admin' : 'member',
        },
        create: {
          userId: dbUser.id,
          organizationId: dbOrg.id,
          role: role === 'admin' ? 'admin' : 'member',
        },
      })
      
      console.log(`✅ Set ${role} role for user ${userId} in org ${organizationId}`)
      return // Success - exit function
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, error)
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }
    }
  }
  
  console.error(`❌ Failed to update org role after ${maxRetries} attempts:`, lastError)
}