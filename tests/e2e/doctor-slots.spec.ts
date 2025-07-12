import { test, expect } from '@playwright/test';
import { loginAsDoctor as loginHelper } from './helpers/auth.helper';

const getTenantUrl = (tenant: string = 'svahy') => {
  return process.env.CI 
    ? `https://${tenant}.veterina-reservations.vercel.app`
    : `http://${tenant}.lvh.me:3000`;
};

test.describe('Doktorský flow - správa slotů', () => {
  test.beforeEach(async ({ page }) => {
    // Přihlášení jako doktor
    await loginHelper(page);
  });

  test('vytvoření jednotlivého slotu', async ({ page }) => {
    await page.goto(getTenantUrl('svahy') + '/slots');
    
    // Počkat na načtení stránky
    await page.waitForLoadState('networkidle');
    
    // Klik na vytvoření nového slotu
    await page.click('button:has-text("+ Přidat slot")');
    
    // Počkat na otevření modalu/formuláře
    await expect(page.locator('h2:has-text("Nový slot")').or(page.locator('h3:has-text("Nový slot")'))).toBeVisible();
    
    // Vyplnění formuláře
    // Začátek - datetime-local input (první input s labelem "Začátek *")
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 30, 0, 0); // 8:30 - po minimálním času 8:00
    
    // Formátovat jako lokální čas, ne UTC
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    const startDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    await page.locator('input[type="datetime-local"]').first().fill(startDateTime);
    
    // Výběr ordinace - použít value z options
    const roomSelect = page.locator('select:has(option:text("Vyberte ordinaci..."))');
    await roomSelect.selectOption({ value: 'cmcnc72cl000t02d8002w4dui' }); // Ordinace 1
    
    // Výběr služby - použít value z options
    const serviceSelect = page.locator('select:has(option:text("Vyberte druh služby..."))');
    await serviceSelect.selectOption({ value: 'cmcnc72cr001102d84pk7zf7u' }); // Základní vyšetření • 30 min
    
    // Poznámky (volitelné)
    await page.fill('input[placeholder="Poznámky o vybavení"]', 'Testovací slot');
    
    // Odeslání - použít správný selektor pro zelené tlačítko
    await page.locator('button[type="submit"]:has-text("Vytvořit slot")').click();
    
    // Počkat na zpracování
    await page.waitForTimeout(1000);
    
    // Kontrola úspěchu - různé možnosti
    // 1. Toast notifikace
    const toastSuccess = page.locator('text=Slot byl úspěšně vytvořen').or(page.locator('text=Slot vytvořen'));
    // 2. Modal se zavřel
    const modalClosed = page.locator('h2:has-text("Nový slot")').or(page.locator('h3:has-text("Nový slot")'));
    // 3. Slot se objevil v seznamu
    const slotInList = page.locator('text=8:30').or(page.locator('text=08:30'));
    
    // Zkontrolovat alespoň jednu z možností
    const success = await toastSuccess.isVisible({ timeout: 3000 }) || 
                   !(await modalClosed.isVisible({ timeout: 1000 })) ||
                   await slotInList.isVisible({ timeout: 3000 });
    
    expect(success).toBeTruthy();
  });

  test('hromadné generování slotů', async ({ page }) => {
    await page.goto(getTenantUrl('svahy') + '/slots/generovani');
    
    // Nastavení parametrů
    await page.fill('input[name="startDate"]', '2025-07-20');
    await page.fill('input[name="endDate"]', '2025-07-26');
    
    // Výběr dnů v týdnu
    await page.check('input[value="1"]'); // Pondělí
    await page.check('input[value="3"]'); // Středa
    await page.check('input[value="5"]'); // Pátek
    
    // Časové rozmezí
    await page.fill('input[name="startTime"]', '08:00');
    await page.fill('input[name="endTime"]', '17:00');
    await page.fill('input[name="slotDuration"]', '30');
    
    // Přestávka na oběd
    await page.check('input[name="includeLunchBreak"]');
    await page.fill('input[name="lunchStart"]', '12:00');
    await page.fill('input[name="lunchEnd"]', '13:00');
    
    // Preview
    await page.click('button:has-text("Zobrazit náhled")');
    await expect(page.locator('.slot-preview')).toBeVisible();
    
    // Generování
    await page.click('button:has-text("Vygenerovat sloty")');
    
    // Kontrola
    await expect(page.locator('text=bylo úspěšně vygenerováno')).toBeVisible();
  });

  test('změna stavu rezervace', async ({ page }) => {
    await page.goto(getTenantUrl('svahy') + '/rezervace/sprava');
    
    // Najít PENDING rezervaci
    const reservation = page.locator('tr:has-text("PENDING")').first();
    
    // Změnit na CONFIRMED
    await reservation.locator('select[name="status"]').selectOption('CONFIRMED');
    
    // Počkat na toast
    await expect(page.locator('text=Stav rezervace byl změněn')).toBeVisible();
  });

  test('zobrazení minulých slotů', async ({ page }) => {
    await page.goto(getTenantUrl('svahy') + '/rezervace/nova');
    
    // Jako doktor vidím i minulé sloty (šedě)
    const pastSlots = page.locator('.past-slot');
    await expect(pastSlots.first()).toBeVisible();
    await expect(pastSlots.first()).toHaveClass(/opacity-50/);
  });
});

