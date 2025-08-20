import dynamic from 'next/dynamic'

export const LazyInstantSearch = dynamic(
  () => import('@/components/instant-search').then(mod => mod.InstantSearch),
  {
    loading: () => (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-100 rounded w-1/4" />
        </div>
      </div>
    ),
    ssr: false,
  }
)

export const LazySearchResults = dynamic(
  () => import('@/components/instant-search').then(mod => mod.SearchResults),
  {
    loading: () => (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    ),
    ssr: false,
  }
)