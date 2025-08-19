# Local Development with Production Clerk

## Issue
When using production Clerk keys locally, you'll encounter this error:
```
Clerk: Production Keys are only allowed for domain "awe.dukelic.com"
```

This is because Clerk restricts production keys to specific domains for security.

## Solutions

### Solution 1: Local Subdomain (Recommended)
Add a local subdomain to your hosts file:

```bash
# Add to /etc/hosts
sudo sh -c 'echo "127.0.0.1 local.awe.dukelic.com" >> /etc/hosts'
```

Then access the app at: `http://local.awe.dukelic.com:3000`

### Solution 2: Development Keys
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a development instance
3. Get development keys (starting with `pk_test_` and `sk_test_`)
4. Update `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Solution 3: Update Clerk Dashboard
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to your production instance
3. Go to **Domains** or **Allowed Origins**
4. Add `localhost:3000` (if your plan allows it)

## Quick Setup Script
Run the setup script to check your configuration:
```bash
./scripts/setup-local-clerk.sh
```

## Verifying Configuration
After setup, test authentication:
1. Navigate to the sign-in page
2. Clerk should load without the "Loading authentication..." message
3. You should be able to sign in with your credentials

## Troubleshooting

### Still seeing "Loading authentication..."?
- Check browser console for errors
- Verify the domain in the URL matches your configuration
- Clear browser cache and cookies
- Restart the development server

### Domain not resolving?
- Verify `/etc/hosts` entry: `cat /etc/hosts | grep awe`
- Flush DNS cache: `sudo dscacheutil -flushcache` (macOS)
- Try accessing directly: `http://127.0.0.1:3000`

### Clerk errors in console?
- Check that keys in `.env.local` match your Clerk instance
- Verify Clerk domain settings in dashboard
- Check for CORS errors in network tab