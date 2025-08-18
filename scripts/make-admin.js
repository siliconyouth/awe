#!/usr/bin/env node

/**
 * Script to make a user an admin by email
 * Usage: node scripts/make-admin.js <email>
 */

const { createClerkClient } = require('@clerk/clerk-sdk-node');
require('dotenv').config({ path: '.env.local' });

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  console.error('Error: CLERK_SECRET_KEY not found in environment variables');
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: clerkSecretKey });

async function makeUserAdmin(email) {
  try {
    console.log(`Looking for user with email: ${email}`);
    
    // Get user by email
    const { data: users } = await clerk.users.getUserList({
      emailAddress: [email]
    });

    if (users.length === 0) {
      console.error(`No user found with email: ${email}`);
      return;
    }

    const user = users[0];
    console.log(`Found user: ${user.firstName} ${user.lastName} (${user.id})`);

    // Update user metadata to set admin role
    const updatedUser = await clerk.users.updateUserMetadata(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        role: 'admin',
        permissions: [
          'admin.access',
          'admin.users.read',
          'admin.users.write',
          'admin.config.read',
          'admin.config.write',
          'admin.knowledge.read',
          'admin.knowledge.write'
        ],
        tier: 'enterprise',
        onboardingCompleted: true
      }
    });

    console.log('✅ User successfully updated to admin role!');
    console.log('User metadata:', updatedUser.publicMetadata);
    
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/make-admin.js <email>');
  console.log('Example: node scripts/make-admin.js vladimir@dukelic.com');
  process.exit(1);
}

makeUserAdmin(email);