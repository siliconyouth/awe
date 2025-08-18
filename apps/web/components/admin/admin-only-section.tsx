'use client'

import { Protect } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Shield, AlertTriangle, Lock } from "lucide-react"
import { Alert, AlertDescription } from "../ui/alert"

interface AdminOnlySectionProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function AdminOnlySection({ 
  children, 
  title = "Admin Area",
  description = "This section is restricted to administrators"
}: AdminOnlySectionProps) {
  return (
    <Protect
      role="admin"
      fallback={
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need administrator privileges to access this section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please contact your system administrator if you believe you should have access to this area.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </Protect>
  )
}

// Role-specific wrapper components
export function ModeratorOnlySection({ children }: AdminOnlySectionProps) {
  return (
    <Protect
      role="moderator"
      fallback={
        <Alert className="border-warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Moderator access required to view this content.
          </AlertDescription>
        </Alert>
      }
    >
      {children}
    </Protect>
  )
}

export function DeveloperOnlySection({ children }: AdminOnlySectionProps) {
  return (
    <Protect
      role="developer"
      fallback={
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Developer access required for this feature.
          </AlertDescription>
        </Alert>
      }
    >
      {children}
    </Protect>
  )
}