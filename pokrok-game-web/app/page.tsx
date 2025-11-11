import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect to default locale (Czech)
  // The middleware will handle locale detection and redirect
  redirect('/cs')
}
