'use client'

import { useState, useEffect } from 'react'
import { formatDisplayTime } from '../../lib/timezone'

interface Slot {
  id: string
  startTime: string
  endTime: string
  equipment?: string
  roomId?: string
  serviceTypeId?: string
  doctorId: string
  doctor: {
    specialization?: string
    user: {
      name: string
    }
  }
  room?: {
    id: string
    name: string
    description?: string
  }
  serviceType?: {
    id: string
    name: string
    description?: string
    duration: number
    color?: string
  }
}

interface CalendarViewProps {
  slots: Slot[]
  selectedDoctor: string
  selectedServiceType?: string
  selectedDate?: string
  onReserveSlot: (slot: Slot) => void
  loading: boolean
  userRole?: string // Přidáno pro role-based zobrazování
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  slots: Slot[]
}

export default function CalendarView({ slots, selectedDoctor, selectedServiceType, selectedDate, onReserveSlot, loading, userRole }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

  useEffect(() => {
    generateCalendarDays()
  }, [currentDate, slots, selectedDoctor, selectedServiceType])

  // Navigate to selected date when date filter changes
  useEffect(() => {
    if (selectedDate) {
      const filterDate = new Date(selectedDate)
      setCurrentDate(new Date(filterDate.getFullYear(), filterDate.getMonth(), 1))
      setSelectedDay(filterDate)
    }
  }, [selectedDate])

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // První den měsíce
    const firstDay = new Date(year, month, 1)
    // Poslední den měsíce
    const lastDay = new Date(year, month + 1, 0)
    
    // Začátek kalendářové mřížky (pondělí předchozího týdne)
    const startDate = new Date(firstDay)
    const dayOfWeek = firstDay.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(firstDay.getDate() - daysToSubtract)
    
    // Konec kalendářové mřížky
    const endDate = new Date(lastDay)
    const endDayOfWeek = lastDay.getDay()
    const daysToAdd = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek
    endDate.setDate(lastDay.getDate() + daysToAdd)
    
    const days: CalendarDay[] = []
    const currentDateIter = new Date(startDate)
    
    while (currentDateIter <= endDate) {
      let daySlots = slots.filter(slot => {
        const slotDate = new Date(slot.startTime)
        return (
          slotDate.getDate() === currentDateIter.getDate() &&
          slotDate.getMonth() === currentDateIter.getMonth() &&
          slotDate.getFullYear() === currentDateIter.getFullYear()
        )
      })
      
      // Apply filters for calendar view
      if (selectedDoctor) {
        daySlots = daySlots.filter(slot => slot.doctorId === selectedDoctor)
      }
      
      if (selectedServiceType) {
        daySlots = daySlots.filter(slot => slot.serviceTypeId === selectedServiceType)
      }
      
      days.push({
        date: new Date(currentDateIter),
        isCurrentMonth: currentDateIter.getMonth() === month,
        slots: daySlots
      })
      
      currentDateIter.setDate(currentDateIter.getDate() + 1)
    }
    
    setCalendarDays(days)
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDay(null)
  }

  // Používáme unifikované funkce z timezone.ts
  // const formatTime = formatDisplayTime

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    return compareDate < today
  }

  // Nová funkce pro kontrolu, zda je slot v minulosti
  const isSlotInPast = (slot: Slot) => {
    const slotDate = new Date(slot.startTime)
    const now = new Date()
    return slotDate < now
  }

  // Funkce pro určení, zda lze na den kliknout
  const canClickDay = (day: CalendarDay) => {
    if (day.slots.length === 0) return false
    
    // Pro doktoři a adminy - mohou kliknout na jakýkoliv den se sloty
    if (userRole === 'DOCTOR' || userRole === 'ADMIN') {
      return true
    }
    
    // Pro klienty - pouze budoucí dny
    return !isPast(day.date)
  }

  const monthNames = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ]

  const dayNames = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Hlavička kalendáře */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Detail vybraného dne - NAD celým kalendářem */}
      {selectedDay && (
        <div className="mx-6 mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Dostupné termíny pro {selectedDay.toLocaleDateString('cs-CZ', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Načítám termíny...</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {slots
                .filter(slot => {
                  const slotDate = new Date(slot.startTime)
                  return (
                    slotDate.getDate() === selectedDay.getDate() &&
                    slotDate.getMonth() === selectedDay.getMonth() &&
                    slotDate.getFullYear() === selectedDay.getFullYear() &&
                    (!selectedDoctor || slot.doctorId === selectedDoctor) &&
                    (!selectedServiceType || slot.serviceTypeId === selectedServiceType)
                  )
                })
                .map(slot => {
                  const isPastSlot = isSlotInPast(slot)
                  const canReserve = !isPastSlot || (userRole === 'DOCTOR' || userRole === 'ADMIN')
                  
                  return (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-3 bg-white rounded-md border transition-colors shadow-sm ${
                        isPastSlot 
                          ? 'border-gray-300 bg-gray-50 opacity-60' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className={isPastSlot ? 'text-gray-500' : ''}>
                        <div className={`font-medium ${isPastSlot ? 'text-gray-600' : 'text-gray-900'}`}>
                          {formatDisplayTime(new Date(slot.startTime))} - {formatDisplayTime(new Date(slot.endTime))}
                          {isPastSlot && (
                            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                              Minulost
                            </span>
                          )}
                        </div>
                        <div className={`text-sm ${isPastSlot ? 'text-gray-500' : 'text-gray-600'}`}>
                          {slot.doctor.user.name}
                          {slot.doctor.specialization && ` • ${slot.doctor.specialization}`}
                        </div>
                        {slot.serviceType && (
                          <div className="text-xs mb-1">
                            <span 
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${
                                isPastSlot ? 'opacity-70' : ''
                              }`}
                              style={{ backgroundColor: slot.serviceType.color || '#3B82F6' }}
                            >
                              ⚕️ {slot.serviceType.name} • {slot.serviceType.duration} min
                            </span>
                          </div>
                        )}
                        {slot.room && (
                          <div className={`text-xs ${isPastSlot ? 'text-gray-400' : 'text-gray-500'}`}>
                            🏥 {slot.room.name}
                            {slot.room.description && ` (${slot.room.description})`}
                          </div>
                        )}
                        {slot.equipment && (
                          <div className={`text-xs ${isPastSlot ? 'text-gray-400' : 'text-gray-500'}`}>
                            🔧 {slot.equipment}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onReserveSlot(slot)}
                        disabled={!canReserve}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          canReserve
                            ? isPastSlot
                              ? 'bg-gray-500 text-white hover:bg-gray-600'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isPastSlot ? 'Zobrazit' : 'Rezervovat'}
                      </button>
                    </div>
                  )
                }) || (
                <p className="text-gray-500 text-center py-4">
                  Žádné dostupné termíny pro tento den.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Názvy dnů */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-b border-gray-200">
              {day}
            </div>
          ))}
        </div>

        {/* Kalendářová mřížka */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const isPastDay = isPast(day.date)
            const hasSlots = day.slots.length > 0
            const canShowPastSlots = userRole === 'DOCTOR' || userRole === 'ADMIN'
            const showSlots = hasSlots && (!isPastDay || canShowPastSlots)
            
            return (
              <div
                key={index}
                className={`
                  min-h-[90px] p-3 border-2 cursor-pointer transition-all duration-200 rounded-lg relative
                  ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-white text-gray-900 border-gray-200'}
                  ${isToday(day.date) ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : ''}
                  ${selectedDay && selectedDay.getTime() === day.date.getTime() ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-300 shadow-lg transform scale-105' : ''}
                  ${isPastDay && !canShowPastSlots ? 'opacity-50 cursor-not-allowed' : ''}
                  ${isPastDay && canShowPastSlots && hasSlots ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400 opacity-70 hover:opacity-85' : ''}
                  ${showSlots && !isPastDay ? 
                    'bg-gradient-to-br from-green-50 to-green-100 border-green-400 shadow-md hover:shadow-lg hover:from-green-100 hover:to-green-200 transform hover:scale-105' : 
                    'hover:bg-gray-50 hover:border-gray-300'}
                `}
                onClick={() => {
                  if (canClickDay(day)) {
                    setSelectedDay(day.date)
                  }
                }}
              >
                {/* Indikátor dostupnosti - zelený kroužek pro budoucí, šedý pro minulé */}
                {showSlots && (
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                    isPastDay ? 'bg-gray-500' : 'bg-green-500'
                  }`}></div>
                )}
                
                <div className={`text-sm font-medium mb-1 ${
                  showSlots && !isPastDay ? 'text-green-800 font-bold' : 
                  showSlots && isPastDay ? 'text-gray-600 font-bold' : ''
                }`}>
                  {day.date.getDate()}
                </div>
                
                {showSlots && (
                  <div className="space-y-1">
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full text-center ${
                      isPastDay 
                        ? 'text-gray-600 bg-gray-300' 
                        : 'text-green-700 bg-green-200'
                    }`}>
                      {day.slots.length} {day.slots.length === 1 ? 'termín' : 'termínů'}
                      {isPastDay && (
                        <span className="block text-xs font-normal">minulost</span>
                      )}
                    </div>
                    
                    {/* Názvy služeb jako text */}
                    <div className="space-y-0.5">
                      {Array.from(new Set(day.slots
                        .filter(slot => slot.serviceType)
                        .map(slot => slot.serviceType!.id)
                      )).slice(0, 2).map(serviceTypeId => {
                        const serviceType = day.slots.find(slot => slot.serviceType?.id === serviceTypeId)?.serviceType
                        return serviceType ? (
                          <div
                            key={serviceTypeId}
                            className={`text-xs px-1 py-0.5 rounded text-white font-medium text-center ${
                              isPastDay ? 'opacity-70' : ''
                            }`}
                            style={{ backgroundColor: serviceType.color || '#3B82F6' }}
                            title={`${serviceType.name} (${serviceType.duration} min)`}
                          >
                            {serviceType.name.length > 10 ? serviceType.name.substring(0, 10) + '...' : serviceType.name}
                          </div>
                        ) : null
                      })}
                      {Array.from(new Set(day.slots
                        .filter(slot => slot.serviceType)
                        .map(slot => slot.serviceType!.id)
                      )).length > 2 && (
                        <div className={`text-xs text-center font-medium ${
                          isPastDay ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          +{Array.from(new Set(day.slots
                            .filter(slot => slot.serviceType)
                            .map(slot => slot.serviceType!.id)
                          )).length - 2} dalších
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Dnešní den indikátor */}
                {isToday(day.date) && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 