import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SITE_PASSWORD = process.env.SITE_PASSWORD || 'DGCPIntel2026!'
const COOKIE_NAME = 'docs-auth'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/api/login') {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get(COOKIE_NAME)
  if (authCookie?.value === 'authenticated') {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|api/login).*)'],
}
