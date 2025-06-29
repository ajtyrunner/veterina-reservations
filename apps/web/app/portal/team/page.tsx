'use client';
import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTenantSlugFromUrl } from '@/lib/tenant';

export default function TeamPortalLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      // Ověř, že přihlášený uživatel má správná oprávnění
      if (session.user.role === 'DOCTOR' || session.user.role === 'ADMIN') {
        router.push('/');
      } else {
        // Klient se dostal na staff stránku - přesměruj
        router.push('/login');
      }
    }
  }, [status, session, router]);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tenantSlug = getTenantSlugFromUrl();
      
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        tenantSlug,
        redirect: false,
      });

      if (result?.error) {
        setError('Neplatné přihlašovací údaje');
      } else {
        router.push('/');
      }
    } catch (error) {
      setError('Chyba při přihlašování');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Načítám...</div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Main content */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-8 shadow-xl rounded-2xl border border-orange-100">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Týmový portál
            </h2>
            <p className="text-gray-600">
              Přihlášení pro doktory a administrátory
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Info box */}
          <div className="mb-8 p-6 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-base font-semibold text-orange-800 mb-1">
                  Pouze pro zaměstnance
                </h3>
                <p className="text-orange-700">
                  Použijte své pracovní přihlašovací údaje do systému ordinace.
                </p>
              </div>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-base font-semibold text-gray-700 mb-2">
                Pracovní email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder="jmeno@veterina-svahy.cz"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-semibold text-gray-700 mb-2">
                Heslo
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder="Vaše pracovní heslo"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Přihlašování...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Přihlásit se do portálu
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Máte potíže s přihlášením? Kontaktujte IT podporu.
            </p>
          </div>
        </div>

        {/* Client redirect link */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <p className="text-gray-600 mb-2">
              Jste klient?
            </p>
            <a href="/login" className="inline-block font-semibold text-orange-600 hover:text-orange-700 transition-colors">
              Přihlaste se zde →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 