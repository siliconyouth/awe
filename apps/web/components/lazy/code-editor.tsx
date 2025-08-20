import dynamic from 'next/dynamic'

export const LazyCodeEditor = dynamic(
  () => import('react-syntax-highlighter').then(mod => mod.Prism),
  {
    loading: () => (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    ),
    ssr: false,
  }
)

export const LazyMarkdownEditor = dynamic(
  () => import('react-markdown'),
  {
    loading: () => (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-4/5" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    ),
  }
)