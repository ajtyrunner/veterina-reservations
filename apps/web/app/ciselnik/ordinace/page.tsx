'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

interface Room {
  id: string
  name: string
  description?: string
  capacity: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function OrdinacePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 1,
    isActive: true,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user?.role !== 'DOCTOR' && session?.user?.role !== 'ADMIN') {
      router.push('/')
      return
    }

    loadRooms()
  }, [session, status, router])

  const loadRooms = async () => {
    try {
      const response = await fetch('/api/rooms')
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      } else {
        toast.error('Chyba při načítání ordinací')
      }
    } catch (error) {
      console.error('Chyba při načítání ordinací:', error)
      toast.error('Chyba při načítání ordinací')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms'
      const method = editingRoom ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingRoom ? 'Ordinace aktualizována' : 'Ordinace vytvořena')
        resetForm()
        loadRooms()
      } else {
        const error = await response.json()
        toast.error(`Chyba: ${error.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Chyba při ukládání:', error)
      toast.error('Chyba při ukládání')
    }
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      description: room.description || '',
      capacity: room.capacity,
      isActive: room.isActive,
    })
    setShowForm(true)
  }

  const handleDelete = async (roomId: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast((t) => (
        <div className="flex flex-col gap-3">
          <div className="font-medium text-gray-900">
            Opravdu chcete smazat tuto ordinaci?
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                resolve(false)
              }}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Zrušit
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                resolve(true)
              }}
              className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
            >
              Smazat
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        style: { maxWidth: '400px' }
      })
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Ordinace smazána')
        loadRooms()
      } else {
        const error = await response.json()
        toast.error(`Chyba: ${error.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Chyba při mazání:', error)
      toast.error('Chyba při mazání')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      capacity: 1,
      isActive: true,
    })
    setEditingRoom(null)
    setShowForm(false)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600">Načítám...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div>
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

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Správa ordinací
        </h2>
        <p className="text-gray-600">
          Spravujte místnosti a ordinace ve vaší veterinární klinice.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Přidat ordinaci
        </button>
      </div>

      {/* Formulář */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingRoom ? 'Upravit ordinaci' : 'Nová ordinace'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Název ordinace
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="např. Ordinace 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Popis
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Popis ordinace..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kapacita
              </label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">Aktivní</label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {editingRoom ? 'Aktualizovat' : 'Vytvořit'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Zrušit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Seznam ordinací */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Seznam ordinací</h2>
          {rooms.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Žádné ordinace nenalezeny.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Název</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Popis</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Kapacita</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(room => (
                    <tr key={room.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium">{room.name}</td>
                      <td className="py-3 px-4 text-gray-600">{room.description || '-'}</td>
                      <td className="py-3 px-4">{room.capacity}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          room.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {room.isActive ? 'Aktivní' : 'Neaktivní'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(room)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Upravit
                          </button>
                          <button
                            onClick={() => handleDelete(room.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Smazat
                          </button>
                        </div>
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