import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAgilityTenant() {
  console.log('🐑 Vytváření tenanta pro Agi/Sheep u Nikol...');

  // 1. Vytvoření content template pro agility/pasení
  const agilityTemplate = await prisma.contentTemplate.upsert({
    where: { name: 'agility_sheep' },
    update: {
      labels: {
        // Základní texty
        app_name: 'Agi/Sheep u Nikol',
        hero_title: 'Rezervujte si trénink agility nebo pasení',
        hero_subtitle: 'Profesionální tréninky pro vás a vašeho psa',
        
        // Role - jiné názvy než veterina!
        STAFF: 'Trenér',
        STAFF_PLURAL: 'Trenéři', 
        CLIENT: 'Majitel psa',
        ADMIN: 'Správce',
        
        // Entity
        SLOT: 'Trénink',
        RESERVATION: 'Rezervace tréninku',
        SERVICE_SUBJECT: 'Pes',
        
        // Formulářové pole
        client_name: 'Vaše jméno',
        dog_name: 'Jméno psa',
        dog_breed: 'Plemeno psa',
        training_type: 'Typ tréninku',
        experience_level: 'Úroveň zkušeností',
        
        // Akce
        book_training: 'Rezervovat trénink',
        cancel_training: 'Zrušit trénink',
        view_trainings: 'Moje tréninky',
        
        // Typy služeb
        service_types: {
          agility_basic: 'Agility - začátečníci',
          agility_advanced: 'Agility - pokročilí',
          sheep_herding: 'Pasení ovcí',
          combined_training: 'Kombinovaný trénink',
          private_lesson: 'Individuální lekce'
        },
        
        // Specifické texty
        training_notes: 'Poznámky k tréninku',
        equipment_needed: 'Potřebné vybavení',
        outdoor_location: 'Venkovní areál',
        weather_dependent: 'Trénink závisí na počasí',
        
        // Hero boxy - NOVÉ!
        hero_box_1: 'Online rezervace',
        hero_box_2: 'Flexibilní časy',
        hero_box_3: 'Zkušení trenéři',
        hero_box_4: 'Trénink psů'
      }
    },
    create: {
      name: 'agility_sheep',
      displayName: 'Agility a pasení',
      category: 'sports',
      labels: {
        // Základní texty
        app_name: 'Agi/Sheep u Nikol',
        hero_title: 'Rezervujte si trénink agility nebo pasení',
        hero_subtitle: 'Profesionální tréninky pro vás a vašeho psa',
        
        // Role - jiné názvy než veterina!
        STAFF: 'Trenér',
        STAFF_PLURAL: 'Trenéři', 
        CLIENT: 'Majitel psa',
        ADMIN: 'Správce',
        
        // Entity
        SLOT: 'Trénink',
        RESERVATION: 'Rezervace tréninku',
        SERVICE_SUBJECT: 'Pes',
        
        // Formulářové pole
        client_name: 'Vaše jméno',
        dog_name: 'Jméno psa',
        dog_breed: 'Plemeno psa',
        training_type: 'Typ tréninku',
        experience_level: 'Úroveň zkušeností',
        
        // Akce
        book_training: 'Rezervovat trénink',
        cancel_training: 'Zrušit trénink',
        view_trainings: 'Moje tréninky',
        
        // Typy služeb
        service_types: {
          agility_basic: 'Agility - začátečníci',
          agility_advanced: 'Agility - pokročilí',
          sheep_herding: 'Pasení ovcí',
          combined_training: 'Kombinovaný trénink',
          private_lesson: 'Individuální lekce'
        },
        
        // Specifické texty
        training_notes: 'Poznámky k tréninku',
        equipment_needed: 'Potřebné vybavení',
        outdoor_location: 'Venkovní areál',
        weather_dependent: 'Trénink závisí na počasí',
        
        // Hero boxy
        hero_box_1: 'Online rezervace',
        hero_box_2: 'Flexibilní časy',
        hero_box_3: 'Zkušení trenéři',
        hero_box_4: 'Trénink psů',
        
        // Login stránka
        login: {
          title: 'Přihlášení pro majitele psů',
          subtitle: 'Přihlaste se rychle a bezpečně pomocí Google účtu',
          security_title: 'Bezpečné přihlášení',
          security_description: 'Používáme Google OAuth pro bezpečné a rychlé přihlášení. Vaše hesla neukládáme.',
          google_button: 'Přihlásit se přes Google',
          loading: 'Přihlašování...',
          error: 'Chyba při přihlašování přes Google',
          terms: 'Přihlášením souhlasíte s našimi podmínkami použití a zásadami ochrany osobních údajů.',
          staff_question: 'Jste trenér?',
          staff_link: 'Přihlaste se zde →'
        },
        
        // Team portal stránka
        team_portal: {
          title: 'Trenérský portál',
          subtitle: 'Přihlášení pro {{STAFF_PLURAL}} a administrátory',
          info_title: 'Pouze pro trenéry',
          info_description: 'Použijte své pracovní přihlašovací údaje do systému.',
          username_label: 'Uživatelské jméno',
          username_placeholder: 'jmeno.prijmeni',
          password_label: 'Heslo',
          password_placeholder: 'Vaše pracovní heslo',
          sign_in_button: 'Přihlásit se do portálu',
          signing_in: 'Přihlašování...',
          error_invalid_credentials: 'Neplatné přihlašovací údaje',
          error_login: 'Chyba při přihlašování',
          support_text: 'Máte potíže s přihlášením? Kontaktujte správce systému.',
          client_question: 'Jste majitel psa?',
          client_link: 'Přihlaste se zde →',
          loading: 'Načítám...'
        },
        
        // How it works stránka
        how_it_works: {
          hero: {
            title: 'Jak funguje náš rezervační systém?',
            subtitle: 'Jednoduché kroky k rychlé a pohodlné rezervaci tréninků'
          },
          steps_title: '5 jednoduchých kroků',
          steps_subtitle: 'Od přihlášení po trénink - celý proces je navržen pro vaše pohodlí',
          steps: [
            {
              title: 'Přihlášení',
              description: 'Přihlaste se rychle a bezpečně pomocí svého Google účtu',
              icon: '🔐',
              details: [
                'Žádné další hesla k zapamatování',
                'Bezpečné OAuth přihlášení',
                'Okamžitý přístup k rezervacím'
              ]
            },
            {
              title: 'Výběr tréninku',
              description: 'Vyberte druh tréninku pro vašeho psa',
              icon: '🎯',
              details: [
                'Agility pro začátečníky i pokročilé',
                'Pasení ovcí pro pastevecká plemena',
                'Individuální lekce na míru'
              ]
            },
            {
              title: 'Výběr termínu',
              description: 'Najděte si vyhovující termín v kalendáři',
              icon: '📅',
              details: [
                'Reálný kalendář dostupnosti',
                'Filtrování podle trenéra',
                'Zobrazení detailů termínů'
              ]
            },
            {
              title: 'Rezervace',
              description: 'Vyplňte informace o vašem psovi a potvrďte rezervaci',
              icon: '🐕',
              details: [
                'Jméno a plemeno psa',
                'Úroveň zkušeností',
                'Okamžité potvrzení rezervace'
              ]
            },
            {
              title: 'Trénink',
              description: 'Dostavte se v rezervovaný čas na tréninkové hřiště',
              icon: '🏃',
              details: [
                'Přijďte 10 minut před tréninkem',
                'Vezměte si vodu pro psa',
                'Profesionální vedení tréninku'
              ]
            }
          ],
          benefits_title: 'Proč si vybrat online rezervace?',
          benefits_subtitle: 'Náš rezervační systém přináší mnoho výhod pro vás i vašeho psa',
          benefits: [
            {
              icon: '⏰',
              title: 'Úspora času',
              description: 'Žádné čekání na telefonu nebo psaní emailů'
            },
            {
              icon: '📱',
              title: 'Dostupnost 24/7',
              description: 'Rezervujte si termín kdykoliv, odkudkoliv'
            },
            {
              icon: '🔔',
              title: 'Automatické připomínky',
              description: 'Budeme vás informovat o blížícím se tréninku'
            },
            {
              icon: '📋',
              title: 'Historie tréninků',
              description: 'Kompletní přehled absolvovaných tréninků a pokroků'
            },
            {
              icon: '👩‍🏫',
              title: 'Zkušení trenéři',
              description: 'Tým profesionálních trenérů s certifikací'
            },
            {
              icon: '🌳',
              title: 'Venkovní prostředí',
              description: 'Krásné přírodní prostředí farmy pro trénink'
            }
          ],
          cta: {
            title: 'Připraveni začít?',
            description: 'Rezervace termínu trvá jen pár minut. Váš pes si zaslouží profesionální trénink.',
            button_primary: '🐕 Rezervovat trénink',
            button_secondary: 'Zpět na hlavní stránku'
          },
          faq_title: 'Často kladené otázky',
          faq: [
            {
              question: 'Mohu rezervaci zrušit nebo změnit?',
              answer: 'Ano, rezervace můžete upravit nebo zrušit až do 12 hodin před tréninkem. Stačí se přihlásit do svého účtu.'
            },
            {
              question: 'Co když bude špatné počasí?',
              answer: 'Při nepříznivém počasí vás budeme kontaktovat. Většina tréninků probíhá i za mírného deště, ale při bouřce nebo silném větru trénink přesuneme.'
            },
            {
              question: 'Potřebuji nějaké vybavení?',
              answer: 'Základní vybavení (překážky, pomůcky) máme k dispozici. Stačí si vzít vodítko, odměny pro psa a vodu.'
            },
            {
              question: 'Je první lekce zdarma?',
              answer: 'Nabízíme ukázkovou lekci za zvýhodněnou cenu, kde si můžete vyzkoušet, zda vám náš přístup vyhovuje.'
            }
          ]
        }
      },
      messages: {
        // Zprávy a notifikace
        training_confirmed: 'Váš trénink byl potvrzen',
        training_cancelled: 'Trénink byl zrušen',
        reminder: 'Připomínka tréninku zítra v {{time}}',
        weather_warning: 'Upozornění: Zkontrolujte počasí před tréninkem',
        bring_water: 'Nezapomeňte vodu pro vašeho psa'
      },
      emailTemplates: {
        reservation_created: {
          subject: 'Potvrzení rezervace tréninku - {{service_type}}',
          body: `
            <h2>Váš trénink byl zarezervován</h2>
            <p>Dobrý den {{client_name}},</p>
            <p>potvrzujeme rezervaci tréninku:</p>
            <ul>
              <li><strong>Typ tréninku:</strong> {{service_type}}</li>
              <li><strong>Datum a čas:</strong> {{date}} v {{time}}</li>
              <li><strong>Trenér:</strong> {{trainer_name}}</li>
              <li><strong>Pes:</strong> {{dog_name}}</li>
            </ul>
            <p>Prosíme, dostavte se 10 minut předem.</p>
            <p>S pozdravem,<br>Tým Agi/Sheep u Nikol</p>
          `
        }
      },
      colorScheme: {
        primary: '#059669',     // Emerald-600 - zelená pro přírodu/sport
        secondary: '#10b981',   // Emerald-500
        accent: '#047857',      // Emerald-700
        neutral: '#6b7280',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#f0fdf4'   // Emerald-50 - světle zelené pozadí
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        headingFont: 'Poppins, sans-serif'
      },
      features: [
        'reservations',
        'outdoor_activities',
        'weather_integration',
        'skill_levels',
        'group_sessions',
        'equipment_tracking'
      ]
    }
  });

  console.log('✅ Content template pro agility vytvořen');

  // 2. Vytvoření tenanta
  const agilityTenant = await prisma.tenant.upsert({
    where: { slug: 'agility-nikol' },
    update: {
      contentTemplateId: agilityTemplate.id,
      subdomain: 'agility-nikol',
      contentData: {
        // Tenant-specific overrides
        contact: {
          phone: '+420 603 891 385',
          email: 'nikol@bordercollie.cz',
          address: 'Farma u Nikol, Žlutavy'
        },
        social: {
          facebook: 'https://facebook.com/agilitynikol',
          instagram: '@agility_sheep_nikol'
        },
        branding: {
          logoUrl: '/images/tenants/agility-nikol/logo.png',
          logoAlt: 'Agi/Sheep u Nikol - Agility a pasení ovcí',
          logoWidth: 180,
          logoHeight: 180
        }
      },
      customStyles: {
        // Vlastní styly pro tento tenant
        logoPosition: 'center',
        heroGradient: 'from-emerald-400 to-green-500',
        borderRadius: 'rounded-xl'
      },
      enabledFeatures: [
        'reservations',
        'outdoor_tracking',
        'weather_alerts',
        'group_management'
      ]
    },
    create: {
      slug: 'agility-nikol',
      name: 'Agi/Sheep u Nikol',
      subdomain: 'agility-nikol',
      primaryColor: '#059669',
      secondaryColor: '#10b981',
      timezone: 'Europe/Prague',
      contentTemplateId: agilityTemplate.id,
      contentData: {
        contact: {
          phone: '+420 603 891 385',
          email: 'nikol@bordercollie.cz',
          address: 'Farma u Nikol, Žlutavy'
        },
        social: {
          facebook: 'https://facebook.com/agilitynikol',
          instagram: '@agility_sheep_nikol'
        },
        branding: {
          logoUrl: '/images/tenants/agility-nikol/logo.png',
          logoAlt: 'Agi/Sheep u Nikol - Agility a pasení ovcí',
          logoWidth: 180,
          logoHeight: 180
        }
      },
      customStyles: {
        logoPosition: 'center',
        heroGradient: 'from-emerald-400 to-green-500',
        borderRadius: 'rounded-xl'
      },
      enabledFeatures: [
        'reservations',
        'outdoor_tracking',
        'weather_alerts',
        'group_management'
      ]
    }
  });

  console.log('✅ Tenant Agility/Sheep u Nikol vytvořen');

  // Zkontrolujeme jestli už existují uživatelé pro tento tenant
  const existingUsers = await prisma.user.count({
    where: { tenantId: agilityTenant.id }
  });

  if (existingUsers > 0) {
    console.log('ℹ️  Uživatelé již existují, přeskakuji vytváření...');
    console.log('✅ Seed dokončen - pouze aktualizace content dat');
    return;
  }

  // 3. Vytvoření uživatelů
  
  // Admin
  const adminUser = await prisma.user.upsert({
    where: {
      unique_username_tenant: {
        username: 'nikol.admin',
        tenantId: agilityTenant.id
      }
    },
    update: {
      email: 'nikol@bordercollie.cz',
      name: 'Nikol - správce',
      isActive: true
    },
    create: {
      email: 'nikol@bordercollie.cz',
      username: 'nikol.admin',
      name: 'Nikol - správce',
      password: await bcrypt.hash('agility123', 10),
      role: 'ADMIN',
      authProvider: 'INTERNAL',
      tenantId: agilityTenant.id,
      isActive: true
    }
  });

  // Trenéři (místo doktorů)
  const trainer1 = await prisma.user.create({
    data: {
      email: 'trener1@agility-nikol.cz',
      username: 'jan.trener',
      name: 'Jan Novák',
      password: await bcrypt.hash('trener123', 10),
      role: 'DOCTOR', // Stále DOCTOR v DB, ale zobrazuje se jako "Trenér"
      authProvider: 'INTERNAL',
      tenantId: agilityTenant.id,
      isActive: true
    }
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      userId: trainer1.id,
      specialization: 'Agility trenér - pokročilí',
      tenantId: agilityTenant.id
    }
  });

  const trainer2 = await prisma.user.create({
    data: {
      email: 'trener2@agility-nikol.cz',
      username: 'marie.trenerka',
      name: 'Marie Svobodová',
      password: await bcrypt.hash('trener123', 10),
      role: 'DOCTOR',
      authProvider: 'INTERNAL',
      tenantId: agilityTenant.id,
      isActive: true
    }
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      userId: trainer2.id,
      specialization: 'Pasení ovcí - instruktor',
      tenantId: agilityTenant.id
    }
  });

  console.log('✅ Uživatelé vytvořeni');

  // 4. Vytvoření míst pro tréninky (rooms)
  const agilityField = await prisma.room.create({
    data: {
      name: 'Agility hřiště',
      description: 'Venkovní hřiště s kompletním agility vybavením',
      tenantId: agilityTenant.id
    }
  });

  const sheepPasture = await prisma.room.create({
    data: {
      name: 'Pastvina pro pasení',
      description: 'Ohrazená pastvina s ovcemi pro nácvik pasení',
      tenantId: agilityTenant.id
    }
  });

  const indoorHall = await prisma.room.create({
    data: {
      name: 'Krytá hala',
      description: 'Hala pro trénink za špatného počasí',
      tenantId: agilityTenant.id
    }
  });

  console.log('✅ Tréninková místa vytvořena');

  // 5. Vytvoření typů služeb
  const agilityBasic = await prisma.serviceType.create({
    data: {
      name: 'Agility - začátečníci',
      duration: 60,
      description: 'Základní agility trénink pro začínající psy',
      tenantId: agilityTenant.id
    }
  });

  const agilityAdvanced = await prisma.serviceType.create({
    data: {
      name: 'Agility - pokročilí',
      duration: 90,
      description: 'Pokročilý trénink pro zkušené agility týmy',
      tenantId: agilityTenant.id
    }
  });

  const sheepHerding = await prisma.serviceType.create({
    data: {
      name: 'Pasení ovcí',
      duration: 120,
      description: 'Trénink pasení pro pastevecká plemena',
      tenantId: agilityTenant.id
    }
  });

  const privateLession = await prisma.serviceType.create({
    data: {
      name: 'Individuální lekce',
      duration: 45,
      description: 'Soukromá lekce s trenérem',
      tenantId: agilityTenant.id
    }
  });

  console.log('✅ Typy služeb vytvořeny');

  // 6. Vytvoření několika slotů
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  // Agility tréninky
  for (let i = 0; i < 5; i++) {
    const slotDate = new Date(tomorrow);
    slotDate.setHours(9 + i * 2);
    
    await prisma.slot.create({
      data: {
        startTime: slotDate,
        endTime: new Date(slotDate.getTime() + 60 * 60 * 1000),
        doctorId: doctor1.id,
        roomId: agilityField.id,
        serviceTypeId: i % 2 === 0 ? agilityBasic.id : agilityAdvanced.id,
        tenantId: agilityTenant.id,
        notes: i % 2 === 0 ? 'Kapacita: 6 psů' : 'Kapacita: 4 psi' // Poznámka o kapacitě
      }
    });
  }

  // Pasení tréninky
  for (let i = 0; i < 3; i++) {
    const slotDate = new Date(tomorrow);
    slotDate.setHours(14 + i * 2);
    
    await prisma.slot.create({
      data: {
        startTime: slotDate,
        endTime: new Date(slotDate.getTime() + 120 * 60 * 1000),
        doctorId: doctor2.id,
        roomId: sheepPasture.id,
        serviceTypeId: sheepHerding.id,
        tenantId: agilityTenant.id,
        equipment: 'Ovce jsou připraveny na pastvině',
        notes: 'Max. kapacita: 3 psi' // Poznámka o kapacitě
      }
    });
  }

  console.log('✅ Sloty vytvořeny');

  console.log(`
🎉 Tenant "Agi/Sheep u Nikol" úspěšně vytvořen!

📝 Přihlašovací údaje:
- Admin: nikol.admin / agility123
- Trenér 1: jan.trener / trener123  
- Trenér 2: marie.trenerka / trener123

🌐 Přístup:
- Local: http://agility-nikol.lvh.me:3000
- Subdoména: agility-nikol

🎨 Specifika:
- Zelené barevné schéma (emerald)
- Role "Trenér" místo "Doktor"
- Skupinové tréninky (více kapacit na slot)
- Venkovní aktivity závislé na počasí
`);

  await prisma.$disconnect();
}

seedAgilityTenant().catch((e) => {
  console.error('❌ Chyba při seedování:', e);
  process.exit(1);
});