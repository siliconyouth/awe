'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs'
import { UserMenu } from './user-menu'
import { ProjectSelector } from './project-selector'
import { ThemeToggle } from '../ui/theme-toggle'
import { Button } from '../ui/button'
import { Logo } from '../ui/logo'
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
    description: 'Manage and organize your work',
    icon: FolderOpen,
  },
  {
    title: 'CLAUDE.md',
    href: '/claude-md',
    description: 'Generate optimized context files',
    icon: FileText,
  },
  {
    title: 'Recommendations',
    href: '/recommendations',
    description: 'AI-powered optimization suggestions',
    icon: Sparkles,
  },
]

const platform = [
  {
    title: 'Pattern Library',
    href: '/admin/patterns',
    description: 'Browse and manage coding patterns',
    icon: Database,
    adminOnly: true,
  },
  {
    title: 'Knowledge Base',
    href: '/admin/knowledge',
    description: 'Global documentation repository',
    icon: Brain,
    adminOnly: true,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    description: 'Platform metrics and insights',
    icon: BarChart3,
  },
  {
    title: 'API Testing',
    href: '/test-api',
    description: 'Test and debug API endpoints',
    icon: TestTube,
  },
]

const admin = [
  {
    title: 'Users',
    href: '/admin/users',
    description: 'User management and roles',
    icon: User,
  },
  {
    title: 'Configuration',
    href: '/admin/config',
    description: 'System settings and features',
    icon: Settings,
  },
  {
    title: 'Organizations',
    href: '/organizations',
    description: 'Manage team workspaces',
    icon: Building2,
  },
]

export function ModernHeader() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        designSystem.components.nav.header,
        'transition-all duration-200',
        isScrolled && 'shadow-sm'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
              aria-label="AWE - Awesome Workspace Engineering Home"
            >
              <Logo size="md" />
            </Link>

            {/* Main Navigation */}
            <SignedIn>
              <NavigationMenu className="hidden lg:flex ml-10">
                <NavigationMenuList>
                  {/* Products */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-9 px-3 text-sm">
                      Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                        {products.map((item) => (
                          <ListItem
                            key={item.href}
                            title={item.title}
                            href={item.href}
                            icon={item.icon}
                          >
                            {item.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Platform */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-9 px-3 text-sm">
                      Platform
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                        {platform.map((item) => (
                          <ListItem
                            key={item.href}
                            title={item.title}
                            href={item.href}
                            icon={item.icon}
                          >
                            {item.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Admin */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-9 px-3 text-sm">
                      Admin
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4">
                        {admin.map((item) => (
                          <ListItem
                            key={item.href}
                            title={item.title}
                            href={item.href}
                            icon={item.icon}
                          >
                            {item.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Docs Link */}
                  <NavigationMenuItem>
                    <Link href="/docs" legacyBehavior passHref>
                      <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                        Documentation
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </SignedIn>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <SignedIn>
              {/* Project Selector */}
              <div className="hidden md:block">
                <ProjectSelector />
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu */}
              <UserMenu />
            </SignedIn>

            <SignedOut>
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Auth Buttons */}
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className={designSystem.components.button.primary}>
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { icon?: React.ElementType }
>(({ className, title, children, icon: Icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            <div className="text-sm font-medium leading-none">{title}</div>
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = 'ListItem'