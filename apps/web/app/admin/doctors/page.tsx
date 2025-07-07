'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'react-hot-toast'

interface Doctor {
  id: string
  specialization?: string
  description?: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
    username?: string
    isActive: boolean
  }
}

interface DoctorFormData {
  name: string
  email: string
  username: string
  phone: string
  specialization: string
  description: string
  password: string
}

export default function AdminDoctorsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [formData, setFormData] = useState<DoctorFormData>({
    name: '',
    email: '',
    username: '',
    phone: '',
    specialization: 'Malá zvířata',
    description: '',
    password: '',
  })

  // Redirect pokud není admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/')
      toast.error('Nemáte oprávnění k této stránce')
      return
    }
  }, [session, status, router])

  // Načtení doktorů
  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      loadDoctors()
    }
  }, [session])

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const { getDoctors } = await import('../../../lib/api-client')
      const doctorsData = await getDoctors()
      setDoctors(doctorsData)
    } catch (error: any) {
      console.error('Chyba při načítání doktorů:', error)
      toast.error('Chyba při načítání doktorů')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      username: '',
      phone: '',
      specialization: 'Malá zvířata',
      description: '',
      password: '',
    })
    setEditingDoctor(null)
    setShowAddForm(false)
  }

  const handleEdit = (doctor: Doctor) => {
    setFormData({
      name: doctor.user.name,
      email: doctor.user.email || '',
      username: doctor.user.username || '',
      phone: doctor.user.phone || '',
      specialization: doctor.specialization || 'Malá zvířata',
      description: doctor.description || '',
      password: '', // Heslo zůstane prázdné při editaci
    })
    setEditingDoctor(doctor)
    setShowAddForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingDoctor) {
        // Editace existujícího doktora
        await updateDoctor()
      } else {
        // Přidání nového doktora
        await createDoctor()
      }
      
      resetForm()
      loadDoctors()
    } catch (error: any) {
      console.error('Chyba při ukládání doktora:', error)
      toast.error(error.message || 'Chyba při ukládání doktora')
    }
  }

  const createDoctor = async () => {
    const { createDoctor: apiCreateDoctor } = await import('../../../lib/api-client')
    
    const doctorData = {
      name: formData.name,
      email: formData.email || null,
      username: formData.username,
      phone: formData.phone || null,
      specialization: formData.specialization,
      description: formData.description,
      password: formData.password,
    }
    
    await apiCreateDoctor(doctorData)
    toast.success('Doktor byl úspěšně přidán')
  }

  const updateDoctor = async () => {
    if (!editingDoctor) return
    
    const { updateDoctor: apiUpdateDoctor } = await import('../../../lib/api-client')
    
    const updateData = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      specialization: formData.specialization,
      description: formData.description,
      ...(formData.password && { password: formData.password }), // Heslo pouze pokud je zadané
    }
    
    await apiUpdateDoctor(editingDoctor.id, updateData)
    toast.success('Doktor byl úspěšně aktualizován')
  }

  const toggleDoctorStatus = async (doctor: Doctor) => {
    try {
      const { toggleDoctorStatus: apiToggleStatus } = await import('../../../lib/api-client')
      await apiToggleStatus(doctor.id, !doctor.user.isActive)
      
      toast.success(
        doctor.user.isActive 
          ? 'Doktor byl deaktivován' 
          : 'Doktor byl aktivován'
      )
      loadDoctors()
    } catch (error: any) {
      console.error('Chyba při změně stavu doktora:', error)
      toast.error('Chyba při změně stavu doktora')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="bottom-right" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Správa doktorů</h1>
          <p className="text-gray-600">
            Přidávání, editace a správa doktorů v ordinaci
          </p>
        </div>

        {/* Tlačítko pro přidání nového doktora */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            ➕ Přidat nového doktora
          </button>
        </div>

        {/* Formulář pro přidání/editaci doktora */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingDoctor ? '✏️ Editace doktora' : '➕ Nový doktor'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ❌
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jméno *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="MVDr. Jméno Příjmení"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username * {editingDoctor && '(nelze změnit)'}
                      </label>
                      <input
                        type="text"
                        required={!editingDoctor}
                        disabled={!!editingDoctor}
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="jmeno.prijmeni"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="doktor@veterina-svahy.cz"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+420 777 123 456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specializace
                      </label>
                      <select
                        value={formData.specialization}
                        onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Malá zvířata">Malá zvířata</option>
                        <option value="Velká zvířata">Velká zvířata</option>
                        <option value="Chirurgie">Chirurgie</option>
                        <option value="Dermatologie">Dermatologie</option>
                        <option value="Kardiologie">Kardiologie</option>
                        <option value="Onkologie">Onkologie</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Heslo {editingDoctor && '(ponechte prázdné pro zachování)'}
                      </label>
                      <input
                        type="password"
                        required={!editingDoctor}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={editingDoctor ? "Nové heslo..." : "Heslo"}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Popis
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Krátký popis specializace a zkušeností..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Zrušit
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      {editingDoctor ? 'Aktualizovat' : 'Přidat doktora'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Seznam doktorů */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Seznam doktorů ({doctors.length})
            </h2>
          </div>

          {doctors.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Žádní doktoři nenalezeni</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doktor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kontakt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specializace
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akce
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {doctors.map((doctor) => (
                    <tr key={doctor.id} className={!doctor.user.isActive ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {doctor.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{doctor.user.username}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {doctor.user.email || 'Bez emailu'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {doctor.user.phone || 'Bez telefonu'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {doctor.specialization}
                        </div>
                        {doctor.description && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {doctor.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          doctor.user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {doctor.user.isActive ? 'Aktivní' : 'Neaktivní'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(doctor)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          ✏️ Editovat
                        </button>
                        <button
                          onClick={() => toggleDoctorStatus(doctor)}
                          className={`transition-colors ${
                            doctor.user.isActive 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {doctor.user.isActive ? '🚫 Deaktivovat' : '✅ Aktivovat'}
                        </button>
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