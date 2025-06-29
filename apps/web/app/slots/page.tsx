'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Slot {
  id: string
  startTime: string
  endTime: string
  room?: string
  equipment?: string
  isAvailable: boolean
  doctor?: {
    user: {
      name: string
    }
  }
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
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    room: '',
    equipment: '',
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingSlot, setEditingSlot] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    startTime: '',
    endTime: '',
    room: '',
    equipment: '',
  })
  const [deletingSlot, setDeletingSlot] = useState<string | null>(null)

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
    }
  }, [session, status, router])

  const loadSlots = async () => {
    try {
      const response = await fetch('/api/slots', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSlots(data)
      } else {
        console.error('Chyba při načítání slotů:', response.statusText)
      }
    } catch (error) {
      console.error('Chyba při načítání slotů:', error)
    } finally {
      setLoading(false)
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
      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newSlot = await response.json()
        setSlots(prev => [...prev, newSlot])
        setFormData({ startTime: '', endTime: '', room: '', equipment: '' })
        setShowCreateForm(false)
        addNotification('success', 'Slot byl úspěšně vytvořen.')
      } else {
        let errorMessage = 'Chyba při vytváření slotu'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = await response.text() || errorMessage
        }
        addNotification('error', errorMessage)
      }
    } catch (error) {
      console.error('Chyba při vytváření slotu:', error)
      addNotification('error', 'Chyba při vytváření slotu. Zkuste to prosím znovu.')
    } finally {
      setIsCreating(false)
    }
  }

  const startEditSlot = (slot: Slot) => {
    setEditingSlot(slot.id)
    setEditFormData({
      startTime: new Date(slot.startTime).toISOString().slice(0, 16),
      endTime: new Date(slot.endTime).toISOString().slice(0, 16),
      room: slot.room || '',
      equipment: slot.equipment || '',
    })
  }

  const cancelEdit = () => {
    setEditingSlot(null)
    setEditFormData({ startTime: '', endTime: '', room: '', equipment: '' })
  }

  const updateSlot = async (slotId: string) => {
    if (!session?.user) {
      addNotification('error', 'Nejste přihlášeni.')
      return
    }

    try {
      const response = await fetch(`/api/slots/${slotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        const updatedSlot = await response.json()
        setSlots(prev => prev.map(slot => slot.id === slotId ? updatedSlot : slot))
        setEditingSlot(null)
        setEditFormData({ startTime: '', endTime: '', room: '', equipment: '' })
        addNotification('success', 'Slot byl úspěšně upraven.')
      } else {
        let errorMessage = 'Chyba při úpravě slotu'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = await response.text() || errorMessage
        }
        addNotification('error', errorMessage)
      }
    } catch (error) {
      console.error('Chyba při úpravě slotu:', error)
      addNotification('error', 'Chyba při úpravě slotu. Zkuste to prosím znovu.')
    }
  }

  const deleteSlot = async (slotId: string) => {
    if (!session?.user) {
      addNotification('error', 'Nejste přihlášeni.')
      return
    }

    setDeletingSlot(slotId)

    try {
      const response = await fetch(`/api/slots/${slotId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSlots(prev => prev.filter(slot => slot.id !== slotId))
        addNotification('success', 'Slot byl úspěšně smazán.')
      } else {
        let errorMessage = 'Chyba při mazání slotu'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = await response.text() || errorMessage
        }
        addNotification('error', errorMessage)
      }
    } catch (error) {
      console.error('Chyba při mazání slotu:', error)
      addNotification('error', 'Chyba při mazání slotu. Zkuste to prosím znovu.')
    } finally {
      setDeletingSlot(null)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('cs-CZ', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTomorrowDateTime = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    return tomorrow.toISOString().slice(0, 16)
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
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Přidat slot
          </button>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  min={getTomorrowDateTime()}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konec *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  min={formData.startTime || getTomorrowDateTime()}
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
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                  placeholder="např. Ordinace 1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vybavení
                </label>
                <input
                  type="text"
                  value={formData.equipment}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
                  placeholder="např. Základní vyšetření"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setFormData({ startTime: '', endTime: '', room: '', equipment: '' })
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Zrušit
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
              >
                {isCreating && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isCreating ? 'Vytváří se...' : 'Vytvořit slot'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Seznam slotů */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Vaše sloty</h2>
        
        {slots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Zatím nemáte žádné sloty. Vytvořte první slot pomocí tlačítka výše.
          </div>
        ) : (
          <div className="space-y-4">
            {slots.map(slot => (
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
                          onChange={(e) => setEditFormData(prev => ({ ...prev, startTime: e.target.value }))}
                          required
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Konec *
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
                        <input
                          type="text"
                          value={editFormData.room}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, room: e.target.value }))}
                          placeholder="např. Ordinace 1"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vybavení
                        </label>
                        <input
                          type="text"
                          value={editFormData.equipment}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, equipment: e.target.value }))}
                          placeholder="např. Základní vyšetření"
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
                          {formatDateTime(slot.startTime)} - {formatDateTime(slot.endTime)}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          {slot.room && (
                            <span>📍 {slot.room}</span>
                          )}
                          {slot.equipment && (
                            <span>🔧 {slot.equipment}</span>
                          )}
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
