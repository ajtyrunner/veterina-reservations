'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { formatTimezoneDateTime } from '../../../lib/timezone'

interface ServiceType {
  id: string
  name: string
  duration: number
  color?: string
}

interface Room {
  id: string
  name: string
  description?: string
}

interface Doctor {
  id: string
  specialization?: string
  user: {
    name: string
  }
}

interface BulkGenerationForm {
  weekdays: number[]
  startTime: string
  endTime: string
  interval: number
  serviceTypeId: string
  roomId: string
  weeksCount: number
  startDate: string
  breakTimes: Array<{ start: string; end: string }>
  doctorId?: string
}

interface PreviewSlot {
  date: string
  startTime: string
  endTime: string
  weekday: string
}

interface GenerationResult {
  message: string
  createdCount: number
  conflictsCount: number
  conflicts: Array<{
    date: string
    startTime: string
    endTime: string
  }>
}

const WEEKDAYS = [
  { value: 1, label: 'Pondělí', short: 'Po' },
  { value: 2, label: 'Úterý', short: 'Út' },
  { value: 3, label: 'Středa', short: 'St' },
  { value: 4, label: 'Čtvrtek', short: 'Čt' },
  { value: 5, label: 'Pátek', short: 'Pá' },
  { value: 6, label: 'Sobota', short: 'So' },
  { value: 0, label: 'Neděle', short: 'Ne' },
]

const INTERVALS = [
  { value: 0, label: 'Nepřetržitě (0 min)' },
  { value: 5, label: '5 minut' },
  { value: 10, label: '10 minut' },
  { value: 15, label: '15 minut' },
  { value: 20, label: '20 minut' },
  { value: 30, label: '30 minut' },
  { value: 45, label: '45 minut' },
  { value: 60, label: '1 hodina' },
]

