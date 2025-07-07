import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth'
import SessionProvider from './components/SessionProvider'
import Header from './components/Header'
import Footer from './components/Footer'
import CookieConsent from './components/CookieConsent'
import GoogleAnalytics from './components/GoogleAnalytics'
import { TenantTimezoneInitializer } from './components/TenantTimezoneInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Veterinární rezervační systém',
  description: 'Multi-tenant rezervační systém pro veterinární ordinace',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="cs">
      <head>
        <GoogleAnalytics />
      </head>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <TenantTimezoneInitializer>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Header />
              <main className="flex-1 container mx-auto px-4 py-8">
                {children}
              </main>
              <Footer />
            </div>
            <CookieConsent />
          </TenantTimezoneInitializer>
        </SessionProvider>
      </body>
    </html>
  )
}
