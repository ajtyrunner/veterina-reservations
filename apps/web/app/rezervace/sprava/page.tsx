'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'

interface Reservation {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  petName?: string
  petType?: string
  description?: string
  createdAt: string
  user: {
    name: string
    email: string
  }
  doctor: {
    user: {
      name: string
    }
  }
  slot: {
    startTime: string
    endTime: string
    room?: string
  }
}

type NotificationType = 'success' | 'error' | 'info'

interface Notification {
  id: string
  type: NotificationType
  message: string
}

const statusLabels = {
  PENDING: 'Čeká na potvrzení',
  CONFIRMED: 'Potvrzeno',
  CANCELLED: 'Zrušeno',
  COMPLETED: 'Dokončeno',
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
}

export default function ReservationManagementPage() {
  const { data: session, status } = useSession()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [updatingReservation, setUpdatingReservation] = useState<string | null>(null)

  // Redirect pokud není přihlášen nebo není doktor/admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/login')
    }
    if (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN') {
      redirect('/')
    }
  }, [session, status])

  useEffect(() => {
    if (session) {
      loadReservations()
    }
  }, [session, selectedStatus])

  const addNotification = (type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substring(7)
    const notification = { id, type, message }
    setNotifications(prev => [...prev, notification])
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const loadReservations = async () => {
    setLoading(true)
    try {
      const { getDoctorReservations } = await import('../../../lib/api-client')
      const data = await getDoctorReservations(selectedStatus || undefined)
      console.log('✅ Doctor rezervace načteny z Railway:', data)
      setReservations(data)
    } catch (error) {
      console.error('Chyba při načítání rezervací z Railway:', error)
      addNotification('error', `Chyba: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
    } finally {
      setLoading(false)
    }
  }

  const updateReservationStatus = async (reservationId: string, newStatus: string) => {
    setUpdatingReservation(reservationId)
    try {
      const { updateDoctorReservationStatus } = await import('../../../lib/api-client')
      await updateDoctorReservationStatus(reservationId, newStatus)
      console.log('✅ Stav rezervace aktualizován v Railway')
      addNotification('success', 'Stav rezervace byl úspěšně aktualizován')
      loadReservations() // Obnovit seznam
    } catch (error) {
      console.error('Chyba při aktualizaci rezervace v Railway:', error)
      addNotification('error', `Chyba: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
    } finally {
      setUpdatingReservation(null)
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || !session) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Správa rezervací</h1>
          <p className="text-gray-600">
            Spravujte rezervace ve vaší ordinaci
          </p>
        </div>

        {/* Filtry */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrovat podle stavu
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Všechny stavy</option>
                <option value="PENDING">Čeká na potvrzení</option>
                <option value="CONFIRMED">Potvrzeno</option>
                <option value="CANCELLED">Zrušeno</option>
                <option value="COMPLETED">Dokončeno</option>
              </select>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={loadReservations}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Načítám...' : 'Obnovit'}
              </button>
            </div>
          </div>
        </div>

        {/* Seznam rezervací */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Načítám rezervace...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>Žádné rezervace nenalezeny</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Klient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Termín
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zvíře
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stav
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akce
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reservation.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDateTime(reservation.slot.startTime)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(reservation.slot.startTime)} - {formatTime(reservation.slot.endTime)}
                            {reservation.slot.room && ` • ${reservation.slot.room}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.petName || 'Nespecifikováno'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reservation.petType || 'Nespecifikováno'}
                          </div>
                          {reservation.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {reservation.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[reservation.status]}`}>
                          {statusLabels[reservation.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {reservation.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateReservationStatus(reservation.id, 'CONFIRMED')}
                              disabled={updatingReservation === reservation.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              {updatingReservation === reservation.id ? 'Aktualizuji...' : 'Potvrdit'}
                            </button>
                            <button
                              onClick={() => updateReservationStatus(reservation.id, 'CANCELLED')}
                              disabled={updatingReservation === reservation.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Zrušit
                            </button>
                          </>
                        )}
                        {reservation.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => updateReservationStatus(reservation.id, 'COMPLETED')}
                              disabled={updatingReservation === reservation.id}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            >
                              {updatingReservation === reservation.id ? 'Aktualizuji...' : 'Dokončit'}
                            </button>
                            <button
                              onClick={() => updateReservationStatus(reservation.id, 'CANCELLED')}
                              disabled={updatingReservation === reservation.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Zrušit
                            </button>
                          </>
                        )}
                        {(reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED') && (
                          <span className="text-gray-400">Žádné akce</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 