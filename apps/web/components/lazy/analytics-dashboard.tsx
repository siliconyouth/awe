import dynamic from 'next/dynamic'

export const LazyAnalyticsDashboard = dynamic(
  () => import('@/app/(auth)/analytics/dashboard/page'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-gray-200 border-t-gray-600 rounded-full" />
          <p>Loading analytics dashboard...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
)