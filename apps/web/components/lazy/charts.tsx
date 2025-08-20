import dynamic from 'next/dynamic'

export const LazyBarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

export const LazyLineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

export const LazyAreaChart = dynamic(
  () => import('recharts').then(mod => mod.AreaChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

export const LazyPieChart = dynamic(
  () => import('recharts').then(mod => mod.PieChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] bg-gray-50 rounded-lg animate-pulse">
      <div className="flex items-end justify-around h-full p-4">
        {[40, 70, 50, 80, 60, 90, 45].map((height, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded"
            style={{
              width: '10%',
              height: `${height}%`,
            }}
          />
        ))}
      </div>
    </div>
  )
}