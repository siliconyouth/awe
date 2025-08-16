/**
 * User Management Page
 * 
 * Admin interface for managing user roles and permissions
 */

'use client'

import { UserRoleManager } from '../../../../components/admin/user-role-manager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { Shield, Users, AlertTriangle } from 'lucide-react'

export default function AdminUsersPage() {

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage user roles, permissions, and access control
        </p>
      </div>

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Role-Based Access Control (RBAC)</strong> is active. Users inherit all permissions from their assigned role.
          Higher roles automatically include permissions from lower roles.
        </AlertDescription>
      </Alert>

      {/* <UserRoleManager userId="placeholder" /> */}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Hierarchy
            </CardTitle>
            <CardDescription>
              Understanding role inheritance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-3">
              <div>
                <p className="font-medium">Administrator</p>
                <p className="text-sm text-muted-foreground">
                  Full system access, user management, configuration control
                </p>
              </div>
              <div>
                <p className="font-medium">Moderator</p>
                <p className="text-sm text-muted-foreground">
                  Content moderation, user reports, knowledge approval
                </p>
              </div>
              <div>
                <p className="font-medium">Developer</p>
                <p className="text-sm text-muted-foreground">
                  API access, debugging tools, advanced features
                </p>
              </div>
              <div>
                <p className="font-medium">User</p>
                <p className="text-sm text-muted-foreground">
                  Basic features, scraping, knowledge viewing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Important Notes
            </CardTitle>
            <CardDescription>
              Best practices for role management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>Role changes take effect immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>Users may need to sign out and back in to see changes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>Organization roles override individual roles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>Custom permissions supplement role-based permissions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>Audit logs track all role changes</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}