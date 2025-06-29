import { NextRequest, NextResponse } from 'next/server'
import { getTenantSlugFromHostname } from './lib/tenant'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const tenantSlug = getTenantSlugFromHostname(hostname)
  
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