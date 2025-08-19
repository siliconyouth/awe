import Link from 'next/link'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { designSystem, cn } from '../lib/design-system'
import { PublicHeader } from '../components/layout/public-header'
import {
  ArrowRight,
  Zap,
  Brain,
  Globe,
  Lock,
  Layers,
  GitBranch,
  Command,
  Sparkles,
  ChevronRight,
  Star,
  Users,
  FileText,
  BarChart3,
  Shield,
  Cpu,
  Database,
  Code,
} from 'lucide-react'

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
        <div className={cn(designSystem.patterns.dots, 'opacity-50')} />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      </div>

      {/* Hero Section */}
      <section className={cn(designSystem.spacing.section, 'relative')}>
        <div className={cn(designSystem.spacing.container, designSystem.spacing.page)}>
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className={designSystem.animations.fadeIn}>
              <Badge
                variant="outline"
                className="mb-4 rounded-full px-4 py-1.5 text-sm font-medium"
              >
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Powered by Claude Opus 4.1
              </Badge>
            </div>

            {/* Heading */}
            <h1
              className={cn(
                designSystem.typography.display[1],
                designSystem.animations.slideUp,
                'mb-6'
              )}
            >
              The AI Companion for{' '}
              <span className={designSystem.gradients.text.brand}>
                Claude Code
              </span>
            </h1>

            {/* Subheading */}
            <p
              className={cn(
                designSystem.typography.heading[3],
                designSystem.typography.muted,
                designSystem.animations.slideUp,
                'mb-8 font-normal'
              )}
            >
              Transform your development workflow with intelligent project analysis,
              pattern extraction, and automated optimization powered by advanced AI.
            </p>

            {/* CTA Buttons */}
            <div
              className={cn(
                'flex flex-col sm:flex-row items-center justify-center gap-4',
                designSystem.animations.slideUp
              )}
            >
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className={cn(designSystem.components.button.primary, 'px-8')}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8"
                >
                  Documentation
                  <FileText className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 border-t pt-8">
              <div>
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-muted-foreground">Active Projects</div>
              </div>
              <div>
                <div className="text-3xl font-bold">50M+</div>
                <div className="text-sm text-muted-foreground">Patterns Analyzed</div>
              </div>
              <div>
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={cn(designSystem.spacing.section, 'bg-muted/30')}>
        <div className={cn(designSystem.spacing.container, designSystem.spacing.page)}>
          <div className="text-center mb-12">
            <h2 className={cn(designSystem.typography.display[3], 'mb-4')}>
              Everything you need for{' '}
              <span className={designSystem.gradients.text.accent}>
                intelligent development
              </span>
            </h2>
            <p className={cn(designSystem.typography.heading[4], designSystem.typography.muted, 'font-normal')}>
              A comprehensive platform that understands your code and helps you build better.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Platform Architecture Section */}
      <section className={designSystem.spacing.section}>
        <div className={cn(designSystem.spacing.container, designSystem.spacing.page)}>
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <Badge variant="outline" className="mb-4">
                Platform Architecture
              </Badge>
              <h2 className={cn(designSystem.typography.display[3], 'mb-4')}>
                Two-tier system for{' '}
                <span className={designSystem.gradients.text.accent}>
                  maximum efficiency
                </span>
              </h2>
              <p className={cn(designSystem.typography.body.large, designSystem.typography.muted, 'mb-8')}>
                Our platform combines a global knowledge base maintained by AI with
                personalized project management for each user.
              </p>

              <div className="space-y-4">
                <ArchitectureItem
                  icon={Globe}
                  title="Global Knowledge Base"
                  description="Platform-wide repository of patterns and best practices"
                />
                <ArchitectureItem
                  icon={Brain}
                  title="AI Pattern Extraction"
                  description="Continuous analysis and learning from documentation"
                />
                <ArchitectureItem
                  icon={Layers}
                  title="Project Organization"
                  description="Personal workspace for tracking and optimization"
                />
                <ArchitectureItem
                  icon={Zap}
                  title="Real-time Analysis"
                  description="Instant recommendations based on your context"
                />
              </div>
            </div>

            <div className="relative">
              <div className={cn(
                'rounded-2xl border bg-gradient-to-b from-muted/50 to-muted/30 p-8',
                designSystem.animations.hover.glow
              )}>
                <div className="space-y-4">
                  {/* Code Preview */}
                  <div className="rounded-lg bg-black/5 dark:bg-white/5 p-4 font-mono text-sm">
                    <div className="text-muted-foreground"># Generate optimized context</div>
                    <div className="text-blue-600 dark:text-blue-400">awe generate claude-md</div>
                    <div className="mt-2 text-green-600 dark:text-green-400">
                      ✓ Analyzed 247 files
                    </div>
                    <div className="text-green-600 dark:text-green-400">
                      ✓ Extracted 18 patterns
                    </div>
                    <div className="text-green-600 dark:text-green-400">
                      ✓ Generated CLAUDE.md
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={cn(designSystem.spacing.section, 'bg-muted/30')}>
        <div className={cn(designSystem.spacing.container, designSystem.spacing.page)}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={cn(designSystem.typography.display[3], 'mb-4')}>
              Ready to transform your workflow?
            </h2>
            <p className={cn(designSystem.typography.heading[4], designSystem.typography.muted, 'mb-8 font-normal')}>
              Join thousands of developers using AWE to build better software faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className={cn(designSystem.components.button.primary, 'px-8')}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="px-8">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}

// Feature data
const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Claude Opus 4.1 analyzes your codebase to provide intelligent insights and recommendations.',
  },
  {
    icon: Database,
    title: 'Pattern Library',
    description: 'Access a vast library of coding patterns and best practices extracted from top repositories.',
  },
  {
    icon: FileText,
    title: 'CLAUDE.md Generation',
    description: 'Automatically generate optimized context files tailored to your project structure.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Role-based access control, audit logging, and SOC 2 compliance for enterprise teams.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track project metrics, pattern usage, and optimization progress with detailed dashboards.',
  },
  {
    icon: Code,
    title: 'CLI Integration',
    description: 'Powerful command-line tools for seamless integration with your development workflow.',
  },
]

// Component: Feature Card
function FeatureCard({ icon: Icon, title, description }: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className={cn(
      designSystem.components.card.hover,
      'p-6 group'
    )}>
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className={cn(designSystem.typography.heading[4], 'mb-2')}>
        {title}
      </h3>
      <p className={cn(designSystem.typography.body.default, designSystem.typography.muted)}>
        {description}
      </p>
    </div>
  )
}

// Component: Architecture Item
function ArchitectureItem({ icon: Icon, title, description }: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div>
        <h3 className={cn(designSystem.typography.heading[4], 'mb-1')}>
          {title}
        </h3>
        <p className={cn(designSystem.typography.body.default, designSystem.typography.muted)}>
          {description}
        </p>
      </div>
    </div>
  )
}