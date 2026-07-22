import { redirect } from 'next/navigation'

export default function RootPage() {
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    redirect('/auth/dev-login')
  }
  // In live mode, proxy.ts sends unauthenticated users to /auth/login.
  redirect('/dashboard')
}
