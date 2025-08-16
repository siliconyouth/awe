# Clerk Authentication Setup

AWE uses Clerk for authentication, providing a complete auth solution with user management, organizations, and role-based access control.

## Quick Start

### 1. Environment Variables

The `.env.sample` file includes test Clerk keys that are ready to use:

```bash
# Copy the sample file
cp apps/web/.env.sample apps/web/.env.local
```

The test keys are already configured and will work immediately:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Public key for client-side
- `CLERK_SECRET_KEY`: Secret key for server-side

### 2. Start the Application

```bash
pnpm dev
```

### 3. Sign Up / Sign In

Visit `http://localhost:3000` and click "Get Started" to create your first account.

## Features Implemented

### User Authentication
- Sign up with email/password
- Sign in with modal or dedicated page
- User profile management
- Session management

### Organization Management
- Create organizations
- Invite team members
- Role-based permissions (Admin/Member)
- Organization switching

### Protected Routes
- Dashboard (`/dashboard`)
- Team management (`/team`)
- Admin panel (`/admin/*`)
- Knowledge monitoring (`/admin/knowledge`)

### Components

#### Authentication Components
- `<SignInButton>` - Modal sign in
- `<SignUpButton>` - Modal sign up
- `<UserButton>` - User menu with profile
- `<SignedIn>` - Show content when authenticated
- `<SignedOut>` - Show content when not authenticated

#### Organization Components
- `<OrganizationSwitcher>` - Switch between organizations
- `<OrganizationProfile>` - Manage organization settings
- `<OrganizationList>` - List user's organizations
- `<CreateOrganization>` - Create new organization

## Middleware Configuration

The middleware (`src/middleware.ts`) uses `clerkMiddleware()` to protect routes:

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();
```

## Layout Configuration

The root layout wraps the app with `<ClerkProvider>`:

```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## Production Setup

For production, create a Clerk account and replace the test keys:

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your production keys
4. Update environment variables in Vercel

## Role-Based Access Control

AWE supports role-based access:

- **Admin**: Full access to all features
- **Member**: Limited access to team features
- **Guest**: Read-only access (optional)

Set user roles in Clerk Dashboard or programmatically:

```typescript
// Check admin role
const { sessionClaims } = await auth();
const isAdmin = sessionClaims?.metadata?.role === 'admin';
```

## API Protection

Protect API routes using auth():

```typescript
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // Your API logic here
}
```

## Organization Features

### Create Organization
Users can create organizations from the team page

### Invite Members
Admins can invite team members via email

### Manage Roles
Assign admin or member roles to organization users

### Organization Settings
- Profile customization
- Domain verification
- SSO configuration (Enterprise)

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**
   - Ensure environment variables are set
   - Check middleware configuration
   - Verify auth() is awaited

2. **Organization not showing**
   - Enable organizations in Clerk Dashboard
   - Check organization permissions

3. **User profile not updating**
   - Clear browser cache
   - Check Clerk Dashboard for user data

## Next Steps

1. Customize authentication UI in Clerk Dashboard
2. Set up webhook endpoints for user events
3. Configure social login providers
4. Enable MFA for enhanced security
5. Set up custom domains for auth pages

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Organization Management](https://clerk.com/docs/organizations/overview)
- [Custom Roles](https://clerk.com/docs/organizations/roles-permissions)