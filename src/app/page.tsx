import { redirect } from 'next/navigation'
import Landing from '@/components/marketing/Landing'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  // Dev mode: no Supabase — show the landing, "login" goes to the dev picker.
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    return <Landing loginHref="/auth/dev-login" signupHref="/auth/dev-login" />
  }

  // Live: signed-in users skip the marketing page.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return <Landing loginHref="/auth/login" signupHref="/auth/signup" />
}
