import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/session'

// In this Next.js version the `middleware` file convention is deprecated and
// renamed to `proxy` (runs on the Node.js runtime). This proxy keeps the
// Supabase session fresh and gates access to the app.

// Routes reachable without a session.
const PUBLIC_PREFIXES = ['/auth']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Dev mode: no Supabase, no session gating — let the mock-data app run freely.
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    return NextResponse.next()
  }

  const { response, user } = await updateSession(request)

  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  const isApi = pathname.startsWith('/api')

  // Unauthenticated + protected page → send to login, remembering where they
  // were headed (e.g. a /join/<code> link) so we can return them after auth.
  if (!user && !isPublic && !isApi) {
    const loginUrl = new URL('/auth/login', request.url)
    if (pathname !== '/') loginUrl.searchParams.set('next', pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user hitting the login/signup screens → straight to the app.
  if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  // Run on everything except static assets and image files. `_next/data` is
  // always included by the framework regardless of this pattern.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
