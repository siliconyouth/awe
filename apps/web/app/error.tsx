'use client'

import { useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-lg w-full shadow-lg">
        <CardHeader>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
              <CardDescription className="mt-2">
                We encountered an unexpected error while processing your request
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Don't worry, this error has been automatically reported to our team. 
                We'll investigate and fix it as soon as possible.
              </p>
            </div>
            
            {process.env.NODE_ENV === 'development' && error.message && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium flex items-center gap-2 hover:text-primary transition-colors">
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                  Developer Information
                </summary>
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs font-mono text-muted-foreground">
                      {error.message}
                    </p>
                  </div>
                  {error.digest && (
                    <p className="text-xs text-muted-foreground">
                      Error ID: <code className="font-mono">{error.digest}</code>
                    </p>
                  )}
                </div>
              </details>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button 
            onClick={reset}
            className="flex-1"
            variant="default"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            asChild 
            className="flex-1"
          >
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}