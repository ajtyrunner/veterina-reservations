'use client'

import Link from 'next/link'
import { useContent } from '../../lib/content-context'

export default function HowItWorksWithContent() {
  const { t, colors, content, loading } = useContent()
  
  // Načtení dat z content systému - přímo z labels
  const howItWorks = content?.labels?.how_it_works || {}
  
  // Debug log
  console.log('Content data:', {
    slug: content?.slug,
    hasHowItWorks: !!content?.labels?.how_it_works,
    howItWorksKeys: Object.keys(howItWorks)
  })
  
  // Pokud se content načítá, zobrazíme loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-80 bg-gray-200"></div>
        <div className="container mx-auto px-4 py-20">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-16"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  // Fallback data pro případ, že content není k dispozici
  const isAgility = content?.slug === 'agility-nikol'
  
  const defaultSteps = isAgility ? [
    {
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
      title: "Výběr tréninku",
      description: "Vyberte druh tréninku pro vašeho psa",
      icon: "🎯",
      details: [
        "Agility pro začátečníky i pokročilé",
        "Pasení ovcí pro pastevecká plemena",
        "Individuální lekce na míru"
      ]
    },
    {
      title: "Výběr termínu",
      description: "Najděte si vyhovující termín v kalendáři",
      icon: "📅",
      details: [
        "Reálný kalendář dostupnosti",
        "Filtrování podle trenéra",
        "Zobrazení detailů termínů"
      ]
    },
    {
      title: "Rezervace",
      description: "Vyplňte informace o vašem psovi a potvrďte rezervaci",
      icon: "🐕",
      details: [
        "Jméno a plemeno psa",
        "Úroveň zkušeností",
        "Okamžité potvrzení rezervace"
      ]
    },
    {
      title: "Trénink",
      description: "Dostavte se v rezervovaný čas na tréninkové hřiště",
      icon: "🏃",
      details: [
        "Přijďte 10 minut před tréninkem",
        "Vezměte si vodu pro psa",
        "Profesionální vedení tréninku"
      ]
    }
  ] : [
    {
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
      title: "Výběr služby",
      description: "Vyberte druh služby pro vašeho mazlíčka",
      icon: "⚕️",
      details: [
        "Základní vyšetření a preventivní péče",
        "Specializované zákroky",
        "Diagnostické služby"
      ]
    },
    {
      title: "Výběr termínu",
      description: "Najděte si vyhovující termín v kalendáři",
      icon: "📅",
      details: [
        "Reálný kalendář dostupnosti",
        "Filtrování podle doktora",
        "Zobrazení detailů termínů"
      ]
    },
    {
      title: "Rezervace",
      description: "Vyplňte informace a potvrďte rezervaci",
      icon: "🐾",
      details: [
        "Jméno a druh zvířete",
        "Popis problému",
        "Okamžité potvrzení"
      ]
    },
    {
      title: "Návštěva",
      description: "Dostavte se v rezervovaný čas",
      icon: "🏥",
      details: [
        "Přijďte 5 minut předem",
        "Vezměte si průkaz zvířete",
        "Profesionální péče"
      ]
    }
  ]
  
  const steps = howItWorks?.steps || defaultSteps
  const benefits = howItWorks?.benefits || []
  const faq = howItWorks?.faq || []
  
  // Styly s tenant barvami - použít fallback dokud se nenačtou
  const primaryColor = colors.primary || '#6b7280'
  const secondaryColor = colors.secondary || primaryColor
  
  const gradientStyle = {
    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
  }
  
  const primaryButtonStyle = {
    backgroundColor: 'white',
    color: primaryColor
  }
  
  const secondaryButtonStyle = {
    borderColor: 'white',
    color: 'white'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero sekce */}
      <div className="text-white py-20" style={gradientStyle}>
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            {howItWorks?.hero?.title || 'Jak funguje náš rezervační systém?'}
          </h1>
          <p className="text-xl lg:text-2xl opacity-90 max-w-3xl mx-auto">
            {howItWorks?.hero?.subtitle || 'Jednoduché kroky k rychlé a pohodlné rezervaci'}
          </p>
        </div>
      </div>

      {/* Kroky procesu */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {howItWorks?.steps_title || '5 jednoduchých kroků'}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {howItWorks?.steps_subtitle || 'Od přihlášení po návštěvu - celý proces je navržen pro vaše pohodlí'}
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div 
              className="hidden lg:block absolute top-20 left-0 right-0 h-0.5" 
              style={{ backgroundColor: primaryColor + '33' }}
            ></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {steps.map((step: any, index: number) => (
                <div key={index} className="relative">
                  {/* Step number circle */}
                  <div className="flex justify-center mb-6">
                    <div 
                      className="w-16 h-16 text-white rounded-full flex items-center justify-center text-2xl font-bold relative z-10"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Step content */}
                  <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <div className="text-4xl mb-4">{step.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    
                    {step.details && (
                      <ul className="text-sm text-gray-500 space-y-1">
                        {step.details.map((detail: string, detailIndex: number) => (
                          <li key={detailIndex} className="flex items-center">
                            <svg 
                              className="w-4 h-4 mr-2 flex-shrink-0" 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                              style={{ color: colors.success || '#22c55e' }}
                            >
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Výhody */}
      {benefits.length > 0 && (
        <div className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {howItWorks?.benefits_title || 'Proč si vybrat online rezervace?'}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {howItWorks?.benefits_subtitle || 'Náš rezervační systém přináší mnoho výhod'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit: any, index: number) => (
                <div key={index} className="text-center p-6">
                  <div className="text-5xl mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Call to action */}
      <div className="py-20" style={gradientStyle}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            {howItWorks?.cta?.title || 'Připraveni začít?'}
          </h2>
          <p className="text-xl text-white opacity-90 mb-8 max-w-2xl mx-auto">
            {howItWorks?.cta?.description || 'Rezervace termínu trvá jen pár minut.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:opacity-90"
              style={primaryButtonStyle}
            >
              {howItWorks?.cta?.button_primary || '🐾 Rezervovat termín'}
            </Link>
            <Link
              href="/"
              className="border-2 px-8 py-4 rounded-lg text-lg font-semibold transition-colors hover:bg-white"
              style={secondaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.color = primaryColor
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'white'
              }}
            >
              {howItWorks?.cta?.button_secondary || 'Zpět na hlavní stránku'}
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ sekce */}
      {faq.length > 0 && (
        <div className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {howItWorks?.faq_title || 'Často kladené otázky'}
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              {faq.map((item: any, index: number) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {item.question}
                  </h3>
                  <p className="text-gray-600">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}