import Link from 'next/link'

export default function HowItWorksPage() {
  const steps = [
    {
      number: 1,
      title: "Přihlášení",
      description: "Přihlaste se rychle a bezpečně pomocí svého Google účtu",
      icon: "🔐",
      details: [
        "Žádné další hesla k zapamatování",
        "Bezpečné OAuth přihlášení",
        "Okamžitý přístup k rezervacím"
      ]
    },
    {
      number: 2,
      title: "Výběr služby",
      description: "Vyberte druh veterinární služby pro vašeho mazlíčka",
      icon: "⚕️",
      details: [
        "Základní vyšetření a preventivní péče",
        "Specializované zákroky a operace",
        "Diagnostické služby (RTG, ultrazvuk)"
      ]
    },
    {
      number: 3,
      title: "Výběr termínu",
      description: "Najděte si vyhovující termín v kalendáři dostupných slotů",
      icon: "📅",
      details: [
        "Reálný kalendář dostupnosti",
        "Filtrování podle veterináře",
        "Zobrazení detailů termínů"
      ]
    },
    {
      number: 4,
      title: "Rezervace",
      description: "Vyplňte informace o vašem zvířeti a potvrďte rezervaci",
      icon: "🐾",
      details: [
        "Jméno a druh zvířete",
        "Popis problému nebo důvod návštěvy",
        "Okamžité potvrzení rezervace"
      ]
    },
    {
      number: 5,
      title: "Návštěva",
      description: "Dostavte se v rezervovaný čas do ordinace",
      icon: "🏥",
      details: [
        "Přijďte 5 minut před termínem",
        "Vezměte si průkaz zvířete",
        "Profesionální veterinární péče"
      ]
    }
  ]

  const benefits = [
    {
      icon: "⏰",
      title: "Úspora času",
      description: "Žádné čekání na telefonu nebo ve frontě"
    },
    {
      icon: "📱",
      title: "Dostupnost 24/7",
      description: "Rezervujte si termín kdykoliv, odkudkoliv"
    },
    {
      icon: "🔔",
      title: "Automatické připomínky",
      description: "Budeme vás informovat o blížícím se termínu"
    },
    {
      icon: "📋",
      title: "Elektronická zdravotní karta",
      description: "Kompletní historie návštěv a léčby vašeho mazlíčka"
    },
    {
      icon: "👨‍⚕️",
      title: "Kvalifikovaní veterináři",
      description: "Tým zkušených a specializovaných veterinářů"
    },
    {
      icon: "🏆",
      title: "Moderní vybavení",
      description: "Nejnovější technologie pro péči o zvířata"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero sekce */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Jak funguje naš rezervační systém?
          </h1>
          <p className="text-xl lg:text-2xl text-orange-100 max-w-3xl mx-auto">
            Jednoduché kroky k rychlé a pohodlné rezervaci veterinárních služeb
          </p>
        </div>
      </div>

      {/* Kroky procesu */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              5 jednoduchých kroků
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Od přihlášení po návštěvu ordinace - celý proces je navržen pro vaše pohodlí
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-orange-200"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  {/* Step number circle */}
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold relative z-10">
                      {step.number}
                    </div>
                  </div>
                  
                  {/* Step content */}
                  <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <div className="text-4xl mb-4">{step.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    
                    <ul className="text-sm text-gray-500 space-y-1">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Výhody */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Proč si vybrat online rezervace?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Naše rezervační systém přináší mnoho výhod pro vás i vaše mazlíčky
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="py-20 bg-gradient-to-r from-orange-400 to-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Připraveni začít?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Rezervace termínu trvá jen pár minut. Vaše zvířata si zaslouží tu nejlepší péči.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-white text-orange-500 hover:bg-orange-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
            >
              🐾 Rezervovat termín
            </Link>
            <Link
              href="/"
              className="border-2 border-white text-white hover:bg-white hover:text-orange-500 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Zpět na hlavní stránku
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ sekce */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Často kladené otázky
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Mohu rezervaci zrušit nebo změnit?
              </h3>
              <p className="text-gray-600">
                Ano, rezervace můžete upravit nebo zrušit až do 2 hodin před termínem. Stačí se přihlásit do svého účtu.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Co když se opozdím na termín?
              </h3>
              <p className="text-gray-600">
                Doporučujeme dorazit 5 minut před termínem. Při zpoždění větším než 15 minut může být termín přesunut.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Jak funguje platba za služby?
              </h3>
              <p className="text-gray-600">
                Platba se provádí přímo v ordinaci po poskytnutí služby. Přijímáme hotovost i karty.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Potřebuji Google účet pro rezervaci?
              </h3>
              <p className="text-gray-600">
                Ano, pro přihlášení používáme Google účet z bezpečnostních důvodů. Je to rychlé a bezpečné.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 