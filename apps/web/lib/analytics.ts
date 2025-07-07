// Google Analytics utility functions for Vercel frontend
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID || 'G-9L3Q6MQVS5'

// Check if we're in production and GA is available
const isGAAvailable = () => {
  return (
    typeof window !== 'undefined' && 
    typeof window.gtag === 'function' && 
    process.env.NODE_ENV === 'production' &&
    GA_TRACKING_ID
  )
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (isGAAvailable()) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
      cookie_domain: window.location.hostname,
    })
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (isGAAvailable()) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Consent management for GDPR compliance
export const updateConsent = (analytics: boolean) => {
  if (isGAAvailable()) {
    window.gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: 'denied', // Always denied for privacy
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
    
    // Re-initialize GA config when consent is granted
    if (analytics) {
      console.log('🔍 Re-initializing GA with domain:', window.location.hostname)
      window.gtag('config', GA_TRACKING_ID, {
        cookie_domain: window.location.hostname,
        cookie_expires: 63072000,
        cookie_update: true,
        cookie_flags: 'SameSite=Lax;Secure',
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      })
    }
  }
}

// Specific tracking functions for common events
export const trackReservation = (action: 'created' | 'cancelled' | 'completed') => {
  event({
    action,
    category: 'Reservation',
    label: `Reservation ${action}`,
  })
}

export const trackSlotGeneration = (count: number) => {
  event({
    action: 'bulk_generate',
    category: 'Slot Management',
    label: 'Slots generated',
    value: count,
  })
}

export const trackLogin = (method: 'google' | 'credentials') => {
  event({
    action: 'login',
    category: 'Authentication',
    label: `Login via ${method}`,
  })
}

export const trackPageView = (page: string) => {
  event({
    action: 'page_view',
    category: 'Navigation',
    label: page,
  })
}

// Debug function for troubleshooting
export const debugGA = () => {
  if (typeof window !== 'undefined') {
    console.log('🔍 GA Debug Info:')
    console.log('- NODE_ENV:', process.env.NODE_ENV)
    console.log('- GA_TRACKING_ID:', GA_TRACKING_ID)
    console.log('- gtag available:', typeof window.gtag === 'function')
    console.log('- Current domain:', window.location.hostname)
    console.log('- Current URL:', window.location.href)
    console.log('- User agent:', navigator.userAgent)
    
    // Check cookies
    const gaCookies = document.cookie
      .split(';')
      .filter(cookie => cookie.trim().startsWith('_ga'))
      .map(cookie => cookie.trim())
    
    console.log('- GA Cookies:', gaCookies.length > 0 ? gaCookies : 'None found')
    
    // Test gtag call
    if (typeof window.gtag === 'function') {
      console.log('- Testing gtag call...')
      window.gtag('event', 'debug_test', {
        event_category: 'Debug',
        event_label: 'GA Debug Test',
      })
    }
  }
}

// TypeScript declarations for gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'consent',
      targetId: string | Date | 'default' | 'update',
      config?: any
    ) => void
  }
} 