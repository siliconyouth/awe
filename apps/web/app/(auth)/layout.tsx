import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ClientLayout } from '../../components/providers/client-layout'

// Layout for authenticated pages - uses server-side auth check
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  
  // Server-side redirect if not authenticated
  if (!userId) {
    redirect("/sign-in")
  }
  
  return <ClientLayout>{children}</ClientLayout>
}