'use client';
import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTenantSlugFromUrl } from '@/lib/tenant';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loginType, setLoginType] = useState<'client' | 'doctor'>('client');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn('google', { 
        callbackUrl: '/',
        redirect: false 
      });
    } catch (error) {
      setError('Chyba při přihlašování přes Google');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Načítám...</div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <header className="w-full bg-[#f7941d] flex items-center justify-between px-8 py-4 shadow-md">
        <div className="flex items-center gap-4">
          <img alt="Logo veteriny" loading="lazy" width="50" height="50" decoding="async" data-nimg="1" style={{color:'transparent'}} srcSet="/_next/image?url=%2Flogo.png&w=64&q=75 1x, /_next/image?url=%2Flogo.png&w=128&q=75 2x" src="/_next/image?url=%2Flogo.png&w=128&q=75"/>
          <span className="text-2xl font-bold text-white">Veterina Svahy</span>
        </div>
        <a className="bg-white text-[#f7941d] font-semibold px-6 py-2 rounded shadow hover:bg-orange-100 transition" href="/">Zpět na úvod</a>
      </header>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setLoginType('client')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'client'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👤 Jsem klient
              </button>
              <button
                onClick={() => setLoginType('doctor')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'doctor'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👨‍⚕️ Jsem doktor
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {loginType === 'client' && (
            <div>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Přihlášení pro klienty
                </h3>
                <p className="text-sm text-blue-600">
                  Klienti se přihlašují pomocí svého Google účtu pro rychlé a bezpečné přihlášení.
                </p>
              </div>
              
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Přihlašování...'
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Přihlásit se přes Google
                  </>
                )}
              </button>
            </div>
          )}

          {loginType === 'doctor' && (
            <div>
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-sm font-medium text-green-800 mb-2">
                  Přihlášení pro doktory
                </h3>
                <p className="text-sm text-green-600">
                  Doktoři používají své pracovní přihlašovací údaje do systému ordinace.
                </p>
              </div>

              <form onSubmit={handleCredentialsSignIn}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="doktor@veterina-svahy.cz"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Heslo
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Vaše heslo"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Přihlašování...' : 'Přihlásit se'}
                </button>
              </form>

              <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
                <strong>Testovací údaje:</strong><br/>
                Email: doktor@veterina-svahy.cz<br/>
                Heslo: doktor123
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="w-full bg-[#fff3e0] py-8 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-4">
          <div>
            <div className="text-[#f7941d] font-bold text-lg mb-1">Veterina Svahy</div>
            <div className="text-gray-700 text-sm">Ulice 123, Město</div>
            <div className="text-gray-700 text-sm">Telefon: 123 456 789</div>
            <div className="text-gray-700 text-sm">Email: info@veterina.cz</div>
          </div>
          <div className="text-gray-400 text-xs">© 2025 Veterina Svahy</div>
        </div>
      </footer>
    </div>
  );
}
