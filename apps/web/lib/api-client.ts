// API client pro přímé volání Railway API s JWT autentizací
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://veterina-reservations-production.up.railway.app'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  requireAuth?: boolean
}

// Získání JWT tokenu z Next.js API
async function getAuthToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/jwt')
    if (response.ok) {
      const data = await response.json()
      return data.token
    } else {
      console.error('Nepodařilo se získat JWT token:', response.status)
      return null
    }
  } catch (error) {
    console.error('Chyba při získávání JWT tokenu:', error)
    return null
  }
}

// Převod validační chyby na user-friendly zprávu
function getUserFriendlyError(field: string, message: string): string {
  // Validace telefonního čísla
  if (field === 'phone') {
    if (message.includes('Neplatný formát')) {
      return 'Zadejte prosím telefonní číslo ve správném formátu (např. 777123456 nebo +420777123456)'
    }
    if (message.includes('příliš krátké')) {
      return 'Zadané telefonní číslo je příliš krátké'
    }
    if (message.includes('příliš dlouhé')) {
      return 'Zadané telefonní číslo je příliš dlouhé'
    }
    if (message.includes('začínat číslicí 6 nebo 7')) {
      return 'České mobilní číslo musí začínat číslicí 6 nebo 7'
    }
    return 'Neplatné telefonní číslo'
  }

  // Validace ostatních polí
  switch (field) {
    case 'email':
      return 'Zadejte prosím platnou e-mailovou adresu'
    case 'petName':
      return 'Zadejte prosím jméno zvířete (1-100 znaků)'
    case 'description':
      return 'Popis je příliš dlouhý (max 1000 znaků)'
    default:
      return message
  }
}

// Hlavní API call funkce
export async function apiCall(endpoint: string, options: ApiOptions = {}) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Přidání JWT tokenu pro autentizované endpointy
    if (options.requireAuth) {
      const token = await getAuthToken()
      if (!token) {
        throw new Error('Pro pokračování se prosím přihlaste')
      }
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      // Zpracování validačních chyb
      if (response.status === 400 && data.details) {
        const validationErrors = data.details
          .map((err: { field: string, message: string }) => 
            getUserFriendlyError(err.field, err.message)
          )
          .join('\n')
        throw new Error(validationErrors)
      }

      // Zpracování rate limit chyb
      if (response.status === 429) {
        const retryAfter = data.retryAfter ? Math.ceil(data.retryAfter / 60) : 15
        throw new Error(`Příliš mnoho požadavků. Zkuste to prosím za ${retryAfter} minut.`)
      }

      // Obecné chyby
      if (response.status === 401) {
        throw new Error('Pro pokračování se prosím přihlaste')
      }
      if (response.status === 403) {
        throw new Error('Nemáte oprávnění k této akci')
      }
      if (response.status === 404) {
        throw new Error('Požadovaný záznam nebyl nalezen')
      }
      
      throw new Error(data.error || 'Něco se pokazilo, zkuste to prosím později')
    }

    return data
  } catch (error) {
    // Předáme pouze text chyby bez technických detailů
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Něco se pokazilo, zkuste to prosím později')
  }
}

// Convenience funkce pro běžné operace
export async function getSlots(tenantId: string, params?: URLSearchParams) {
  const url = params 
    ? `/api/slots/${tenantId}?${params}`
    : `/api/slots/${tenantId}`
  
  return apiCall(url, { requireAuth: true })
}

export async function createSlot(slotData: any) {
  return apiCall('/api/doctor/slots', {
    method: 'POST',
    body: slotData,
    requireAuth: true
  })
}

export async function updateSlot(id: string, slotData: any) {
  return apiCall(`/api/doctor/slots/${id}`, {
    method: 'PUT',
    body: slotData,
    requireAuth: true
  })
}

export async function deleteSlot(id: string) {
  return apiCall(`/api/doctor/slots/${id}`, {
    method: 'DELETE',
    requireAuth: true
  })
}

export async function getRooms() {
  return apiCall('/api/rooms', {
    requireAuth: true
  })
}

