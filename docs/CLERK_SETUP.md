# Clerk Setup Documentation

## Critical Configuration Steps

### 1. Environment Variables ✅
Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 2. Session Token Configuration (REQUIRED)
**This is critical for role-based access to work properly!**

1. Go to Clerk Dashboard → Sessions → Customize session token
2. Add this custom claim:
```json
{
  "metadata": {
    "role": "{{user.public_metadata.role}}",
    "permissions": "{{user.public_metadata.permissions}}",
    "tier": "{{user.public_metadata.tier}}"
  }
}
```

### 3. Webhook Configuration
1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Select events:
   - user.created
   - user.updated
   - organization.member.created
   - organization.member.updated
4. Copy signing secret to `CLERK_WEBHOOK_SECRET`

### 4. OAuth Providers (Optional)
1. Go to Clerk Dashboard → User & Authentication → Social connections
2. Enable desired providers (Google, GitHub, etc.)
3. Configure OAuth credentials

### 5. Organization Features (Optional)
1. Go to Clerk Dashboard → Organizations
2. Enable organizations
3. Configure organization roles if needed

## Role Management

### Default Roles
- `admin`: Full system access
- `moderator`: Content moderation and elevated access
- `developer`: Development tools and API access
- `user`: Basic access (default)

### Role Assignment Rules
Users are automatically assigned roles based on:
1. Email domain (@awe.dev, @dukelic.com → admin)
2. Email patterns (+dev@ → developer, +beta@ → moderator)
3. Manual assignment by admins

### Testing Role Assignment
1. Create a test user
2. Check webhook logs for role assignment
3. Verify role in Clerk Dashboard → Users → [User] → Metadata → Public

## Troubleshooting

### Issue: User roles not recognized
**Solution**: Ensure session token claims are configured (Step 2 above)

### Issue: Webhooks not firing
**Solution**: 
1. Check webhook endpoint is accessible
2. Verify signing secret matches
3. Check Clerk Dashboard → Webhooks → Logs

### Issue: Authentication state not recognized on homepage
**Solution**: 
1. Ensure only ONE ClerkProvider at root
2. Wrap components needing auth state with ClerkLoaded/ClerkLoading
3. Use ProjectProvider for project-specific context

## Development Tips

### Check User Role
```typescript
import { auth } from '@clerk/nextjs/server'

const { sessionClaims } = await auth()
const role = sessionClaims?.metadata?.role || 'user'
```

### Update User Role (Admin Only)
```typescript
import { setUserRole } from '@/lib/auth/rbac'

await setUserRole(userId, 'developer')
```

### Protect Routes
```typescript
import { protectRoute } from '@/lib/auth/rbac'

// In a page component
await protectRoute('admin', '/unauthorized')
```

## Production Checklist
- [ ] Session token claims configured
- [ ] Webhook endpoint live and verified
- [ ] Environment variables set
- [ ] Role initialization tested
- [ ] Admin users configured
- [ ] Rate limits reviewed
- [ ] Error handling implemented