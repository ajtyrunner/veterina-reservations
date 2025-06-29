'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

interface ServiceType {
  id: string
  name: string
  description?: string
  duration: number
  price?: number
  color?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function SluzbyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: '',
    color: '#3B82F6',
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

    loadServiceTypes()
  }, [session, status, router])

  const loadServiceTypes = async () => {
    try {
      const response = await fetch('/api/service-types')
      if (response.ok) {
        const data = await response.json()
        setServiceTypes(data)
      } else {
        toast.error('Chyba při načítání druhů služeb')
      }
    } catch (error) {
      console.error('Chyba při načítání druhů služeb:', error)
      toast.error('Chyba při načítání druhů služeb')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingServiceType ? `/api/service-types/${editingServiceType.id}` : '/api/service-types'
      const method = editingServiceType ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          durationMinutes: formData.duration, // API očekává durationMinutes
          price: formData.price ? parseFloat(formData.price) : null,
        }),
      })

      if (response.ok) {
        toast.success(editingServiceType ? 'Druh služby aktualizován' : 'Druh služby vytvořen')
        resetForm()
        loadServiceTypes()
      } else {
        const error = await response.json()
        toast.error(`Chyba: ${error.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Chyba při ukládání:', error)
      toast.error('Chyba při ukládání')
    }
  }

  const handleEdit = (serviceType: ServiceType) => {
    setEditingServiceType(serviceType)
    setFormData({
      name: serviceType.name,
      description: serviceType.description || '',
      duration: serviceType.duration,
      price: serviceType.price?.toString() || '',
      color: serviceType.color || '#3B82F6',
      isActive: serviceType.isActive,
    })
    setShowForm(true)
  }

  const handleDelete = async (serviceTypeId: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast((t) => (
        <div className="flex flex-col gap-3">
          <div className="font-medium text-gray-900">
            Opravdu chcete smazat tento druh služby?
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
      const response = await fetch(`/api/service-types/${serviceTypeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Druh služby smazán')
        loadServiceTypes()
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
      duration: 30,
      price: '',
      color: '#3B82F6',
      isActive: true,
    })
    setEditingServiceType(null)
    setShowForm(false)
  }

  const formatPrice = (price?: number) => {
    if (!price) return '-'
    return new Intl.NumberFormat('cs-CZ', { 
      style: 'currency', 
      currency: 'CZK' 
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours} h`
    }
    return `${hours} h ${remainingMinutes} min`
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
          Správa druhů služeb
        </h2>
        <p className="text-gray-600">
          Spravujte typy úkonů, vyšetření a služeb vaší veterinární kliniky.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Přidat druh služby
        </button>
      </div>

      {/* Formulář */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {editingServiceType ? 'Upravit druh služby' : 'Nový druh služby'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Název služby *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="např. Základní vyšetření"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doba trvání (minuty) *
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                placeholder="Popis služby..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cena (CZK)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barva pro kalendář
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
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
                {editingServiceType ? 'Aktualizovat' : 'Vytvořit'}
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

      {/* Seznam druhů služeb */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Seznam druhů služeb</h3>
          {serviceTypes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Žádné druhy služeb nenalezeny.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Název</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Popis</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Doba trvání</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cena</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Barva</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceTypes.map(serviceType => (
                    <tr key={serviceType.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium">{serviceType.name}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {serviceType.description || '-'}
                      </td>
                      <td className="py-3 px-4">{formatDuration(serviceType.duration)}</td>
                      <td className="py-3 px-4">{formatPrice(serviceType.price)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: serviceType.color }}
                          />
                          <span className="text-xs text-gray-500">{serviceType.color}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          serviceType.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {serviceType.isActive ? 'Aktivní' : 'Neaktivní'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(serviceType)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Upravit
                          </button>
                          <button
                            onClick={() => handleDelete(serviceType.id)}
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