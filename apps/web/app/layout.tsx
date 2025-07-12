import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth'
import SessionProvider from './components/SessionProvider'
import HeaderWithContent from './components/HeaderWithContent'
import FooterWithContent from './components/FooterWithContent'
import CookieConsent from './components/CookieConsent'
import GoogleAnalytics from './components/GoogleAnalytics'
import { TenantTimezoneInitializer } from './components/TenantTimezoneInitializer'
import { ContentProvider } from '../lib/content-context'
import { ContentStyleApplier } from './components/ContentStyleApplier'

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
          <ContentProvider>
            <ContentStyleApplier />
            <TenantTimezoneInitializer>
              <div className="min-h-screen bg-gray-50 flex flex-col">
                <HeaderWithContent />
                <main className="flex-1 container mx-auto px-4 py-8">
                  {children}
                </main>
                <FooterWithContent />
              </div>
              <CookieConsent />
            </TenantTimezoneInitializer>
          </ContentProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
