import { Page, BrowserContext } from '@playwright/test';

/**
 * Mock Google OAuth login pro testy
 * Vytvoří nebo najde uživatele s GOOGLE providerem a nastaví JWT session
 * POZNÁMKA: Google OAuth podporuje pouze roli CLIENT
 */
export async function mockGoogleLogin(
  page: Page | BrowserContext, 
  email: string, 
  options?: {
    name?: string;
    tenantSlug?: string;
  }
) {
  const tenantSlug = options?.tenantSlug || 'svahy';
  const webUrl = 'http://svahy.lvh.me:3000';
  const apiUrl = process.env.API_URL || 'http://localhost:4000';
  
  // Nejdřív vytvoř uživatele v databázi přes API
  let request;
  if ('request' in page) {
    request = page.request;
  } else {
    request = await page.newPage().then(p => {
      const req = p.request;
      p.close();
      return req;
    });
  }
  
  // Vytvoř uživatele v DB
  const createUserResponse = await request.post(`${apiUrl}/test/mock-google-login`, {
    data: {
      email,
      name: options?.name || email.split('@')[0],
      tenantSlug
    }
  });

  if (!createUserResponse.ok()) {
    const error = await createUserResponse.text();
    throw new Error(`Failed to create test user: ${error}`);
  }

  const userData = await createUserResponse.json();
  
  // Nyní přihlas uživatele přes NextAuth test endpoint
  const loginResponse = await request.post(`${webUrl}/api/test/login`, {
    data: {
      email,
      name: userData.user.name,
      role: userData.user.role,
      tenantSlug: userData.user.tenant,
      authProvider: 'GOOGLE'
    }
  });

  if (!loginResponse.ok()) {
    const error = await loginResponse.text();
    throw new Error(`Mock Google login failed: ${error}`);
  }

  // Získej cookies z response
  const setCookieHeaders = loginResponse.headers()['set-cookie'];
  if (setCookieHeaders) {
    const cookies = parseCookies(setCookieHeaders);
    
    if ('addCookies' in page) {
      await page.addCookies(cookies);
    } else {
      await page.context().addCookies(cookies);
    }
  }

  return userData;
}

function parseCookies(setCookieHeader: string): any[] {
  const cookie = setCookieHeader.split(';')[0];
  const [name, value] = cookie.split('=');
  
  return [{
    name: name.trim(),
    value: value.trim(),
    domain: '.lvh.me',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax' as 'Lax'
  }];
}

/**
 * Vytvoří authenticated context pro Google uživatele
 * POZNÁMKA: Google OAuth podporuje pouze roli CLIENT
 */
export async function createGoogleAuthContext(browser: any, email: string) {
  const context = await browser.newContext();
  
  // Mock Google login (vždy CLIENT)
  await mockGoogleLogin(context, email, { 
    name: `Test Google Client`
  });
  
  return context;
}

/**
 * Helper pro vytvoření testovacích Google uživatelů
 */
export async function setupGoogleTestUsers(page: Page) {
  const apiUrl = process.env.API_URL || 'http://localhost:4000';
  
  const response = await page.request.post(`${apiUrl}/test/create-google-test-users`, {
    data: {
      tenantSlug: 'svahy'
    }
  });

  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Failed to create test users: ${error}`);
  }

  return response.json();
}

/**
 * Simulace Google OAuth flow v UI (pro vizuální testy)
 */
export async function simulateGoogleOAuthFlow(page: Page, email: string) {
  // Naviguj na login stránku
  await page.goto('http://svahy.lvh.me:3000/login');
  
  // Klikni na Google login button
  await page.click('button:has-text("Přihlásit se přes Google")');
  
  // Počkej chvíli pro efekt
  await page.waitForTimeout(500);
  
  // Místo skutečného OAuth flow, použij mock
  await mockGoogleLogin(page, email);
  
  // Reload stránky pro aplikování session
  await page.goto('http://svahy.lvh.me:3000');
  
  // Ověř, že jsme přihlášeni
  await page.waitForSelector('text=Odhlásit se', { timeout: 5000 });
}