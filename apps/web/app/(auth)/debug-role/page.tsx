"use client"

import { useAuth, useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { useRole, usePermissions, useHasRole } from '../../../lib/auth/hooks'
import { Shield, User, Key, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { useState } from 'react'

export default function DebugRolePage() {
  const { user, isLoaded: userLoaded } = useUser()
  const { sessionClaims, isLoaded: sessionLoaded } = useAuth()
  const role = useRole()
  const permissions = usePermissions()
  const isAdmin = useHasRole('admin')
  const [_refreshing, setRefreshing] = useState(false)

  // Debug: Log everything to console
  if (typeof window !== 'undefined') {
    console.log('=== DEBUG ROLE INFO ===')
    console.log('User Object:', user)
    console.log('Session Claims:', sessionClaims)
    console.log('User Public Metadata:', user?.publicMetadata)
    console.log('Session Metadata:', sessionClaims?.metadata)
    console.log('Current Role from hook:', role)
    console.log('Is Admin?:', isAdmin)
    console.log('Permissions:', permissions)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Force reload the page to refresh session
    window.location.reload()
  }

  const handleSignOut = () => {
    window.location.href = '/sign-out'
  }

  if (!userLoaded || !sessionLoaded) {
    return <div className="container mx-auto p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Role Debug Information</h1>
        <p className="text-muted-foreground">
          Debugging your current role and permissions
        </p>
      </div>

      {/* Quick Status */}
      <Card className={isAdmin ? "border-green-500" : "border-orange-500"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Admin Access Detected
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-orange-500" />
                Admin Access Not Detected
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Current Role:</span>
              <Badge variant={role === 'admin' ? 'destructive' : 'secondary'}>
                {role.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
            
            {!isAdmin && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Action Required</span>
                </div>
                <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
                  If you just ran make-admin.js, you need to sign out and sign back in to refresh your session.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={handleSignOut}>
                    Sign Out & Sign In Again
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRefresh}>
                    Refresh Page
                  </Button>
                </div>
              </div>
            )}
            
            {isAdmin && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Admin Access Active</span>
                </div>
                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                  You have superadmin access. Admin links should be visible in the navigation bar.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Public Metadata
            </CardTitle>
            <CardDescription>Data stored on user object</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(user?.publicMetadata || {}, null, 2)}
            </pre>
            {!user?.publicMetadata?.role && (
              <p className="text-xs text-orange-500 mt-2">
                ⚠️ No role found in user public metadata
              </p>
            )}
          </CardContent>
        </Card>

        {/* Session Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Session Metadata
            </CardTitle>
            <CardDescription>Data in current session</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(sessionClaims?.metadata || {}, null, 2)}
            </pre>
            {!sessionClaims?.metadata?.role && (
              <p className="text-xs text-orange-500 mt-2">
                ⚠️ No role found in session metadata
              </p>
            )}
          </CardContent>
        </Card>

        {/* Full Session Claims */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Full Session Claims
            </CardTitle>
            <CardDescription>Complete session data</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(sessionClaims || {}, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Calculated Permissions
            </CardTitle>
            <CardDescription>{permissions.length} permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {permissions.length > 0 ? (
                permissions.map((permission) => (
                  <div key={permission} className="text-xs font-mono p-1 bg-muted rounded">
                    {permission}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No permissions calculated</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Troubleshooting Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Make sure you ran: <code className="bg-muted px-1 rounded">node scripts/make-admin.js vladimir@dukelic.com</code></li>
            <li>Check that the script completed successfully</li>
            <li>Sign out completely from your account</li>
            <li>Clear your browser cookies/cache for this domain</li>
            <li>Sign back in with your email</li>
            <li>Return to this page to verify admin access</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}