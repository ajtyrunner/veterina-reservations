import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSvahyTenant() {
  console.log('🔧 Aktualizace tenanta Svahy...');

  try {
    // 1. Zkontroluj, zda existuje veterinární template
    let veterinaryTemplate = await prisma.contentTemplate.findUnique({
      where: { name: 'veterinary' }
    });

    // 2. Pokud neexistuje, vytvoř ho
    if (!veterinaryTemplate) {
      console.log('📝 Vytváření veterinárního content template...');
      
      veterinaryTemplate = await prisma.contentTemplate.create({
        data: {
          name: 'veterinary',
          displayName: 'Veterinární ordinace',
          category: 'healthcare',
          labels: {
            // Základní texty
            app_name: 'Veterinární ordinace',
            hero_title: 'Rezervujte si termín online',
            hero_subtitle: 'Jednoduché a rychlé rezervace veterinárních služeb přímo z pohodlí domova',
            
            // Role
            STAFF: 'Veterinář',
            STAFF_PLURAL: 'Veterináři',
            CLIENT: 'Majitel zvířete',
            ADMIN: 'Správce',
            
            // Entity
            SLOT: 'Termín',
            RESERVATION: 'Rezervace',
            SERVICE_SUBJECT: 'Zvíře',
            
            // Formulářové pole
            pet_name: 'Jméno zvířete',
            pet_type: 'Druh zvířete',
            client_name: 'Vaše jméno',
            client_phone: 'Telefonní číslo',
            
            // Akce
            book_appointment: '🐾 Rezervovat termín',
            cancel_appointment: 'Zrušit rezervaci',
            view_appointments: 'Moje rezervace',
            
            // Typy služeb
            service_types: {
              basic_exam: 'Základní vyšetření',
              vaccination: 'Očkování',
              surgery: 'Chirurgický zákrok',
              dental: 'Zubní ošetření',
              emergency: 'Akutní ošetření'
            },
            
            // Specifické texty
            opening_hours: 'Ordinační hodiny',
            emergency_contact: 'Pohotovost',
            pet_health_info: 'Zdravotní informace',
            
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
              support_text: 'Máte potíže s přihlášením? Kontaktujte IT podporu.',
              client_question: 'Jste klient?',
              client_link: 'Přihlaste se zde →',
              loading: 'Načítám...'
            }
          },
          messages: {
            // Zprávy a notifikace
            reservation_confirmed: 'Vaše rezervace byla potvrzena',
            reservation_cancelled: 'Rezervace byla zrušena',
            reminder: 'Připomínka návštěvy zítra v {{time}}',
            thank_you: 'Děkujeme za návštěvu!',
            new_reservation: 'Nová rezervace vyžaduje pozornost'
          },
          emailTemplates: {
            reservation_created: {
              subject: 'Potvrzení rezervace - {{date}}',
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
                <p>V případě potřeby změny termínu nás prosím kontaktujte.</p>
                <p>S pozdravem,<br>Tým veterinární ordinace</p>
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
            'emergency_contact'
          ]
        }
      });
      
      console.log('✅ Veterinární template vytvořen');
    }

    // 3. Aktualizuj tenant Svahy
    const updatedTenant = await prisma.tenant.update({
      where: { slug: 'svahy' },
      data: {
        contentTemplateId: veterinaryTemplate.id,
        subdomain: 'veterina-svahy',
        primaryColor: '#f97316', // Orange pro veterinu
        secondaryColor: '#fb923c'
      }
    });

    console.log('✅ Tenant Svahy aktualizován s veterinárním template');
    console.log('📋 Detaily:');
    console.log(`- Subdoména: ${updatedTenant.subdomain}`);
    console.log(`- Template: ${veterinaryTemplate.displayName}`);
    console.log(`- Primární barva: ${updatedTenant.primaryColor}`);

  } catch (error) {
    console.error('❌ Chyba při aktualizaci:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSvahyTenant().catch((e) => {
  console.error('❌ Kritická chyba:', e);
  process.exit(1);
});