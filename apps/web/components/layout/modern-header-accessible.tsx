'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs'
import { UserMenu } from './user-menu'
import { ProjectSelector } from './project-selector'
import { ThemeToggle } from '../ui/theme-toggle'
import { Button } from '../ui/button'
import { designSystem, cn } from '../../lib/design-system'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu'
import {
  Home,
  LayoutDashboard,
  FolderOpen,
  User,
  Building2,
  BarChart3,
  TestTube,
  Sparkles,
  FileText,
  Shield,
  Settings,
  Database,
  Command,
  Zap,
  Brain,
  Globe,
  Lock,
  Layers,
  GitBranch,
  Menu,
  X,
} from 'lucide-react'

const products = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    description: 'Monitor your projects and analytics',
    icon: LayoutDashboard,
  },
  {
    title: 'Projects',
    href: '/projects',
    description: 'Manage your development projects',
    icon: FolderOpen,
  },
  {
    title: 'Recommendations',
    href: '/recommendations',
    description: 'AI-powered code suggestions',
    icon: Sparkles,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    description: 'Platform usage and insights',
    icon: BarChart3,
  },
]

const adminTools = [
  {
    title: 'User Management',
    href: '/admin/users',
    description: 'Manage users and permissions',
    icon: User,
  },
  {
    title: 'Knowledge Base',
    href: '/admin/knowledge',
    description: 'Configure knowledge sources',
    icon: Database,
  },
  {
    title: 'Patterns',
    href: '/admin/patterns',
    description: 'Review extracted patterns',
    icon: Brain,
  },
  {
    title: 'Configuration',
    href: '/admin/config',
    description: 'System configuration',
    icon: Settings,
  },
]

const resources = [
  {
    title: 'Documentation',
    href: '/docs',
    description: 'Learn how to use AWE',
    icon: FileText,
  },
  {
    title: 'API Reference',
    href: '/test-api',
    description: 'Test API endpoints',
    icon: TestTube,
  },
  {
    title: 'Organizations',
    href: '/organizations',
    description: 'Manage team settings',
    icon: Building2,
  },
]

// Memoized header component for performance
export const ModernHeaderAccessible = React.memo(function ModernHeaderAccessible() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Throttled scroll handler for better performance
  useEffect(() => {
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Handle escape key for accessibility
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      // Trap focus in mobile menu
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }
  }, [mobileMenuOpen])

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-[100] focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      
      <header 
        className={cn(
          'sticky top-0 z-50 w-full border-b transition-all',
          isScrolled 
            ? 'bg-background/80 backdrop-blur-lg border-border/40 shadow-sm'
            : 'bg-background/60 backdrop-blur-sm border-transparent'
        )}
        role="banner"
        aria-label="Main navigation"
      >
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between px-4">
            {/* Logo and Branding */}
            <div className="flex items-center gap-6">
              <Link 
                href="/" 
                className="flex items-center space-x-2 group"
                aria-label="AWE Home"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  AWE
                </span>
              </Link>

              {/* Main Navigation - Desktop */}
              <nav className="hidden lg:flex" aria-label="Main navigation">
                <NavigationMenu>
                  <NavigationMenuList>
                    {/* Products Menu */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger 
                        className="h-9 px-3 text-sm"
                        aria-label="Products menu"
                        aria-haspopup="menu"
                      >
                        Products
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]" role="menu">
                          {products.map((product) => (
                            <li key={product.title} role="none">
                              <NavigationMenuLink asChild>
                                <Link
                                  href={product.href}
                                  className={cn(
                                    'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
                                    'hover:bg-accent hover:text-accent-foreground',
                                    'focus:bg-accent focus:text-accent-foreground'
                                  )}
                                  role="menuitem"
                                >
                                  <div className="flex items-center gap-2">
                                    <product.icon className="h-4 w-4" aria-hidden="true" />
                                    <div className="text-sm font-medium leading-none">{product.title}</div>
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {product.description}
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Admin Menu */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger 
                        className="h-9 px-3 text-sm"
                        aria-label="Admin tools menu"
                        aria-haspopup="menu"
                      >
                        Admin
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2" role="menu">
                          {adminTools.map((tool) => (
                            <li key={tool.title} role="none">
                              <NavigationMenuLink asChild>
                                <Link
                                  href={tool.href}
                                  className={cn(
                                    'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
                                    'hover:bg-accent hover:text-accent-foreground',
                                    'focus:bg-accent focus:text-accent-foreground'
                                  )}
                                  role="menuitem"
                                >
                                  <div className="flex items-center gap-2">
                                    <tool.icon className="h-4 w-4" aria-hidden="true" />
                                    <div className="text-sm font-medium leading-none">{tool.title}</div>
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {tool.description}
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Resources Menu */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger 
                        className="h-9 px-3 text-sm"
                        aria-label="Resources menu"
                        aria-haspopup="menu"
                      >
                        Resources
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4" role="menu">
                          {resources.map((resource) => (
                            <li key={resource.title} role="none">
                              <NavigationMenuLink asChild>
                                <Link
                                  href={resource.href}
                                  className={cn(
                                    'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
                                    'hover:bg-accent hover:text-accent-foreground',
                                    'focus:bg-accent focus:text-accent-foreground'
                                  )}
                                  role="menuitem"
                                >
                                  <div className="flex items-center gap-2">
                                    <resource.icon className="h-4 w-4" aria-hidden="true" />
                                    <div className="text-sm font-medium leading-none">{resource.title}</div>
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {resource.description}
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Project Selector */}
              <SignedIn>
                <div className="hidden lg:block">
                  <ProjectSelector />
                </div>
              </SignedIn>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu / Auth */}
              <SignedIn>
                <UserMenu />
              </SignedIn>
              <SignedOut>
                <div className="hidden lg:flex items-center gap-2">
                  <SignInButton mode="modal">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="sm">Sign Up</Button>
                  </SignUpButton>
                </div>
              </SignedOut>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={toggleMobileMenu}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <nav
              id="mobile-navigation"
              className="lg:hidden border-t bg-background/95 backdrop-blur-lg"
              aria-label="Mobile navigation"
              role="navigation"
            >
              <div className="container mx-auto px-4 py-4 space-y-4">
                {/* Mobile Project Selector */}
                <SignedIn>
                  <div className="pb-4 border-b">
                    <ProjectSelector />
                  </div>
                </SignedIn>

                {/* Mobile menu sections */}
                <div className="space-y-6">
                  {/* Products Section */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Products</h3>
                    <div className="space-y-1">
                      {products.map((product) => (
                        <Link
                          key={product.href}
                          href={product.href}
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <product.icon className="h-4 w-4" aria-hidden="true" />
                          <span className="text-sm">{product.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Admin Section */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Admin</h3>
                    <div className="space-y-1">
                      {adminTools.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <tool.icon className="h-4 w-4" aria-hidden="true" />
                          <span className="text-sm">{tool.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Resources Section */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Resources</h3>
                    <div className="space-y-1">
                      {resources.map((resource) => (
                        <Link
                          key={resource.href}
                          href={resource.href}
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <resource.icon className="h-4 w-4" aria-hidden="true" />
                          <span className="text-sm">{resource.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Auth Buttons */}
                <SignedOut>
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <SignInButton mode="modal">
                      <Button variant="ghost" size="sm" className="flex-1">Sign In</Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button size="sm" className="flex-1">Sign Up</Button>
                    </SignUpButton>
                  </div>
                </SignedOut>
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  )
})