export async function getServiceTypes(tenantId: string) {
  return apiCall(`/api/service-types/${tenantId}`, { requireAuth: true })
}

export async function createServiceType(serviceTypeData: any) {
  return apiCall('/api/service-types', {
    method: 'POST',
    body: serviceTypeData,
    requireAuth: true
  })
}

export async function updateServiceType(id: string, serviceTypeData: any) {
  return apiCall(`/api/service-types/${id}`, {
    method: 'PUT',
    body: serviceTypeData,
    requireAuth: true
  })
}

export async function deleteServiceType(id: string) {
  return apiCall(`/api/service-types/${id}`, {
    method: 'DELETE'
  })
}

export async function createRoom(roomData: any) {
  return apiCall('/api/rooms', {
    method: 'POST',
    body: roomData,
    requireAuth: true
  })
}

export async function updateRoom(id: string, roomData: any) {
  return apiCall(`/api/rooms/${id}`, {
    method: 'PUT',
    body: roomData,
    requireAuth: true
  })
}

export async function deleteRoom(id: string) {
  return apiCall(`/api/rooms/${id}`, {
    method: 'DELETE'
  })
}

export async function createReservation(reservationData: any) {
  return apiCall('/api/reservations', {
    method: 'POST',
    body: reservationData,
    requireAuth: true
  })
}

export async function getReservations(statusFilter?: string) {
  const url = statusFilter ? `/api/reservations?status=${statusFilter}` : '/api/reservations'
  return apiCall(url, {
    requireAuth: true
  })
}

export async function updateReservationStatus(id: string, status: string, notes?: string) {
  return apiCall(`/api/doctor/reservations/${id}/status`, {
    method: 'PUT',
    body: { status, notes },
    requireAuth: true
  })
}

export async function updateReservationNotes(id: string, notes: string) {
  return apiCall(`/api/doctor/reservations/${id}/notes`, {
    method: 'PUT',
    body: { notes },
    requireAuth: true
  })
}

export async function deleteReservation(id: string) {
  return apiCall(`/api/reservations/${id}`, {
    method: 'DELETE',
    requireAuth: true
  })
}

export async function getDoctorReservations(statusFilter?: string) {
  const url = statusFilter ? `/api/doctor/reservations?status=${statusFilter}` : '/api/doctor/reservations'
  return apiCall(url, {
    requireAuth: true
  })
}

// Veřejné endpointy (bez autentizace)
export async function getPublicSlots(tenantId: string, params?: URLSearchParams) {
  const url = params 
    ? `/api/public/slots/${tenantId}?${params}`
    : `/api/public/slots/${tenantId}`
    
  return apiCall(url, { requireAuth: false })
}

export async function getPublicDoctors(tenantId: string) {
  return apiCall(`/api/public/doctors/${tenantId}`, { requireAuth: false })
}

export async function getPublicServiceTypes(tenantId: string) {
  return apiCall(`/api/public/service-types/${tenantId}`, { requireAuth: false })
}

export async function getPublicTenant(slug: string) {
  return apiCall(`/api/public/tenant/${slug}`, { requireAuth: false })
}

// Bulk generování slotů
export async function bulkGenerateSlots(bulkData: any) {
  return apiCall('/api/doctor/slots/bulk-generate', {
    method: 'POST',
    body: bulkData,
    requireAuth: true
  })
}

// Bulk smazání slotů
export async function bulkDeleteSlots(deleteData: any) {
  return apiCall('/api/doctor/slots/bulk-delete', {
    method: 'POST',
    body: deleteData,
    requireAuth: true
  })
}

// Získání doktorů (pro adminy)
export async function getDoctors(tenantId: string) {
  return apiCall(`/api/doctors/${tenantId}`, { requireAuth: true })
}

// Test spojení
export async function testRailwayConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    if (response.ok) {
      const data = await response.json()
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Railway API je dostupné:', data)
      }
      return data
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Railway API nedostupné:', response.status, response.statusText)
      }
      return null
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Chyba při připojení k Railway:', error)
    }
    return null
  }
}

export async function getUserProfile() {
  return apiCall('/api/user/profile', {
    requireAuth: true
  })
} 