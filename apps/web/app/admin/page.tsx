import { prisma } from '@awe/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Database, 
  Users, 
  TrendingUp,
  Download,
  Eye,
  Star,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getStats() {
  const [
    totalResources,
    totalSources,
    totalUsers,
    recentResources,
    popularResources,
    totalDownloads,
    totalViews
  ] = await Promise.all([
    prisma.resource.count(),
    prisma.knowledgeSource.count(),
    prisma.user.count(),
    prisma.resource.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true
      }
    }),
    prisma.resource.findMany({
      take: 5,
      orderBy: { downloads: 'desc' },
      select: {
        id: true,
        title: true,
        downloads: true,
        views: true
      }
    }),
    prisma.resource.aggregate({
      _sum: { downloads: true }
    }),
    prisma.resource.aggregate({
      _sum: { views: true }
    })
  ])

  return {
    totalResources,
    totalSources,
    totalUsers,
    recentResources,
    popularResources,
    totalDownloads: totalDownloads._sum.downloads || 0,
    totalViews: totalViews._sum.views || 0
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your Resource Hub efficiently
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/import">
              <Database className="mr-2 h-4 w-4" />
              Import Resources
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/resources/new">
              <FileText className="mr-2 h-4 w-4" />
              Add Resource
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Resources
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResources}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Knowledge Sources
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSources}</div>
            <p className="text-xs text-muted-foreground">
              Active sources configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Downloads
            </CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalDownloads.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Resources downloaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Views
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Resources viewed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent and Popular */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Resources</CardTitle>
            <CardDescription>
              Latest resources added to the hub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentResources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">
                      {resource.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {resource.type} • {new Date(resource.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/resources/${resource.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Resources</CardTitle>
            <CardDescription>
              Most downloaded resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.popularResources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">
                      {resource.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {resource.downloads} downloads • {resource.views} views
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/resources/${resource.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/import">
                <Database className="mr-2 h-4 w-4" />
                Import from GitHub
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/resources?status=draft">
                <FileText className="mr-2 h-4 w-4" />
                Review Drafts
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/sources">
                <Package className="mr-2 h-4 w-4" />
                Configure Sources
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}