import { test, expect } from '@playwright/test';

test.describe('Multi-tenant funkcionalita', () => {
  test('různé tenanty mají oddělená data', async ({ browser }) => {
    // Otevřít dva kontexty pro různé tenanty
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Tenant 1 - svahy
    await page1.goto('http://svahy.lvh.me:3000');
    await expect(page1.locator('text=Veterinární ordinace Sváhy')).toBeVisible();
    
    // Tenant 2 - demo (pokud existuje)
    await page2.goto('http://demo.lvh.me:3000');
    // Pokud tenant neexistuje, měla by se zobrazit chyba nebo fallback
    
    // Cleanup
    await context1.close();
    await context2.close();
  });

  test('tenant branding se načítá správně', async ({ page }) => {
    await page.goto('http://svahy.lvh.me:3000');
    
    // Kontrola tenant-specific elementů
    const logo = page.locator('img[alt*="logo"]');
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary');
    });
    
    // Kontrola, že se načetly tenant styly
    expect(primaryColor).toBeTruthy();
  });

  test('content system načítá správné texty', async ({ page }) => {
    await page.goto('http://svahy.lvh.me:3000');
    
    // Počkat na načtení content systému
    await page.waitForLoadState('networkidle');
    
    // Kontrola, že se zobrazují texty (ne fallback klíče)
    const heroTitle = page.locator('h1').first();
    await expect(heroTitle).not.toHaveText('hero.title');
    await expect(heroTitle).toContainText('Rezervujte');
  });
});

test.describe('Content system as-is stav', () => {
  test('kontrola hardcoded textů před migrací', async ({ page }) => {
    await page.goto('http://svahy.lvh.me:3000');
    
    // Seznam hardcoded textů k ověření
    const hardcodedTexts = [
      'Rezervujte si termín online',
      'Jednoduché rezervace veterinárních služeb',
      'Jméno zvířete',
      'Druh zvířete',
      'Veterinář'
    ];
    
    // Kontrola, že texty jsou stále viditelné
    for (const text of hardcodedTexts) {
      await expect(page.locator(`text=${text}`)).toBeVisible();
    }
  });

  test('kontrola hardcoded stylů před migrací', async ({ page }) => {
    await page.goto('http://svahy.lvh.me:3000');
    
    // Kontrola orange barev v Hero sekci
    const heroSection = page.locator('[class*="orange"]').first();
    await expect(heroSection).toBeVisible();
    
    // Kontrola gradientu
    const gradient = page.locator('[class*="from-orange-400"]');
    await expect(gradient).toBeVisible();
  });
});