'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { 
  Building2, 
  CreditCard, 
  LogOut, 
  Settings, 
  User,
  Shield,
  Sparkles,
  HelpCircle
} from 'lucide-react'
import { useHasRole } from '../../lib/auth/hooks'

export function UserMenu() {
  const { user } = useUser()
  const isAdmin = useHasRole('admin')
  
  // Custom menu items that will appear in the UserButton dropdown
  const customPages = [
    {
      label: "Profile",
      url: "/profile",
      icon: <User className="h-4 w-4" />
    },
    {
      label: "Organizations",
      url: "/organizations",
      icon: <Building2 className="h-4 w-4" />
    },
    {
      label: "Billing",
      url: "/billing",
      icon: <CreditCard className="h-4 w-4" />
    }
  ]

  // Admin-only menu items
  const adminPages = isAdmin ? [
    {
      label: "Admin Panel",
      url: "/admin/users",
      icon: <Shield className="h-4 w-4" />
    }
  ] : []

  return (
    <div className="flex items-center gap-3">
      {/* Show user name on larger screens */}
      <div className="hidden lg:block text-sm">
        <p className="font-medium">{user?.firstName || user?.username}</p>
        <p className="text-xs text-muted-foreground">
          {user?.primaryEmailAddress?.emailAddress}
        </p>
      </div>
      
      <UserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "h-10 w-10 ring-2 ring-primary/10 ring-offset-2 ring-offset-background hover:ring-primary/20 transition-all",
            userButtonPopoverCard: "shadow-xl border-border",
            userButtonPopoverActionButton: "hover:bg-accent",
            userButtonPopoverActionButtonText: "text-foreground",
            userButtonPopoverActionButtonIcon: "text-muted-foreground",
            userButtonPopoverFooter: "bg-muted/50 border-t",
            userButtonPopoverMainIdentifier: "font-semibold text-foreground",
            userButtonPopoverSecondaryIdentifier: "text-muted-foreground text-sm",
            userButtonTrigger: "focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
          }
        }}
      />
    </div>
  )
}