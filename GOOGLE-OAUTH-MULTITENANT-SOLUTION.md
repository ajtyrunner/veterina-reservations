# Google OAuth Multitenant Solution

## Problem
Při OAuth flow docházelo ke ztrátě subdomény - uživatel se přihlásil na `svahy.lvh.me`, ale po OAuth callback byl přesměrován na `lvh.me`.

## Řešení

### 1. Cookie Configuration
Nastavit správné sdílení cookies mezi subdoménami v `auth.ts`:

```typescript
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === 'production' 
      ? `__Secure-next-auth.session-token`
      : `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      domain: '.lvh.me' // Sdílené pro všechny subdomény
    }
  },
  // ... podobně pro další cookies
}
```

**Důležité**: V development prostředí nepoužívat `__Secure-` prefix, protože vyžaduje HTTPS.

### 2. Middleware pro uchování tenant informace
V `middleware.ts` ukládat tenant do cookie při OAuth signin:

```typescript
if (request.nextUrl.pathname.startsWith('/api/auth/signin/')) {
  response.cookies.set('oauth-tenant', tenantSlug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: '.lvh.me',
    maxAge: 60 * 10 // 10 minutes
  })
}
```

### 3. Auth Route Handler
V `/api/auth/[...nextauth]/route.ts` číst tenant z cookie při OAuth callback:

```typescript
if (req.nextUrl.pathname.includes('/api/auth/callback/')) {
  const oauthTenantCookie = req.cookies.get('oauth-tenant')
  if (oauthTenantCookie) {
    tenantSlug = oauthTenantCookie.value
  }
}
```

### 4. Custom Redirect Handler
Vytvořit `/api/auth/custom-callback/route.ts` pro návrat na správnou subdoménu:

```typescript
export async function GET(request: NextRequest) {
  const oauthTenantCookie = request.cookies.get('oauth-tenant')
  const tenantSlug = oauthTenantCookie?.value || 'svahy'
  
  const protocol = request.nextUrl.protocol
  const port = request.nextUrl.port ? `:${request.nextUrl.port}` : ''
  const redirectUrl = `${protocol}//${tenantSlug}.lvh.me${port}/`
  
  const response = NextResponse.redirect(redirectUrl)
  response.cookies.delete('oauth-tenant')
  
  return response
}
```

### 5. Redirect Callback v NextAuth
V `auth.ts` přidat redirect callback:

```typescript
async redirect({ url, baseUrl }) {
  if (url === baseUrl || url === '/') {
    return '/api/auth/custom-callback?callbackUrl=/';
  }
  return url.startsWith(baseUrl) ? url : baseUrl;
}
```

### 6. Login Component
V login komponentě zahrnout plnou URL s subdoménou:

```typescript
const currentHost = window.location.host;
const protocol = window.location.protocol;
const callbackUrl = `${protocol}//${currentHost}/?tenant=${tenantSlug}`;

await signIn('google', { 
  callbackUrl: callbackUrl,
  redirect: true 
});
```

## Výsledek
Po implementaci těchto změn Google OAuth správně zachovává subdoménu během celého flow.