'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select'
import { Shield, User, UserCheck, UserX } from 'lucide-react'
import { useToast } from '../../hooks/use-toast'

interface UserRoleManagerProps {
  userId: string
  currentRole?: string
  userName?: string
  userEmail?: string
}

const AVAILABLE_ROLES = [
  { value: 'user', label: 'User', icon: User },
  { value: 'moderator', label: 'Moderator', icon: UserCheck },
  { value: 'admin', label: 'Admin', icon: Shield },
  { value: 'developer', label: 'Developer', icon: UserX },
] as const

export function UserRoleManager({ 
  userId, 
  currentRole = 'user', 
  userName,
  userEmail 
}: UserRoleManagerProps) {
  const [role, setRole] = useState(currentRole)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useUser()

  const handleRoleUpdate = async () => {
    if (role === currentRole) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })

      if (!response.ok) {
        throw new Error('Failed to update role')
      }

      toast({
        title: 'Role Updated',
        description: `Successfully updated role to ${role}`,
      })
      
      // Trigger parent refresh if possible
      window.location.reload()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500'
      case 'moderator': return 'bg-blue-500'
      case 'developer': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const cannotEditOwnRole = user?.id === userId

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">User Role Management</CardTitle>
        <CardDescription>
          {userName && <span className="font-semibold">{userName}</span>}
          {userEmail && <span className="text-sm text-muted-foreground ml-2">({userEmail})</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Badge className={getRoleColor(currentRole)}>
            Current: {currentRole}
          </Badge>
          
          <Select 
            value={role} 
            onValueChange={setRole}
            disabled={cannotEditOwnRole || isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_ROLES.map((roleOption) => {
                const Icon = roleOption.icon
                return (
                  <SelectItem key={roleOption.value} value={roleOption.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {roleOption.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleRoleUpdate}
            disabled={role === currentRole || cannotEditOwnRole || isLoading}
            size="sm"
          >
            {isLoading ? 'Updating...' : 'Update Role'}
          </Button>
        </div>

        {cannotEditOwnRole && (
          <p className="text-sm text-muted-foreground">
            You cannot edit your own role
          </p>
        )}

        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Role Permissions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {role === 'admin' && (
              <>
                <li>• Full system access</li>
                <li>• User management</li>
                <li>• Configuration control</li>
              </>
            )}
            {role === 'moderator' && (
              <>
                <li>• Content moderation</li>
                <li>• User support</li>
                <li>• Limited admin features</li>
              </>
            )}
            {role === 'developer' && (
              <>
                <li>• API access</li>
                <li>• Development tools</li>
                <li>• Debug features</li>
              </>
            )}
            {role === 'user' && (
              <>
                <li>• Basic access</li>
                <li>• Personal data management</li>
                <li>• Standard features</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}