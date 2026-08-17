import { NextResponse, type NextRequest } from 'next/server'

/**
 * A fast gate in front of the dashboard — NOT the lock.
 *
 * It only checks that a session cookie EXISTS. It deliberately does not verify
 * the signature: middleware runs on the edge runtime, where node:crypto and the
 * Supabase client are unavailable, and a half-implemented check here would be
 * more dangerous than an honest absence of one.
 *
 * The real verification is `getSessionUser()` in every dashboard page and
 * `requireUser()` / `requireAdmin()` in every action. Those re-read the account
 * from the database on each request, which is what makes a forged cookie
 * useless and a deactivated account stop working immediately.
 *
 * So this exists for one reason: to send a signed-out person to the login form
 * instead of rendering a page that would redirect them a moment later.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/dashboard/login') return NextResponse.next()

  if (!request.cookies.get('dash_session')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/login'
    // Carry where they were headed, so signing in lands them there rather than
    // dumping them at the top and making them navigate again.
    url.search = pathname === '/dashboard' ? '' : `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
