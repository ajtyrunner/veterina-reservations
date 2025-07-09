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
    room?: {
      name: string
      description?: string
    }
    equipment?: string
    serviceType?: {
      name: string
      duration: number
      color: string
    }
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
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE') // Výchozí filtr na aktivní rezervace (čekající + potvrzené)
  const [filtersExpanded, setFiltersExpanded] = useState(false) // State pro sbalení/rozbalení filtrů

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

  // Filtrování rezervací podle stavu
  const filteredReservations = reservations.filter(reservation => {
    if (!statusFilter || statusFilter === '') return true
    if (statusFilter === 'ACTIVE') {
      return reservation.status === 'PENDING' || reservation.status === 'CONFIRMED'
    }
    return reservation.status === statusFilter
  })

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
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">
            Moje rezervace
          </h1>
          {/* Tooltip ikona */}
          <div className="relative group">
            <svg className="w-5 h-5 text-gray-400 hover:text-blue-500 cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {/* Tooltip obsah */}
            <div className="absolute left-0 top-6 w-80 bg-gray-900 text-white text-sm rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="font-medium mb-1">Zobrazení rezervací</div>
              <div>Ve výchozím nastavení jsou zobrazeny pouze <strong>aktivní rezervace</strong> (čekající na potvrzení a potvrzené). Pro zobrazení zrušených nebo dokončených rezervací použijte filtry níže.</div>
              {/* Šipka tooltip */}
              <div className="absolute -top-1 left-3 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Přehled všech vašich rezervací v ordinaci.
        </p>
      </div>

      {/* Sbalitelné filtry */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        {/* Hlavička filtrů */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Filtry</h2>
            <span className="text-sm text-gray-500">
              ({filteredReservations.length} z {reservations.length} rezervací)
            </span>
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${filtersExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Obsah filtrů */}
        {filtersExpanded && (
          <div className="px-4 pb-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stav rezervace</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Všechny stavy</option>
                  <option value="ACTIVE">Aktivní (čekající + potvrzené)</option>
                  <option value="PENDING">Čeká na potvrzení</option>
                  <option value="CONFIRMED">Potvrzeno</option>
                  <option value="CANCELLED">Zrušeno</option>
                  <option value="COMPLETED">Dokončeno</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setStatusFilter('')}
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
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  statusFilter === 'ACTIVE' 
                    ? 'bg-purple-200 text-purple-800 font-medium' 
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                Aktivní
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  statusFilter === 'PENDING' 
                    ? 'bg-yellow-200 text-yellow-800 font-medium' 
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                Čekající
              </button>
              <button
                onClick={() => setStatusFilter('CONFIRMED')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  statusFilter === 'CONFIRMED' 
                    ? 'bg-green-200 text-green-800 font-medium' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Potvrzené
              </button>
              <button
                onClick={() => setStatusFilter('CANCELLED')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  statusFilter === 'CANCELLED' 
                    ? 'bg-red-200 text-red-800 font-medium' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                Zrušeno
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  statusFilter === 'COMPLETED' 
                    ? 'bg-blue-200 text-blue-800 font-medium' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Dokončené
              </button>
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  statusFilter === '' 
                    ? 'bg-gray-200 text-gray-800 font-medium' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Vše
              </button>
            </div>
          </div>
        )}
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
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
      ) : filteredReservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Žádné rezervace nevyhovují filtru
          </h3>
          <p className="text-gray-500 mb-6">
            Zkuste změnit filtr nebo vymažte všechny filtry pro zobrazení všech rezervací.
          </p>
          <button
            onClick={() => setStatusFilter('')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Vymazat filtry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map(reservation => (
            <div key={reservation.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Ikona doktora */}
                    <div className="flex items-center text-blue-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-lg font-semibold text-gray-800">
                        {reservation.slot.doctor.user.name}
                      </span>
                    </div>
                    
                    {/* Služba */}
                    {reservation.slot.serviceType && (
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: reservation.slot.serviceType.color }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {reservation.slot.serviceType.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({reservation.slot.serviceType.duration} min)
                        </span>
                      </div>
                    )}
                  </div>
                  
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
              
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                      </svg>
                      <span>Datum: {formatDisplayDate(new Date(reservation.slot.startTime))}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Čas: {formatDisplayTime(new Date(reservation.slot.startTime))} - {formatDisplayTime(new Date(reservation.slot.endTime))}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {reservation.slot.room && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Místnost: {reservation.slot.room.name}</span>
                      </div>
                    )}
                    {reservation.slot.equipment && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>Vybavení: {reservation.slot.equipment}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Informace o zvířeti */}
                {(reservation.petName || reservation.petType || reservation.description) && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Informace o zvířeti:</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      {reservation.petName && <p>Jméno: {reservation.petName}</p>}
                      {reservation.petType && <p>Druh: {reservation.petType}</p>}
                      {reservation.description && <p>Poznámka: {reservation.description}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
