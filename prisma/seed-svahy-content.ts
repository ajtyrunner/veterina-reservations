import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSvahyContent() {
  console.log('🏥 Konfigurace content dat pro tenant Svahy...');

  try {
    // 1. Vytvoření nebo aktualizace veterinárního content template
    const veterinaryTemplate = await prisma.contentTemplate.upsert({
      where: { name: 'veterinary_svahy' },
      update: {
        labels: {
          // Základní texty
          app_name: 'Veterina Svahy',
          hero_title: 'Rezervujte si termín online',
          hero_subtitle: 'MVDr. Lucia Friedlaenderová - profesionální péče o vaše mazlíčky',
          
          // Role
          STAFF: 'Veterinář',
          STAFF_PLURAL: 'Veterináři',
          CLIENT: 'Majitel zvířete',
          ADMIN: 'Správce',
          
          // Entity
          SLOT: 'Termín',
          RESERVATION: 'Rezervace',
          SERVICE_SUBJECT: 'Mazlíček',
          
          // Formulářové pole
          pet_name: 'Jméno zvířete',
          pet_type: 'Druh zvířete',
          pet_breed: 'Plemeno',
          pet_age: 'Věk zvířete',
          client_name: 'Vaše jméno',
          client_phone: 'Telefonní číslo',
          client_email: 'Email',
          
          // Akce
          book_appointment: '🐾 Rezervovat termín',
          cancel_appointment: 'Zrušit rezervaci',
          view_appointments: 'Moje rezervace',
          emergency_call: '🚨 Pohotovost',
          
          // Typy služeb
          service_types: {
            basic_exam: 'Základní vyšetření',
            vaccination: 'Očkování',
            surgery: 'Chirurgický zákrok',
            dental: 'Zubní ošetření',
            emergency: 'Akutní ošetření',
            castration: 'Kastrace',
            ultrasound: 'Ultrazvuk',
            xray: 'RTG vyšetření',
            lab_tests: 'Laboratorní vyšetření',
            microchip: 'Čipování',
            passport: 'Vystavení pasu',
            dermatology: 'Dermatologie',
            ophthalmology: 'Oftalmologie',
            orthopedics: 'Ortopedie',
            cardiology: 'Kardiologie'
          },
          
          // Specifické texty
          opening_hours: 'Ordinační hodiny',
          emergency_contact: 'Pohotovost',
          pet_health_info: 'Zdravotní informace',
          vaccination_history: 'Historie očkování',
          
          // Hero boxy
          hero_box_1: '📅 Online rezervace',
          hero_box_2: '🏥 Moderní vybavení',
          hero_box_3: '🐕 Všechna zvířata',
          hero_box_4: '❤️ Individuální přístup',
          
          // Login stránka
          login: {
            title: 'Přihlášení pro majitele zvířat',
            subtitle: 'Přihlaste se rychle a bezpečně pomocí Google účtu',
            security_title: 'Bezpečné přihlášení',
            security_description: 'Používáme Google OAuth pro bezpečné a rychlé přihlášení. Vaše hesla neukládáme.',
            google_button: 'Přihlásit se přes Google',
            loading: 'Přihlašování...',
            error: 'Chyba při přihlašování přes Google',
            terms: 'Přihlášením souhlasíte s našimi podmínkami použití a zásadami ochrany osobních údajů.',
            staff_question: 'Jste veterinář?',
            staff_link: 'Přihlaste se zde →'
          },
          
          // Team portal stránka
          team_portal: {
            title: 'Týmový portál',
            subtitle: 'Přihlášení pro {{STAFF_PLURAL}} a administrátory',
            info_title: 'Pouze pro zaměstnance',
            info_description: 'Použijte své pracovní přihlašovací údaje do systému ordinace.',
            username_label: 'Uživatelské jméno',
            username_placeholder: 'jmeno.prijmeni',
            password_label: 'Heslo',
            password_placeholder: 'Vaše pracovní heslo',
            sign_in_button: 'Přihlásit se do portálu',
            signing_in: 'Přihlašování...',
            error_invalid_credentials: 'Neplatné přihlašovací údaje',
            error_login: 'Chyba při přihlašování',
            support_text: 'Máte potíže s přihlášením? Kontaktujte administrátora.',
            client_question: 'Jste klient?',
            client_link: 'Přihlaste se zde →',
            loading: 'Načítám...'
          },
          
          // How it works stránka
          how_it_works: {
            hero: {
              title: 'Jak funguje náš rezervační systém?',
              subtitle: 'Jednoduché kroky k rychlé a pohodlné rezervaci veterinární péče'
            },
            steps_title: '5 jednoduchých kroků',
            steps_subtitle: 'Od přihlášení po návštěvu ordinace - celý proces je navržen pro vaše pohodlí',
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
                title: 'Výběr služby',
                description: 'Vyberte typ vyšetření nebo ošetření pro vašeho mazlíčka',
                icon: '🏥',
                details: [
                  'Preventivní prohlídky',
                  'Očkování a odčervení',
                  'Specializovaná vyšetření',
                  'Chirurgické zákroky'
                ]
              },
              {
                title: 'Výběr termínu',
                description: 'Najděte si vyhovující termín v našem kalendáři',
                icon: '📅',
                details: [
                  'Reálný kalendář dostupnosti',
                  'Filtrování podle veterináře',
                  'Zobrazení délky vyšetření'
                ]
              },
              {
                title: 'Rezervace',
                description: 'Vyplňte informace o vašem mazlíčkovi a potvrďte rezervaci',
                icon: '🐾',
                details: [
                  'Druh a jméno zvířete',
                  'Důvod návštěvy',
                  'Okamžité potvrzení rezervace'
                ]
              },
              {
                title: 'Návštěva',
                description: 'Dostavte se v rezervovaný čas do naší ordinace',
                icon: '🏥',
                details: [
                  'Přijďte 10 minut předem',
                  'Vezměte očkovací průkaz',
                  'Profesionální péče o vašeho mazlíčka'
                ]
              }
            ],
            benefits_title: 'Proč si vybrat online rezervace?',
            benefits_subtitle: 'Náš rezervační systém přináší mnoho výhod pro vás i vaše mazlíčky',
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
                description: 'Připomeneme vám blížící se návštěvu'
              },
              {
                icon: '📋',
                title: 'Historie návštěv',
                description: 'Kompletní přehled ošetření a očkování'
              },
              {
                icon: '🏥',
                title: 'Moderní vybavení',
                description: 'RTG, ultrazvuk, laboratoř přímo v ordinaci'
              },
              {
                icon: '❤️',
                title: 'Individuální přístup',
                description: 'Každý mazlíček je pro nás jedinečný'
              }
            ],
            cta: {
              title: 'Připraveni se objednat?',
              description: 'Rezervace termínu trvá jen pár minut. Váš mazlíček si zaslouží tu nejlepší péči.',
              button_primary: '🐾 Rezervovat termín',
              button_secondary: 'Zpět na hlavní stránku'
            },
            faq_title: 'Často kladené otázky',
            faq: [
              {
                question: 'Mohu rezervaci zrušit nebo změnit?',
                answer: 'Ano, rezervace můžete upravit nebo zrušit až do 24 hodin před termínem. Stačí se přihlásit do svého účtu.'
              },
              {
                question: 'Co když potřebuji akutní ošetření?',
                answer: 'Pro akutní případy volejte naši ordinaci na číslo 571 118 622 nebo mobil 721 049 699.'
              },
              {
                question: 'Jaké doklady mám vzít s sebou?',
                answer: 'Vezměte prosím očkovací průkaz zvířete, případně předchozí lékařské zprávy. Pro první návštěvu doporučujeme vzít i doklad totožnosti.'
              },
              {
                question: 'Přijímáte všechny druhy zvířat?',
                answer: 'Specializujeme se na psy, kočky, králíky a drobné savce. Pro exotická zvířata doporučíme specializovaného kolegu.'
              },
              {
                question: 'Kde vás najdu?',
                answer: 'Nacházíme se na adrese Středová 5668, 760 05 Zlín. K dispozici je parkoviště přímo před ordinací.'
              },
              {
                question: 'Jaké jsou ordinační hodiny?',
                answer: 'Aktuální ordinační hodiny najdete na našem webu www.veterina-svahy.cz nebo volejte na 571 118 622.'
              }
            ]
          }
        },
        messages: {
          // Zprávy a notifikace
          reservation_confirmed: 'Vaše rezervace byla potvrzena',
          reservation_cancelled: 'Rezervace byla zrušena',
          reminder: 'Připomínka návštěvy zítra v {{time}}',
          thank_you: 'Děkujeme za návštěvu!',
          new_reservation: 'Nová rezervace vyžaduje pozornost',
          vaccination_reminder: 'Blíží se termín přeočkování vašeho mazlíčka'
        },
        emailTemplates: {
          reservation_created: {
            subject: 'Potvrzení rezervace - Veterina Svahy - {{date}}',
            body: `
              <h2>Vaše rezervace byla přijata</h2>
              <p>Dobrý den {{client_name}},</p>
              <p>potvrzujeme Vaši rezervaci na termín:</p>
              <ul>
                <li><strong>Datum a čas:</strong> {{date}} v {{time}}</li>
                <li><strong>Veterinář:</strong> {{doctor_name}}</li>
                <li><strong>Zvíře:</strong> {{pet_name}}</li>
                <li><strong>Typ vyšetření:</strong> {{service_type}}</li>
              </ul>
              <p>Prosíme o příchod 10 minut před termínem.</p>
              <p>Nezapomeňte vzít s sebou očkovací průkaz.</p>
              <p>V případě potřeby změny termínu nás prosím kontaktujte na tel: 571 118 622 nebo 721 049 699.</p>
              <hr>
              <p><strong>Veterina Svahy</strong><br>
              MVDr. Lucia Friedlaenderová<br>
              Středová 5668, 760 05 Zlín<br>
              Tel: 571 118 622, Mobil: 721 049 699<br>
              Email: veterina-svahy@email.cz<br>
              Web: www.veterina-svahy.cz</p>
            `
          },
          reservation_reminder: {
            subject: 'Připomínka návštěvy - Veterina Svahy - {{date}}',
            body: `
              <h2>Připomínka zítřejší návštěvy</h2>
              <p>Dobrý den {{client_name}},</p>
              <p>připomínáme Vaši rezervaci na zítra:</p>
              <ul>
                <li><strong>Datum a čas:</strong> {{date}} v {{time}}</li>
                <li><strong>Veterinář:</strong> {{doctor_name}}</li>
                <li><strong>Zvíře:</strong> {{pet_name}}</li>
                <li><strong>Typ vyšetření:</strong> {{service_type}}</li>
              </ul>
              <p>Prosíme o příchod 10 minut předem a nezapomeňte očkovací průkaz.</p>
              <p>Těšíme se na vás!</p>
              <hr>
              <p><strong>Veterina Svahy</strong><br>
              MVDr. Lucia Friedlaenderová<br>
              Středová 5668, 760 05 Zlín<br>
              Tel: 571 118 622, Mobil: 721 049 699</p>
            `
          },
          reservation_cancelled: {
            subject: 'Potvrzení zrušení rezervace - Veterina Svahy',
            body: `
              <h2>Vaše rezervace byla zrušena</h2>
              <p>Dobrý den {{client_name}},</p>
              <p>potvrzujeme zrušení Vaší rezervace:</p>
              <ul>
                <li><strong>Datum a čas:</strong> {{date}} v {{time}}</li>
                <li><strong>Veterinář:</strong> {{doctor_name}}</li>
                <li><strong>Zvíře:</strong> {{pet_name}}</li>
              </ul>
              <p>Pokud budete chtít vytvořit novou rezervaci, můžete tak učinit na našem webu nebo telefonicky.</p>
              <hr>
              <p><strong>Veterina Svahy</strong><br>
              Tel: 571 118 622, Mobil: 721 049 699<br>
              Email: veterina-svahy@email.cz<br>
              Web: www.veterina-svahy.cz</p>
            `
          }
        },
        colorScheme: {
          primary: '#f97316',     // Orange-500
          secondary: '#fb923c',   // Orange-400
          accent: '#ea580c',      // Orange-600
          neutral: '#6b7280',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          background: '#fff7ed'   // Orange-50
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          headingFont: 'Inter, sans-serif'
        },
        features: [
          'reservations',
          'pet_management',
          'medical_history',
          'vaccination_reminders',
          'emergency_contact',
          'lab_results',
          'prescription_management',
          'online_medical_records',
          'appointment_history'
        ]
      },
      create: {
        name: 'veterinary_svahy',
        displayName: 'Veterina Svahy',
        category: 'healthcare',
        labels: {
          app_name: 'Veterina Svahy',
          hero_title: 'Rezervujte si termín online',
          hero_subtitle: 'MVDr. Lucia Friedlaenderová - profesionální péče o vaše mazlíčky',
          STAFF: 'Veterinář',
          STAFF_PLURAL: 'Veterináři',
          CLIENT: 'Majitel zvířete',
          ADMIN: 'Správce',
          SLOT: 'Termín',
          RESERVATION: 'Rezervace',
          SERVICE_SUBJECT: 'Mazlíček',
          pet_name: 'Jméno zvířete',
          pet_type: 'Druh zvířete',
          pet_breed: 'Plemeno',
          pet_age: 'Věk zvířete',
          client_name: 'Vaše jméno',
          client_phone: 'Telefonní číslo',
          client_email: 'Email',
          book_appointment: '🐾 Rezervovat termín',
          cancel_appointment: 'Zrušit rezervaci',
          view_appointments: 'Moje rezervace',
          emergency_call: '🚨 Pohotovost',
          service_types: {
            basic_exam: 'Základní vyšetření',
            vaccination: 'Očkování',
            surgery: 'Chirurgický zákrok',
            dental: 'Zubní ošetření',
            emergency: 'Akutní ošetření',
            castration: 'Kastrace',
            ultrasound: 'Ultrazvuk',
            xray: 'RTG vyšetření',
            lab_tests: 'Laboratorní vyšetření',
            microchip: 'Čipování',
            passport: 'Vystavení pasu',
            dermatology: 'Dermatologie',
            ophthalmology: 'Oftalmologie',
            orthopedics: 'Ortopedie',
            cardiology: 'Kardiologie'
          },
          opening_hours: 'Ordinační hodiny',
          emergency_contact: 'Pohotovost',
          pet_health_info: 'Zdravotní informace',
          vaccination_history: 'Historie očkování',
          hero_box_1: '📅 Online rezervace',
          hero_box_2: '🏥 Moderní vybavení',
          hero_box_3: '🐕 Všechna zvířata',
          hero_box_4: '❤️ Individuální přístup',
          login: {
            title: 'Přihlášení pro majitele zvířat',
            subtitle: 'Přihlaste se rychle a bezpečně pomocí Google účtu',
            security_title: 'Bezpečné přihlášení',
            security_description: 'Používáme Google OAuth pro bezpečné a rychlé přihlášení. Vaše hesla neukládáme.',
            google_button: 'Přihlásit se přes Google',
            loading: 'Přihlašování...',
            error: 'Chyba při přihlašování přes Google',
            terms: 'Přihlášením souhlasíte s našimi podmínkami použití a zásadami ochrany osobních údajů.',
            staff_question: 'Jste veterinář?',
            staff_link: 'Přihlaste se zde →'
          },
          team_portal: {
            title: 'Týmový portál',
            subtitle: 'Přihlášení pro {{STAFF_PLURAL}} a administrátory',
            info_title: 'Pouze pro zaměstnance',
            info_description: 'Použijte své pracovní přihlašovací údaje do systému ordinace.',
            username_label: 'Uživatelské jméno',
            username_placeholder: 'jmeno.prijmeni',
            password_label: 'Heslo',
            password_placeholder: 'Vaše pracovní heslo',
            sign_in_button: 'Přihlásit se do portálu',
            signing_in: 'Přihlašování...',
            error_invalid_credentials: 'Neplatné přihlašovací údaje',
            error_login: 'Chyba při přihlašování',
            support_text: 'Máte potíže s přihlášením? Kontaktujte administrátora.',
            client_question: 'Jste klient?',
            client_link: 'Přihlaste se zde →',
            loading: 'Načítám...'
          },
          how_it_works: {
            hero: {
              title: 'Jak funguje náš rezervační systém?',
              subtitle: 'Jednoduché kroky k rychlé a pohodlné rezervaci veterinární péče'
            },
            steps_title: '5 jednoduchých kroků',
            steps_subtitle: 'Od přihlášení po návštěvu ordinace - celý proces je navržen pro vaše pohodlí',
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
                title: 'Výběr služby',
                description: 'Vyberte typ vyšetření nebo ošetření pro vašeho mazlíčka',
                icon: '🏥',
                details: [
                  'Preventivní prohlídky',
                  'Očkování a odčervení',
                  'Specializovaná vyšetření',
                  'Chirurgické zákroky'
                ]
              },
              {
                title: 'Výběr termínu',
                description: 'Najděte si vyhovující termín v našem kalendáři',
                icon: '📅',
                details: [
                  'Reálný kalendář dostupnosti',
                  'Filtrování podle veterináře',
                  'Zobrazení délky vyšetření'
                ]
              },
              {
                title: 'Rezervace',
                description: 'Vyplňte informace o vašem mazlíčkovi a potvrďte rezervaci',
                icon: '🐾',
                details: [
                  'Druh a jméno zvířete',
                  'Důvod návštěvy',
                  'Okamžité potvrzení rezervace'
                ]
              },
              {
                title: 'Návštěva',
                description: 'Dostavte se v rezervovaný čas do naší ordinace',
                icon: '🏥',
                details: [
                  'Přijďte 10 minut předem',
                  'Vezměte očkovací průkaz',
                  'Profesionální péče o vašeho mazlíčka'
                ]
              }
            ],
            benefits_title: 'Proč si vybrat online rezervace?',
            benefits_subtitle: 'Náš rezervační systém přináší mnoho výhod pro vás i vaše mazlíčky',
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
                description: 'Připomeneme vám blížící se návštěvu'
              },
              {
                icon: '📋',
                title: 'Historie návštěv',
                description: 'Kompletní přehled ošetření a očkování'
              },
              {
                icon: '🏥',
                title: 'Moderní vybavení',
                description: 'RTG, ultrazvuk, laboratoř přímo v ordinaci'
              },
              {
                icon: '❤️',
                title: 'Individuální přístup',
                description: 'Každý mazlíček je pro nás jedinečný'
              }
            ],
            cta: {
              title: 'Připraveni se objednat?',
              description: 'Rezervace termínu trvá jen pár minut. Váš mazlíček si zaslouží tu nejlepší péči.',
              button_primary: '🐾 Rezervovat termín',
              button_secondary: 'Zpět na hlavní stránku'
            },
            faq_title: 'Často kladené otázky',
            faq: [
              {
                question: 'Mohu rezervaci zrušit nebo změnit?',
                answer: 'Ano, rezervace můžete upravit nebo zrušit až do 24 hodin před termínem. Stačí se přihlásit do svého účtu.'
              },
              {
                question: 'Co když potřebuji akutní ošetření?',
                answer: 'Pro akutní případy volejte naši ordinaci na číslo 571 118 622 nebo mobil 721 049 699.'
              },
              {
                question: 'Jaké doklady mám vzít s sebou?',
                answer: 'Vezměte prosím očkovací průkaz zvířete, případně předchozí lékařské zprávy. Pro první návštěvu doporučujeme vzít i doklad totožnosti.'
              },
              {
                question: 'Přijímáte všechny druhy zvířat?',
                answer: 'Specializujeme se na psy, kočky, králíky a drobné savce. Pro exotická zvířata doporučíme specializovaného kolegu.'
              },
              {
                question: 'Kde vás najdu?',
                answer: 'Nacházíme se na adrese Středová 5668, 760 05 Zlín. K dispozici je parkoviště přímo před ordinací.'
              },
              {
                question: 'Jaké jsou ordinační hodiny?',
                answer: 'Aktuální ordinační hodiny najdete na našem webu www.veterina-svahy.cz nebo volejte na 571 118 622.'
              }
            ]
          }
        },
        messages: {
          reservation_confirmed: 'Vaše rezervace byla potvrzena',
          reservation_cancelled: 'Rezervace byla zrušena',
          reminder: 'Připomínka návštěvy zítra v {{time}}',
          thank_you: 'Děkujeme za návštěvu!',
          new_reservation: 'Nová rezervace vyžaduje pozornost',
          vaccination_reminder: 'Blíží se termín přeočkování vašeho mazlíčka'
        },
        emailTemplates: {
          reservation_created: {
            subject: 'Potvrzení rezervace - Veterina Svahy - {{date}}',
            body: `
              <h2>Vaše rezervace byla přijata</h2>
              <p>Dobrý den {{client_name}},</p>
              <p>potvrzujeme Vaši rezervaci na termín:</p>
              <ul>
                <li><strong>Datum a čas:</strong> {{date}} v {{time}}</li>
                <li><strong>Veterinář:</strong> {{doctor_name}}</li>
                <li><strong>Zvíře:</strong> {{pet_name}}</li>
                <li><strong>Typ vyšetření:</strong> {{service_type}}</li>
              </ul>
              <p>Prosíme o příchod 10 minut před termínem.</p>
              <p>Nezapomeňte vzít s sebou očkovací průkaz.</p>
              <p>V případě potřeby změny termínu nás prosím kontaktujte na tel: 571 118 622 nebo 721 049 699.</p>
              <hr>
              <p><strong>Veterina Svahy</strong><br>
              MVDr. Lucia Friedlaenderová<br>
              Středová 5668, 760 05 Zlín<br>
              Tel: 571 118 622, Mobil: 721 049 699<br>
              Email: veterina-svahy@email.cz<br>
              Web: www.veterina-svahy.cz</p>
            `
          },
          reservation_reminder: {
            subject: 'Připomínka návštěvy - Veterina Svahy - {{date}}',
            body: `
              <h2>Připomínka zítřejší návštěvy</h2>
              <p>Dobrý den {{client_name}},</p>
              <p>připomínáme Vaši rezervaci na zítra:</p>
              <ul>
                <li><strong>Datum a čas:</strong> {{date}} v {{time}}</li>
                <li><strong>Veterinář:</strong> {{doctor_name}}</li>
                <li><strong>Zvíře:</strong> {{pet_name}}</li>
                <li><strong>Typ vyšetření:</strong> {{service_type}}</li>
              </ul>
              <p>Prosíme o příchod 10 minut předem a nezapomeňte očkovací průkaz.</p>
              <p>Těšíme se na vás!</p>
              <hr>
              <p><strong>Veterina Svahy</strong><br>
              MVDr. Lucia Friedlaenderová<br>
              Středová 5668, 760 05 Zlín<br>
              Tel: 571 118 622, Mobil: 721 049 699</p>
            `
          },
          reservation_cancelled: {
            subject: 'Potvrzení zrušení rezervace - Veterina Svahy',
            body: `
              <h2>Vaše rezervace byla zrušena</h2>
              <p>Dobrý den {{client_name}},</p>
              <p>potvrzujeme zrušení Vaší rezervace:</p>
              <ul>
                <li><strong>Datum a čas:</strong> {{date}} v {{time}}</li>
                <li><strong>Veterinář:</strong> {{doctor_name}}</li>
                <li><strong>Zvíře:</strong> {{pet_name}}</li>
              </ul>
              <p>Pokud budete chtít vytvořit novou rezervaci, můžete tak učinit na našem webu nebo telefonicky.</p>
              <hr>
              <p><strong>Veterina Svahy</strong><br>
              Tel: 571 118 622, Mobil: 721 049 699<br>
              Email: veterina-svahy@email.cz<br>
              Web: www.veterina-svahy.cz</p>
            `
          }
        },
        colorScheme: {
          primary: '#f97316',
          secondary: '#fb923c',
          accent: '#ea580c',
          neutral: '#6b7280',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          background: '#fff7ed'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          headingFont: 'Inter, sans-serif'
        },
        features: [
          'reservations',
          'pet_management',
          'medical_history',
          'vaccination_reminders',
          'emergency_contact',
          'lab_results',
          'prescription_management',
          'online_medical_records',
          'appointment_history'
        ]
      }
    });

    console.log('✅ Veterinární template pro Svahy vytvořen/aktualizován');

    // 2. Aktualizace tenanta Svahy s content daty
    const svahyTenant = await prisma.tenant.update({
      where: { slug: 'veterina-svahy' },
      data: {
        contentTemplateId: veterinaryTemplate.id,
        subdomain: 'veterina-svahy',
        contentData: {
          // Tenant-specific overrides
          contact: {
            phone: '+420 721 049 699',  // Mobilní číslo pro hlavičku webu
            landline: '+420 571 118 622',  // Pevná linka
            mobile: '+420 721 049 699',
            email: 'veterina-svahy@email.cz',
            address: 'Středová 5668, 760 05 Zlín',
            web: 'www.veterina-svahy.cz'
          },
          owner: {
            name: 'MVDr. Lucia Friedlaenderová',
            title: 'Hlavní veterinářka a majitelka ordinace'
          },
          social: {
            facebook: 'https://www.facebook.com/people/Veterina-Svahy/100049515202415/'
          },
          branding: {
            logoUrl: '/images/tenants/svahy/logo.png',
            logoAlt: 'Veterina Svahy - MVDr. Lucia Friedlaenderová',
            favicon: '/images/tenants/svahy/favicon.ico',
            logoWidth: 60,
            logoHeight: 60
          },
          openingHours: {
            monday: '8-11 15-18',
            tuesday: '8-11 15-18',
            wednesday: '8-14',
            thursday: '8-11 15-18',
            friday: '8-11 15-18',
            saturday: '9-11',
            sunday: 'Ne, svátky zavřeno'
          },
          additionalInfo: {
            parkingInfo: 'Parkování zdarma přímo před ordinací',
            publicTransport: 'MHD zastávka Středová - 2 minuty pěšky',
            accessibilityInfo: 'Bezbariérový přístup do ordinace',
            paymentMethods: 'Hotově, kartou, převodem',
            insurance: 'Přímá platba pojišťovnám'
          },
          services: {
            emergency: {
              available: true,
              phone: '+420 721 049 699',
              description: 'V akutních případech volejte na mobilní číslo'
            },
            homeVisits: {
              available: true,
              description: 'Návštěvy u vás doma po předchozí domluvě'
            },
            specializations: [
              'Chirurgie měkkých tkání',
              'Stomatologie',
              'Dermatologie',
              'Interní medicína',
              'Preventivní péče'
            ]
          }
        },
        customStyles: {
          // Vlastní styly pro tento tenant
          logoPosition: 'left',
          heroGradient: 'from-orange-400 to-orange-600',
          borderRadius: 'rounded-lg',
          cardStyle: 'shadow-md hover:shadow-lg transition-shadow',
          headerStyle: 'bg-white/95 backdrop-blur-sm',
          buttonStyle: 'rounded-lg font-medium',
          primaryButtonClass: 'bg-orange-500 hover:bg-orange-600 text-white',
          secondaryButtonClass: 'border-2 border-white text-white hover:bg-white hover:text-orange-500 transition-colors'
        },
        enabledFeatures: [
          'reservations',
          'pet_profiles',
          'vaccination_tracking',
          'medical_history',
          'emergency_booking',
          'online_payments',
          'sms_reminders',
          'email_notifications',
          'loyalty_program',
          'prescription_management',
          'lab_results_portal'
        ]
      }
    });

    console.log('✅ Tenant Sváhy aktualizován s kompletními content daty');
    
    console.log(`
🎉 Content konfigurace pro tenant "Sváhy" úspěšně vytvořena!

📋 Shrnutí:
- Template: veterinary_svahy
- Název: Veterina Svahy
- Majitelka: MVDr. Lucia Friedlaenderová
- Adresa: Středová 5668, 760 05 Zlín
- Telefon: 571 118 622
- Mobil: 721 049 699
- Email: veterina-svahy@email.cz
- Web: www.veterina-svahy.cz

🎨 Vizuální identita:
- Primární barva: Orange (#f97316)
- Sekundární barva: Orange-400 (#fb923c)
- Gradient: from-orange-400 to-orange-600

✅ Aktivní funkce:
- Online rezervace
- Správa profilů mazlíčků
- Sledování očkování
- Historie ošetření
- SMS a email notifikace
- Online platby
- Věrnostní program

📝 Poznámka:
Tento seed respektuje existující produkční data a používá upsert operace.
`);

  } catch (error) {
    console.error('❌ Chyba při konfiguraci content dat pro Svahy:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedSvahyContent().catch((e) => {
  console.error('❌ Kritická chyba:', e);
  process.exit(1);
});