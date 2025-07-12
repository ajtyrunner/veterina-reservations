'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { getTenantSlugFromUrl } from '@/lib/tenant'
import { useContent } from '../lib/content-context'
import CalendarView from './components/CalendarView'
import { formatDisplayTime, formatDisplayDate, isSameDayInTimezone } from '../lib/timezone'
import { getDoctors, getSlots, getServiceTypes, createReservation } from '../lib/api-client'

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
  const { t, colors, content } = useContent()
  
  const gradientStyle = {
    background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`
  }

  const checkmarkBgStyle = {
    backgroundColor: colors.background
  }

  const checkmarkStyle = {
    color: colors.primary
  }

  // Dynamické features podle typu businessu
  const features = content?.slug === 'agility-nikol' ? [
    'Online rezervace 24/7',
    `Zkušení ${t('STAFF_PLURAL', 'trenéři').toLowerCase()}`,
    'Venkovní i vnitřní prostory'
  ] : [
    'Online rezervace 24/7',
    `Kvalifikovaní ${t('STAFF_PLURAL', 'veterináři').toLowerCase()}`,
    'Moderní vybavení'
  ]

  return (
    <div className="relative text-white" style={gradientStyle}>
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative container mx-auto px-4 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              {t('hero_title', 'Rezervujte si termín online').split(' ').map((word, i) => (
                i === t('hero_title', 'Rezervujte si termín online').split(' ').length - 1 ? (
                  <span key={i} className="block opacity-90">{word}</span>
                ) : (
                  <span key={i}>{word} </span>
                )
              ))}
            </h1>
            <p className="text-xl lg:text-2xl opacity-95 leading-relaxed">
              {t('hero_subtitle', 'Jednoduché a rychlé rezervace přímo z pohodlí domova')}
            </p>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={checkmarkBgStyle}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={checkmarkStyle}>
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="text-lg">{feature}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link
                href="/login"
                className="bg-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg text-center hover:opacity-90"
                style={{ color: colors.primary }}
              >
                {t('book_appointment', t('book_training', '🐾 Rezervovat termín'))}
              </Link>
              <Link
                href="/jak-to-funguje"
                className="border-2 border-white text-white hover:bg-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors text-center group"
              >
                <span className="group-hover:hidden">Jak to funguje?</span>
                <span className="hidden group-hover:inline" style={{ color: colors.primary }}>Jak to funguje?</span>
              </Link>
            </div>
          </div>
          
          {/* Image/Illustration */}
          <div className="hidden lg:block">
            <div className="bg-white bg-opacity-20 rounded-2xl p-8 backdrop-blur-sm">
              <div className="text-center space-y-6">
                {content?.customContent?.branding?.logoUrl ? (
                  <div className="relative">
                    <div className="w-40 h-40 mx-auto bg-white/95 backdrop-blur-sm rounded-full overflow-hidden shadow-2xl p-4">
                      <img 
                        src={content.customContent.branding.logoUrl} 
                        alt={content.customContent.branding.logoAlt || content?.name || 'Logo'}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    </div>
                    <div className="text-8xl hidden">{content?.slug === 'agility-nikol' ? '🐕' : '🏥'}</div>
                  </div>
                ) : (
                  <div className="text-8xl">
                    {content?.slug === 'agility-nikol' ? '🐕' : '🏥'}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl mb-2">📅</div>
                    <div>{t('hero_box_1', 'Online rezervace')}</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl mb-2">⏰</div>
                    <div>{t('hero_box_2', 'Flexibilní časy')}</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl mb-2">👨‍⚕️</div>
                    <div>{t('hero_box_3', t('STAFF_PLURAL', 'Zkušení odborníci'))}</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl mb-2">💝</div>
                    <div>{t('hero_box_4', `Péče o ${t('SERVICE_SUBJECT', 'mazlíčky').toLowerCase()}`)}</div>
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

// Services Component for non-authenticated users
function ServicesSection() {
  const { t, colors, content } = useContent()

  const services = content?.slug === 'agility-nikol' ? [
    {
      icon: '🏃',
      title: 'Agility tréninky',
      description: 'Profesionální tréninky agility pro všechny úrovně. Od začátečníků po zkušené závodníky.'
    },
    {
      icon: '🐑',
      title: 'Pasení ovcí',
      description: 'Specializované tréninky pasení pro pastevecká plemena. Rozvíjíme přirozené instinkty vašeho psa.'
    },
    {
      icon: '🎯',
      title: 'Individuální lekce',
      description: 'Osobní přístup a tréninky na míru podle potřeb vašeho psa. Flexibilní termíny.'
    },
    {
      icon: '🏆',
      title: 'Příprava na závody',
      description: 'Specializovaná příprava na agility závody. Trénink techniky, rychlosti a přesnosti.'
    }
  ] : [
    {
      icon: '🩺',
      title: 'Preventivní prohlídky',
      description: 'Pravidelné kontroly zdravotního stavu vašeho mazlíčka pro včasné odhalení případných problémů.'
    },
    {
      icon: '💉',
      title: 'Očkování',
      description: 'Kompletní vakcinační program pro psy, kočky a další domácí mazlíčky dle aktuálních doporučení.'
    },
    {
      icon: '🏥',
      title: 'Chirurgické zákroky',
      description: 'Moderně vybavený operační sál pro běžné i specializované chirurgické výkony.'
    },
    {
      icon: '🦷',
      title: 'Stomatologie',
      description: 'Péče o zuby a dutinu ústní včetně odstranění zubního kamene a extrakcí.'
    }
  ]

  const cardStyle = {
    ':hover': {
      borderColor: colors.primary,
      transform: 'translateY(-4px)'
    }
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4" style={{ color: colors.primary }}>
          Naše služby
        </h2>
        <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          {content?.slug === 'agility-nikol' 
            ? 'Nabízíme širokou škálu tréninkových programů pro vás a vašeho psa' 
            : 'Poskytujeme komplexní veterinární péči s důrazem na individuální přístup'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent'
              }}
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: colors.primary }}>
                {service.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// CTA Component for non-authenticated users
function CTASection() {
  const { t, colors, content } = useContent()

  const bgStyle = {
    backgroundColor: colors.primary
  }

  const buttonStyle = {
    backgroundColor: 'white',
    color: colors.primary
  }

  return (
    <div className="py-16 text-white" style={bgStyle}>
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
          {content?.slug === 'agility-nikol'
            ? 'Připraveni na trénink?'
            : 'Připraveni se objednat?'}
        </h2>
        <p className="text-xl mb-8 opacity-90">
          {content?.slug === 'agility-nikol'
            ? 'Začněte trénovat s našimi profesionálními trenéry ještě dnes'
            : 'Začněte využívat náš online rezervační systém ještě dnes'}
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:opacity-90"
          style={buttonStyle}
        >
          {t('book_appointment', t('book_training', 'Rezervovat termín'))}
        </Link>
      </div>
    </div>
  )
}

export default function HomePageWithContent() {
  const { data: session } = useSession()
  const { content, loading: contentLoading, t, colors } = useContent()
  const [tenantSlug, setTenantSlug] = useState<string>('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedDoctor, setSelectedDoctor] = useState<string>('')
  const [selectedServiceType, setSelectedServiceType] = useState<string>('')
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
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [noSlotsMessage, setNoSlotsMessage] = useState('')

  // Initialize tenant slug
  useEffect(() => {
    const slug = session?.user?.tenant || getTenantSlugFromUrl()
    setTenantSlug(slug)
  }, [session])

  // Load initial data
  useEffect(() => {
    if (session && tenantSlug) {
      loadDoctors()
      loadServiceTypes()
    }
  }, [session, tenantSlug])

  // Load slots when filters change
  useEffect(() => {
    if (session && tenantSlug) {
      loadSlots()
    }
  }, [session, tenantSlug, selectedDate, selectedDoctor, selectedServiceType])

  const loadDoctors = async () => {
    try {
      const data = await getDoctors()
      setDoctors(data)
    } catch (error) {
      console.error('Chyba při načítání doktorů:', error)
    }
  }

  const loadServiceTypes = async () => {
    try {
      const data = await getServiceTypes(tenantSlug)
      setServiceTypes(data)
    } catch (error) {
      console.error('Chyba při načítání typů služeb:', error)
    }
  }

  const loadSlots = async () => {
    try {
      setLoading(true)
      setNoSlotsMessage('')
      
      // Use selected date or current date for month calculation
      const dateToUse = selectedDate || new Date().toISOString().split('T')[0]
      
      // Calculate month range for calendar view
      const selectedDateObj = new Date(dateToUse)
      const year = selectedDateObj.getFullYear()
      const month = selectedDateObj.getMonth()
      
      // First and last day of the month
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0)
      
      // Format dates for API
      const startDate = monthStart.toISOString().split('T')[0]
      const endDate = monthEnd.toISOString().split('T')[0]

      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate,
        ...(selectedDoctor && { doctorId: selectedDoctor }),
        ...(selectedServiceType && { serviceTypeId: selectedServiceType }),
      })

      const data = await getSlots(tenantSlug, params)
      setSlots(data)
        
      if (data.length === 0) {
        // Check if date is in the past
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const selected = new Date(selectedDate)
        selected.setHours(0, 0, 0, 0)
        
        if (selected < today) {
          setNoSlotsMessage('Pro minulé dny nelze rezervovat termíny.')
        } else if (selected.toDateString() === today.toDateString()) {
          setNoSlotsMessage('Pro dnešní den již nejsou dostupné žádné termíny.')
        } else {
          setNoSlotsMessage('Pro vybraný den nejsou dostupné žádné termíny.')
        }
      }
    } catch (error) {
      console.error('Chyba při načítání slotů:', error)
      addNotification('error', 'Nepodařilo se načíst dostupné termíny')
    } finally {
      setLoading(false)
    }
  }

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now().toString()
    const notification: Notification = { id, type, message }
    setNotifications(prev => [...prev, notification])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const handleSlotClick = async (slot: Slot) => {
    setSelectedSlotForReservation(slot)
    setShowReservationForm(true)
  }

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSlotForReservation) return
    
    setReservingSlot(selectedSlotForReservation.id)
    
    try {
      await createReservation({
        slotId: selectedSlotForReservation.id,
        ...reservationForm,
      })
      
      addNotification('success', 'Rezervace byla úspěšně vytvořena!')
      
      // Close modal and reset form
      setShowReservationForm(false)
      setSelectedSlotForReservation(null)
      setReservationForm({
        petName: '',
        petType: '',
        description: '',
        phone: '',
      })
      
      // Reload slots to update availability
      loadSlots()
    } catch (error: any) {
      console.error('Chyba při vytváření rezervace:', error)
      if (error.message) {
        setPhoneError(error.message)
      } else {
        addNotification('error', 'Nepodařilo se vytvořit rezervaci')
      }
    } finally {
      setReservingSlot(null)
    }
  }

  const groupSlotsByTime = (slots: Slot[]) => {
    const grouped: { [key: string]: Slot[] } = {}
    
    slots.forEach(slot => {
      const time = formatDisplayTime(new Date(slot.startTime))
      if (!grouped[time]) {
        grouped[time] = []
      }
      grouped[time].push(slot)
    })
    
    return grouped
  }

  const groupedSlots = useMemo(() => groupSlotsByTime(slots), [slots])

  if (contentLoading) {
    return <div className="min-h-screen bg-gray-50 animate-pulse" />
  }

  // Show hero section for non-authenticated users
  if (!session) {
    return (
      <>
        <HeroSection />
        <ServicesSection />
        <CTASection />
      </>
    )
  }

  // Show calendar view for authenticated users

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>
          {t('book_appointment', t('book_training', 'Rezervace termínu'))}
        </h1>
        <p className="text-gray-600">
          Vyberte si vhodný termín pro {t('SERVICE_SUBJECT', 'vašeho mazlíčka').toLowerCase()}
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar' 
                  ? 'text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={viewMode === 'calendar' ? { backgroundColor: colors.primary } : {}}
            >
              📅 Kalendář
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={viewMode === 'grid' ? { backgroundColor: colors.primary } : {}}
            >
              📋 Seznam
            </button>
          </div>
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>Filtry</span>
            <svg className={`w-4 h-4 transform transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`bg-white rounded-lg shadow transition-all duration-300 ${filtersExpanded ? 'p-6' : 'p-0 overflow-hidden'}`} style={{ maxHeight: filtersExpanded ? '500px' : '0' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('STAFF', 'Doktor')}
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
              style={{ focusRingColor: colors.primary }}
            >
              <option value="">Všichni {t('STAFF_PLURAL', 'doktoři').toLowerCase()}</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user.name}
                  {doctor.specialization && ` - ${doctor.specialization}`}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typ služby
            </label>
            <select
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
              style={{ focusRingColor: colors.primary }}
            >
              <option value="">Všechny služby</option>
              {serviceTypes.map(serviceType => (
                <option key={serviceType.id} value={serviceType.id}>
                  {serviceType.name}
                  {serviceType.duration && ` (${serviceType.duration} min)`}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
              style={{ focusRingColor: colors.primary }}
              placeholder=""
            />
          </div>
        </div>
      </div>

      {/* Calendar or Grid View */}
      {viewMode === 'calendar' ? (
        <CalendarView
          slots={slots}
          selectedDoctor={selectedDoctor}
          selectedServiceType={selectedServiceType}
          selectedDate={selectedDate || undefined}
          onReserveSlot={handleSlotClick}
          loading={loading}
          userRole={session?.user?.role}
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Načítám termíny...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{noSlotsMessage || 'Pro vybraný den nejsou dostupné žádné termíny.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedSlots).map(([time, timeSlots]) => (
                <div key={time}>
                  <h4 className="font-medium text-gray-700 mb-2">{time}</h4>
                  <div className="space-y-2">
                    {timeSlots.map(slot => (
                      <div
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {slot.doctor.user.name}
                              {slot.doctor.specialization && (
                                <span className="text-sm text-gray-500 ml-2">
                                  {slot.doctor.specialization}
                                </span>
                              )}
                            </div>
                            {slot.serviceType && (
                              <div className="mt-1">
                                <span 
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                  style={{ backgroundColor: slot.serviceType.color || '#3B82F6' }}
                                >
                                  {slot.serviceType.name} • {slot.serviceType.duration} min
                                </span>
                              </div>
                            )}
                            {slot.room && (
                              <div className="text-sm text-gray-500 mt-1">
                                📍 {slot.room.name}
                              </div>
                            )}
                          </div>
                          <button className="px-4 py-2 text-white rounded-md hover:opacity-90 transition-opacity" style={{ backgroundColor: colors.primary }}>
                            Rezervovat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`
              px-4 py-3 rounded-lg shadow-lg text-white
              ${notification.type === 'success' ? 'bg-green-500' : ''}
              ${notification.type === 'error' ? 'bg-red-500' : ''}
              ${notification.type === 'info' ? 'bg-blue-500' : ''}
            `}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Reservation Modal */}
      {showReservationForm && selectedSlotForReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
                  Nová rezervace
                </h2>
                <button
                  onClick={() => {
                    setShowReservationForm(false)
                    setSelectedSlotForReservation(null)
                    setReservationForm({
                      petName: '',
                      petType: '',
                      description: '',
                      phone: '',
                    })
                    setPhoneError('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">{selectedSlotForReservation.doctor.user.name}</h3>
                {selectedSlotForReservation.doctor.specialization && (
                  <p className="text-sm text-gray-600 mb-1">{selectedSlotForReservation.doctor.specialization}</p>
                )}
                <p className="text-sm text-gray-600">
                  {formatDisplayDate(new Date(selectedSlotForReservation.startTime))} • {formatDisplayTime(new Date(selectedSlotForReservation.startTime))}
                </p>
                {selectedSlotForReservation.serviceType && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedSlotForReservation.serviceType.name} ({selectedSlotForReservation.serviceType.duration} min)
                  </p>
                )}
                {selectedSlotForReservation.room && (
                  <p className="text-sm text-gray-600">
                    📍 {selectedSlotForReservation.room.name}
                  </p>
                )}
              </div>
              
              <form onSubmit={handleReservationSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jméno mazlíčka
                  </label>
                  <input
                    type="text"
                    value={reservationForm.petName}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, petName: e.target.value }))}
                    placeholder="např. Rex"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Druh zvířete
                  </label>
                  <select
                    value={reservationForm.petType}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, petType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Vyberte druh zvířete</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefonní číslo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={reservationForm.phone}
                    onChange={(e) => {
                      setReservationForm(prev => ({ ...prev, phone: e.target.value }))
                      setPhoneError('')
                    }}
                    placeholder="např. 777123456"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      phoneError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {phoneError && (
                    <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poznámka k návštěvě
                  </label>
                  <textarea
                    value={reservationForm.description}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Popište důvod návštěvy, příznaky, nebo jiné poznámky..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReservationForm(false)
                      setSelectedSlotForReservation(null)
                      setReservationForm({
                        petName: '',
                        petType: '',
                        description: '',
                        phone: '',
                      })
                      setPhoneError('')
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    disabled={reservingSlot !== null}
                    className="px-4 py-2 text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {reservingSlot !== null ? 'Vytvářím...' : 'Vytvořit rezervaci'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}