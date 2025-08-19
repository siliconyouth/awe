'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { Button } from '../ui/button'
import { ThemeToggle } from '../ui/theme-toggle'
import { ProjectSelector } from './project-selector'
import { designSystem, cn } from '../../lib/design-system'
import { Logo } from '../ui/logo'
import {
  Home,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react'

export function PublicHeader() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()

  // Handle scroll effect with throttling for performance
  React.useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 0)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: '/docs', label: 'Documentation' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
  ]

  return (
    <>
      {/* Skip to main content for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-background border rounded-md"
      >
        Skip to main content
      </a>

      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b transition-all duration-200',
          isScrolled ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60' : 'bg-background',
          designSystem.animations.fadeIn
        )}
        role="banner"
      >
        <div className="container flex h-16 items-center">
          {/* Logo and Home Link */}
          <div className="mr-4 flex">
            <Link 
              href="/" 
              className="mr-6 flex items-center space-x-2"
              aria-label="AWE - Awesome Workspace Engineering Home"
            >
              <Logo size="sm" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 items-center justify-between">
            <div className="flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === item.href
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              <SignedIn>
                <ProjectSelector />
              </SignedIn>
              
              <ThemeToggle />
              
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignUpButton>
              </SignedOut>
              
              <SignedIn>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8"
                    }
                  }}
                />
              </SignedIn>
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden flex-1 items-center justify-end space-x-4">
            <ThemeToggle />
            
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            </SignedIn>
            
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="container py-4 space-y-2">
              <SignedIn>
                <div className="pb-4 border-b">
                  <ProjectSelector />
                </div>
              </SignedIn>
              
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/60"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="border-t pt-2 mt-2">
                <SignedOut>
                  <div className="space-y-2">
                    <SignInButton mode="modal">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button size="sm" className="w-full">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </SignUpButton>
                  </div>
                </SignedOut>
                
                <SignedIn>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      Dashboard
                    </Button>
                  </Link>
                </SignedIn>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}