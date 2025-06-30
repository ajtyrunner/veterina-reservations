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

// Hlavní API call funkce
export async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, requireAuth = true } = options
  
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  // Přidání JWT tokenu pro autentizované požadavky
  if (requireAuth) {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Nepodařilo se získat autentizační token')
    }
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const config: RequestInit = {
    method,
    headers,
  }
  
  if (body) {
    config.body = JSON.stringify(body)
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  if (!response.ok) {
    let errorMessage = 'API chyba'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      errorMessage = response.statusText
    }
    throw new Error(errorMessage)
  }
  
  return response.json()
}

// Convenience funkce pro běžné operace
export async function getSlots() {
  return apiCall('/api/doctor/slots')
}

export async function createSlot(slotData: any) {
  return apiCall('/api/doctor/slots', {
    method: 'POST',
    body: slotData
  })
}

export async function getRooms() {
  return apiCall('/api/rooms')
}

export async function getServiceTypes() {
  return apiCall('/api/service-types')
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

// Test spojení
export async function testRailwayConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Railway API je dostupné:', data)
      return data
    } else {
      console.error('❌ Railway API nedostupné:', response.status, response.statusText)
      return null
    }
  } catch (error) {
    console.error('❌ Chyba při připojení k Railway:', error)
    return null
  }
} 