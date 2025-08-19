import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
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
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

const adminNavItems = [
  {
    title: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Admin dashboard overview'
  },
  {
    title: 'Resources',
    href: '/admin/resources',
    icon: Sparkles,
    description: 'Manage all resources'
  },
  {
    title: 'Knowledge Sources',
    href: '/admin/sources',
    icon: Database,
    description: 'Configure data sources'
  },
  {
    title: 'Import Hub',
    href: '/admin/import',
    icon: GitBranch,
    description: 'Import from sources'
  },
  {
    title: 'Collections',
    href: '/admin/collections',
    icon: Package,
    description: 'Manage collections'
  },
  {
    title: 'Tags',
    href: '/admin/tags',
    icon: Tags,
    description: 'Tag management'
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Usage analytics'
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'User management'
  },
  {
    title: 'Security',
    href: '/admin/security',
    icon: Shield,
    description: 'Security settings'
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System settings'
  }
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  // Check if user is admin
  const isAdmin = session?.sessionClaims?.metadata?.role === 'admin'
  
  if (!isAdmin) {
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold">Admin Dashboard</h2>
            <p className="text-sm text-muted-foreground">Resource Hub Management</p>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>
          
          {/* Footer */}
          <div className="border-t p-4">
            <Link
              href="/resources"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-4 w-4" />
              Back to Resources
            </Link>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}