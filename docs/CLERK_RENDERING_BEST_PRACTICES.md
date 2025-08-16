# Clerk + Next.js Rendering Best Practices

## Overview
This document outlines the best practices for using Clerk authentication with Next.js rendering modes in the AWE codebase.

## Key Principles

### 1. Avoid Wrapping Entire App with ClerkProvider
❌ **Don't do this:**
```tsx
// Root layout - forces entire app to be client-side
export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
}
```

✅ **Do this instead:**
```tsx
// Use ClerkProvider only where needed
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
```

### 2. Use Server Components for Authentication Checks

✅ **Server Component (Preferred):**
```tsx
// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }
  
  // Render authenticated content
}
```

❌ **Client Component (Avoid when possible):**
```tsx
"use client"
import { useAuth } from "@clerk/nextjs"

export default function DashboardPage() {
  const { userId } = useAuth()
  
  if (!userId) {
    // Client-side redirect
  }
}
```

### 3. Use Layout Groups for Authenticated Routes

Create a layout that handles authentication for multiple pages:

```tsx
// app/(auth)/layout.tsx
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function AuthenticatedLayout({ children }) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }
  
  return <>{children}</>
}
```

Then place authenticated pages under this layout:
- `app/(auth)/dashboard/page.tsx`
- `app/(auth)/profile/page.tsx`
- `app/(auth)/settings/page.tsx`

### 4. Use Dynamic Rendering Selectively

When you need client-side auth data, use the `dynamic` prop with Suspense:

```tsx
"use client"
import { Suspense } from 'react'
import { ClerkProvider } from '@clerk/nextjs'

function AuthContent() {
  // Component that needs auth data
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ClerkProvider dynamic>
        <AuthContent />
      </ClerkProvider>
    </Suspense>
  )
}
```

### 5. API Routes Best Practices

Always use server-side auth in API routes:

```tsx
// app/api/protected/route.ts
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Handle authenticated request
}
```

## File Structure Recommendations

```
app/
├── (public)/           # Public pages (static generation)
│   ├── page.tsx       # Home page
│   └── about/
│       └── page.tsx
├── (auth)/            # Authenticated pages (dynamic)
│   ├── layout.tsx     # Auth check layout
│   ├── dashboard/
│   │   └── page.tsx
│   └── profile/
│       └── page.tsx
├── api/               # API routes
│   └── protected/
│       └── route.ts
└── layout.tsx         # Root layout (minimal)
```

## Component Guidelines

### Server Components (Default)
- Use for pages that need SEO
- Use for data fetching
- Use `auth()` for authentication checks
- Can pass auth data to client components as props

### Client Components ("use client")
- Use for interactivity (onClick, onChange, etc.)
- Use for browser APIs
- Use `useAuth()` hook when needed
- Minimize usage for better performance

## RBAC Implementation

### Server-Side Role Checking
```tsx
// lib/auth/rbac.ts (server utilities)
import { auth } from "@clerk/nextjs/server"

export async function checkRole(role: Roles): Promise<boolean> {
  const { sessionClaims } = await auth()
  // Check role logic
}
```

### Client-Side Role Checking
```tsx
// lib/auth/hooks.ts (client hooks)
"use client"
import { useAuth } from "@clerk/nextjs"

export function useHasRole(role: Roles): boolean {
  const { sessionClaims } = useAuth()
  // Check role logic
}
```

## Common Patterns

### Protected Page Pattern
```tsx
// Server component with auth check
export default async function ProtectedPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")
  
  const user = await currentUser()
  const role = await getUserRole()
  
  return <PageContent user={user} role={role} />
}
```

### Protected API Pattern
```tsx
export async function GET() {
  const unauthorizedResponse = await protectApiRoute('admin')
  if (unauthorizedResponse) return unauthorizedResponse
  
  // Handle request
}
```

### Conditional Rendering Pattern
```tsx
// In server components
const user = await currentUser()
{user && <AuthenticatedContent />}

// In client components
<SignedIn>
  <AuthenticatedContent />
</SignedIn>
<SignedOut>
  <PublicContent />
</SignedOut>
```

## Performance Tips

1. **Minimize ClerkProvider usage**: Only wrap components that need auth state
2. **Use server components by default**: Only use client components when necessary
3. **Leverage caching**: Server components can be cached at CDN level
4. **Use Suspense boundaries**: Provide loading states for dynamic content
5. **Avoid auth checks in middleware for all routes**: Be selective

## Testing Considerations

- Mock `auth()` for server component tests
- Mock `useAuth()` for client component tests
- Test both authenticated and unauthenticated states
- Test role-based access control

## Migration Checklist

When migrating existing code:
- [ ] Remove unnecessary ClerkProvider wrappers
- [ ] Convert client components to server components where possible
- [ ] Move auth checks to layouts when multiple pages need protection
- [ ] Add Suspense boundaries for dynamic content
- [ ] Update imports from `@clerk/nextjs` to `@clerk/nextjs/server` where appropriate
- [ ] Test that static pages are being statically generated
- [ ] Verify that protected routes properly redirect unauthenticated users

## References

- [Clerk Next.js Rendering Modes](https://clerk.com/docs/references/nextjs/rendering-modes)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/react/use-server)