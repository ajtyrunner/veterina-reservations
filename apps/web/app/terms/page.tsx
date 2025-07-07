import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Obchodní podmínky | Veterinární rezervační systém',
  description: 'Obchodní podmínky pro používání rezervačního systému',
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Obchodní podmínky
        </h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Úvodní ustanovení
            </h2>
            <p className="leading-relaxed">
              Tyto obchodní podmínky upravují vzájemná práva a povinnosti mezi 
              provozovatelem rezervačního systému a uživateli systému. 
              Používáním našich služeb souhlasíte s těmito podmínkami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Poskytované služby
            </h2>
            <p className="leading-relaxed mb-3">
              Rezervační systém poskytuje následující služby:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Online rezervační systém pro veterinární ordinace</li>
              <li>Správu termínů a kalendáře</li>
              <li>Komunikaci mezi klienty a veterinárními ordinacemi</li>
              <li>Evidenci a správu rezervací</li>
              <li>Notifikace a připomínky</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Registrace a účet
            </h2>
            <p className="leading-relaxed mb-3">
              Pro používání služeb je nutné:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Poskytnout pravdivé a aktuální údaje</li>
              <li>Chránit přístupové údaje</li>
              <li>Nepředávat účet třetím stranám</li>
              <li>Informovat o změnách kontaktních údajů</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. Rezervace a zrušení
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900">Rezervace:</h3>
                <p className="leading-relaxed">
                  Rezervace je závazná po potvrzení veterinární ordinací. 
                  Klient se zavazuje dostavit se v stanovený čas.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Zrušení:</h3>
                <p className="leading-relaxed">
                  Rezervaci lze zrušit nejpozději 2 hodiny před stanoveným termínem. 
                  Pozdní zrušení nebo nedostavení se může být zpoplatněno.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Odpovědnost
            </h2>
            <p className="leading-relaxed mb-3">
              Provozovatel nenese odpovědnost za:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Kvalitu veterinárních služeb</li>
              <li>Škody způsobené třetími stranami</li>
              <li>Dočasné výpadky systému</li>
              <li>Ztrátu dat způsobenou technickými problémy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. Ceny a platby
            </h2>
            <p className="leading-relaxed">
              Služby rezervačního systému jsou poskytovány zdarma pro koncové uživatele. 
              Ceny veterinárních služeb stanovuje příslušná veterinární ordinace.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Ochrana dat
            </h2>
            <p className="leading-relaxed">
              Zpracování osobních údajů se řídí našimi zásadami ochrany osobních údajů 
              a platnou legislativou GDPR. Podrobnosti najdete v sekci 
              <a href="/privacy" className="text-orange-600 hover:text-orange-700 font-medium">
                Ochrana osobních údajů
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Ukončení služeb
            </h2>
            <p className="leading-relaxed">
              Uživatel může kdykoli ukončit používání služeb. Provozovatel si vyhrazuje 
              právo ukončit poskytování služeb při porušení těchto podmínek.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. Změny podmínek
            </h2>
            <p className="leading-relaxed">
              Tyto obchodní podmínky můžeme změnit. O změnách budeme informovat 
              prostřednictvím našeho webu nebo e-mailem.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              10. Kontakt a podpora
            </h2>
            <p className="leading-relaxed">
              Pro dotazy a technickou podporu nás kontaktujte:
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
              <p className="font-medium mt-2">🕐 Podpora: Po-Pá 8:00-18:00</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              11. Závěrečná ustanovení
            </h2>
            <p className="leading-relaxed">
              Tyto obchodní podmínky se řídí právním řádem České republiky. 
              Případné spory budou řešeny u příslušných soudů České republiky.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Platné od: {new Date().toLocaleDateString('cs-CZ')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Poslední aktualizace: {new Date().toLocaleDateString('cs-CZ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 