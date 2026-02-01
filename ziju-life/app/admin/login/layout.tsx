export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout bypasses the admin authentication check
  // by not importing or checking authentication
  return <>{children}</>
}
