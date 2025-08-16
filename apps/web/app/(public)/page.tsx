import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { 
  Globe, 
  Brain, 
  Database, 
  Zap, 
  Shield, 
  Users,
  ArrowRight,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-6 pb-8 pt-6 md:py-10">
        <div className="flex max-w-[980px] flex-col items-center gap-2 text-center">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="mr-2 h-3 w-3" />
            AI-Powered Workspace Engineering
          </Badge>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
            Welcome to AWE
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
            Intelligent web scraping, knowledge management, and AI-powered insights 
            for modern engineering teams.
          </p>
        </div>
        
        <div className="flex gap-4">
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </SignedIn>
          <Link href="/docs">
            <Button variant="outline" size="lg">
              Documentation
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
            Features
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Everything you need to build intelligent data pipelines and knowledge systems.
          </p>
        </div>
        
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 mt-8">
          <Card>
            <CardHeader>
              <Globe className="h-10 w-10 mb-3 text-primary" />
              <CardTitle>Web Scraping</CardTitle>
              <CardDescription>
                Advanced web scraping with Firecrawl integration and intelligent content extraction.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Brain className="h-10 w-10 mb-3 text-primary" />
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>
                Powered by Claude for intelligent pattern recognition and content understanding.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Database className="h-10 w-10 mb-3 text-primary" />
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                Organize and version your extracted data with powerful search and filtering.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-3 text-primary" />
              <CardTitle>Real-time Updates</CardTitle>
              <CardDescription>
                Monitor websites for changes and get instant notifications when content updates.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 mb-3 text-primary" />
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Role-based access control, audit logs, and enterprise-grade security features.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 mb-3 text-primary" />
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Share knowledge, collaborate on patterns, and manage team permissions.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-8 md:py-12 lg:py-24">
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-200 dark:border-pink-800">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">
              Ready to get started?
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Join thousands of engineers using AWE to build intelligent data systems.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                  Start Free Trial
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </SignedIn>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}