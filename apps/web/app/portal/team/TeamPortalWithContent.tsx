'use client';
import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTenantSlugFromUrl } from '@/lib/tenant';
import { useContent } from '../../../lib/content-context';

export default function TeamPortalWithContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, colors, content, loading: contentLoading } = useContent();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Zkontroluj error z URL parametrů
    const urlError = searchParams.get('error');
    if (urlError === 'CredentialsSignin') {
      setError(t('team_portal.error_invalid_credentials', 'Neplatné přihlašovací údaje'));
    }
    
    if (status === 'authenticated') {
      // Ověř, že přihlášený uživatel má správná oprávnění
      if (session.user.role === 'DOCTOR' || session.user.role === 'ADMIN') {
        router.push('/');
      } else {
        // Klient se dostal na staff stránku - přesměruj
        router.push('/login');
      }
    }
  }, [status, session, router, searchParams, t]);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tenantSlug = getTenantSlugFromUrl();
      
      console.log('🔐 Attempting login:', {
        username: formData.username,
        tenantSlug,
        hasPassword: !!formData.password
      });
      
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        tenantSlug,
        redirect: false
      });
      
      console.log('🔐 Login result:', result);
      
      // Explicitně zkontrolujeme result
      if (!result) {
        console.error('❌ SignIn returned no result');
        setError(t('team_portal.error_login', 'Chyba při přihlašování'));
        return;
      }

      if (result.error) {
        // NextAuth vrací error 'CredentialsSignin' pro neplatné přihlašovací údaje
        if (result.error === 'CredentialsSignin') {
          setError(t('team_portal.error_invalid_credentials', 'Neplatné přihlašovací údaje'));
        } else {
          setError(t('team_portal.error_login', 'Chyba při přihlašování'));
        }
      } else if (result?.ok) {
        // Získej aktuální host s subdoménou
        const currentHost = window.location.host;
        const protocol = window.location.protocol;
        // Přesměruj na homepage se zachováním subdomény
        window.location.href = `${protocol}//${currentHost}/`;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('team_portal.error_login', 'Chyba při přihlašování'));
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">{t('team_portal.loading', 'Načítám...')}</div>
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
  
  
  const infoBoxStyle = {
    background: `linear-gradient(to right, ${primaryColor}10, ${primaryColor}20)`,
    borderColor: `${primaryColor}33`
  };

  const buttonGradient = {
    background: `linear-gradient(to right, ${primaryColor}, ${colors.secondary || primaryColor})`
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t('team_portal.title', 'Týmový portál')}
            </h2>
            <p className="text-gray-600">
              {t('team_portal.subtitle', `Přihlášení pro ${t('STAFF_PLURAL', 'doktory').toLowerCase()} a administrátory`)}
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
                  {t('team_portal.info_title', 'Pouze pro zaměstnance')}
                </h3>
                <p className="text-gray-700">
                  {t('team_portal.info_description', 'Použijte své pracovní přihlašovací údaje do systému ordinace.')}
                </p>
              </div>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-base font-semibold text-gray-700 mb-2">
                {t('team_portal.username_label', 'Uživatelské jméno')}
              </label>
              <input
                id="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                placeholder={t('team_portal.username_placeholder', 'jmeno.prijmeni')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-semibold text-gray-700 mb-2">
                {t('team_portal.password_label', 'Heslo')}
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                placeholder={t('team_portal.password_placeholder', 'Vaše pracovní heslo')}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.username || !formData.password}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={buttonGradient}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('team_portal.signing_in', 'Přihlašování...')}
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('team_portal.sign_in_button', 'Přihlásit se do portálu')}
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              {t('team_portal.support_text', 'Máte potíže s přihlášením? Kontaktujte IT podporu.')}
            </p>
          </div>
        </div>

        {/* Client redirect link */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <p className="text-gray-600 mb-2">
              {t('team_portal.client_question', 'Jste klient?')}
            </p>
            <a 
              href="/login" 
              className="inline-block font-semibold hover:opacity-80 transition-opacity"
              style={linkStyle}
            >
              {t('team_portal.client_link', 'Přihlaste se zde →')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}