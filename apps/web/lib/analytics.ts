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