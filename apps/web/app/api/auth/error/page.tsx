'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Získej typ chyby
    const error = searchParams.get('error') || 'CredentialsSignin';
    
    // Zkontroluj, odkud přišel uživatel
    const callbackUrl = searchParams.get('callbackUrl') || '';
    const isTeamPortal = callbackUrl.includes('/portal/team') || document.referrer.includes('/portal/team');
    
    // Pro credentials chyby nebo pokud přišel z team portalu
    if (error === 'CredentialsSignin' || isTeamPortal) {
      router.replace('/portal/team?error=CredentialsSignin');
    } else {
      // Pro ostatní chyby (např. Google OAuth) přesměruj na login
      router.replace('/login?error=' + (error || 'unknown'));
    }
  }, [router, searchParams]);

  // Zobraz loading state během přesměrování
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-lg text-gray-600">Přesměrování...</div>
    </div>
  );
}