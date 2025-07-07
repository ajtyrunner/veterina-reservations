'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { getTenantSlugFromUrl } from '@/lib/tenant'
import CalendarView from './components/CalendarView'
import { formatDisplayTime, formatDisplayDate, isSameDayInTimezone } from '../lib/timezone'

interface Slot {
  id: string
  startTime: string
  endTime: string
  equipment?: string
  roomId?: string
  serviceTypeId?: string
  doctorId: string
  doctor: {
    specialization?: string
    user: {
      name: string
    }
  }
  room?: {
    id: string
    name: string
    description?: string
  }
  serviceType?: {
    id: string
    name: string
    description?: string
    duration: number
    color?: string
  }
}

interface Doctor {
  id: string
  specialization?: string
  user: {
    name: string
    image?: string
  }
}

interface ServiceType {
  id: string
  name: string
  description?: string
  duration: number
  color?: string
}

type NotificationType = 'success' | 'error' | 'info'

interface Notification {
  id: string
  type: NotificationType
  message: string
}

// Hero Component for non-authenticated users
function HeroSection() {
  return (
    <div className="relative bg-gradient-to-r from-orange-400 to-orange-500 text-white">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative container mx-auto px-4 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Rezervujte si termín 
              <span className="block text-orange-200">online</span>
            </h1>
            <p className="text-xl lg:text-2xl text-orange-100 leading-relaxed">
              Jednoduché a rychlé rezervace veterinárních služeb přímo z pohodlí domova
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="text-lg">Online rezervace 24/7</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="text-lg">Kvalifikovaní veterináři</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="text-lg">Moderní vybavení</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link
                href="/login"
                className="bg-white text-orange-500 hover:bg-orange-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg text-center"
              >
                🐾 Rezervovat termín
              </Link>
              <Link
                href="/jak-to-funguje"
                className="border-2 border-white text-white hover:bg-white hover:text-orange-500 px-8 py-4 rounded-lg text-lg font-semibold transition-colors text-center"
              >
                Jak to funguje?
              </Link>
            </div>
          </div>
          
          {/* Image/Illustration */}
          <div className="hidden lg:block">
            <div className="bg-white bg-opacity-20 rounded-2xl p-8 backdrop-blur-sm">
              <div className="text-center space-y-6">
                <div className="text-8xl">🏥</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl mb-2">📅</div>
                    <div>Online rezervace</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl mb-2">⏰</div>
                    <div>Flexibilní časy</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl mb-2">👨‍⚕️</div>
                    <div>Zkušení veterináři</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl mb-2">❤️</div>
                    <div>Péče o zvířata</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Services Section for non-authenticated users
function ServicesSection() {
  const services = [
    {
      icon: '🔍',
      name: 'Základní vyšetření',
      description: 'Rutinní kontrola zdravotního stavu'
    },
    {
      icon: '💉',
      name: 'Očkování',
      description: 'Preventivní očkování podle věku'
    },
    {
      icon: '🏥',
      name: 'Chirurgický zákrok',
      description: 'Operativní výkony'
    },
    {
      icon: '📸',
      name: 'RTG vyšetření',
      description: 'Rentgenové snímkování'
    },
    {
      icon: '🔊',
      name: 'Ultrazvuk',
      description: 'Ultrazvukové vyšetření'
    },
    {
      icon: '🦷',
      name: 'Dentální péče',
      description: 'Ošetření zubů a dásní'
    }
  ]

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Naše služby
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Poskytujeme komplexní veterinární péči pro vaše domácí mazlíčky
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Připraveni na rezervaci?
            </h3>
            <p className="text-blue-700 mb-4">
              Pro rezervaci termínu se přihlaste pomocí Google účtu
            </p>
            <Link
              href="/login"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Přihlásit se a rezervovat
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { data: session } = useSession()
  const [slots, setSlots] = useState<Slot[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<string>('')
  const [selectedServiceType, setSelectedServiceType] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [reservingSlot, setReservingSlot] = useState<string | null>(null)
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [selectedSlotForReservation, setSelectedSlotForReservation] = useState<Slot | null>(null)
  const [reservationForm, setReservationForm] = useState({
    petName: '',
    petType: '',
    description: '',
    phone: '',
  })
  const [phoneError, setPhoneError] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('calendar')

  useEffect(() => {
    // Test přímého Railway spojení
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Testování přímého Railway spojení...')
    }
    const testConnection = async () => {
      try {
        const railwayUrl = process.env.NEXT_PUBLIC_API_URL || 'https://veterina-reservations-production.up.railway.app'
        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 Railway URL:', railwayUrl)
        }
        
        const response = await fetch(`${railwayUrl}/health`)
        if (response.ok) {
          const data = await response.json()
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Railway API je DOSTUPNÉ přímo z frontendu!', data)
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Railway API nedostupné:', response.status, response.statusText)
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Chyba při přímém Railway spojení:', error)
        }
      }
    }
    testConnection()
    
    loadDoctors()
    loadServiceTypes()
    loadSlots()
  }, [session])

  useEffect(() => {
    loadSlots()
  }, [selectedDoctor, selectedServiceType, selectedDate])

  const addNotification = (type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substring(7)
    const notification = { id, type, message }
    setNotifications(prev => [...prev, notification])
    
    // Automaticky odstraň notifikaci po 5 sekundách
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const openReservationForm = (slot: Slot) => {
    if (!session) {
      addNotification('error', 'Pro rezervaci se musíte nejdřív přihlásit.')
      return
    }
    setSelectedSlotForReservation(slot)
    setShowReservationForm(true)
    
    // Načtení profilu uživatele pro předvyplnění telefonu
    loadUserProfile()
  }

  const loadUserProfile = async () => {
    try {
      const { getUserProfile } = await import('../lib/api-client')
      const userProfile = await getUserProfile()
      
      // Předvyplnění telefonu pokud existuje
      if (userProfile.phone) {
        setReservationForm(prev => ({ 
          ...prev, 
          phone: userProfile.phone 
        }))
      }
    } catch (error) {
      // Tichá chyba - profil není kritický pro formulář
      if (process.env.NODE_ENV === 'development') {
        console.error('Chyba při načítání profilu uživatele:', error)
      }
    }
  }

  const closeReservationForm = () => {
    setShowReservationForm(false)
    setSelectedSlotForReservation(null)
    setReservationForm({ petName: '', petType: '', description: '', phone: '' })
    setPhoneError('')
  }

  const createReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSlotForReservation || !session) {
      addNotification('error', 'Chyba při vytváření rezervace.')
      return
    }

    // Zkontrolovat validaci telefonu před odesláním
    if (reservationForm.phone && phoneError) {
      addNotification('error', 'Opravte prosím chyby ve formuláři před odesláním.')
      return
    }

    setReservingSlot(selectedSlotForReservation.id)

    try {
      const { createReservation } = await import('../lib/api-client')
      await createReservation({
        slotId: selectedSlotForReservation.id,
        ...reservationForm,
      })
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Rezervace vytvořena v Railway')
      }
      addNotification('success', 'Rezervace byla úspěšně vytvořena!')
      closeReservationForm()
      loadSlots() // Obnovit sloty
    } catch (error) {
      console.error('Chyba při vytváření rezervace v Railway:', error)
      addNotification('error', `Chyba: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
    } finally {
      setReservingSlot(null)
    }
  }

  const loadDoctors = async () => {
    if (!session?.user?.tenantId) return

    try {
      const { getDoctors } = await import('../lib/api-client')
      const data = await getDoctors()
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Doktoři načteni z Railway:', data)
      }
      setDoctors(data)
    } catch (error) {
      console.error('Chyba při načítání doktorů z Railway:', error)
    }
  }

  const loadServiceTypes = async () => {
    if (!session?.user?.tenantId) return

    try {
      const { getServiceTypes } = await import('../lib/api-client')
      const data = await getServiceTypes(session.user.tenantId)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Service types načteny z Railway:', data)
      }
      setServiceTypes(data)
    } catch (error) {
      console.error('Chyba při načítání druhů služeb z Railway:', error)
    }
  }

  const loadSlots = async () => {
    if (!session?.user?.tenantId) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedDoctor) params.append('doctorId', selectedDoctor)
      if (selectedServiceType) params.append('serviceTypeId', selectedServiceType)
      // Date filter works for both views
      if (selectedDate) params.append('date', selectedDate)

      const { getSlots } = await import('../lib/api-client')
      const data = await getSlots(session.user.tenantId, params)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Sloty načteny z Railway:', data)
      }
      setSlots(data)
    } catch (error) {
      console.error('Chyba při načítání slotů z Railway:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrované sloty podle vybraných filtrů
  const filteredSlots = useMemo(() => {
    let filtered = slots

    if (selectedServiceType) {
      filtered = filtered.filter(slot => slot.serviceTypeId === selectedServiceType)
    }

    if (selectedDoctor) {
      filtered = filtered.filter(slot => slot.doctorId === selectedDoctor)
    }

    // Datum už je filtrované na API
    // if (selectedDate) {
    //   filtered = filtered.filter(slot => isSameDayInTimezone(new Date(slot.startTime), new Date(selectedDate)))
    // }

    return filtered
  }, [slots, selectedServiceType, selectedDoctor])

  // Používáme unifikované funkce z timezone.ts
  // const formatTime = formatDisplayTime
  // const formatDate = formatDisplayDate

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  // Funkce pro validaci telefonního čísla
  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return '' // Prázdné je OK - volitelné pole
    
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    
    // Kontrola základní délky
    if (cleaned.length < 7) {
      return 'Telefonní číslo je příliš krátké. Minimálně 7 číslic.'
    }
    
    if (cleaned.length > 15) {
      return 'Telefonní číslo je příliš dlouhé. Maximálně 15 číslic.'
    }
    
    // Kontrola, že obsahuje pouze číslice a povolené znaky
    if (!/^[\+\d]+$/.test(cleaned)) {
      return 'Telefonní číslo může obsahovat pouze číslice a znak +.'
    }
    
    // České telefonní číslo - různé formáty
    const czechPatterns = [
      /^[67]\d{8}$/,                    // 777456789
      /^0[67]\d{8}$/,                   // 0777456789
      /^\+420[67]\d{8}$/,               // +420777456789
      /^420[67]\d{8}$/,                 // 420777456789
      /^00420[67]\d{8}$/,               // 00420777456789
    ]
    
    // Mezinárodní čísla
    const internationalPattern = /^\+[1-9]\d{6,14}$/
    
    // Testování vzorů
    const isCzechValid = czechPatterns.some(pattern => pattern.test(cleaned))
    const isInternationalValid = internationalPattern.test(cleaned)
    
    if (!isCzechValid && !isInternationalValid) {
      // Specifická diagnostika pro české číslo
      if (cleaned.length === 9 || cleaned.length === 10 || 
          cleaned.startsWith('420') || cleaned.startsWith('+420') || cleaned.startsWith('00420')) {
        
        // Extrahujeme základní číslo pro diagnostiku
        let coreNumber = cleaned
        if (cleaned.startsWith('+420')) coreNumber = cleaned.substring(4)
        else if (cleaned.startsWith('420')) coreNumber = cleaned.substring(3)
        else if (cleaned.startsWith('00420')) coreNumber = cleaned.substring(5)
        else if (cleaned.startsWith('0')) coreNumber = cleaned.substring(1)
        
        if (coreNumber.length !== 9) {
          return `České číslo má nesprávnou délku. Má ${coreNumber.length} číslic, ale očekává se 9. Příklad: 777123456`
        }
        
        if (!/^[67]/.test(coreNumber)) {
          return `České mobilní číslo musí začínat číslicí 6 nebo 7. Vaše číslo začíná ${coreNumber[0]}. Příklad: 777123456`
        }
      }
      
      return 'Neplatný formát. České: 777123456, 0777123456, +420777123456. Mezinárodní: +49123456789'
    }
    
    // Dodatečná validace pro české čísla
    if (isCzechValid) {
      let coreNumber = cleaned
      if (cleaned.startsWith('+420')) coreNumber = cleaned.substring(4)
      else if (cleaned.startsWith('420')) coreNumber = cleaned.substring(3)
      else if (cleaned.startsWith('00420')) coreNumber = cleaned.substring(5)
      else if (cleaned.startsWith('0')) coreNumber = cleaned.substring(1)
      
      if (coreNumber.length === 9 && !/^[67]/.test(coreNumber)) {
        return `České mobilní číslo musí začínat číslicí 6 nebo 7. Vaše číslo začíná ${coreNumber[0]}. Příklad: 777123456`
      }
    }
    
    return ''
  }

  // Handler pro změnu telefonu s validací
  const handlePhoneChange = (value: string) => {
    setReservationForm(prev => ({ ...prev, phone: value }))
    const error = validatePhone(value)
    setPhoneError(error)
  }

  // Show different content based on authentication status
  if (!session) {
    return (
      <div>
        <HeroSection />
        <ServicesSection />
      </div>
    )
  }

  return (
    <div>
      {/* Toast notifikace */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 w-full max-w-sm">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`w-full p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out animate-in slide-in-from-bottom-2 ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : notification.type === 'error' 
                ? 'bg-red-500 text-white' 
                : 'bg-blue-500 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {notification.type === 'success' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Rezervační formulář modal */}
      {showReservationForm && selectedSlotForReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Rezervace termínu
              </h3>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Datum:</strong> {formatDisplayDate(new Date(selectedSlotForReservation.startTime))}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Čas:</strong> {formatDisplayTime(new Date(selectedSlotForReservation.startTime))} - {formatDisplayTime(new Date(selectedSlotForReservation.endTime))}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Veterinář:</strong> {selectedSlotForReservation.doctor.user.name}
                </p>
                {selectedSlotForReservation.serviceType && (
                  <p className="text-sm text-blue-800">
                    <strong>Služba:</strong> {selectedSlotForReservation.serviceType.name} ({selectedSlotForReservation.serviceType.duration} min)
                  </p>
                )}
                {selectedSlotForReservation.room && (
                  <p className="text-sm text-blue-800">
                    <strong>Místnost:</strong> {selectedSlotForReservation.room.name}
                  </p>
                )}
              </div>

              <form onSubmit={createReservation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jméno zvířete *
                  </label>
                  <input
                    type="text"
                    value={reservationForm.petName}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, petName: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="např. Rex"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Druh zvířete *
                  </label>
                  <select
                    value={reservationForm.petType}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, petType: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Vyberte druh</option>
                    <option value="pes">Pes</option>
                    <option value="kočka">Kočka</option>
                    <option value="králík">Králík</option>
                    <option value="pták">Pták</option>
                    <option value="hlodavec">Hlodavec</option>
                    <option value="plaz">Plaz</option>
                    <option value="jiné">Jiné</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Popis problému
                  </label>
                  <textarea
                    value={reservationForm.description}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Popište prosím důvod návštěvy..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefonní číslo
                  </label>
                  <input
                    type="tel"
                    value={reservationForm.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                      phoneError 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="777 123 456 nebo +420 777 123 456"
                  />
                  {phoneError && (
                    <p className="text-xs text-red-600 mt-1">{phoneError}</p>
                  )}
                  {!phoneError && (
                    <p className="text-xs text-gray-500 mt-1">
                      Volitelné. Pro účely případného upřesnění požadavku.
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeReservationForm}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    disabled={reservingSlot === selectedSlotForReservation.id}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {reservingSlot === selectedSlotForReservation.id ? 'Rezervuji...' : 'Potvrdit rezervaci'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rezervační sekce */}
      <div id="rezervace" className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Rezervace termínu</h2>
          
          {/* Přepínač pohledů */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Kalendář
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Seznam
            </button>
          </div>
        </div>

        {/* Filtry */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filtry</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Druh služby</label>
              <select
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Všechny služby</option>
                {serviceTypes.map((serviceType) => (
                  <option key={serviceType.id} value={serviceType.id}>
                    {serviceType.name} ({serviceType.duration} min)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Veterinář</label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Všichni veterináři</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.user.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedServiceType('')
                  setSelectedDoctor('')
                  setSelectedDate('')
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Vymazat filtry
              </button>
            </div>
          </div>
          
          {/* Rychlé filtry */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Rychlé filtry:</span>
            <button
              onClick={() => setSelectedDate(new Date().toLocaleDateString('sv-SE'))}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              Dnes
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                setSelectedDate(tomorrow.toLocaleDateString('sv-SE'))
              }}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              Zítra
            </button>
            <button
              onClick={() => {
                const nextWeek = new Date()
                nextWeek.setDate(nextWeek.getDate() + 7)
                setSelectedDate(nextWeek.toLocaleDateString('sv-SE'))
              }}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
            >
              Za týden
            </button>
            <button
              onClick={() => {
                setSelectedServiceType('')
                setSelectedDoctor('')
                setSelectedDate('')
              }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              Vše
            </button>
          </div>

          {/* Počítadlo výsledků */}
          <div className="mt-4 text-sm text-gray-600">
            Zobrazeno: <span className="font-medium">{filteredSlots.length}</span> dostupných termínů
          </div>
        </div>

        {/* Zobrazení podle vybraného módu */}
        {viewMode === 'calendar' ? (
          <CalendarView
            slots={filteredSlots}
            selectedDoctor={selectedDoctor}
            selectedServiceType={selectedServiceType}
            selectedDate={selectedDate}
            onReserveSlot={openReservationForm}
            loading={loading}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Dostupné termíny</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Načítání...</div>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {slots.length === 0 
                  ? "Momentálně nejsou k dispozici žádné termíny."
                  : "Žádné termíny nevyhovují zvoleným filtrům."
                }
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredSlots.map((slot) => (
                  <div key={slot.id} className="p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="mb-3">
                      <p className="text-lg font-semibold text-gray-800">
                        {formatDisplayDate(new Date(slot.startTime))}
                      </p>
                      <p className="text-md text-blue-600 font-medium">
                        {formatDisplayTime(new Date(slot.startTime))} - {formatDisplayTime(new Date(slot.endTime))}
                      </p>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">{slot.doctor.user.name}</p>
                      {slot.doctor.specialization && (
                        <p className="text-xs text-gray-500">{slot.doctor.specialization}</p>
                      )}
                    </div>

                    {/* Zobrazení nových polí s fallbackem na stará */}
                    {slot.room && (
                      <p className="text-xs text-gray-600 mb-1">
                        🏥 {slot.room.name}
                        {slot.room.description && ` (${slot.room.description})`}
                      </p>
                    )}
                    {slot.serviceType && (
                      <div className="mb-2">
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: slot.serviceType.color || '#3B82F6' }}
                        >
                          ⚕️ {slot.serviceType.name} • {slot.serviceType.duration} min
                        </span>
                        {slot.serviceType.description && (
                          <p className="text-xs text-gray-500 mt-1">{slot.serviceType.description}</p>
                        )}
                      </div>
                    )}
                    {/* Fallback pro stará pole */}
                    {!slot.serviceType && slot.equipment && (
                      <p className="text-xs text-gray-600 mb-1">🔧 {slot.equipment}</p>
                    )}

                    <button
                      onClick={() => openReservationForm(slot)}
                      disabled={reservingSlot === slot.id}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      {reservingSlot === slot.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Rezervuji...</span>
                        </>
                      ) : (
                        <span>Rezervovat termín</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
