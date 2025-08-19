import { ModernHeader } from "./modern-header"
import { Footer } from "./footer"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <ModernHeader />
      <main id="main-content" className="flex-1 flex flex-col" role="main" aria-label="Main content">
        {children}
      </main>
      <Footer />
    </div>
  )
}