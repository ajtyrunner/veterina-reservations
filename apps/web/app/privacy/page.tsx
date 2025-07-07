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
              6. Cookies a sledovací technologie
            </h2>
            <p className="leading-relaxed mb-4">
              Náš web používá cookies a podobné technologie pro zlepšení vašeho zážitku a analýzu používání.
            </p>
            
            <div className="space-y-4">
              <div className="border-l-4 border-orange-500 pl-4 bg-orange-50 p-4 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Nutné cookies</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Tyto cookies jsou nezbytné pro základní funkčnost webu a nelze je vypnout.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Přihlašovací tokeny (next-auth.session-token)</li>
                  <li>• Bezpečnostní tokeny (next-auth.csrf-token)</li>
                  <li>• Nastavení cookies (cookie-consent)</li>
                  <li>• Jazykové preference</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Analytické cookies</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Používáme Google Analytics pro analýzu návštěvnosti a zlepšení uživatelského zážitku.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Poskytovatel:</strong> Google LLC</li>
                  <li>• <strong>Cookies:</strong> _ga, _ga_*, _gid</li>
                  <li>• <strong>Účel:</strong> Anonymní analýza návštěvnosti</li>
                  <li>• <strong>Doba uchování:</strong> 26 měsíců</li>
                  <li>• <strong>Tracking ID:</strong> G-9L3Q6MQVS5</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  Data jsou zpracovávána v souladu s 
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline ml-1">
                    Google Privacy Policy
                  </a>
                </p>
              </div>

              <div className="border-l-4 border-gray-400 pl-4 bg-gray-50 p-4 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Marketingové cookies</h3>
                <p className="text-sm text-gray-700">
                  Momentálně nepoužíváme žádné marketingové nebo reklamní cookies.
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Správa cookies</h4>
              <p className="text-sm text-gray-700 mb-2">
                Můžete spravovat své preference cookies pomocí banneru na našem webu nebo 
                v nastavení vašeho prohlížeče.
              </p>
              <p className="text-xs text-gray-600">
                Vypnutí cookies může ovlivnit funkčnost některých částí webu.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Kontakt
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
              8. Změny těchto zásad
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