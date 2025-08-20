'use client'

import { redirect, usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect } from 'react'
import { 
  LayoutDashboard, 
  Database, 
  Tags, 
  Users, 
  Settings,
  ChevronRight,
  FolderOpen,
  Upload,
  Layers,
  Activity,
  Lock,
  Sliders,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClientLayout } from '@/components/providers/client-layout'

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
      <ClientLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-[240px] min-h-[calc(100vh-4rem)] border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="sticky top-16 p-4">
          {/* Admin Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Admin Panel</h2>
            <p className="text-sm text-muted-foreground">Resource Hub Management</p>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-6">
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
          </nav>
        </div>
      </aside>
      
        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </ClientLayout>
  )
}