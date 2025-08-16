'use server';

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { requireRole, hasRole } from "../../lib/clerk-backend";

/**
 * Server Action: Update user profile
 */
export async function updateUserProfile(formData: FormData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  
  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      firstName,
      lastName,
    });
    
    revalidatePath('/dashboard');
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, message: "Failed to update profile" };
  }
}

/**
 * Server Action: Update user metadata (admin only)
 */
export async function updateUserMetadata(
  targetUserId: string,
  metadata: Record<string, any>
) {
  // Require admin role
  await requireRole('admin');
  
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(targetUserId, {
      publicMetadata: metadata,
    });
    
    return { success: true, message: "User metadata updated" };
  } catch (error) {
    console.error("Error updating metadata:", error);
    return { success: false, message: "Failed to update metadata" };
  }
}

/**
 * Server Action: Create organization
 */
export async function createOrganization(name: string, slug: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  try {
    const client = await clerkClient();
    const org = await client.organizations.createOrganization({
      name,
      slug,
      createdBy: userId,
    });
    
    return { 
      success: true, 
      organizationId: org.id,
      message: "Organization created successfully" 
    };
  } catch (error) {
    console.error("Error creating organization:", error);
    return { success: false, message: "Failed to create organization" };
  }
}

/**
 * Server Action: Invite user to organization
 */
export async function inviteToOrganization(
  orgId: string,
  emailAddress: string,
  role: string = 'member'
) {
  // Check if user has admin role in the organization
  const isAdmin = await hasRole('admin');
  
  if (!isAdmin) {
    throw new Error("Only organization admins can invite members");
  }
  
  try {
    const client = await clerkClient();
    await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress,
      role,
      inviterUserId: (await auth()).userId!,
    });
    
    return { 
      success: true, 
      message: `Invitation sent to ${emailAddress}` 
    };
  } catch (error) {
    console.error("Error sending invitation:", error);
    return { success: false, message: "Failed to send invitation" };
  }
}

/**
 * Server Action: Get user's organizations
 */
export async function getUserOrganizations() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  try {
    const client = await clerkClient();
    const memberships = await client.users.getOrganizationMembershipList({
      userId,
    });
    
    return {
      success: true,
      organizations: memberships.data.map(m => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
        createdAt: m.createdAt,
      }))
    };
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return { success: false, organizations: [] };
  }
}

/**
 * Server Action: Delete user (admin only)
 */
export async function deleteUser(targetUserId: string) {
  // Require admin role
  await requireRole('admin');
  
  const { userId } = await auth();
  
  // Prevent self-deletion
  if (userId === targetUserId) {
    throw new Error("Cannot delete your own account");
  }
  
  try {
    const client = await clerkClient();
    await client.users.deleteUser(targetUserId);
    
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, message: "Failed to delete user" };
  }
}