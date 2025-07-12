import { Page } from '@playwright/test';

export const getTenantUrl = (tenant: string = 'svahy') => {
  return process.env.CI 
    ? `https://${tenant}.veterina-reservations.vercel.app`
    : `http://${tenant}.lvh.me:3000`;
};

/**
 * Přihlášení testovacího klienta (INTERNAL auth)
 */
export async function loginAsClient(page: Page) {
  await page.goto(getTenantUrl('svahy') + '/login');
  
  // Klik na "Přihlásit se pomocí uživatelského jména"
  const internalLoginButton = page.locator('text=Přihlásit se pomocí uživatelského jména');
  if (await internalLoginButton.isVisible()) {
    await internalLoginButton.click();
  }
  
  // Vyplnit přihlašovací údaje
  await page.fill('input[name="username"]', 'milan.kopp');
  await page.fill('input[name="password"]', 'doktor123');
  
  // Odeslat formulář
  await page.click('button[type="submit"]:has-text("Přihlásit")');
  
  // Počkat na přesměrování
  await page.waitForURL('**/');
}

/**
 * Přihlášení testovacího doktora (INTERNAL auth)
 */
export async function loginAsDoctor(page: Page) {
  // Jdi na login stránku
  await page.goto(getTenantUrl('svahy') + '/login');
  
  // Přijmi cookies pokud je dialog zobrazen
  const cookieButton = page.locator('button:has-text("Přijmout vše")');
  if (await cookieButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieButton.click();
  }
  
  // Klikni na "Přihlaste se zde"
  await page.locator('a:has-text("Přihlaste se zde")').click();
  
  // Vyčkej až budeme na /portal/team
  await page.waitForURL('**/portal/team');
  
  // Vyčkej na přihlašovací formulář
  await page.waitForSelector('input#username');
  
  await page.fill('input#username', 'milan.kopp');
  await page.fill('input#password', 'doktor123');
  await page.click('button[type="submit"]:has-text("Přihlásit")');
  await page.waitForURL('**/', { waitUntil: 'networkidle' });
}

/**
 * Přihlášení testovacího admina (INTERNAL auth)
 */
export async function loginAsAdmin(page: Page) {
  // Jdi na login stránku
  await page.goto(getTenantUrl('svahy') + '/login');
  
  // Přijmi cookies pokud je dialog zobrazen
  const cookieButton = page.locator('button:has-text("Přijmout vše")');
  if (await cookieButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieButton.click();
  }
  
  // Klikni na "Přihlaste se zde"
  await page.locator('a:has-text("Přihlaste se zde")').click();
  
  // Vyčkej až budeme na /portal/team
  await page.waitForURL('**/portal/team');
  
  // Vyčkej na přihlašovací formulář
  await page.waitForSelector('input#username');
  
  await page.fill('input#username', 'admin');
  await page.fill('input#password', 'K9mX2nP7qE');
  await page.click('button[type="submit"]:has-text("Přihlásit")');
  await page.waitForURL('**/', { waitUntil: 'networkidle' });
}

/**
 * Vytvoření authenticated context pro rychlejší testy
 */
export async function createAuthenticatedContext(browser: any, role: 'client' | 'doctor' | 'admin') {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  switch(role) {
    case 'client':
      await loginAsClient(page);
      break;
    case 'doctor':
      await loginAsDoctor(page);
      break;
    case 'admin':
      await loginAsAdmin(page);
      break;
  }
  
  // Uložit storage state
  await context.storageState({ path: `tests/e2e/.auth/${role}.json` });
  await page.close();
  
  return context;
}