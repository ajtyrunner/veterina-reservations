'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function CiselnikLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const tabs = [
    { name: 'Ordinace', href: '/ciselnik/ordinace', icon: '🏥' },
    { name: 'Druhy služeb', href: '/ciselnik/sluzby', icon: '⚕️' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Číselníky
        </h1>
        <p className="text-gray-600">
          Správa základních dat pro veterinární kliniku
        </p>
      </div>

      {/* Tab navigace */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                pathname === tab.href
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </div>
  )
} 