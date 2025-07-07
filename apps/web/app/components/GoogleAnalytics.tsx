'use client'

import Script from 'next/script'
import { useEffect } from 'react'

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID || 'G-9L3Q6MQVS5'

export default function GoogleAnalytics() {
  useEffect(() => {
    // Pouze pro produkci na Vercel
    if (process.env.NODE_ENV === 'production') {
      console.log('🔍 Google Analytics initialized for production')
      
      // Fallback: pokud GA cookies selhávají, nastavíme je manuálně
      setTimeout(() => {
        const domain = window.location.hostname
        console.log('🔍 Checking GA cookies after 3s for domain:', domain)
        
        const gaCookies = document.cookie
          .split(';')
          .filter(cookie => cookie.trim().startsWith('_ga'))
        
        if (gaCookies.length === 0) {
          console.log('⚠️ No GA cookies found, manual fallback might be needed')
          console.log('🔍 Current cookies:', document.cookie)
        } else {
          console.log('✅ GA cookies found:', gaCookies)
        }
      }, 3000)
    }
  }, [])

  // Nepoužívat GA v development nebo pokud není tracking ID
  if (process.env.NODE_ENV === 'development' || !GA_TRACKING_ID) {
    return null
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          // Debug current domain
          console.log('🔍 Current domain for GA:', window.location.hostname);
          console.log('🔍 Full URL:', window.location.href);
          
          // Google Consent Mode v2 - default to denied (GDPR compliance)
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500,
          });
          
          // Try different approach - disable automatic cookie setting
          gtag('config', '${GA_TRACKING_ID}', {
            page_title: document.title,
            page_location: window.location.href,
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            cookie_domain: 'none',
            send_page_view: false,
          });
          
          console.log('🔍 GA initialized with cookie_domain: none');
        `}
      </Script>
    </>
  )
} 