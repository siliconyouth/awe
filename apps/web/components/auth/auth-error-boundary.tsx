'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '../ui/button'
import { AlertCircle, RefreshCw, LogIn, Home } from 'lucide-react'
import { SignInButton } from '@clerk/nextjs'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorType: 'auth' | 'network' | 'unknown'
}

/**
 * Error boundary specifically for authentication failures
 * Provides user-friendly error messages and recovery actions
 */
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorType: 'unknown',
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Determine error type based on error message
    let errorType: 'auth' | 'network' | 'unknown' = 'unknown'
    
    if (error.message?.toLowerCase().includes('auth') ||
        error.message?.toLowerCase().includes('clerk') ||
        error.message?.toLowerCase().includes('unauthorized') ||
        error.message?.toLowerCase().includes('unauthenticated')) {
      errorType = 'auth'
    } else if (error.message?.toLowerCase().includes('network') ||
               error.message?.toLowerCase().includes('fetch') ||
               error.message?.toLowerCase().includes('offline')) {
      errorType = 'network'
    }
    
    return {
      hasError: true,
      error,
      errorType,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('Auth Error Boundary caught error:', error, errorInfo)
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry, LogRocket, etc.
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorType: 'unknown',
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Default error UI based on error type
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>

            {this.state.errorType === 'auth' ? (
              <>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Authentication Error</h2>
                  <p className="text-muted-foreground">
                    There was a problem with authentication. Please sign in to continue.
                  </p>
                </div>

                <div className="space-y-3">
                  <SignInButton mode="modal">
                    <Button className="w-full" size="lg">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  </SignInButton>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={this.handleReload}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Page
                  </Button>
                </div>
              </>
            ) : this.state.errorType === 'network' ? (
              <>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Connection Error</h2>
                  <p className="text-muted-foreground">
                    Unable to connect to our servers. Please check your internet connection and try again.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={this.handleReload}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={this.handleGoHome}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go to Homepage
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Something went wrong</h2>
                  <p className="text-muted-foreground">
                    An unexpected error occurred. Please try refreshing the page.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={this.handleReset}
                  >
                    Try Again
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={this.handleReload}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Page
                  </Button>
                </div>
              </>
            )}

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook to wrap async operations with error handling
 */
export function useAuthErrorHandler() {
  return React.useCallback((error: Error) => {
    // Check if it's an auth error
    if (error.message?.toLowerCase().includes('auth') ||
        error.message?.toLowerCase().includes('clerk')) {
      // In production, could trigger a re-authentication flow
      console.error('Authentication error:', error)
      
      // Optionally show a toast notification
      if (typeof window !== 'undefined' && 'showToast' in window) {
        (window as any).showToast({
          title: 'Authentication Error',
          description: 'Please sign in to continue',
          variant: 'destructive',
        })
      }
    } else {
      // Re-throw for other error boundaries to catch
      throw error
    }
  }, [])
}

/**
 * Component to wrap parts of the app that require authentication
 */
export function AuthProtectedBoundary({ children }: { children: ReactNode }) {
  return (
    <AuthErrorBoundary
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">Please sign in to access this content</p>
            <SignInButton mode="modal">
              <Button>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </SignInButton>
          </div>
        </div>
      }
    >
      {children}
    </AuthErrorBoundary>
  )
}