import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { AuthOptions } from 'next-auth';
import { getTenantSlugFromHeaders } from './lib/tenant';

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
      if (account?.provider === 'google') {
        try {
          // Pro Google OAuth, získej tenant slug z URL (client-side řešení)
          const tenantSlug = 'svahy' // Fallback, bude řešeno jinak
          
          // Zkusíme najít uživatele v databázi
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { tenant: true, doctor: true },
          });

          // Najdi správný tenant
          const tenant = await prisma.tenant.findUnique({
            where: { slug: tenantSlug },
          });

          if (!tenant) {
            console.error(`Tenant '${tenantSlug}' nenalezen`);
            return false;
          }

          if (existingUser) {
            // Ověř, že uživatel patří ke správnému tenantovi
            if (existingUser.tenantId === tenant.id) {
              return true;
            } else {
              console.error(`Uživatel ${user.email} nepatří k tenantovi ${tenantSlug}`);
              return false;
            }
          }

          // Pokud uživatel neexistuje, vytvoříme ho pro aktuální tenant
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              tenantId: tenant.id,
              role: 'CLIENT',
            },
          });

          return true;
        } catch (error) {
          console.error('Chyba při přihlašování:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user || trigger === 'signIn') {
        if (account?.provider === 'credentials') {
          // Pro credentials provider, uživatel už má všechny údaje
          token.role = (user as any).role;
          token.tenant = (user as any).tenant;
          token.tenantId = (user as any).tenantId;
          token.userId = user.id;
          token.isDoctor = (user as any).role === 'DOCTOR';
        } else {
          // Pro Google OAuth, načteme uživatele z databáze
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email! },
            include: { tenant: true, doctor: true },
          });

          if (dbUser) {
            token.role = dbUser.role;
            token.tenant = dbUser.tenant.slug;
            token.tenantId = dbUser.tenantId;
            token.userId = dbUser.id;
            token.isDoctor = !!dbUser.doctor;
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
  secret: process.env.NEXTAUTH_SECRET,
};
