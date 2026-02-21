import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=(), display-capture=(), fullscreen=()'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  response.headers.set('Permissions-Policy', PERMISSIONS_POLICY)
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|ico|svg|woff2?)).*)'],
}
