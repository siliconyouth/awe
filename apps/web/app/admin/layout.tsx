'use client'

import { redirect, usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect } from 'react'
import { 
  LayoutDashboard, 
  Database, 
  FileText, 
  Tags, 
  Users, 
  Settings,
  Package,
  GitBranch,
  BarChart3,
  Shield,
  Sparkles,
  ChevronRight,
  Home,
  FolderOpen,
  Upload,
  Layers,
  Activity,
  Lock,
  Sliders
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const adminNavItems = [
  {
    title: 'General',
    items: [
      {
        title: 'Overview',
        href: '/admin',
        icon: LayoutDashboard,
        exact: true
      },
      {
        title: 'Resources',
        href: '/admin/resources',
        icon: Sparkles
      },
      {
        title: 'Collections',
        href: '/admin/collections',
        icon: Layers
      },
      {
        title: 'Analytics',
        href: '/admin/analytics',
        icon: Activity
      }
    ]
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Sources',
        href: '/admin/sources',
        icon: Database
      },
      {
        title: 'Import',
        href: '/admin/import',
        icon: Upload
      },
      {
        title: 'Tags',
        href: '/admin/tags',
        icon: Tags
      },
      {
        title: 'Categories',
        href: '/admin/categories',
        icon: FolderOpen
      }
    ]
  },
  {
    title: 'System',
    items: [
      {
        title: 'Users',
        href: '/admin/users',
        icon: Users
      },
      {
        title: 'Security',
        href: '/admin/security',
        icon: Lock
      },
      {
        title: 'Settings',
        href: '/admin/settings',
        icon: Sliders
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

  useEffect(() => {
    if (isLoaded && (!userId || sessionClaims?.metadata?.role !== 'admin')) {
      redirect('/')
    }
  }, [isLoaded, userId, sessionClaims])

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-[240px] border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center border-b px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <span>Admin</span>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {adminNavItems.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = item.exact 
                        ? pathname === item.href 
                        : pathname.startsWith(item.href)
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                            isActive 
                              ? "bg-accent text-accent-foreground" 
                              : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                          )}
                        >
                          <Icon className={cn(
                            "h-4 w-4 transition-colors",
                            isActive && "text-accent-foreground"
                          )} />
                          <span>{item.title}</span>
                          {isActive && (
                            <ChevronRight className="ml-auto h-4 w-4" />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>
          
          {/* Footer */}
          <div className="border-t p-4">
            <Link href="/resources">
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Home className="mr-2 h-4 w-4" />
                Back to App
              </Button>
            </Link>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="flex h-14 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-1 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              {/* Breadcrumbs could go here */}
            </div>
            <div className="flex items-center gap-4">
              {/* User menu could go here */}
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="container mx-auto py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}