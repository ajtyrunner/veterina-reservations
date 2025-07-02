'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { formatDisplayTime, formatDisplayDate } from '../../lib/timezone'

interface Reservation {
  id: string
  petName?: string
  petType?: string
  description?: string
  status: string
  createdAt: string
  slot: {
    startTime: string
    endTime: string
    room?: string
    equipment?: string
    doctor: {
      user: {
        name: string
      }
    }
  }
}

export default function ReservationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingReservation, setCancelingReservation] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }

    if (session?.user?.userId) {
      loadReservations()
    }
  }, [session, status, router])

  const loadReservations = async () => {
    try {
      const { getReservations } = await import('../../lib/api-client')
      const data = await getReservations()
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Rezervace načteny z Railway:', data)
      }
      setReservations(data)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Chyba při načítání rezervací z Railway:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const cancelReservation = (reservationId: string) => {
    setCancelingReservation(reservationId)
  }

  const confirmCancelReservation = async (reservationId: string) => {
    try {
      const { deleteReservation } = await import('../../lib/api-client')
      await deleteReservation(reservationId)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Rezervace zrušena v Railway')
      }
      setReservations(prev => prev.filter(r => r.id !== reservationId))
      toast.success('Rezervace byla úspěšně zrušena.')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Chyba při rušení rezervace v Railway:', error)
      }
      toast.error(`Chyba: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
    }
  }

  // Používáme unifikované funkce z timezone.ts
  // const formatTime = formatDisplayTime
  // const formatDate = formatDisplayDate

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Čeká na potvrzení'
      case 'CONFIRMED':
        return 'Potvrzeno'
      case 'CANCELLED':
        return 'Zrušeno'
      case 'COMPLETED':
        return 'Dokončeno'
      default:
        return status
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600">Načítám rezervace...</div>
      </div>
    )
  }

  if (!session) {
    return null // Router push už probíhá
  }

  return (
    <div>
      {/* Overlay pro zavření modalu při kliknutí mimo */}
      {cancelingReservation && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setCancelingReservation(null)}
        />
      )}
      
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            duration: 3000,
            style: {
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ffffff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Moje rezervace
        </h1>
        <p className="text-gray-600">
          Přehled všech vašich rezervací v ordinaci.
        </p>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Žádné rezervace
          </h3>
          <p className="text-gray-500 mb-6">
            Nemáte zatím žádné rezervace. Vytvořte si novou rezervaci.
          </p>
          <a
            href="/"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Vytvořit rezervaci
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map(reservation => (
            <div key={reservation.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {reservation.slot.doctor.user.name}
                  </h3>
                  <div className="flex items-center mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                      {getStatusText(reservation.status)}
                    </span>
                  </div>
                </div>
                {reservation.status === 'PENDING' && (
                  <div className="relative">
                    <button
                      onClick={() => cancelReservation(reservation.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Zrušit rezervaci
                    </button>
                    
                    {cancelingReservation === reservation.id && (
                      <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-[280px]">
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Opravdu chcete zrušit tuto rezervaci?
                          </p>
                          <p className="text-xs text-gray-500">
                            Tato akce je nevratná.
                          </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setCancelingReservation(null)}
                            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                          >
                            Zrušit
                          </button>
                          <button
                            onClick={() => {
                              setCancelingReservation(null)
                              confirmCancelReservation(reservation.id)
                            }}
                            className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                          >
                            Ano, zrušit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <p>Datum: {formatDisplayDate(new Date(reservation.slot.startTime))}</p>
                <p>Čas: {formatDisplayTime(new Date(reservation.slot.startTime))} - {formatDisplayTime(new Date(reservation.slot.endTime))}</p>
                {reservation.slot.room && <p>Místnost: {reservation.slot.room}</p>}
                {reservation.slot.equipment && <p>Vybavení: {reservation.slot.equipment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
