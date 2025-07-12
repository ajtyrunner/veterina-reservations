import { test, expect } from '@playwright/test';
import { mockGoogleLogin, setupGoogleTestUsers, simulateGoogleOAuthFlow } from './helpers/mock-google-auth';

test.describe('Google OAuth flow testy', () => {
  // Vytvoř test users před testy
  test.beforeAll(async ({ request }) => {
    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    await request.post(`${apiUrl}/test/create-google-test-users`, {
      data: { tenantSlug: 'svahy' }
    });
  });

  test('Google klient může vytvořit rezervaci', async ({ page }) => {
    // Mock Google přihlášení
    await mockGoogleLogin(page, 'google.client@example.com');
    
    // Naviguj na hlavní stránku
    await page.goto('http://svahy.lvh.me:3000');
    
    // Ověř, že jsme přihlášeni - použij první viditelný button "Odhlásit se"
    await expect(page.locator('button:has-text("Odhlásit se")').first()).toBeVisible();
    
    // Ověř, že vidíme uživatelské info - použij první výskyt
    await expect(page.locator('text=google.client').first()).toBeVisible();
    
    // Jdi na rezervace - klikni na první výskyt
    await page.locator('text=Rezervovat termín').first().click();
    
    // Ověř, že vidíme stránku s rezervacemi
    await expect(page.locator('h1:has-text("Rezervace termínu")').or(page.locator('h2:has-text("Rezervace termínu")'))).toBeVisible();
  });

  test('Google uživatel NEMŮŽE být doktor', async ({ page }) => {
    // Mock Google přihlášení
    await mockGoogleLogin(page, 'google.user@example.com');
    
    await page.goto('http://svahy.lvh.me:3000');
    
    // Google uživatel (CLIENT) by NEMĚL vidět správu slotů
    await expect(page.locator('text=Správa slotů')).not.toBeVisible();
    
    // Pokus o přímý přístup na /slots by měl být odmítnut
    await page.goto('http://svahy.lvh.me:3000/slots');
    
    // Měl by být přesměrován zpět na rezervace nebo domovskou stránku
    await expect(page).toHaveURL(/\/(rezervace|$)/);
    
    // A neměl by vidět nic souvisejícího se správou slotů
    await expect(page.locator('text=Vytvořit nový slot')).not.toBeVisible();
    await expect(page.locator('text=Správa slotů')).not.toBeVisible();
  });

  test('Google vs INTERNAL auth provider rozdíly', async ({ browser }) => {
    // Vytvoř dva kontexty - Google a Internal
    const googleContext = await browser.newContext();
    const googlePage = await googleContext.newPage();
    
    const internalContext = await browser.newContext();
    const internalPage = await internalContext.newPage();
    
    // Google login
    await mockGoogleLogin(googlePage, 'google.client@example.com');
    await googlePage.goto('http://svahy.lvh.me:3000/rezervace/sprava');
    
    // Google users nemají možnost změnit heslo
    await expect(googlePage.locator('text=Změnit heslo')).not.toBeVisible();
    
    // INTERNAL login (pokud máte test user)
    // await loginAsInternalUser(internalPage, 'test.client', 'TestPassword123!');
    // await internalPage.goto('http://svahy.lvh.me:3000/rezervace/sprava');
    
    // INTERNAL users mají možnost změnit heslo
    // await expect(internalPage.locator('text=Změnit heslo')).toBeVisible();
    
    await googleContext.close();
    await internalContext.close();
  });

  test('JWT token obsahuje správné Google OAuth informace', async ({ page, request }) => {
    // Mock login a získej response
    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    const response = await request.post(`${apiUrl}/test/mock-google-login`, {
      data: {
        email: 'test.jwt@example.com',
        name: 'JWT Test User',
        tenantSlug: 'svahy'
      }
    });
    
    const data = await response.json();
    
    // Ověř strukturu JWT dat
    expect(data.user).toMatchObject({
      email: 'test.jwt@example.com',
      name: 'JWT Test User',
      authProvider: 'GOOGLE',
      role: 'CLIENT'
    });
    
    // Token by měl obsahovat Google-specific claims
    expect(data.token).toBeTruthy();
    
    // Dekóduj token (pouze pro test účely)
    const tokenPayload = JSON.parse(Buffer.from(data.token.split('.')[1], 'base64').toString());
    
    expect(tokenPayload).toMatchObject({
      email: 'test.jwt@example.com',
      provider: 'google',
      role: 'CLIENT'
    });
    
    // Ověř OAuth specific fields
    expect(tokenPayload.providerAccountId).toContain('google-test-');
    expect(tokenPayload.access_token).toBe('mock-google-access-token');
  });

  test('Vizuální test Google OAuth flow', async ({ page }) => {
    // Simuluj celý OAuth flow vizuálně
    await simulateGoogleOAuthFlow(page, 'google.visual@example.com');
    
    // Ověř, že jsme na hlavní stránce a jsme přihlášeni
    await expect(page).toHaveURL('http://svahy.lvh.me:3000/');
    await expect(page.locator('button:has-text("Odhlásit se")').first()).toBeVisible();
    
    // Screenshot pro vizuální regresi
    await expect(page).toHaveScreenshot('google-logged-in.png');
  });
});