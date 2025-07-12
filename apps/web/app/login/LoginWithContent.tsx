'use client';
import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackLogin } from '../../lib/analytics';
import { useContent } from '../../lib/content-context';
import { getTenantSlugFromUrl } from '../../lib/tenant';

export default function LoginWithContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, colors, content, loading: contentLoading } = useContent();

  useEffect(() => {
    // Zkontroluj error z URL parametrů
    const urlError = searchParams.get('error');
    if (urlError && urlError !== 'null') {
      setError(t('login.error', 'Chyba při přihlašování'));
    }
    
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router, searchParams, t]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      // Track Google login attempt
      trackLogin('google');
      
      // Get current tenant slug
      const tenantSlug = getTenantSlugFromUrl();
      
      // Nastav cookie s tenant informací před OAuth flow
      document.cookie = `oauth-tenant=${tenantSlug}; path=/; domain=.lvh.me; max-age=600; samesite=lax`;
      console.log('🍪 Setting oauth-tenant cookie before OAuth:', tenantSlug);
      
      // Get current host with subdomain
      const currentHost = window.location.host; // e.g., 'svahy.lvh.me:3000'
      const protocol = window.location.protocol; // 'http:'
      
      // Construct callback URL with full domain
      const callbackUrl = `${protocol}//${currentHost}/?tenant=${tenantSlug}`;
      
      // Sign in with redirect to maintain state
      await signIn('google', { 
        callbackUrl: callbackUrl,
        redirect: true 
      });
    } catch (error) {
      setError(t('login.error', 'Chyba při přihlašování přes Google'));
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Načítám...</div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  // Styly s tenant barvami
  const primaryColor = colors.primary || '#f97316';
  const backgroundGradient = {
    background: `linear-gradient(to bottom right, ${primaryColor}10, ${primaryColor}20)`
  };
  
  const iconGradient = {
    background: `linear-gradient(to bottom right, ${primaryColor}, ${colors.secondary || primaryColor})`
  };
  
  const infoBoxStyle = {
    background: `linear-gradient(to right, ${primaryColor}10, ${primaryColor}20)`,
    borderColor: `${primaryColor}33`
  };

  const staffBoxStyle = {
    backgroundColor: 'white',
    borderColor: '#e5e7eb'
  };

  const linkStyle = {
    color: primaryColor
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={backgroundGradient}>
      {/* Main content */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-8 shadow-xl rounded-2xl border" style={{ borderColor: `${primaryColor}20` }}>
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white shadow-inner" style={{ border: `2px solid ${primaryColor}` }}>
              {content?.customContent?.branding?.logoUrl ? (
                <img 
                  src={content.customContent.branding.logoUrl} 
                  alt={content.customContent.branding.logoAlt || content?.name || 'Logo'}
                  className="w-12 h-12 object-contain p-2"
                />
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primaryColor }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t('login.title', 'Přihlášení pro klienty')}
            </h2>
            <p className="text-gray-600">
              {t('login.subtitle', 'Přihlaste se rychle a bezpečně pomocí Google účtu')}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Info box */}
          <div className="mb-8 p-6 border rounded-xl" style={infoBoxStyle}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" style={{ color: primaryColor }}>
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-base font-semibold mb-1" style={{ color: primaryColor }}>
                  {t('login.security_title', 'Bezpečné přihlášení')}
                </h3>
                <p className="text-gray-700">
                  {t('login.security_description', 'Používáme Google OAuth pro bezpečné a rychlé přihlášení. Vaše hesla neukládáme.')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Google sign in button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex justify-center items-center py-4 px-6 border border-gray-300 rounded-xl shadow-lg text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = primaryColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('login.loading', 'Přihlašování...')}
              </div>
            ) : (
              <>
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('login.google_button', 'Přihlásit se přes Google')}
              </>
            )}
          </button>

          {/* Additional info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {t('login.terms', 'Přihlášením souhlasíte s našimi podmínkami použití a zásadami ochrany osobních údajů.')}
            </p>
          </div>
        </div>

        {/* Staff link */}
        <div className="mt-8 text-center">
          <div className="rounded-xl shadow-md border p-4" style={staffBoxStyle}>
            <p className="text-gray-600 mb-2">
              {t('login.staff_question', 'Jste zaměstnanec ordinace?')}
            </p>
            <a 
              href="/portal/team" 
              className="inline-block font-semibold hover:opacity-80 transition-opacity"
              style={linkStyle}
            >
              {t('login.staff_link', 'Přihlaste se zde →')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}