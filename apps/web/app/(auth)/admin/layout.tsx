import { checkRole } from "../../../lib/auth/rbac"
import { redirect } from "next/navigation"

// Admin-specific layout with role check
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user has admin role
  const hasAdminRole = await checkRole('admin')
  
  if (!hasAdminRole) {
    redirect('/dashboard')
  }
  
  return <>{children}</>
}