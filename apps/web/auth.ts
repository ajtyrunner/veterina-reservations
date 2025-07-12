import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { AuthOptions } from 'next-auth';
import { getTenantSlugFromHeaders } from './lib/tenant';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://lvh.me:4000';

// Debug výpis pro kontrolu proměnných prostředí
if (process.env.NODE_ENV === 'development') {
  console.log('Next.js Environment variables:')
  console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'is set' : 'is not set')
}

export const authOptions: AuthOptions = {
  // Disable CSRF check for OAuth in development
  debug: process.env.NODE_ENV === 'development',
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
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: '.lvh.me'
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: '.lvh.me'
      }
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: '.lvh.me',
        maxAge: 900
      }
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: '.lvh.me',
        maxAge: 900
      }
    },
    nonce: {
      name: `next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: '.lvh.me'
      }
    }
  },
  providers: [
    // Google OAuth pro klienty
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/userinfo.email'
          ].join(' ')
        }
      },
      // Allow dynamic redirect URIs
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📦 Google profile data:', JSON.stringify(profile, null, 2))
        }
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          locale: profile.locale || 'cs',
          emailVerified: profile.email_verified
        }
      }
    }),
    // Lokální credentials pro doktory/adminy
    CredentialsProvider({
      id: 'credentials',
      name: 'Doktor/Admin přihlášení',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Heslo', type: 'password' },
        tenantSlug: { label: 'Ordinace', type: 'text' }
      },
      async authorize(credentials) {
        console.log('🔐 Authorize callback called')
        
        if (!credentials?.username || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null;
        }

        try {
          // Volej Railway API pro autentizaci
          const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://lvh.me:4000'
          
          console.log('🔐 Calling auth API:', `${apiUrl}/api/auth/credentials`)
          console.log('🔐 Credentials:', {
            username: credentials.username,
            tenantSlug: credentials.tenantSlug,
            hasPassword: !!credentials.password
          })
          
          const response = await fetch(`${apiUrl}/api/auth/credentials`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-slug': credentials.tenantSlug || ''
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
              tenantSlug: credentials.tenantSlug
            }),
          });

          if (!response.ok) {
            const errorText = await response.text()
            console.error('Credentials authentication failed:', response.status, errorText)
            return null;
          }

          const user = await response.json();
          
          console.log('✅ User authenticated:', user.username);
          
          // Vrátíme user objekt pro NextAuth
          const authUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            tenant: user.tenant,
            tenantId: user.tenantId,
            username: user.username,
          };
          
          console.log('✅ Returning auth user:', authUser);
          return authUser;
        } catch (error) {
          console.error('Chyba při ověřování credentials:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn(params: any) {
      const { user, account } = params;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 SignIn callback:', { 
          provider: account?.provider, 
          user: user.email,
          accountType: account?.type,
          tenantSlug: params.tenantSlug
        })
      }
      
      if (account?.provider === 'google') {
        try {
          // Get tenant from callback URL query params
          let tenantSlug: string | null = null;
          
          // Try to extract tenant from various sources
          if (params.tenantSlug) {
            tenantSlug = params.tenantSlug;
          } else if (params.callbackUrl) {
            // Extract from callback URL query params
            const url = new URL(params.callbackUrl, 'http://localhost');
            const tenantFromUrl = url.searchParams.get('tenant');
            if (tenantFromUrl) {
              tenantSlug = tenantFromUrl;
            }
          }
          
          // DŮLEŽITÉ: Pokud nemáme tenant informaci, odmítni přihlášení
          if (!tenantSlug) {
            console.error('❌ Google OAuth: Missing tenant information')
            return false
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🏢 Google OAuth tenant resolution:', { 
              fromParams: params.tenantSlug,
              fromCallbackUrl: params.callbackUrl,
              final: tenantSlug
            })
          }
          
          // Pro Google OAuth - vytvoř uživatele přes Railway API
          const response = await fetch(`${API_URL}/api/auth/google-user`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-tenant-slug': tenantSlug
            },
            body: JSON.stringify({
              email: user.email!,
              name: user.name,
              image: user.image,
              tenantSlug: tenantSlug
            }),
          });

          if (!response.ok) {
            console.error('Failed to create/verify Google user')
            return false
          }
          
          // Verify user was created for correct tenant
          const userData = await response.json()
          if (userData.tenant !== tenantSlug) {
            console.error(`Tenant mismatch: expected ${tenantSlug}, got ${userData.tenant}`)
            // User exists but for different tenant
            return false
          }
          
          // Ulož tenant informaci do user objektu pro JWT callback
          user.tenant = userData.tenant
          user.tenantId = userData.tenantId
          user.role = userData.role
          user.id = userData.id
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Google user creation: SUCCESS for tenant', tenantSlug)
          }
          return true
        } catch (error) {
          console.error('❌ Chyba při přihlašování:', error);
          return false;
        }
      }
      
      // Pro credentials provider - uživatel už má správný tenant z databáze
      if (account?.provider === 'credentials') {
        // Tenant je již správně nastaven v user objektu
        return true;
      }
      
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 JWT callback:', { 
          trigger, 
          provider: account?.provider,
          hasUser: !!user,
          email: token.email,
          username: token.preferred_username || (user as any)?.username
        })
      }
      
      if (user) {
        // Při prvním přihlášení nebo sign in
        if (account?.provider === 'credentials') {
          // Pro credentials provider, uživatel už má všechny údaje
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.role = (user as any).role;
          token.tenant = (user as any).tenant;
          token.tenantId = (user as any).tenantId;
          token.userId = user.id;
          token.isDoctor = (user as any).role === 'DOCTOR';
          token.preferred_username = (user as any).username;
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Credentials JWT updated with username:', (user as any).username)
          }
        } else if (account?.provider === 'google') {
          // Pro Google OAuth - použij informace z user objektu (nastavené v signIn)
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.role = (user as any).role || 'CLIENT';
          token.tenant = (user as any).tenant;
          token.tenantId = (user as any).tenantId;
          token.userId = user.id;
          token.isDoctor = false; // Google OAuth je vždy CLIENT
          
          // Pokud nemáme tenant info, zkus načíst z API
          if (!token.tenant && token.email) {
            try {
              const response = await fetch(`${API_URL}/api/auth/user-info`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: token.email }),
              });

              if (response.ok) {
                const dbUser = await response.json();
                token.role = dbUser.role;
                token.tenant = dbUser.tenant;
                token.tenantId = dbUser.tenantId;
                token.userId = dbUser.id;
                token.isDoctor = dbUser.isDoctor;
                token.preferred_username = dbUser.username;
                if (process.env.NODE_ENV === 'development') {
                  console.log('✅ User info loaded from Railway API for tenant:', dbUser.tenant)
                }
              } else {
                console.error('❌ Failed to load user info from Railway API')
              }
            } catch (error) {
              console.error('❌ Chyba při načítání uživatele:', error);
            }
          }
        }
      }
      return token;
    },
    async session({ session, token, ...params }: any) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Session callback:', { 
          hasToken: !!token,
          tokenEmail: token?.email,
          tokenRole: token?.role,
          tokenTenant: token?.tenant
        })
      }
      
      // Získej aktuální tenant z kontextu (NextAuth to předává v params)
      const currentTenant = params.tenantSlug || params.currentTenant
      
      if (token) {
        // Pokud máme tenant informaci a nesedí s uživatelovým tenantem, vrať null
        if (currentTenant && token.tenant && token.tenant !== currentTenant) {
          console.log('🚫 Tenant mismatch in session callback:', {
            currentTenant,
            userTenant: token.tenant
          })
          // Vrátíme null, což znamená "žádná session"
          return null
        }
        
        session.user.role = token.role as string;
        session.user.tenant = token.tenant as string;
        session.user.tenantId = token.tenantId as string;
        session.user.userId = token.userId as string;
        session.user.username = token.preferred_username as string; // Přidáme username do session
      }
      return session;
    },
    async redirect({ url }) {
      // Jednoduše vrať URL - NextAuth už má správnou baseUrl s tenant subdoménou
      return url;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/api/auth/error', // Custom error page
  },
  events: {
    async signOut() {
      // Vyčistit všechny cookies při signout
      console.log('🚪 User signing out')
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