export default function BulkSlotGenerationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewSlots, setPreviewSlots] = useState<PreviewSlot[]>([])

  const [form, setForm] = useState<BulkGenerationForm>({
    weekdays: [1, 2, 3, 4, 5], // Po-Pá default
    startTime: '08:00',
    endTime: '17:00',
    interval: 30,
    serviceTypeId: '',
    roomId: '',
    weeksCount: 4,
    startDate: '',
    breakTimes: [{ start: '12:00', end: '13:00' }], // Oběd default
    doctorId: '',
  })

  // Redirect pokud není doktor/admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  // Nastavení defaultního data na zítřek
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    setForm(prev => ({ ...prev, startDate: tomorrowStr }))
  }, [])

  // Načtení dat
  useEffect(() => {
    if (session) {
      loadData()
    }
  }, [session])

  const loadData = async () => {
    setLoading(true)
    try {
      const { getServiceTypes, getRooms, getDoctors } = await import('../../../lib/api-client')
      
      if (!session) {
        throw new Error('Session is not available')
      }
      
      const promises = [
        getServiceTypes(session.user.tenantId),
        getRooms(),
      ]
      
      // Přidej getDoctors pouze pro ADMIN
      if (session?.user.role === 'ADMIN') {
        promises.push(getDoctors(session.user.tenantId))
      }
      
      const results = await Promise.all(promises)
      
      setServiceTypes(results[0] || [])
      setRooms(results[1] || [])
      
      if (session?.user.role === 'ADMIN' && results[2]) {
        setDoctors(results[2])
      }
    } catch (error) {
      console.error('Chyba při načítání dat:', error)
      toast.error('Chyba při načítání dat')
    } finally {
      setLoading(false)
    }
  }

  const handleWeekdayToggle = (weekday: number) => {
    setForm(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(weekday)
        ? prev.weekdays.filter(w => w !== weekday)
        : [...prev.weekdays, weekday].sort()
    }))
  }

  const addBreakTime = () => {
    setForm(prev => ({
      ...prev,
      breakTimes: [...prev.breakTimes, { start: '12:00', end: '13:00' }]
    }))
  }

  const removeBreakTime = (index: number) => {
    setForm(prev => ({
      ...prev,
      breakTimes: prev.breakTimes.filter((_, i) => i !== index)
    }))
  }

  const updateBreakTime = (index: number, field: 'start' | 'end', value: string) => {
    setForm(prev => ({
      ...prev,
      breakTimes: prev.breakTimes.map((bt, i) => 
        i === index ? { ...bt, [field]: value } : bt
      )
    }))
  }

  const generatePreview = () => {
    const slots: PreviewSlot[] = []
    const baseDate = new Date(form.startDate)
    
    for (let week = 0; week < form.weeksCount; week++) {
      for (const weekday of form.weekdays) {
        const targetDate = new Date(baseDate)
        const daysToAdd = (weekday - baseDate.getDay() + 7) % 7 + (week * 7)
        targetDate.setDate(baseDate.getDate() + daysToAdd)
        
        const dateStr = targetDate.toLocaleDateString('cs-CZ')
        const weekdayName = WEEKDAYS.find(w => w.value === weekday)?.short || ''
        
        // Najdi délku služby pro inteligentní sloty
        const selectedServiceType = serviceTypes.find(st => st.id === form.serviceTypeId)
        const serviceTypeDuration = selectedServiceType?.duration
        
        // Generuj sloty pro tento den s inteligentní logikou
        const daySlots = generateDayPreview(form.startTime, form.endTime, form.interval, form.breakTimes, serviceTypeDuration)
        
        for (const slot of daySlots) {
          slots.push({
            date: dateStr,
            startTime: slot.start,
            endTime: slot.end,
            weekday: weekdayName,
          })
        }
      }
    }
    
    setPreviewSlots(slots)
    setShowPreview(true)
  }

  const generateDayPreview = (startTime: string, endTime: string, interval: number, breakTimes: Array<{start: string, end: string}>, serviceTypeDuration?: number) => {
    const slots = []
    
    // Určení skutečné délky slotu (inteligentní sloty)
    const actualSlotDuration = serviceTypeDuration || interval || 30 // fallback na 30 min
    const stepInterval = interval || actualSlotDuration // interval pro posun začátků
    
    // Speciální případ: interval 0 = jeden nepřetržitý slot
    if (interval === 0) {
      // Kontrola, jestli celý rozsah nekoliduje s přestávkou
      let isInBreak = false
      for (const breakTime of breakTimes) {
        if (startTime >= breakTime.start && startTime < breakTime.end) {
          isInBreak = true
          break
        }
      }
      
      if (!isInBreak) {
        slots.push({ start: startTime, end: endTime })
      }
      return slots
    }
    
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    let currentHour = startHour
    let currentMin = startMin
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
      
      // INTELIGENTNÍ SLOTY: Délka slotu podle služby
      let slotEndHour = currentHour
      let slotEndMin = currentMin + actualSlotDuration
      
      if (slotEndMin >= 60) {
        slotEndHour += Math.floor(slotEndMin / 60)
        slotEndMin = slotEndMin % 60
      }
      
      const slotEnd = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`
      
      // Slot nesmí přesahovat konec pracovní doby
      if (slotEndHour > endHour || (slotEndHour === endHour && slotEndMin > endMin)) {
        break
      }
      
      // Kontrola přestávek - slot nesmí začínat v přestávce ani do ní zasahovat
      let isInBreak = false
      for (const breakTime of breakTimes) {
        if (slotStart >= breakTime.start && slotStart < breakTime.end) {
          isInBreak = true
          break
        }
        if (slotStart < breakTime.start && slotEnd > breakTime.start) {
          isInBreak = true
          break
        }
      }
      
      if (!isInBreak) {
        slots.push({ start: slotStart, end: slotEnd })
      }
      
      // Přejdi na další slot podle step intervalu (ne podle délky slotu!)
      currentMin += stepInterval
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60)
        currentMin = currentMin % 60
      }
    }
    
    return slots
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (form.weekdays.length === 0) {
      toast.error('Vyberte alespoň jeden den v týdnu')
      return
    }
    
    if (form.startTime >= form.endTime) {
      toast.error('Čas začátku musí být před časem konce')
      return
    }
    
    setGenerating(true)
    try {
      const { bulkGenerateSlots } = await import('../../../lib/api-client')
      
      const result: GenerationResult = await bulkGenerateSlots({
        weekdays: form.weekdays,
        startTime: form.startTime,
        endTime: form.endTime,
        interval: form.interval,
        serviceTypeId: form.serviceTypeId || undefined,
        roomId: form.roomId || undefined,
        weeksCount: form.weeksCount,
        startDate: form.startDate,
        breakTimes: form.breakTimes,
        doctorId: form.doctorId || undefined,
      })
      
      toast.success(result.message)
      
      if (result.conflictsCount > 0) {
        toast(`⚠️ ${result.conflictsCount} slotů bylo přeskočeno kvůli konfliktům`, {
          icon: '⚠️',
          style: {
            background: '#fef3c7',
            color: '#d97706',
            border: '1px solid #f59e0b',
          }
        })
      }
      
      setShowPreview(false)
      
      // Přesměruj zpět na správu slotů
      setTimeout(() => {
        router.push('/slots')
      }, 2000)
      
    } catch (error) {
      console.error('Chyba při generování slotů:', error)
      toast.error(`Chyba: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
    } finally {
      setGenerating(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="bottom-right" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📅 Generování slotů
          </h1>
          <p className="text-gray-600">
            Vytvořte sloty podle rozvrhu pro více týdnů najednou
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. ROZVRH */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🗓️ 1. Rozvrh - Dny v týdnu
              </h2>
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAYS.map((weekday) => (
                  <button
                    key={weekday.value}
                    type="button"
                    onClick={() => handleWeekdayToggle(weekday.value)}
                    className={`p-3 text-sm font-medium rounded-md transition-colors ${
                      form.weekdays.includes(weekday.value)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-bold">{weekday.short}</div>
                    <div className="text-xs">{weekday.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. ČASOVÉ ROZMEZÍ */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                ⏰ 2. Časové rozmezí
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Čas začátku
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Čas konce
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interval mezi sloty
                  </label>
                  <select
                    value={form.interval}
                    onChange={(e) => setForm(prev => ({ ...prev, interval: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {INTERVALS.map((interval) => (
                      <option key={interval.value} value={interval.value}>
                        {interval.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. SLUŽBY A MÍSTNOST */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🏥 3. Služby a místnost
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ služby (volitelné)
                </label>
                <select
                  value={form.serviceTypeId}
                  onChange={(e) => setForm(prev => ({ ...prev, serviceTypeId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Bez typu služby --</option>
                  {serviceTypes.map((serviceType) => (
                    <option key={serviceType.id} value={serviceType.id}>
                      {serviceType.name} ({serviceType.duration} min)
                    </option>
                  ))}
                </select>
                
                {/* Inteligentní sloty info */}
                {form.serviceTypeId && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-0.5">🧠</span>
                      <div className="text-sm text-blue-700">
                        <strong>Inteligentní sloty:</strong>
                        {(() => {
                          const selectedService = serviceTypes.find(st => st.id === form.serviceTypeId)
                          if (selectedService && selectedService.duration !== form.interval) {
                            return (
                              <div>
                                • Délka slotů: <strong>{selectedService.duration} min</strong> (podle služby)<br/>
                                • Interval začátků: <strong>{form.interval} min</strong><br/>
                                • Sloty se budou překrývat pro flexibilní rezervace
                              </div>
                            )
                          } else if (selectedService && selectedService.duration === form.interval) {
                            return (
                              <div>
                                • Délka slotů i interval: <strong>{selectedService.duration} min</strong><br/>
                                • Sloty budou navazovat bez překrývání
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Místnost (volitelné)
                  </label>
                  <select
                    value={form.roomId}
                    onChange={(e) => setForm(prev => ({ ...prev, roomId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Bez místnosti --</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 4. OPAKOVÁNÍ */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🔄 4. Opakování
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Počet týdnů
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={form.weeksCount}
                    onChange={(e) => setForm(prev => ({ ...prev, weeksCount: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Datum začátku
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 5. ADMIN - VÝBĚR DOKTORA */}
            {session.user.role === 'ADMIN' && doctors.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  👨‍⚕️ 5. Doktor (pouze admin)
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vyberte doktora
                  </label>
                  <select
                    value={form.doctorId}
                    onChange={(e) => setForm(prev => ({ ...prev, doctorId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Automatický výběr --</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.user.name} {doctor.specialization && `(${doctor.specialization})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 6. PŘESTÁVKY */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                ☕ 6. Přestávky
              </h2>
              <div className="space-y-3">
                {form.breakTimes.map((breakTime, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="time"
                      value={breakTime.start}
                      onChange={(e) => updateBreakTime(index, 'start', e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={breakTime.end}
                      onChange={(e) => updateBreakTime(index, 'end', e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeBreakTime(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      ❌
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBreakTime}
                  className="text-blue-500 hover:text-blue-700 text-sm transition-colors"
                >
                  + Přidat přestávku
                </button>
              </div>
            </div>

            {/* AKCE */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={generatePreview}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
              >
                📋 Náhled ({previewSlots.length} slotů)
              </button>
              <button
                type="submit"
                disabled={generating}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {generating ? 'Generuji...' : '💾 Generovat sloty'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  👁️ Náhled generovaných slotů
                </h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ❌
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600">
                  Vygeneruje se <strong>{previewSlots.length} slotů</strong> v {form.weeksCount} týdnech.
                </p>
                {form.serviceTypeId && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                    <span className="font-medium">🧠 Inteligentní sloty:</span>
                    {(() => {
                      const selectedService = serviceTypes.find(st => st.id === form.serviceTypeId)
                      if (selectedService) {
                        return ` Délka ${selectedService.duration} min, interval ${form.interval} min`
                      }
                      return ''
                    })()}
                  </div>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Den</th>
                      <th className="px-3 py-2 text-left">Datum</th>
                      <th className="px-3 py-2 text-left">Čas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSlots.map((slot, index) => (
                      <tr key={index} className="border-t border-gray-100">
                        <td className="px-3 py-2">{slot.weekday}</td>
                        <td className="px-3 py-2">{slot.date}</td>
                        <td className="px-3 py-2">{slot.startTime} - {slot.endTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPreview(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ❌ Zrušit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={generating}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {generating ? 'Generuji...' : '✅ Potvrdit generování'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 