# Clerk Session Token Configuration

This guide explains how to configure Clerk to include user roles in the session token for optimal performance.

## Why Configure Session Claims?

By default, Clerk doesn't include `publicMetadata` in the session token. This means we have to fetch the user object on every request to check roles, which is slow and uses API quota.

By configuring custom session claims, the role is included directly in the JWT token, making role checks instant and reducing API calls.

## Configuration Steps

### 1. Access Clerk Dashboard
1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **Sessions** in the left sidebar

### 2. Edit Session Token
Click on **Edit** in the Session token section to open the JSON editor.

### 3. Add Custom Claims
Replace the default configuration with:

```json
{
  "metadata": {
    "role": "{{user.public_metadata.role}}"
  },
  "publicMetadata": "{{user.public_metadata}}"
}
```

Or for a more comprehensive setup:

```json
{
  "userId": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "firstName": "{{user.first_name}}",
  "lastName": "{{user.last_name}}",
  "metadata": {
    "role": "{{user.public_metadata.role}}",
    "permissions": "{{user.public_metadata.permissions}}"
  },
  "publicMetadata": "{{user.public_metadata}}",
  "orgId": "{{org.id}}",
  "orgRole": "{{org_membership.role}}",
  "orgSlug": "{{org.slug}}"
}
```

### 4. Save Changes
Click **Save** to apply the configuration.

### 5. Sign Out and Back In
Users need to sign out and sign back in to get a new session token with the custom claims.

## How It Works

### Before Configuration
```typescript
// Every request requires an API call to Clerk
const user = await clerkClient.users.getUser(userId)
const role = user.publicMetadata.role
```

### After Configuration
```typescript
// Role is directly available in the session
const { sessionClaims } = await auth()
const role = sessionClaims.metadata.role
```

## Testing the Configuration

1. Sign out of your application
2. Sign back in
3. Visit `/debug-role` to see the session claims
4. Check that `sessionClaims.metadata.role` contains your role

## Fallback Mechanism

The code includes a fallback mechanism:
1. First checks `sessionClaims.metadata.role`
2. Then checks `sessionClaims.publicMetadata.role`
3. Finally fetches from the user object if needed

This ensures the app works both with and without custom session claims configured.

## Performance Impact

- **Without custom claims**: ~100-200ms per role check (API call)
- **With custom claims**: ~1ms per role check (JWT decode)

For a typical page load with 5 role checks, this saves ~500-1000ms of latency.

## Security Notes

- Session tokens are signed JWTs and cannot be tampered with
- Roles in publicMetadata can only be changed server-side
- The session token is automatically refreshed when publicMetadata changes
- Users must sign out/in to get updated roles immediately

## Troubleshooting

### Role not appearing in session
1. Check the JSON configuration syntax
2. Ensure you saved the changes
3. Sign out and back in
4. Check `/debug-role` for session contents

### Old role persists after change
1. User needs to sign out and sign in again
2. Or wait for session to expire (default 1 hour)
3. Consider implementing a "refresh session" button

### Session claims undefined
1. Check that custom claims are saved in Clerk Dashboard
2. Verify the template syntax: `{{user.public_metadata.role}}`
3. Check browser DevTools for any JWT errors