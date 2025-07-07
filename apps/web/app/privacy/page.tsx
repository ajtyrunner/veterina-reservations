import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ochrana osobních údajů | Veterinární rezervační systém',
  description: 'Informace o ochraně osobních údajů v rezervačním systému',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Ochrana osobních údajů
        </h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Úvod
            </h2>
            <p className="leading-relaxed">
              Provozovatel rezervačního systému respektuje vaše soukromí a zavazuje se chránit vaše osobní údaje. 
              Tyto zásady ochrany osobních údajů vysvětlují, jak shromažďujeme, používáme a chráníme 
              vaše informace při používání našeho rezervačního systému.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Shromažďované údaje
            </h2>
            <p className="leading-relaxed mb-3">
              Při používání našich služeb můžeme shromažďovat následující typy údajů:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Jméno a příjmení</li>
              <li>E-mailová adresa</li>
              <li>Telefonní číslo</li>
              <li>Informace o vašem domácím mazlíčkovi</li>
              <li>Údaje o rezervacích a návštěvách</li>
              <li>Technické údaje o používání webu</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Účel zpracování
            </h2>
            <p className="leading-relaxed mb-3">
              Vaše osobní údaje používáme pro:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Správu rezervací a termínů</li>
              <li>Komunikaci ohledně vašich návštěv</li>
              <li>Zlepšování našich služeb</li>
              <li>Splnění právních povinností</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. Zabezpečení údajů
            </h2>
            <p className="leading-relaxed">
              Implementujeme vhodná technická a organizační opatření k ochraně vašich osobních údajů 
              proti neoprávněnému přístupu, ztrátě, zničení nebo pozměnění.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Vaše práva
            </h2>
            <p className="leading-relaxed mb-3">
              Máte právo na:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Přístup k vašim osobním údajům</li>
              <li>Opravu nepřesných údajů</li>
              <li>Výmaz údajů</li>
              <li>Omezení zpracování</li>
              <li>Přenositelnost údajů</li>
              <li>Námitku proti zpracování</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. Kontakt
            </h2>
            <p className="leading-relaxed">
              Pokud máte jakékoliv dotazy ohledně ochrany osobních údajů, kontaktujte nás na:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">📧 Email: 
                <a href="mailto:koppito.solutions@gmail.com" className="text-orange-600 hover:text-orange-700 ml-1">
                  koppito.solutions@gmail.com
                </a>
              </p>
              <p className="font-medium mt-2">📞 Telefon: 
                <a href="tel:+420777123456" className="text-orange-600 hover:text-orange-700 ml-1">
                  +420 777 123 456
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Změny těchto zásad
            </h2>
            <p className="leading-relaxed">
              Tyto zásady ochrany osobních údajů můžeme čas od času aktualizovat. 
              O významných změnách vás budeme informovat prostřednictvím našeho webu.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Poslední aktualizace: {new Date().toLocaleDateString('cs-CZ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 