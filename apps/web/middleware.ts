import { NextRequest, NextResponse } from 'next/server'
import { getTenantSlugFromHostname } from './lib/tenant'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const tenantSlug = getTenantSlugFromHostname(hostname)
  
  console.log('🔍 Middleware:', {
    path: request.nextUrl.pathname,
    hostname,
    tenantSlug,
    cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
  })
  
  // Skip rate limiting for auth endpoints in development
  if (process.env.NODE_ENV === 'development' && 
      process.env.DISABLE_RATE_LIMIT === 'true' &&
      request.nextUrl.pathname.startsWith('/api/auth/')) {
    // Add custom header to indicate rate limit should be skipped
    const response = NextResponse.next()
    response.headers.set('x-skip-rate-limit', 'true')
    return response
  }
  
  // Přidej tenant slug do headers pro server components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-slug', tenantSlug)
  
  // Pro API routes, přidej tenant informace
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    
    response.headers.set('x-tenant-slug', tenantSlug)
    
    // Pro jakékoliv auth operace, ulož tenant do cookie
    if (request.nextUrl.pathname.startsWith('/api/auth/')) {
      console.log('🍪 Setting oauth-tenant cookie:', tenantSlug)
      // Dynamicky urči cookie domain podle hostname
      let cookieDomain = undefined;
      if (hostname.includes('lvh.me')) {
        cookieDomain = '.lvh.me';
      } else if (hostname.includes('slotnito.online')) {
        cookieDomain = '.slotnito.online';
      }
      // Pro localhost a jiné domény nepoužívej domain parametr
      
      response.cookies.set('oauth-tenant', tenantSlug, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        ...(cookieDomain && { domain: cookieDomain }),
        maxAge: 60 * 10 // 10 minutes for auth flow
      })
    }
    
    return response
  }
  
  // Pro normální stránky
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Nastav tenant slug do response headers
  response.headers.set('x-tenant-slug', tenantSlug)
  
  return response
}

export const config = {
  // Aplikuj middleware na všechny routes kromě statických souborů
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 