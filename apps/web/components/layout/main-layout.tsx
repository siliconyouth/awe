import { ModernHeader } from "./modern-header"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ModernHeader />
      <main id="main-content" className="flex-1" role="main" aria-label="Main content">
        {children}
      </main>
    </div>
  )
}