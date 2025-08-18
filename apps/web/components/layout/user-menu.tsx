'use client'

import { UserButton, useUser } from '@clerk/nextjs'

export function UserMenu() {
  const { user } = useUser()

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
            userButtonPopoverCard: "shadow-xl",
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