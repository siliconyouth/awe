import { Brain, Rocket, Zap, Code2, Database, Shield, Globe, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AWE</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link href="/projects" className="text-gray-600 hover:text-gray-900">Projects</Link>
            <Link href="/templates" className="text-gray-600 hover:text-gray-900">Templates</Link>
            <Link href="/docs" className="text-gray-600 hover:text-gray-900">Docs</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Awesome Workspace
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Engineering
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            AI-powered companion for Claude Code that transforms your development workflow with 
            intelligent project analysis, optimization, and automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/docs"
              className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors font-semibold text-lg"
            >
              Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
          Supercharge Your Development
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Brain className="h-8 w-8" />}
            title="AI-Powered Analysis"
            description="Intelligent project analysis with performance metrics, code complexity scoring, and optimization recommendations."
          />
          <FeatureCard
            icon={<Rocket className="h-8 w-8" />}
            title="Smart Templates"
            description="Generate project skeletons and boilerplates tailored to your tech stack and requirements."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Lightning Fast"
            description="Sub-millisecond cache performance with hybrid local-cloud architecture for optimal speed."
          />
          <FeatureCard
            icon={<Code2 className="h-8 w-8" />}
            title="Claude Integration"
            description="Seamless integration with Claude Code for enhanced context engineering and memory management."
          />
          <FeatureCard
            icon={<Database className="h-8 w-8" />}
            title="Modern Stack"
            description="Built with TypeScript, Next.js, Prisma, and Supabase on a Turborepo monorepo architecture."
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="Enterprise Security"
            description="AES-256-GCM encryption, secure environment management, and SOC 2 compliance features."
          />
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for Scale
          </h2>
          <p className="text-xl text-gray-600">
            Modern technologies for maximum performance and developer experience
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
          <TechBadge name="TypeScript" />
          <TechBadge name="Next.js 15" />
          <TechBadge name="Turbopack" />
          <TechBadge name="Prisma" />
          <TechBadge name="Supabase" />
          <TechBadge name="Vercel" />
        </div>
      </section>

      {/* Performance Stats */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Performance That Matters
          </h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard value="<1ms" label="Cache Response" />
            <StatCard value="<5ms" label="Database Query" />
            <StatCard value="95%" label="Cache Hit Rate" />
            <StatCard value="<50ms" label="Template Search" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center text-gray-600">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Brain className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-semibold text-gray-900">AWE</span>
        </div>
        <p>Built with ❤️ for the Claude Code community</p>
      </footer>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function TechBadge({ name }: { name: string }) {
  return (
    <div className="bg-gray-100 rounded-lg px-4 py-2 text-center">
      <span className="text-gray-700 font-medium">{name}</span>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  )
}