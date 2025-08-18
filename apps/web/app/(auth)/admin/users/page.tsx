/**
 * User Management Page
 * 
 * Admin interface for managing user roles and permissions
 */

'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { UserRoleManager } from '../../../../components/admin/user-role-manager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Badge } from '../../../../components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '../../../../components/ui/select'
import { Shield, Users, AlertTriangle, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '../../../../components/ui/use-toast'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  createdAt: string
  lastSignInAt?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const { toast } = useToast()
  const { user: currentUser } = useUser()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
        ...(roleFilter !== 'all' && { role: roleFilter })
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, roleFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) throw new Error('Failed to update role')

      toast({
        title: 'Success',
        description: 'User role updated successfully'
      })
      
      // Refresh the user list
      fetchUsers()
      setSelectedUser(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive'
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'moderator': return 'default' 
      case 'developer': return 'secondary'
      default: return 'outline'
    }
  }

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

      {/* User List Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Search and manage user accounts and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchUsers} size="icon" variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName || user.lastName 
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : 'Unknown User'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.lastSignInAt 
                          ? new Date(user.lastSignInAt).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user.id)}
                          disabled={user.id === currentUser?.id}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected User Management */}
      {selectedUser && (
        <div className="mb-6">
          {users.map(user => user.id === selectedUser && (
            <UserRoleManager
              key={user.id}
              userId={user.id}
              currentRole={user.role}
              userName={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'}
              userEmail={user.email}
            />
          ))}
        </div>
      )}

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