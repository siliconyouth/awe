'use client'

import { usePathname, redirect } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  LayoutDashboard, 
  Database, 
  Tags, 
  Users, 
  ChevronRight,
  FolderOpen,
  Upload,
  Layers,
  Activity,
  Lock,
  Sliders,
  Sparkles,
  ArrowLeft,
  Menu,
  X,
  Command,
  Shield,
  Zap,
  GitBranch,
  BookOpen,
  FileText,
  Settings2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const adminNavItems = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        exact: true,
        badge: null as string | null,
        description: 'System overview and metrics'
      },
      {
        title: 'Analytics',
        href: '/admin/analytics',
        icon: Activity,
        badge: 'Live',
        badgeColor: 'bg-green-500',
        description: 'Real-time analytics',
        exact: false
      }
    ]
  },
  {
    title: 'Content',
    items: [
      {
        title: 'Resources',
        href: '/admin/resources',
        icon: Sparkles,
        badge: '156',
        description: 'Manage all resources',
        exact: false
      },
      {
        title: 'Collections',
        href: '/admin/collections',
        icon: Layers,
        badge: '12',
        description: 'Curated collections',
        exact: false
      },
      {
        title: 'Knowledge Base',
        href: '/admin/knowledge',
        icon: BookOpen,
        description: 'Documentation hub',
        exact: false
      },
      {
        title: 'Patterns',
        href: '/admin/patterns',
        icon: GitBranch,
        badge: 'New',
        badgeColor: 'bg-blue-500',
        description: 'Code patterns library',
        exact: false
      }
    ]
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Sources',
        href: '/admin/sources',
        icon: Database,
        description: 'Data sources configuration',
        exact: false
      },
      {
        title: 'Import Hub',
        href: '/admin/import',
        icon: Upload,
        badge: '3',
        badgeColor: 'bg-orange-500',
        description: 'Import from external sources',
        exact: false
      },
      {
        title: 'Tags',
        href: '/admin/tags',
        icon: Tags,
        description: 'Tag management',
        exact: false
      },
      {
        title: 'Categories',
        href: '/admin/categories',
        icon: FolderOpen,
        description: 'Category organization',
        exact: false
      }
    ]
  },
  {
    title: 'System',
    items: [
      {
        title: 'Users',
        href: '/admin/users',
        icon: Users,
        badge: '1.8k',
        description: 'User management',
        exact: false
      },
      {
        title: 'Security',
        href: '/admin/security',
        icon: Shield,
        description: 'Security settings',
        exact: false
      },
      {
        title: 'Configuration',
        href: '/admin/config',
        icon: Settings2,
        description: 'System configuration',
        exact: false
      },
      {
        title: 'Settings',
        href: '/admin/settings',
        icon: Sliders,
        description: 'Platform settings',
        exact: false
      }
    ]
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, userId, sessionClaims } = useAuth()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    // Check admin role client-side
    if (isLoaded && (!userId || sessionClaims?.metadata?.role !== 'admin')) {
      redirect('/dashboard')
    }
  }, [isLoaded, userId, sessionClaims])

  if (!isLoaded) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Shield className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
          </div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-20 left-4 z-50 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Admin Sidebar */}
        <aside className={cn(
          "fixed lg:sticky top-16 lg:top-20 z-40 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]",
          "border-r bg-background/60 backdrop-blur-xl",
          "transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[280px]",
          mobileOpen ? "left-0" : "-left-full lg:left-0"
        )}>
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 lg:p-6">
              <div className={cn(
                "flex items-center gap-3 transition-all duration-300",
                collapsed && "justify-center"
              )}>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl blur-lg opacity-70" />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg">
                    <Command className="h-5 w-5 text-white" />
                  </div>
                </div>
                {!collapsed && (
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Admin Console
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      System Management
                    </p>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "hidden lg:flex h-8 w-8 ml-auto",
                    collapsed && "rotate-180"
                  )}
                  onClick={() => setCollapsed(!collapsed)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator className="opacity-50" />
            
            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
              {adminNavItems.map((section, sectionIdx) => (
                <div key={section.title} className="space-y-2">
                  {!collapsed && (
                    <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {section.title}
                    </h3>
                  )}
                  {collapsed && sectionIdx > 0 && (
                    <Separator className="opacity-30" />
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = item.exact === true 
                        ? pathname === item.href 
                        : pathname.startsWith(item.href)
                      
                      const linkContent = (
                        <Link
                          href={item.href}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5",
                            "transition-all duration-200",
                            "hover:bg-accent/50",
                            isActive && "bg-gradient-to-r from-primary/10 to-primary/5",
                            collapsed && "justify-center"
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          {/* Active Indicator */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-r-full" />
                          )}
                          
                          {/* Icon with gradient on active */}
                          <div className={cn(
                            "relative transition-all duration-200",
                            isActive && "scale-110"
                          )}>
                            {isActive && (
                              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                            )}
                            <Icon className={cn(
                              "h-5 w-5 relative transition-colors",
                              isActive 
                                ? "text-primary drop-shadow-md" 
                                : "text-muted-foreground group-hover:text-foreground"
                            )} />
                          </div>
                          
                          {!collapsed && (
                            <>
                              <div className="flex-1">
                                <span className={cn(
                                  "text-sm font-medium transition-colors",
                                  isActive 
                                    ? "text-foreground" 
                                    : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                  {item.title}
                                </span>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              
                              {item.badge && (
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "ml-auto text-xs h-5 px-1.5",
                                    item.badgeColor || "bg-muted",
                                    item.badgeColor && "text-white border-0"
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                              
                              {isActive && (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </>
                          )}
                        </Link>
                      )

                      if (collapsed) {
                        return (
                          <Tooltip key={item.href} delayDuration={0}>
                            <TooltipTrigger asChild>
                              {linkContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="flex items-center gap-2">
                              <span>{item.title}</span>
                              {item.badge && (
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-xs h-5 px-1.5",
                                    item.badgeColor || "bg-muted",
                                    item.badgeColor && "text-white border-0"
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        )
                      }

                      return linkContent
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 lg:p-6 border-t">
              <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full",
                    collapsed ? "px-0" : "justify-start"
                  )}
                >
                  <ArrowLeft className={cn(
                    "h-4 w-4",
                    !collapsed && "mr-2"
                  )} />
                  {!collapsed && "Exit Admin"}
                </Button>
              </Link>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "lg:ml-[68px]" : "lg:ml-[280px]",
          "lg:ml-0"
        )}>
          <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
            {children}
          </div>
        </main>

        {/* Mobile Overlay */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </div>
    </TooltipProvider>
  )
}