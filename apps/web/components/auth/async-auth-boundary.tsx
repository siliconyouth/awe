'use client'

import { Suspense, ReactNode } from 'react'
import { AuthErrorBoundary } from './auth-error-boundary'
import { Skeleton } from '../ui/skeleton'
import { Loader2 } from 'lucide-react'

interface AsyncAuthBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
  errorFallback?: ReactNode
}

/**
 * Combines Suspense and Error Boundary for async auth components
 * Handles both loading states and errors gracefully
 */
export function AsyncAuthBoundary({
  children,
  fallback,
  loadingFallback,
  errorFallback,
}: AsyncAuthBoundaryProps) {
  return (
    <AuthErrorBoundary fallback={errorFallback || fallback}>
      <Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </Suspense>
    </AuthErrorBoundary>
  )
}

/**
 * Default loading component
 */
function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for user profile sections
 */
export function UserProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

/**
 * Loading skeleton for navigation
 */
export function NavigationSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-8 w-[100px]" />
      <Skeleton className="h-8 w-[100px]" />
      <Skeleton className="h-8 w-[100px]" />
      <div className="ml-auto">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Wrapper for auth-required sections with proper error handling
 */
export function AuthRequiredSection({
  children,
  requiredRole,
}: {
  children: ReactNode
  requiredRole?: string
}) {
  return (
    <AsyncAuthBoundary
      loadingFallback={<UserProfileSkeleton />}
      errorFallback={
        <div className="p-6 border rounded-lg bg-muted/50">
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            {requiredRole
              ? `This section requires ${requiredRole} role.`
              : 'Please sign in to view this content.'}
          </p>
        </div>
      }
    >
      {children}
    </AsyncAuthBoundary>
  )
}

/**
 * Wrapper for optional auth sections
 */
export function OptionalAuthSection({ children }: { children: ReactNode }) {
  return (
    <AsyncAuthBoundary
      errorFallback={null} // Don't show errors for optional sections
      loadingFallback={null} // Don't show loading for optional sections
    >
      {children}
    </AsyncAuthBoundary>
  )
}