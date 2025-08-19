'use client'

import { UserButton } from '@clerk/nextjs'

export function UserMenu() {
  return (
    <UserButton 
      signInUrl="/sign-in"
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
  )
}