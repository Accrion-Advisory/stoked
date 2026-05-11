import { redirect } from 'next/navigation'

export default function RootPage() {
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    redirect('/auth/dev-login')
  }
  redirect('/auth/login')
}
