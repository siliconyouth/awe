/**
 * User Management Page
 * 
 * Admin interface for managing user roles and permissions
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { PageContainer } from '../../../../components/layout/page-container'
import { PageHeader } from '../../../../components/layout/page-header'
import { EmptyState } from '../../../../components/ui/empty-state'
import { designSystem, cn } from '../../../../lib/design-system'
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  UserCog,
  Lock,
  Key,
  UserCheck,
  Settings,
  Activity
} from 'lucide-react'
import { useToast } from '../../../../hooks/use-toast'

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

  const fetchUsers = useCallback(async () => {
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
  }, [currentPage, roleFilter, searchQuery, toast])

  useEffect(() => {
    fetchUsers()
  }, [currentPage, roleFilter, fetchUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  // Currently unused - functionality handled by UserRoleManager component
  // const handleRoleUpdate = async (userId: string, newRole: string) => {
  //   try {
  //     const response = await fetch(`/api/admin/users/${userId}/role`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ role: newRole })
  //     })

  //     if (!response.ok) throw new Error('Failed to update role')

  //     toast({
  //       title: 'Success',
  //       description: 'User role updated successfully'
  //     })
      
  //     // Refresh the user list
  //     fetchUsers()
  //     setSelectedUser(null)
  //   } catch {
  //     toast({
  //       title: 'Error',
  //       description: 'Failed to update user role',
  //       variant: 'destructive'
  //     })
  //   }
  // }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'moderator': return 'default' 
      case 'developer': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="User Management"
        description="Manage user roles, permissions, and access control for your platform"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Users' }
        ]}
        actions={
          <div className="flex gap-2">
            <Button onClick={fetchUsers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />

      <Alert className={cn("mb-6", designSystem.animations.fadeIn)}>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Role-Based Access Control (RBAC)</strong> is active. Users inherit all permissions from their assigned role.
          Higher roles automatically include permissions from lower roles.
        </AlertDescription>
      </Alert>

      {/* User List Section */}
      <Card className={cn("mb-6", designSystem.components.card.default, designSystem.animations.fadeIn)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                All Users
              </CardTitle>
              <CardDescription className="mt-1">
                Search and manage user accounts and their roles
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {users.length} users
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Shield className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    Admin
                  </div>
                </SelectItem>
                <SelectItem value="moderator">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    Moderator
                  </div>
                </SelectItem>
                <SelectItem value="developer">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Developer
                  </div>
                </SelectItem>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-500" />
                    User
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className={cn("border rounded-lg overflow-hidden", designSystem.components.card.default)}>
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
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className={cn(
                          "h-12 w-12 rounded-full bg-muted flex items-center justify-center",
                          'animate-pulse'
                        )}>
                          <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Loading users...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12">
                      <EmptyState
                        icon={Users}
                        title="No users found"
                        description="Try adjusting your search or filters"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => (
                    <TableRow 
                      key={user.id}
                      className={cn(
                        "group hover:bg-muted/50 transition-colors",
                        designSystem.animations.fadeIn
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold">
                              {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.firstName || user.lastName 
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                : 'Unknown User'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground font-mono">
                          {user.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getRoleColor(user.role)}
                          className="font-medium"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastSignInAt ? (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            {new Date(user.lastSignInAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUser(user.id)}
                          disabled={user.id === currentUser?.id}
                          className="group-hover:bg-background"
                        >
                          <Settings className="h-4 w-4 mr-2" />
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
        <Card className={cn(designSystem.components.card.default, designSystem.animations.fadeIn)}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Role Hierarchy</CardTitle>
                <CardDescription>Understanding role inheritance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  role: 'Administrator', 
                  icon: UserCog,
                  color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
                  desc: 'Full system access, user management, configuration control' 
                },
                { 
                  role: 'Moderator',
                  icon: UserCheck, 
                  color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
                  desc: 'Content moderation, user reports, knowledge approval' 
                },
                { 
                  role: 'Developer',
                  icon: Key, 
                  color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
                  desc: 'API access, debugging tools, advanced features' 
                },
                { 
                  role: 'User',
                  icon: Users, 
                  color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
                  desc: 'Basic features, scraping, knowledge viewing' 
                }
              ].map((item, index) => (
                <div 
                  key={item.role}
                  className={cn(
                    "group p-3 rounded-lg border transition-all hover:shadow-md hover:border-primary/20",
                    designSystem.animations.fadeIn
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", item.color)}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.role}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={cn(designSystem.components.card.default, designSystem.animations.fadeIn)}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle>Important Notes</CardTitle>
                <CardDescription>Best practices for role management</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { icon: Lock, text: 'Role changes take effect immediately' },
                { icon: RefreshCw, text: 'Users may need to sign out and back in to see changes' },
                { icon: Users, text: 'Organization roles override individual roles' },
                { icon: Key, text: 'Custom permissions supplement role-based permissions' },
                { icon: Activity, text: 'Audit logs track all role changes' }
              ].map((item, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors",
                    designSystem.animations.fadeIn
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}