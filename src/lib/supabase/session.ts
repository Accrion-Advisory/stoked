import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase auth session on every request and keeps the auth
 * cookies in sync between the incoming request and the outgoing response.
 *
 * This is the standard @supabase/ssr "middleware" helper, but wired for this
 * Next.js version where the middleware convention has been renamed to `proxy`
 * (see proxy.ts at the project root). Returns both the response (whose cookies
 * must be preserved) and the resolved user so the proxy can make redirect
 * decisions without a second round-trip.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() revalidates the token with the Supabase Auth server.
  // Do not trust getSession() in server code — it only reads the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
