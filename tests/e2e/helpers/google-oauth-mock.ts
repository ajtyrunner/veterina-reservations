import { Page } from '@playwright/test';

/**
 * Mock Google OAuth flow pro testy
 * POZOR: Toto funguje pouze v TEST prostředí s upraveným backendem
 */
export async function mockGoogleLogin(page: Page, email: string) {
  // V TEST prostředí můžete mít speciální endpoint
  // který vytvoří session bez skutečného OAuth flow
  
  if (process.env.NODE_ENV === 'test') {
    // Zavolat mock endpoint
    const response = await page.request.post('/api/auth/mock-google-login', {
      data: {
        email,
        name: 'Test User',
        image: 'https://example.com/avatar.jpg'
      }
    });
    
    const { sessionToken } = await response.json();
    
    // Nastavit session cookie
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: sessionToken,
      domain: 'lvh.me',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    }]);
    
    // Refresh stránky pro aplikování session
    await page.reload();
  } else {
    throw new Error('Mock Google login je dostupný pouze v TEST prostředí');
  }
}

/**
 * Alternativa: Použití Playwright s real Google account
 * NEDOPORUČUJE SE pro CI/CD
 */
export async function realGoogleLogin(page: Page, email: string, password: string) {
  // Klik na Google login button
  await page.click('button:has-text("Přihlásit se přes Google")');
  
  // Počkat na Google login page
  await page.waitForURL('https://accounts.google.com/**');
  
  // Vyplnit email
  await page.fill('input[type="email"]', email);
  await page.click('#identifierNext');
  
  // Vyplnit heslo
  await page.fill('input[type="password"]', password);
  await page.click('#passwordNext');
  
  // Počkat na redirect zpět
  await page.waitForURL('http://svahy.lvh.me:3000/**');
  
  // PROBLÉMY:
  // - Google může vyžadovat CAPTCHA
  // - 2FA autentizace
  // - Detekce automatizace
  // - Rate limiting
}