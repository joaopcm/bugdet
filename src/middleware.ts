import { getSessionCookie } from 'better-auth/cookies'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up', '/forgot-password']

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie && !PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api/auth/* (auth API routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|api/auth/*|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
