'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { getTenantSlugFromUrl } from '@/lib/tenant'
import { getSlots, createReservation as apiCreateReservation } from '@/lib/api-client'

interface Slot {
  id: string
  startTime: string
  endTime: string
  room?: {
    id: string
    name: string
    description?: string
  }
  equipment?: string
  doctor: {
    specialization?: string
    user: {
      name: string
    }
  }
  serviceType?: {
    id: string
    name: string
    description?: string
    duration: number
    color?: string
  }
}

export default function NewReservationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slotId = searchParams.get('slotId')
  
  const [slot, setSlot] = useState<Slot | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    petName: '',
    petType: '',
    description: '',
    phone: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }

    if (!slotId) {
      router.push('/')
      return
    }

    loadSlotDetails()
  }, [session, status, slotId, router])

  const loadSlotDetails = async () => {
    if (!slotId) return

    try {
      const tenantSlug = session?.user?.tenant || getTenantSlugFromUrl()
      
      // Načti všechny sloty pomocí api-client
      const slots = await getSlots(tenantSlug)
      const foundSlot = slots.find((s: Slot) => s.id === slotId)
      setSlot(foundSlot || null)
    } catch (error) {
      console.error('Chyba při načítání slotu:', error)
      toast.error('Nepodařilo se načíst informace o termínu')
    }
  }

  const createReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!slotId || !session?.user?.userId) {
      toast.error('Chybí potřebné údaje pro rezervaci')
      return
    }

    setLoading(true)
    try {
      // Použij api-client který automaticky získá JWT token
      await apiCreateReservation({
        slotId,
        ...formData,
      })

      toast.success('Rezervace byla úspěšně vytvořena!')
      router.push('/rezervace')
    } catch (error: any) {
      console.error('Chyba při vytváření rezervace:', error)
      
      // Vylepšené zobrazení chyby z API
      if (error.message && error.message.includes('aktivní rezervaci na službu')) {
        // Speciální formátování pro duplicitní rezervace
        toast.error(error.message, {
          duration: 5000,
        })
      } else {
        // Standardní formátování pro ostatní chyby
        toast.error(error.message || 'Chyba při vytváření rezervace.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('cs-CZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading') {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600">Načítám...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (!slot) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Slot nenalezen
        </h1>
        <p className="text-gray-600 mb-6">
          Požadovaný termín nebyl nalezen nebo již není dostupný.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          Zpět na výběr termínů
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
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
          Nová rezervace
        </h1>
        <p className="text-gray-600">
          Vyplňte údaje pro rezervaci termínu.
        </p>
      </div>

      {/* Informace o slotu */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Vybraný termín</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-800">
              {slot.doctor.user.name}
            </h3>
            {slot.doctor.specialization && (
              <p className="text-sm text-gray-600">
                {slot.doctor.specialization}
              </p>
            )}
          </div>
          <div className="text-sm text-gray-600">
            <div className="mb-2">
              <span className="font-medium">Datum a čas:</span>
              <div className="mt-1">{formatDateTime(slot.startTime)}</div>
            </div>
            {slot.room && (
              <div className="mb-2">
                <span className="font-medium">Místnost:</span>
                <span className="ml-2">{slot.room.name}</span>
              </div>
            )}
            {slot.serviceType && (
              <div className="mb-2">
                <span className="font-medium">Typ služby:</span>
                <span className="ml-2">{slot.serviceType.name} ({slot.serviceType.duration} min)</span>
              </div>
            )}
            {slot.equipment && (
              <div>
                <span className="font-medium">Vybavení:</span>
                <span className="ml-2">{slot.equipment}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulář rezervace */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Údaje o rezervaci</h2>
        <form onSubmit={createReservation} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jméno mazlíčka
            </label>
            <input
              type="text"
              value={formData.petName}
              onChange={(e) => setFormData(prev => ({ ...prev, petName: e.target.value }))}
              placeholder="např. Rex"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Druh zvířete
            </label>
            <select
              value={formData.petType}
              onChange={(e) => setFormData(prev => ({ ...prev, petType: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefonní číslo
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="např. 777123456"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poznámka k návštěvě
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Popište důvod návštěvy, příznaky, nebo jiné poznámky..."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {loading ? 'Vytvářím...' : 'Vytvořit rezervaci'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 