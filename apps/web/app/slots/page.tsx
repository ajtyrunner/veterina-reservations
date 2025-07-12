'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDisplayTime, formatDisplayDate, formatDisplayDateTime, formatDateTimeFromAPI, getTomorrowDateTime as getTimezoneAwareTomorrowDateTime, isSameDayInTimezone, getTodayDateString } from '../../lib/timezone'

interface Room {
  id: string
  name: string
  description?: string
  capacity: number
  isActive: boolean
}

interface ServiceType {
  id: string
  name: string
  description?: string
  duration: number
  price?: number
  color?: string
  isActive: boolean
}

interface Slot {
  id: string
  startTime: string
  endTime: string
  equipment?: string
  roomId?: string
  serviceTypeId?: string
  isAvailable: boolean
  doctor?: {
    user: {
      name: string
    }
  }
  room?: Room
  serviceType?: ServiceType
  reservations: Array<{
    id: string
    petName?: string
    petType?: string
    user: {
      name: string
      email: string
    }
  }>
}

type NotificationType = 'success' | 'error' | 'info'

interface Notification {
  id: string
  type: NotificationType
  message: string
}

export default function SlotsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    equipment: '',
    roomId: '',
    serviceTypeId: '',
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingSlot, setEditingSlot] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    startTime: '',
    endTime: '',
    equipment: '',
    roomId: '',
    serviceTypeId: '',
  })
  const [deletingSlot, setDeletingSlot] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    serviceTypeId: '',
    roomId: '',
    date: '',
    status: '', // 'available', 'reserved', nebo ''
  })
  const [filteredSlots, setFilteredSlots] = useState<Slot[]>([])

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }

    if (session?.user?.role && !['DOCTOR', 'ADMIN'].includes(session.user.role)) {
      router.push('/')
      return
    }

    if (session?.user?.userId) {
      loadSlots()
      loadRooms()
      loadServiceTypes()
    }
  }, [session, status, router])

  const loadSlots = async () => {
    try {
      console.log('🔄 Načítám sloty přímo z Railway API...')
      const { getSlots } = await import('../../lib/api-client')
      if (!session) {
        throw new Error('Session is not available')
      }
      const data = await getSlots(session.user.tenant)
      console.log('✅ Sloty načteny z Railway:', data)
      setSlots(data)
    } catch (error) {
      console.error('Chyba při načítání slotů z Railway:', error)
      addNotification('error', 'Chyba při načítání slotů')
    } finally {
      setLoading(false)
    }
  }

  const loadRooms = async () => {
    try {
      const { getRooms } = await import('../../lib/api-client')
      const data = await getRooms()
      console.log('✅ Ordinace načteny z Railway:', data)
      setRooms(data.filter((room: Room) => room.isActive))
    } catch (error) {
      console.error('Chyba při načítání ordinací z Railway:', error)
    }
  }

  const loadServiceTypes = async () => {
    try {
      const { getServiceTypes } = await import('../../lib/api-client')
      if (!session) {
        throw new Error('Session is not available')
      }
      const data = await getServiceTypes(session.user.tenant)
      console.log('✅ Service types načteny z Railway:', data)
      // Odstraním filtrování podle isActive, protože to už dělá API
      setServiceTypes(data)
    } catch (error) {
      console.error('Chyba při načítání druhů služeb z Railway:', error)
    }
  }

  const createSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user) {
      addNotification('error', 'Nejste přihlášeni nebo vypršela platnost přihlášení. Prosím, přihlaste se znovu.')
      router.push('/login')
      return
    }

    setIsCreating(true)
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Vytvářím slot přímo přes Railway API...')
      }
      
      // Konvertujeme datetime-local na Prague timezone formát před odesláním
      const { formatDateTimeForAPI } = await import('../../lib/timezone')
      const apiData = {
        ...formData,
        startTime: formatDateTimeForAPI(formData.startTime),
        endTime: formatDateTimeForAPI(formData.endTime)
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📤 Odesílám data:', apiData)
      }
      const { createSlot } = await import('../../lib/api-client')
      const newSlot = await createSlot(apiData)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Slot vytvořen přes Railway:', newSlot)
      }
      
      setSlots(prev => [...prev, newSlot])
      setFormData({ startTime: '', endTime: '', equipment: '', roomId: '', serviceTypeId: '' })
      setShowCreateForm(false)
      addNotification('success', 'Slot byl úspěšně vytvořen!')
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Chyba při vytváření slotu přes Railway:', error)
      }
      addNotification('error', error.message || 'Chyba při vytváření slotu')
    } finally {
      setIsCreating(false)
    }
  }

  const startEditSlot = (slot: Slot) => {
    setEditingSlot(slot.id)
    const { formatTimezoneDateTime } = require('../../lib/timezone')
    setEditFormData({
      startTime: formatTimezoneDateTime(new Date(slot.startTime)),
      endTime: formatTimezoneDateTime(new Date(slot.endTime)),
      equipment: slot.equipment || '',
      roomId: slot.roomId || '',
      serviceTypeId: slot.serviceTypeId || '',
    })
  }

  const cancelEdit = () => {
    setEditingSlot(null)
    setEditFormData({ startTime: '', endTime: '', equipment: '', roomId: '', serviceTypeId: '' })
  }

  const updateSlot = async (slotId: string) => {
    if (!session?.user) {
      addNotification('error', 'Nejste přihlášeni.')
      return
    }

    try {
      // Konvertujeme datetime-local na Prague timezone formát před odesláním
      const { formatDateTimeForAPI } = await import('../../lib/timezone')
      const apiData = {
        ...editFormData,
        startTime: formatDateTimeForAPI(editFormData.startTime),
        endTime: formatDateTimeForAPI(editFormData.endTime)
      }
      
      const { updateSlot } = await import('../../lib/api-client')
      const updatedSlot = await updateSlot(slotId, apiData)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Slot upraven v Railway:', updatedSlot)
      }
      setSlots(prev => prev.map(slot => slot.id === slotId ? updatedSlot : slot))
      setEditingSlot(null)
      setEditFormData({ startTime: '', endTime: '', equipment: '', roomId: '', serviceTypeId: '' })
      addNotification('success', 'Slot byl úspěšně upraven.')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Chyba při úpravě slotu v Railway:', error)
      }
      addNotification('error', `Chyba: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
    }
  }

  const deleteSlot = async (slotId: string) => {
    if (!session?.user) {
      addNotification('error', 'Nejste přihlášeni.')
      return
    }

    setDeletingSlot(slotId)

    try {
      const { deleteSlot } = await import('../../lib/api-client')
      await deleteSlot(slotId)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Slot smazán v Railway')
      }
      setSlots(prev => prev.filter(slot => slot.id !== slotId))
      addNotification('success', 'Slot byl úspěšně smazán.')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Chyba při mazání slotu v Railway:', error)
      }
      addNotification('error', `Chyba: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
    } finally {
      setDeletingSlot(null)
    }
  }

  const getTomorrowDateTime = () => {
    return getTimezoneAwareTomorrowDateTime()
  }

  // Utility funkce pro správné přidání minut k datetime-local
  const addMinutesToDateTimeLocal = (dateTimeLocal: string, addMinutes: number): string => {
    // Parsujeme datetime-local string manuálně
    const [datePart, timePart] = dateTimeLocal.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)
    
    // Vytvoříme Date v lokálním čase (month-1 protože Date používá 0-based měsíce)
    const date = new Date(year, month - 1, day, hour, minute)
    
    // Přidáme minuty
    date.setMinutes(date.getMinutes() + addMinutes)
    
    // Formatujeme výsledek manuálně (bez toISOString aby se vyhnuli UTC)
    const resultYear = date.getFullYear()
    const resultMonth = String(date.getMonth() + 1).padStart(2, '0')
    const resultDay = String(date.getDate()).padStart(2, '0')
    const resultHour = String(date.getHours()).padStart(2, '0')
    const resultMinute = String(date.getMinutes()).padStart(2, '0')
    
    return `${resultYear}-${resultMonth}-${resultDay}T${resultHour}:${resultMinute}`
  }

  const handleServiceTypeChange = (serviceTypeId: string) => {
    if (serviceTypeId) {
      // Vybrána služba - automaticky nastav čas konce
      const selectedService = serviceTypes.find(s => s.id === serviceTypeId)
      if (selectedService && formData.startTime) {
        const endTime = addMinutesToDateTimeLocal(formData.startTime, selectedService.duration)
        setFormData(prev => ({ 
          ...prev, 
          serviceTypeId,
          endTime
        }))
      } else {
        setFormData(prev => ({ ...prev, serviceTypeId }))
      }
    } else {
      // Zrušen výběr služby - vymaž čas konce, aby ho uživatel mohl zadat manuálně
      setFormData(prev => ({ 
        ...prev, 
        serviceTypeId: '',
        endTime: ''
      }))
    }
  }

  const handleStartTimeChange = (startTime: string) => {
    if (formData.serviceTypeId && startTime) {
      // Pokud je vybrána služba, automaticky nastav čas konce
      const selectedService = serviceTypes.find(s => s.id === formData.serviceTypeId)
      if (selectedService) {
        const endTime = addMinutesToDateTimeLocal(startTime, selectedService.duration)
        setFormData(prev => ({ 
          ...prev, 
          startTime,
          endTime
        }))
        return
      }
    }
    
    // Pokud není vybrána služba, jen nastav čas začátku
    setFormData(prev => ({ ...prev, startTime }))
  }

  // Funkce pro editační formulář
  const handleEditServiceTypeChange = (serviceTypeId: string) => {
    if (serviceTypeId) {
      // Vybrána služba - automaticky nastav čas konce
      const selectedService = serviceTypes.find(s => s.id === serviceTypeId)
      if (selectedService && editFormData.startTime) {
        const endTime = addMinutesToDateTimeLocal(editFormData.startTime, selectedService.duration)
        setEditFormData(prev => ({ 
          ...prev, 
          serviceTypeId,
          endTime
        }))
      } else {
        setEditFormData(prev => ({ ...prev, serviceTypeId }))
      }
    } else {
      // Zrušen výběr služby - ponech současný čas konce
      setEditFormData(prev => ({ 
        ...prev, 
        serviceTypeId: ''
      }))
    }
  }

  const handleEditStartTimeChange = (startTime: string) => {
    if (editFormData.serviceTypeId && startTime) {
      // Pokud je vybrána služba, automaticky nastav čas konce
      const selectedService = serviceTypes.find(s => s.id === editFormData.serviceTypeId)
      if (selectedService) {
        const endTime = addMinutesToDateTimeLocal(startTime, selectedService.duration)
        setEditFormData(prev => ({ 
          ...prev, 
          startTime,
          endTime
        }))
        return
      }
    }
    
    // Pokud není vybrána služba, jen nastav čas začátku
    setEditFormData(prev => ({ ...prev, startTime }))
  }

  const applyFilters = () => {
    let filtered = [...slots]

    // Filtr podle druhu služby
    if (filters.serviceTypeId) {
      filtered = filtered.filter(slot => slot.serviceTypeId === filters.serviceTypeId)
    }

    // Filtr podle ordinace
    if (filters.roomId) {
      filtered = filtered.filter(slot => slot.roomId === filters.roomId)
    }

    // Timezone-aware filtr podle data
    if (filters.date) {
      const filterDate = new Date(filters.date)
      filtered = filtered.filter(slot => {
        const slotDate = new Date(slot.startTime)
        return isSameDayInTimezone(slotDate, filterDate)
      })
    }

    // Filtr podle stavu
    if (filters.status) {
      if (filters.status === 'available') {
        filtered = filtered.filter(slot => slot.isAvailable && slot.reservations.length === 0)
      } else if (filters.status === 'reserved') {
        filtered = filtered.filter(slot => slot.reservations.length > 0)
      }
    }

    setFilteredSlots(filtered)
  }

  // Aplikuj filtry při změně slotů nebo filtrů
  useEffect(() => {
    applyFilters()
  }, [slots, filters])

  const clearFilters = () => {
    setFilters({
      serviceTypeId: '',
      roomId: '',
      date: '',
      status: '',
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600">Načítám sloty...</div>
      </div>
    )
  }

  if (!session || !['DOCTOR', 'ADMIN'].includes(session.user.role)) {
    return null
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
                {notification.type === 'info' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Správa slotů
            </h1>
            <p className="text-gray-600">
              Vytvářejte a spravujte své dostupné termíny.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/slots/generovani"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center"
            >
              📅 Generovat sloty
            </Link>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              + Přidat slot
            </button>
          </div>
        </div>
      </div>

      {/* Formulář pro vytvoření slotu */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Nový slot</h2>
          <form onSubmit={createSlot} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Začátek *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  min={getTomorrowDateTime()}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konec * {formData.serviceTypeId && (
                    <span className="text-xs text-green-600">(automaticky podle služby)</span>
                  )}
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  min={formData.startTime || getTomorrowDateTime()}
                  required
                  disabled={!!formData.serviceTypeId}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.serviceTypeId ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
                {formData.serviceTypeId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Konec se automaticky vypočítá podle doby trvání vybrané služby
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordinace
                </label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Vyberte ordinaci...</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} {room.description && `(${room.description})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Druh služby
                </label>
                <select
                  value={formData.serviceTypeId}
                  onChange={(e) => handleServiceTypeChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Vyberte druh služby...</option>
                  {serviceTypes.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} • {service.duration} min
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poznámky
              </label>
              <input
                type="text"
                placeholder="Poznámky o vybavení"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.equipment}
                onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isCreating}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                {isCreating ? 'Vytváření...' : 'Vytvořit slot'}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ startTime: '', endTime: '', equipment: '', roomId: '', serviceTypeId: '' })}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Zrušit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtry */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtry</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Druh služby
            </label>
            <select
              value={filters.serviceTypeId}
              onChange={(e) => setFilters(prev => ({ ...prev, serviceTypeId: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Všechny služby</option>
              {serviceTypes.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordinace
            </label>
            <select
              value={filters.roomId}
              onChange={(e) => setFilters(prev => ({ ...prev, roomId: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Všechny ordinace</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name}
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
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stav
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Všechny stavy</option>
              <option value="available">Volné</option>
              <option value="reserved">Rezervované</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
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
            onClick={() => setFilters(prev => ({ ...prev, date: getTodayDateString() }))}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            Dnes
          </button>
          <button
            onClick={() => {
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              setFilters(prev => ({ ...prev, date: tomorrow.toLocaleDateString('sv-SE') }))
            }}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
          >
            Zítra
          </button>
          <button
            onClick={() => {
              const nextWeek = new Date()
              nextWeek.setDate(nextWeek.getDate() + 7)
              setFilters(prev => ({ ...prev, date: nextWeek.toLocaleDateString('sv-SE') }))
            }}
            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
          >
            Za týden
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: 'available' }))}
            className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors"
          >
            Pouze volné
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: 'reserved' }))}
            className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
          >
            Pouze rezervované
          </button>
        </div>

        {/* Počítadlo výsledků */}
        <div className="mt-4 text-sm text-gray-600">
          Zobrazeno: <span className="font-medium">{filteredSlots.length}</span> z <span className="font-medium">{slots.length}</span> slotů
        </div>
      </div>

      {/* Seznam slotů */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Vaše sloty</h2>
        
        {filteredSlots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {slots.length === 0 
              ? "Zatím nemáte žádné sloty. Vytvořte první slot pomocí tlačítka výše."
              : "Žádné sloty nevyhovují zvoleným filtrům."
            }
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSlots.map(slot => (
              <div 
                key={slot.id} 
                className={`border rounded-lg p-4 ${slot.reservations.length > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
              >
                {editingSlot === slot.id ? (
                  // Editační formulář
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Upravit slot</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Začátek *
                        </label>
                        <input
                          type="datetime-local"
                          value={editFormData.startTime}
                          onChange={(e) => handleEditStartTimeChange(e.target.value)}
                          required
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Konec * {editFormData.serviceTypeId && (
                            <span className="text-xs text-green-600">(automaticky podle služby)</span>
                          )}
                        </label>
                        <input
                          type="datetime-local"
                          value={editFormData.endTime}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, endTime: e.target.value }))}
                          min={editFormData.startTime}
                          required
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Místnost
                        </label>
                        <select
                          value={editFormData.roomId}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, roomId: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Vyberte místnost (volitelné)</option>
                          {rooms.map(room => (
                            <option key={room.id} value={room.id}>
                              {room.name} {room.description && `(${room.description})`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Druh služby
                        </label>
                        <select
                          value={editFormData.serviceTypeId}
                          onChange={(e) => handleEditServiceTypeChange(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Vyberte druh služby (volitelné)</option>
                          {serviceTypes.map(serviceType => (
                            <option key={serviceType.id} value={serviceType.id}>
                              {serviceType.name} ({serviceType.duration} min)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Poznámky
                        </label>
                        <input
                          type="text"
                          value={editFormData.equipment}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, equipment: e.target.value }))}
                          placeholder="Volitelné poznámky o slotu"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Zrušit
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSlot(slot.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Uložit změny
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normální zobrazení slotu
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {formatDisplayDateTime(new Date(slot.startTime))} - {formatDisplayDateTime(new Date(slot.endTime))}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <div className="space-y-2">
                            {slot.room && (
                              <div className="flex items-center text-sm text-gray-600">
                                <span>📍</span>
                                <span>{slot.room.name}</span>
                                {slot.room.description && (
                                  <span className="text-xs text-gray-500">({slot.room.description})</span>
                                )}
                              </div>
                            )}
                            
                            {slot.serviceType && (
                              <div className="flex items-center text-sm text-gray-600">
                                <span>🔧</span>
                                <span>{slot.serviceType.name}</span>
                              </div>
                            )}

                            {slot.equipment && (
                              <div className="flex items-center text-sm text-gray-600">
                                <span>📋</span>
                                <span>{slot.equipment}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            slot.reservations.length > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {slot.reservations.length > 0 ? 'Rezervováno' : 'Volný'}
                        </span>
                        
                        {/* Tlačítka pro akce */}
                        <div className="flex space-x-1">
                          <button
                            onClick={() => startEditSlot(slot)}
                            disabled={slot.reservations.length > 0}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                            title={slot.reservations.length > 0 ? 'Nelze upravit rezervovaný slot' : 'Upravit slot'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteSlot(slot.id)}
                            disabled={slot.reservations.length > 0 || deletingSlot === slot.id}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                            title={slot.reservations.length > 0 ? 'Nelze smazat rezervovaný slot' : 'Smazat slot'}
                          >
                            {deletingSlot === slot.id ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {slot.reservations.length > 0 && (
                  <div className="border-t border-green-200 pt-3 mt-3">
                    <h4 className="font-medium text-gray-700 mb-2">Rezervace:</h4>
                    {slot.reservations.map(reservation => (
                      <div key={reservation.id} className="bg-white rounded-md p-3 border border-green-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800">{reservation.user.name}</p>
                            <p className="text-sm text-gray-600">{reservation.user.email}</p>
                          </div>
                          {reservation.petName && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-700">{reservation.petName}</p>
                              {reservation.petType && (
                                <p className="text-xs text-gray-500">{reservation.petType}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
