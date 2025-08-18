"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  SignInButton, 
  SignUpButton, 
  SignedIn, 
  SignedOut
} from '@clerk/nextjs'
import { UserMenu } from './user-menu'
import { 
  Home, 
  LayoutDashboard, 
  Shield, 
  TestTube, 
  Menu,
  User,
  Building2,
  BarChart3
} from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { ThemeToggle } from "../ui/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { useHasRole } from "../../lib/auth/hooks"

const navigationItems = [
  { 
    title: "Home", 
    href: "/", 
    icon: Home,
    requiresAuth: false 
  },
  { 
    title: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    requiresAuth: true 
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
    requiresAuth: true
  },
  {
    title: "Organizations",
    href: "/organizations",
    icon: Building2,
    requiresAuth: true
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    requiresAuth: true
  },
  { 
    title: "API Test", 
    href: "/test-api", 
    icon: TestTube,
    requiresAuth: true 
  },
  { 
    title: "Admin", 
    href: "/admin/users", 
    icon: Shield,
    requiresAuth: true,
    requiresRole: "admin" as const
  },
]

export function Navigation() {
  const pathname = usePathname()
  const isAdmin = useHasRole("admin")
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo only */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">AWE</span>
          </Link>
        </div>

        {/* Right side - Auth and Theme */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {/* Navigation Dropdown - Show when signed in */}
          <SignedIn>
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Navigation menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navigationItems.map((item) => {
                  if (item.requiresRole === "admin" && !isAdmin) {
                    return null
                  }
                  
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link 
                        href={item.href} 
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center",
                          isActive && "bg-accent"
                        )}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span className={cn(isActive && "font-semibold")}>
                          {item.title}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>

          {/* Sign In/Up Buttons - Only show when signed out */}
          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton mode="redirect" fallbackRedirectUrl="/dashboard">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="redirect" fallbackRedirectUrl="/dashboard">
                <Button size="sm" className="hidden sm:inline-flex">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>
          
          {/* User Menu - Show when signed in */}
          <SignedIn>
            <UserMenu />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}