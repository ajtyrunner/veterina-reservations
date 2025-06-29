import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      role: string
      tenant: string
      tenantId: string
      userId: string
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
    tenant?: string
    tenantId?: string
    userId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    tenant?: string
    tenantId?: string
    userId?: string
    isDoctor?: boolean
  }
} 