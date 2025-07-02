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
          response_type: "code",
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/user.phonenumbers.read'
          ].join(' ')
        }
      },
      profile(profile) {
        console.log('📦 Google profile data:', JSON.stringify(profile, null, 2))
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          phone: profile.phone_number || null,
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
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
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
              username: credentials.username,
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
            username: user.username, // Přidáme username z API response
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
              phone: (user as any).phone_number || null,  // Použijeme phone_number z Google profilu
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
        email: token.email,
        username: token.preferred_username || (user as any)?.username
      })
      
      if (user || trigger === 'signIn') {
        if (account?.provider === 'credentials') {
          // Pro credentials provider, uživatel už má všechny údaje
          token.role = (user as any).role;
          token.tenant = (user as any).tenant;
          token.tenantId = (user as any).tenantId;
          token.userId = user.id;
          token.isDoctor = (user as any).role === 'DOCTOR';
          token.preferred_username = (user as any).username; // Standard JWT field pro username
          console.log('✅ Credentials JWT updated with username:', (user as any).username)
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
              token.preferred_username = dbUser.username; // Username i pro OAuth
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
        session.user.username = token.preferred_username as string; // Přidáme username do session
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
