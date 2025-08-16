import { ClientLayout } from '../../components/providers/client-layout'

// Layout for public pages
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}