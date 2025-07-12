import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateSvahySlug() {
  console.log('🔄 Migrace tenant slug z "svahy" na "veterina-svahy"...');

  try {
    // 1. Zkontroluj, zda existuje tenant se slug "svahy"
    const svahyTenant = await prisma.tenant.findUnique({
      where: { slug: 'svahy' }
    });

    if (!svahyTenant) {
      console.log('⚠️  Tenant se slug "svahy" neexistuje, migrace není potřeba.');
      return;
    }

    // 2. Zkontroluj, zda už neexistuje tenant se slug "veterina-svahy"
    const existingVeterinaSvahy = await prisma.tenant.findUnique({
      where: { slug: 'veterina-svahy' }
    });

    if (existingVeterinaSvahy) {
      console.error('❌ Tenant se slug "veterina-svahy" již existuje! Migrace nemůže pokračovat.');
      throw new Error('Duplicate slug detected');
    }

    // 3. Aktualizuj slug
    const updatedTenant = await prisma.tenant.update({
      where: { slug: 'svahy' },
      data: { 
        slug: 'veterina-svahy',
        subdomain: 'veterina-svahy' // Také aktualizuj subdomain
      }
    });

    console.log('✅ Tenant slug úspěšně aktualizován');
    console.log(`   - Původní slug: svahy`);
    console.log(`   - Nový slug: veterina-svahy`);
    console.log(`   - Subdoména: ${updatedTenant.subdomain}`);
    console.log(`   - ID: ${updatedTenant.id}`);

    // 4. Výpis dalších potřebných změn
    console.log('\n📋 DŮLEŽITÉ: Následující změny je třeba provést ručně:\n');
    console.log('1. **Produkční DNS a konfigurace:**');
    console.log('   - Změnit DNS záznam z svahy.slotnito.online na veterina-svahy.slotnito.online');
    console.log('   - Aktualizovat CORS whitelist v produkční konfiguraci');
    console.log('');
    console.log('2. **Aktualizovat konfigurační soubory:**');
    console.log('   - /apps/api/src/index.ts - CORS konfigurace');
    console.log('   - playwright.config.ts - base URL pro testy');
    console.log('');
    console.log('3. **Aktualizovat seed soubory:**');
    console.log('   - /prisma/seed.ts');
    console.log('   - /prisma/seed-svahy-content.ts');
    console.log('   - /prisma/update-svahy-tenant.ts');
    console.log('   - Všechny další seed soubory');
    console.log('');
    console.log('4. **Aktualizovat defaultní tenant v kódu:**');
    console.log('   - /apps/web/lib/tenant.ts');
    console.log('   - /apps/api/src/routes/auth.ts');
    console.log('   - Všechny další místa s fallback na "svahy"');
    console.log('');
    console.log('5. **Aktualizovat testy:**');
    console.log('   - Všechny E2E testy používající tenant "svahy"');
    console.log('');
    console.log('6. **Pro lokální vývoj:**');
    console.log('   - Používat veterina-svahy.lvh.me:3000 místo svahy.lvh.me:3000');

  } catch (error) {
    console.error('❌ Chyba při migraci:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Spustit migraci
migrateSvahySlug().catch((e) => {
  console.error('❌ Kritická chyba:', e);
  process.exit(1);
});