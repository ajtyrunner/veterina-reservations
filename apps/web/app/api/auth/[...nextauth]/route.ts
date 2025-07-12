import { authOptions } from '@/auth'
import NextAuth from 'next-auth/next'
import { headers } from 'next/headers'
import type { NextAuthOptions } from 'next-auth'
import type { NextRequest } from 'next/server'

// Create handler that injects tenant from headers
export async function GET(req: NextRequest, context: any) {
  const headersList = headers()
  let tenantSlug = headersList.get('x-tenant-slug')
  
  // For OAuth callback, try to get tenant from cookie
  if (req.nextUrl.pathname.includes('/api/auth/callback/')) {
    const oauthTenantCookie = req.cookies.get('oauth-tenant')
    if (oauthTenantCookie) {
      tenantSlug = oauthTenantCookie.value
      console.log('🍪 Found oauth-tenant cookie in callback:', tenantSlug)
    } else {
      console.log('⚠️ No oauth-tenant cookie found in callback')
      console.log('🍪 All cookies:', req.cookies.getAll().map(c => ({ name: c.name, value: c.value })))
      // Zkus získat tenant z hostname
      if (!tenantSlug && headersList.get('x-tenant-slug')) {
        tenantSlug = headersList.get('x-tenant-slug')
        console.log('🔍 Using tenant from header:', tenantSlug)
      }
    }
  }
  
  // Získej host s tenant subdoménou
  const host = req.headers.get('host') || 'lvh.me:3000'
  const protocol = req.headers.get('x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${host}`
  
  // Create modified auth options with tenant info
  const modifiedAuthOptions: NextAuthOptions = {
    ...authOptions,
    callbacks: {
      ...authOptions.callbacks,
      signIn: async (params) => {
        // Inject tenant into params
        const modifiedParams = {
          ...params,
          tenantSlug: tenantSlug
        }
        return authOptions.callbacks?.signIn ? authOptions.callbacks.signIn(modifiedParams) : true
      },
      session: async (params) => {
        // Inject current tenant into session callback
        const modifiedParams = {
          ...params,
          currentTenant: tenantSlug
        }
        return authOptions.callbacks?.session ? authOptions.callbacks.session(modifiedParams) : params.session
      }
    }
  }
  
  // Nastav NEXTAUTH_URL pro tento request
  process.env.NEXTAUTH_URL = baseUrl
  
  const handler = NextAuth(modifiedAuthOptions)
  return handler(req as any, context)
}

export async function POST(req: NextRequest, context: any) {
  const headersList = headers()
  let tenantSlug = headersList.get('x-tenant-slug')
  
  // For OAuth callback, try to get tenant from cookie
  if (req.nextUrl.pathname.includes('/api/auth/callback/')) {
    const oauthTenantCookie = req.cookies.get('oauth-tenant')
    if (oauthTenantCookie) {
      tenantSlug = oauthTenantCookie.value
      console.log('🍪 Found oauth-tenant cookie in callback:', tenantSlug)
    } else {
      console.log('⚠️ No oauth-tenant cookie found in callback')
      console.log('🍪 All cookies:', req.cookies.getAll().map(c => ({ name: c.name, value: c.value })))
      // Zkus získat tenant z hostname
      if (!tenantSlug && headersList.get('x-tenant-slug')) {
        tenantSlug = headersList.get('x-tenant-slug')
        console.log('🔍 Using tenant from header:', tenantSlug)
      }
    }
  }
  
  // For credentials signin, try to get tenant from referer header
  if (req.nextUrl.pathname.includes('/api/auth/signin') || 
      req.nextUrl.pathname.includes('/api/auth/callback/credentials')) {
    const referer = req.headers.get('referer')
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        const refererTenant = refererUrl.hostname.split('.')[0]
        if (refererTenant && refererTenant !== 'lvh') {
          tenantSlug = refererTenant
          console.log('🔍 Tenant from referer:', tenantSlug)
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
  }
  
  // Získej host s tenant subdoménou
  const host = req.headers.get('host') || 'lvh.me:3000'
  const protocol = req.headers.get('x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${host}`
  
  // Create modified auth options with tenant info
  const modifiedAuthOptions: NextAuthOptions = {
    ...authOptions,
    callbacks: {
      ...authOptions.callbacks,
      signIn: async (params) => {
        // Inject tenant into params
        const modifiedParams = {
          ...params,
          tenantSlug: tenantSlug
        }
        return authOptions.callbacks?.signIn ? authOptions.callbacks.signIn(modifiedParams) : true
      },
      session: async (params) => {
        // Inject current tenant into session callback
        const modifiedParams = {
          ...params,
          currentTenant: tenantSlug
        }
        return authOptions.callbacks?.session ? authOptions.callbacks.session(modifiedParams) : params.session
      }
    }
  }
  
  // Nastav NEXTAUTH_URL pro tento request
  process.env.NEXTAUTH_URL = baseUrl
  
  const handler = NextAuth(modifiedAuthOptions)
  return handler(req as any, context)
}
