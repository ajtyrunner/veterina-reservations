import { test, expect } from '@playwright/test';
import { loginAsDoctor } from './helpers/auth.helper';

const getTenantUrl = (tenant: string = 'svahy') => {
  return process.env.CI 
    ? `https://${tenant}.veterina-reservations.vercel.app`
    : `http://${tenant}.lvh.me:3000`;
};

test.describe('Doktorský flow - základní funkce', () => {
  test.beforeEach(async ({ page }) => {
    // Přihlášení jako doktor
    await loginAsDoctor(page);
  });

  test('přístup k doktorským funkcím', async ({ page }) => {
    // Ověřit, že doktor vidí správu slotů v menu
    await page.goto(getTenantUrl('svahy'));
    
    // Najít odkaz na správu slotů
    const slotsLink = page.locator('a:has-text("Správa slotů")').first();
    await expect(slotsLink).toBeVisible();
    
    // Kliknout na odkaz
    await slotsLink.click();
    
    // Ověřit, že jsme na správné stránce
    await expect(page).toHaveURL(/.*\/slots/);
    await expect(page.locator('h1:has-text("Správa slotů")')).toBeVisible();
  });

  test('zobrazení seznamu slotů', async ({ page }) => {
    await page.goto(getTenantUrl('svahy') + '/slots');
    
    // Počkat na načtení
    await page.waitForLoadState('networkidle');
    
    // Ověřit základní elementy stránky
    await expect(page.locator('h1:has-text("Správa slotů")')).toBeVisible();
    
    // Tlačítko pro přidání slotu
    await expect(page.locator('button:has-text("+ Přidat slot")')).toBeVisible();
    
    // Seznam slotů nebo zpráva o prázdném seznamu
    const slotList = await page.locator('.grid').count() > 0;
    const emptyMessage = await page.locator('text=Žádné sloty').isVisible();
    
    expect(slotList || emptyMessage).toBeTruthy();
  });

  test('zobrazení správy rezervací', async ({ page }) => {
    await page.goto(getTenantUrl('svahy') + '/rezervace/sprava');
    
    // Počkat na načtení
    await page.waitForLoadState('networkidle');
    
    // Ověřit, že jsme na správné stránce
    await expect(page.locator('h1:has-text("Správa rezervací")').or(page.locator('h2:has-text("Rezervace")'))).toBeVisible();
    
    // Ověřit, že vidíme nějaký obsah
    const hasContent = await page.locator('table').isVisible() || 
                      await page.locator('[role="list"]').isVisible() ||
                      await page.locator('text=Žádné rezervace').isVisible();
    
    expect(hasContent).toBeTruthy();
  });

  test('kalendář zobrazuje minulé sloty pro doktory', async ({ page }) => {
    await page.goto(getTenantUrl('svahy') + '/rezervace/nova');
    
    // Počkat na načtení kalendáře
    await expect(page.locator('h2:has-text("2025")')).toBeVisible();
    
    // Doktor by měl vidět i minulé dny se sloty (šedé)
    const grayDays = page.locator('div[class*="from-gray-100"][class*="to-gray-200"]');
    const grayDayCount = await grayDays.count();
    
    // Měli bychom vidět alespoň nějaké šedé dny (minulé)
    expect(grayDayCount).toBeGreaterThan(0);
  });
});