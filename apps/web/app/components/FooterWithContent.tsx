'use client'

import Link from 'next/link'
import { useContent } from '../../lib/content-context'

export default function FooterWithContent() {
  const { content, t, colors } = useContent()
  const currentYear = new Date().getFullYear()

  // Dynamické služby podle typu businessu
  const services = content?.slug === 'agility-nikol' ? [
    { icon: '🏃', name: 'Agility tréninky' },
    { icon: '🐑', name: 'Pasení ovcí' },
    { icon: '🎯', name: 'Individuální lekce' },
    { icon: '🏆', name: 'Příprava na závody' },
    { icon: '🌳', name: 'Venkovní aktivity' }
  ] : [
    { icon: '🔍', name: 'Základní vyšetření' },
    { icon: '💉', name: 'Očkování' },
    { icon: '🏥', name: 'Chirurgické zákroky' },
    { icon: '📸', name: 'RTG vyšetření' },
    { icon: '🦷', name: 'Dentální péče' }
  ]

  const linkStyle = {
    color: colors.primary
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Hlavní info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">
                {content?.slug === 'agility-nikol' ? '🐕' : '🏥'}
              </span>
              <h3 className="text-xl font-bold" style={linkStyle}>
                {t('app_name', 'Slotnito')}
              </h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {content?.slug === 'agility-nikol' 
                ? 'Profesionální tréninky agility a pasení pro vás a vašeho psa. Rezervujte si termín online.'
                : 'Inteligentní rezervační systém pro efektivní správu termínů. Rezervujte si čas rychle a jednoduše.'}
            </p>
            <div className="flex space-x-4">
              {content?.customContent?.contact?.email && (
                <a 
                  href={`mailto:${content.customContent.contact.email}`}
                  className="text-gray-400 transition-colors hover:opacity-80"
                  title="Email"
                  style={{ ':hover': linkStyle }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                </a>
              )}
              {content?.customContent?.social?.facebook && (
                <a 
                  href={content.customContent.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:opacity-80"
                  title="Facebook"
                  style={{ ':hover': linkStyle }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {content?.customContent?.social?.instagram && (
                <a 
                  href={`https://instagram.com/${content.customContent.social.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:opacity-80"
                  title="Instagram"
                  style={{ ':hover': linkStyle }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Rychlé odkazy */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold" style={linkStyle}>Rychlé odkazy</h4>
            <nav className="space-y-2">
              <Link 
                href="/" 
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                🏠 Domů
              </Link>
              <Link 
                href="/rezervace" 
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                📅 {t('view_appointments', t('view_trainings', 'Rezervace'))}
              </Link>
              <Link 
                href="/jak-to-funguje" 
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                ❓ Jak to funguje
              </Link>
              <Link 
                href="/login" 
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                🔐 Přihlášení
              </Link>
            </nav>
          </div>

          {/* Služby */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold" style={linkStyle}>Naše služby</h4>
            <div className="space-y-2 text-sm text-gray-300">
              {services.map((service, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span>{service.icon}</span>
                  <span>{service.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kontakt */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold" style={linkStyle}>Kontakt</h4>
            <div className="space-y-3 text-sm text-gray-300">
              {content?.customContent?.contact?.email && (
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={linkStyle}>
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  <div>
                    <a 
                      href={`mailto:${content.customContent.contact.email}`}
                      className="hover:text-white transition-colors"
                    >
                      {content.customContent.contact.email}
                    </a>
                  </div>
                </div>
              )}

              {content?.customContent?.contact?.phone && (
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={linkStyle}>
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                  <div>
                    <a 
                      href={`tel:${content.customContent.contact.phone.replace(/\s/g, '')}`}
                      className="hover:text-white transition-colors"
                    >
                      {content.customContent.contact.phone}
                    </a>
                  </div>
                </div>
              )}

              {content?.customContent?.contact?.address && (
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={linkStyle}>
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                  <div>{content.customContent.contact.address}</div>
                </div>
              )}

              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={linkStyle}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                <div>
                  <div>Systém dostupný 24/7</div>
                  <div>Rezervace kdykoliv online</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spodní část */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              © {currentYear} {t('app_name', 'Slotnito')}. Všechna práva vyhrazena.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link 
                href="/privacy" 
                className="hover:text-white transition-colors"
              >
                Ochrana osobních údajů
              </Link>
              <Link 
                href="/terms" 
                className="hover:text-white transition-colors"
              >
                Obchodní podmínky
              </Link>
              <div className="flex items-center space-x-1">
                <span>Vytvořeno s</span>
                <span className="text-red-400">❤️</span>
                <span>pomocí</span>
                <a 
                  href="mailto:koppito.solutions@gmail.com"
                  className="hover:opacity-80 transition-opacity font-medium"
                  style={linkStyle}
                >
                  Slotnito
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}