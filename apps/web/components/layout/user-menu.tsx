'use client'

import { UserButton } from '@clerk/nextjs'

export function UserMenu() {
  return (
    <UserButton 
      signInUrl="/sign-in"
      appearance={{
        elements: {
          avatarBox: "h-10 w-10",
          userButtonTrigger: "focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
        }
      }}
    />
  )
}