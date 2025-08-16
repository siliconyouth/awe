# Clerk Backend Implementation Guide

## Overview

This implementation provides comprehensive backend authentication using Clerk in Next.js App Router, including protected API routes, server actions, and authenticated requests.

## Key Components Implemented

### 1. Protected API Routes

#### `/api/user/route.ts`
- GET endpoint to fetch current user information
- Uses `auth()` and `currentUser()` from Clerk
- Returns user profile data

#### `/api/protected/route.ts`
- Example of role-based protection
- GET: Returns session information
- POST: Admin-only endpoint using `auth().protect({ role: 'admin' })`

#### `/api/session/route.ts`
- GET: Retrieves session details and tokens
- DELETE: Revokes current session
- Demonstrates token management

### 2. Middleware Configuration

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/api/protected(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});
```

### 3. Server Actions

Located in `/app/actions/user-actions.ts`:
- `updateUserProfile()` - Update user information
- `updateUserMetadata()` - Admin-only metadata updates
- `createOrganization()` - Create new organizations
- `inviteToOrganization()` - Send invitations
- `getUserOrganizations()` - List user's organizations
- `deleteUser()` - Admin-only user deletion

### 4. Backend Request Utilities

Located in `/lib/clerk-backend.ts`:

```typescript
// Make authenticated backend requests
authenticatedFetch(url, options)
authenticatedGet(url)
authenticatedPost(url, body)

// Role-based access control
hasRole(role)
requireRole(role)

// Organization headers
getOrgHeaders()
```

### 5. Client-Side Authentication

#### API Tester Component (`/components/api-tester.tsx`)
Demonstrates client-side authenticated requests:
```typescript
const { getToken } = useAuth();
const token = await getToken();

fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Authentication Flow

### Server Components
```typescript
// In any server component
import { auth } from "@clerk/nextjs/server";

export default async function Page() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  // Component logic
}
```

### API Routes
```typescript
// In any API route
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // Route logic
}
```

### Server Actions
```typescript
'use server';

import { auth } from "@clerk/nextjs/server";

export async function myAction() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  // Action logic
}
```

## Role-Based Access Control

### Setting User Roles

Roles should be set in Clerk Dashboard or programmatically:

```typescript
const client = await clerkClient();
await client.users.updateUserMetadata(userId, {
  publicMetadata: {
    role: 'admin'
  }
});
```

### Checking Roles

```typescript
const { sessionClaims, orgRole } = await auth();

const isAdmin = 
  sessionClaims?.metadata?.role === 'admin' ||
  orgRole === 'org:admin';
```

### Protecting Routes by Role

```typescript
// Using middleware
if (isAdminRoute(req)) {
  const { sessionClaims } = await auth();
  if (sessionClaims?.metadata?.role !== 'admin') {
    return new Response("Forbidden", { status: 403 });
  }
}

// Using auth().protect()
await auth().protect({ role: 'admin' });
```

## Testing Endpoints

Visit `/test-api` to test the implemented endpoints:

1. **Get User Info** - `/api/user`
2. **Protected Route** - `/api/protected`
3. **Session Info** - `/api/session`
4. **Admin POST** - `/api/protected` (POST)

## Security Best Practices

1. **Always verify authentication** in server components and API routes
2. **Use middleware** to protect entire route groups
3. **Implement role-based access** for sensitive operations
4. **Validate tokens** on every backend request
5. **Use Server Actions** for mutations to automatically include auth context
6. **Include proper headers** in authenticated requests

## Environment Variables

Ensure these are set in `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Common Patterns

### Protected Page
```typescript
export default async function ProtectedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  // Page content
}
```

### Protected API
```typescript
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // API logic
}
```

### Admin-Only Action
```typescript
export async function adminAction() {
  await requireRole('admin');
  // Admin logic
}
```

## Troubleshooting

### "auth() was called but Clerk can't detect clerkMiddleware()"
- Ensure middleware.ts is in the correct location
- Check that clerkMiddleware() is the default export
- Verify matcher configuration includes your route

### "Unauthorized" errors
- Check environment variables are set correctly
- Ensure user is signed in
- Verify middleware is protecting the route

### Token issues
- Tokens expire after a short time
- Use `getToken()` to get fresh tokens
- Check Clerk Dashboard for API key configuration

## Next Steps

1. Set up webhook endpoints for user events
2. Implement custom session tokens
3. Add OAuth providers
4. Configure organization settings
5. Set up production keys in Clerk Dashboard