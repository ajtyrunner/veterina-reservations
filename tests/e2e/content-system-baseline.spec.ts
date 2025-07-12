import { test, expect } from '@playwright/test';

/**
 * Baseline testy pro ověření AS-IS stavu před migrací na content system
 * Tyto testy zajistí, že po migraci vše funguje stejně
 */
test.describe('Content System - AS-IS baseline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://svahy.lvh.me:3000');
  });

  test('screenshot hlavní stránky pro vizuální regresi', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage-baseline.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('veterinární texty na hlavní stránce', async ({ page }) => {
    const textsToCheck = {
      hero: 'Rezervujte si termín online',
      subtitle: 'veterinárních služeb',
      services: 'Základní vyšetření',
      cta: 'Rezervovat termín',
    };

    for (const [key, text] of Object.entries(textsToCheck)) {
      await expect(page.locator(`text=${text}`).first()).toBeVisible({
        timeout: 5000
      });
    }
  });

  test('formulářové labely ve veterinární terminologii', async ({ page }) => {
    // Navigace na rezervační formulář
    await page.click('text=Rezervovat termín');
    
    // Počkat na načtení kalendáře
    await page.waitForSelector('.calendar-view', { state: 'visible' });
    
    // Kliknout na dostupný den
    const availableDay = page.locator('.has-slots').first();
    await availableDay.click();
    
    // Kliknout na slot
    const slot = page.locator('.slot-available').first();
    await slot.click();
    
    // Kontrola veterinárních labelů
    await expect(page.locator('label:has-text("Jméno zvířete")')).toBeVisible();
    await expect(page.locator('label:has-text("Druh zvířete")')).toBeVisible();
    await expect(page.locator('select[name="petType"] option')).toContainText(['pes', 'kočka']);
  });

  test('barevné schéma - orange primární barva', async ({ page }) => {
    // Kontrola CSS tříd s orange barvami
    const orangeElements = await page.locator('[class*="orange"]').count();
    expect(orangeElements).toBeGreaterThan(0);
    
    // Kontrola gradientu v hero sekci
    const heroGradient = page.locator('[class*="from-orange-400"]');
    await expect(heroGradient).toBeVisible();
    
    // Kontrola tlačítek
    const primaryButton = page.locator('button[class*="orange"]:has-text("Rezervovat")');
    await expect(primaryButton).toBeVisible();
  });

  test('email šablony obsahují veterinární terminologii', async ({ page }) => {
    // Tento test by měl ověřit, že emailové šablony používají správnou terminologii
    // Můžeme to testovat nepřímo přes UI nebo přímo v backend testech
    
    // Například: vytvoření rezervace a kontrola toast notifikace
    // která reflektuje obsah emailu
    // ... implementace podle potřeby
  });
});

test.describe('Metriky pro porovnání po migraci', () => {
  test('změření doby načtení stránky', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://svahy.lvh.me:3000');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Doba načtení hlavní stránky: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000); // Max 3 sekundy
  });

  test('počet hardcoded textů k nahrazení', async ({ page }) => {
    await page.goto('http://svahy.lvh.me:3000');
    
    // Seznam veterinárních termínů k nahrazení
    const veterinaryTerms = [
      'veterinár',
      'zvíře',
      'mazlíček',
      'ordinace',
      'vyšetření'
    ];
    
    let hardcodedCount = 0;
    for (const term of veterinaryTerms) {
      const count = await page.locator(`text=/${term}/i`).count();
      hardcodedCount += count;
      if (count > 0) {
        console.log(`Nalezeno "${term}": ${count}x`);
      }
    }
    
    console.log(`Celkem nalezeno ${hardcodedCount} veterinárních termínů`);
  });
});