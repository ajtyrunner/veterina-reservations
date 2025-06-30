import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { AuthOptions } from 'next-auth';
import { getTenantSlugFromHeaders } from './lib/tenant';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://veterina-reservations-production.up.railway.app';

// Debug výpis pro kontrolu proměnných prostředí
if (process.env.NODE_ENV === 'development') {
  console.log('Next.js Environment variables:')
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'is set' : 'is not set')
}

export const authOptions: AuthOptions = {
  providers: [
    // Google OAuth pro klienty
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    // Lokální credentials pro doktory/adminy
    CredentialsProvider({
      id: 'credentials',
      name: 'Doktor/Admin přihlášení',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Heslo', type: 'password' },
        tenantSlug: { label: 'Ordinace', type: 'text' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Volej Railway API pro autentizaci
          const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://veterina-reservations-production.up.railway.app'
          
          const response = await fetch(`${apiUrl}/api/auth/credentials`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              tenantSlug: credentials.tenantSlug
            }),
          });

          if (!response.ok) {
            console.error('Credentials authentication failed:', response.status)
            return null;
          }

          const user = await response.json();
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            tenant: user.tenant,
            tenantId: user.tenantId,
          };
        } catch (error) {
          console.error('Chyba při ověřování credentials:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔄 SignIn callback:', { 
        provider: account?.provider, 
        user: user.email,
        accountType: account?.type 
      })
      
      if (account?.provider === 'google') {
        try {
          // Pro Google OAuth - vytvoř uživatele přes Railway API
          const response = await fetch(`${API_URL}/api/auth/google-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email!,
              name: user.name,
              image: user.image,
              tenantSlug: 'svahy' // Fallback
            }),
          });

          const success = response.ok
          console.log('✅ Google user creation:', success ? 'SUCCESS' : 'FAILED')
          return success
        } catch (error) {
          console.error('❌ Chyba při přihlašování:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      console.log('🔄 JWT callback:', { 
        trigger, 
        provider: account?.provider,
        hasUser: !!user,
        email: token.email 
      })
      
      if (user || trigger === 'signIn') {
        if (account?.provider === 'credentials') {
          // Pro credentials provider, uživatel už má všechny údaje
          token.role = (user as any).role;
          token.tenant = (user as any).tenant;
          token.tenantId = (user as any).tenantId;
          token.userId = user.id;
          token.isDoctor = (user as any).role === 'DOCTOR';
        } else {
          // Pro Google OAuth, načteme uživatele přes Railway API
          try {
            const response = await fetch(`${API_URL}/api/auth/user-info`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: token.email! }),
            });

            if (response.ok) {
              const dbUser = await response.json();
              token.role = dbUser.role;
              token.tenant = dbUser.tenant;
              token.tenantId = dbUser.tenantId;
              token.userId = dbUser.id;
              token.isDoctor = dbUser.isDoctor;
              console.log('✅ User info loaded from Railway API')
            } else {
              console.error('❌ Failed to load user info from Railway API')
            }
          } catch (error) {
            console.error('❌ Chyba při načítání uživatele:', error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string;
        session.user.tenant = token.tenant as string;
        session.user.tenantId = token.tenantId as string;
        session.user.userId = token.userId as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
