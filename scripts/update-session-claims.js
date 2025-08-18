#!/usr/bin/env node

/**
 * Update Clerk Session Claims
 * 
 * This script updates the user's session to include the role from publicMetadata.
 * 
 * IMPORTANT: After running this script, you need to:
 * 1. Sign out completely
 * 2. Sign back in to get a new session with the updated claims
 * 
 * Usage:
 * node scripts/update-session-claims.js <email>
 */

import { createClerkClient } from '@clerk/backend'
import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../apps/web/.env.local') })

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

async function updateSessionClaims(email) {
  try {
    console.log(`\n🔍 Looking for user with email: ${email}`)
    
    // Find user by email
    const users = await clerkClient.users.getUserList({
      emailAddress: [email],
    })

    if (users.data.length === 0) {
      console.error(`❌ No user found with email: ${email}`)
      process.exit(1)
    }

    const user = users.data[0]
    console.log(`✅ Found user: ${user.id}`)
    console.log(`📋 Current publicMetadata:`, user.publicMetadata)

    // Get the role from publicMetadata
    const role = user.publicMetadata?.role || 'user'
    console.log(`🎭 Role in publicMetadata: ${role}`)

    // Update the user's unsafe metadata to include the role
    // This will be included in the session claims
    const updatedUser = await clerkClient.users.updateUser(user.id, {
      unsafeMetadata: {
        ...user.unsafeMetadata,
        role: role,
      },
    })

    console.log(`✅ Updated unsafeMetadata with role: ${role}`)
    console.log(`📋 New unsafeMetadata:`, updatedUser.unsafeMetadata)

    // Also ensure publicMetadata has the role
    if (!user.publicMetadata?.role) {
      await clerkClient.users.updateUser(user.id, {
        publicMetadata: {
          ...user.publicMetadata,
          role: role,
        },
      })
      console.log(`✅ Also updated publicMetadata with role: ${role}`)
    }

    console.log(`
✨ Session claims updated successfully!

⚠️  IMPORTANT: The user needs to sign out and sign back in for the changes to take effect.

Next steps:
1. Sign out from your current session
2. Sign back in with your email: ${email}
3. Visit /debug-role to verify the role is now in the session
4. The admin links should now appear in the navigation menu
`)

  } catch (error) {
    console.error('❌ Error updating session claims:', error)
    process.exit(1)
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.log(`
Usage: node scripts/update-session-claims.js <email>

Example:
  node scripts/update-session-claims.js vladimir@dukelic.com
`)
  process.exit(1)
}

// Check for required environment variables
if (!process.env.CLERK_SECRET_KEY) {
  console.error(`
❌ CLERK_SECRET_KEY not found in environment variables.

Make sure you have a .env.local file in apps/web with:
CLERK_SECRET_KEY=sk_...
`)
  process.exit(1)
}

updateSessionClaims(email)