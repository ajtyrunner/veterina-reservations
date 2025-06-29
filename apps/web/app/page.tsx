'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTenantSlugFromUrl } from '@/lib/tenant'
import CalendarView from './components/CalendarView'

interface Slot {
  id: string
  startTime: string
  endTime: string
  room?: string
  equipment?: string
  doctor: {
    specialization?: string
    user: {
      name: string
    }
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

type NotificationType = 'success' | 'error' | 'info'

interface Notification {
  id: string
  type: NotificationType
  message: string
}

export default function Home() {
  const { data: session } = useSession()
  const [slots, setSlots] = useState<Slot[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<string>('')
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
  })
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('calendar')

  useEffect(() => {
    loadDoctors()
    loadSlots()
  }, [session])

  useEffect(() => {
    loadSlots()
  }, [selectedDoctor, selectedDate])

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
  }

  const closeReservationForm = () => {
    setShowReservationForm(false)
    setSelectedSlotForReservation(null)
    setReservationForm({ petName: '', petType: '', description: '' })
  }

  const createReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSlotForReservation || !session) {
      addNotification('error', 'Chyba při vytváření rezervace.')
      return
    }

    setReservingSlot(selectedSlotForReservation.id)

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotId: selectedSlotForReservation.id,
          ...reservationForm,
        }),
      })

      if (response.ok) {
        addNotification('success', 'Rezervace byla úspěšně vytvořena!')
        closeReservationForm()
        loadSlots() // Obnovit sloty
      } else {
        let errorMessage = 'Chyba při vytváření rezervace'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = await response.text() || errorMessage
        }
        addNotification('error', errorMessage)
      }
    } catch (error) {
      console.error('Chyba při vytváření rezervace:', error)
      addNotification('error', 'Chyba při vytváření rezervace. Zkuste to prosím znovu.')
    } finally {
      setReservingSlot(null)
    }
  }

  const loadDoctors = async () => {
    if (!session?.user?.tenantId) return

    try {
      const response = await fetch(`/api/public/doctors/${session.user.tenantId}`)
      
      if (response.ok) {
        const data = await response.json()
        setDoctors(data)
      } else {
        console.error('Chyba při načítání doktorů:', await response.text())
      }
    } catch (error) {
      console.error('Chyba při načítání doktorů:', error)
    }
  }

  const loadSlots = async () => {
    if (!session?.user?.tenantId) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedDoctor) params.append('doctorId', selectedDoctor)
      if (selectedDate) params.append('date', selectedDate)

      const response = await fetch(`/api/public/slots/${session.user.tenantId}?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSlots(data)
      } else {
        console.error('Chyba při načítání slotů:', await response.text())
      }
    } catch (error) {
      console.error('Chyba při načítání slotů:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  // Odstraněna sekce Hero a další nerelevantní části

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
                  <strong>Datum:</strong> {formatDate(selectedSlotForReservation.startTime)}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Čas:</strong> {formatTime(selectedSlotForReservation.startTime)} - {formatTime(selectedSlotForReservation.endTime)}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Veterinář:</strong> {selectedSlotForReservation.doctor.user.name}
                </p>
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
                    <option value="Pes">Pes</option>
                    <option value="Kočka">Kočka</option>
                    <option value="Králík">Králík</option>
                    <option value="Pták">Pták</option>
                    <option value="Jiné">Jiné</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Veterinář</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Všichni veterináři</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user.name}
                </option>
              ))}
            </select>
          </div>
          {viewMode === 'grid' && (
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Datum</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          )}
        </div>

        {/* Zobrazení podle vybraného módu */}
        {viewMode === 'calendar' ? (
          <CalendarView
            slots={slots}
            selectedDoctor={selectedDoctor}
            onReserveSlot={openReservationForm}
            loading={loading}
          />
        ) : (
          <div className="mt-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Načítání dostupných termínů...</p>
              </div>
            ) : slots.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {slots.map((slot) => (
                  <div key={slot.id} className="p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="mb-3">
                      <p className="text-lg font-semibold text-gray-800">
                        {formatDate(slot.startTime)}
                      </p>
                      <p className="text-md text-blue-600 font-medium">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </p>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">{slot.doctor.user.name}</p>
                      {slot.doctor.specialization && (
                        <p className="text-xs text-gray-500">{slot.doctor.specialization}</p>
                      )}
                    </div>

                    {slot.room && (
                      <p className="text-xs text-gray-600 mb-1">📍 {slot.room}</p>
                    )}
                    {slot.equipment && (
                      <p className="text-xs text-gray-600 mb-3">🔧 {slot.equipment}</p>
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
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Žádné dostupné termíny nenalezeny.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
