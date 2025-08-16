/**
 * User Role Management Component
 * 
 * Admin component for managing user roles and permissions
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { AdminOnly } from '@/components/auth/role-guard'
import { useHasPermission } from '@/lib/auth/hooks'
import type { Roles } from '@/types/globals'
import { 
  Shield, 
  User, 
  UserCog, 
  Crown, 
  Code, 
  Search, 
  Edit, 
  Save, 
  X,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react'

interface UserData {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: Roles
  permissions?: string[]
  createdAt: string
  lastSignInAt?: string
  imageUrl?: string
}

const ROLE_INFO: Record<Roles, { label: string; icon: any; color: string; description: string }> = {
  admin: {
    label: 'Administrator',
    icon: Crown,
    color: 'red',
    description: 'Full system access and control'
  },
  moderator: {
    label: 'Moderator',
    icon: UserCog,
    color: 'yellow',
    description: 'Content moderation and user management'
  },
  developer: {
    label: 'Developer',
    icon: Code,
    color: 'blue',
    description: 'Advanced features and API access'
  },
  user: {
    label: 'User',
    icon: User,
    color: 'gray',
    description: 'Standard access to core features'
  }
}

export function UserRoleManager() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const canEditRoles = useHasPermission('users.edit')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      // In production, fetch from API
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
      toast({
        title: 'Error loading users',
        description: 'Failed to fetch user list. Please try again.',
        variant: 'destructive'
      })
      
      // Mock data for development
      setUsers([
        {
          id: '1',
          email: 'admin@awe.dev',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          permissions: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastSignInAt: '2025-01-16T00:00:00Z'
        },
        {
          id: '2',
          email: 'developer@partner.com',
          firstName: 'Dev',
          lastName: 'User',
          role: 'developer',
          permissions: ['api.debug'],
          createdAt: '2025-01-05T00:00:00Z',
          lastSignInAt: '2025-01-15T00:00:00Z'
        },
        {
          id: '3',
          email: 'user@example.com',
          firstName: 'Regular',
          lastName: 'User',
          role: 'user',
          permissions: [],
          createdAt: '2025-01-10T00:00:00Z',
          lastSignInAt: '2025-01-16T00:00:00Z'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const saveUserRole = async () => {
    if (!editingUser) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editingUser.role,
          permissions: editingUser.permissions
        })
      })

      if (!response.ok) throw new Error('Failed to update user role')

      toast({
        title: 'Role updated',
        description: `${editingUser.email} is now ${ROLE_INFO[editingUser.role].label}`
      })

      // Update local state
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u))
      setShowEditDialog(false)
      setEditingUser(null)
    } catch (error) {
      toast({
        title: 'Error updating role',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getUsersByRole = (role: Roles) => users.filter(u => u.role === role)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <AdminOnly showError>
      <div className="space-y-6">
        {/* Role Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(ROLE_INFO).map(([role, info]) => {
            const Icon = info.icon
            const count = getUsersByRole(role as Roles).length
            return (
              <Card key={role}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 text-${info.color}-500`} />
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                  <CardTitle className="text-sm font-medium">
                    {info.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {info.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* User Management Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Role Management</CardTitle>
                <CardDescription>
                  Manage user roles and permissions
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Custom Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => {
                  const roleInfo = ROLE_INFO[user.role]
                  const Icon = roleInfo.icon
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.imageUrl ? (
                            <img 
                              src={user.imageUrl} 
                              alt={user.email}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : user.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className="gap-1"
                        >
                          <Icon className="h-3 w-3" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.permissions && user.permissions.length > 0 ? (
                          <div className="flex gap-1">
                            {user.permissions.slice(0, 2).map(perm => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                            {user.permissions.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{user.permissions.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.lastSignInAt 
                          ? new Date(user.lastSignInAt).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {canEditRoles && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditingUser(user)
                              setShowEditDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Role Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Update role and permissions for {editingUser?.email}
              </DialogDescription>
            </DialogHeader>
            
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={editingUser.role}
                    onValueChange={(value: Roles) => 
                      setEditingUser({ ...editingUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_INFO).map(([role, info]) => {
                        const Icon = info.icon
                        return (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {info.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ROLE_INFO[editingUser.role].description}
                  </p>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Changing user roles affects their access to system features immediately.
                    Higher roles inherit all permissions from lower roles.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={saveUserRole}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminOnly>
  )
}