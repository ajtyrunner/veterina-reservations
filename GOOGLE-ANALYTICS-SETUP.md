# Google Analytics & GDPR Setup

## 🎯 Přehled

Aplikace používá Google Analytics 4 (GA4) s plnou GDPR compliance pro českou republiku. Analytics funguje pouze na **Vercel frontendu**, ne na Railway backendu.

## 🔧 Nastavení pro Vercel

### 1. Environment Variables v Vercel Dashboard

```bash
# Povinné pro GA
NEXT_PUBLIC_GA_TRACKING_ID=G-9L3Q6MQVS5

# API komunikace s Railway
NEXT_PUBLIC_API_URL=https://veterina-reservations-production.up.railway.app
API_URL=https://veterina-reservations-production.up.railway.app

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://veterina-reservations.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Vercel Domains

- **Production**: `https://veterina-reservations.vercel.app`
- **Preview**: `https://veterina-reservations-*.vercel.app`

## 🍪 GDPR Cookie Consent

### Implementované funkce:

- ✅ **Cookie banner** s opt-in pro analytics
- ✅ **Consent management** s granulárním nastavením
- ✅ **Google Consent Mode v2** 
- ✅ **Anonymizace IP** adres
- ✅ **Vypnutí personalizace** reklam
- ✅ **Detailed privacy policy** s cookie informacemi

### Typy cookies:

1. **Nutné cookies** (vždy aktivní)
   - NextAuth session tokeny
   - CSRF protection
   - Cookie preferences

2. **Analytické cookies** (opt-in)
   - Google Analytics (_ga, _ga_*, _gid)
   - Anonymní návštěvnost
   - Doba uchování: 26 měsíců

3. **Marketingové cookies** (nepoužíváme)

## 🔍 Jak to funguje

### 1. Inicializace (layout.tsx)
```tsx
// Google Analytics se načte s consent mode "denied"
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  wait_for_update: 500,
});
```

### 2. Uživatelský souhlas (CookieConsent.tsx)
```tsx
// Po souhlasu se analytics aktivuje
updateConsent(true) // nebo false
```

### 3. Tracking events (analytics.ts)
```tsx
// Funguje pouze v production na Vercel
trackReservation('created')
trackLogin('google')
trackPageView('/reservace')
```

## 🚀 Production Checklist

### Vercel nastavení:
- [ ] Environment variables nastaveny
- [ ] Domain `veterina-reservations.vercel.app` aktivní
- [ ] GA tracking ID `G-9L3Q6MQVS5` ověřen

### GDPR compliance:
- [ ] Cookie banner se zobrazuje novým uživatelům
- [ ] Analytics defaultně vypnuté
- [ ] Granulární nastavení cookies funguje
- [ ] Privacy policy obsahuje cookie informace
- [ ] Data retention nastaveno na 26 měsíců

### Google Analytics:
- [ ] GA4 property vytvořena
- [ ] Enhanced ecommerce vypnuto (nepoužíváme)
- [ ] Data sharing vypnuto
- [ ] IP anonymization aktivní

## 🔧 Debugging

### Development:
- GA se **neaktivuje** v development režimu
- Console logy pro tracking calls

### Production:
- Zkontrolujte Network tab pro gtag calls
- Google Analytics Real-time reports
- Browser dev tools > Application > Cookies

## 📝 Legal Notes

- **GDPR Article 7**: Explicit consent required
- **Czech ZVOP**: Cookie consent mandatory
- **ePrivacy Directive**: Opt-in for analytics
- **Data retention**: 26 months maximum

## 🔗 Užitečné odkazy

- [Google Analytics 4](https://analytics.google.com/)
- [Google Consent Mode](https://developers.google.com/tag-platform/security/consent-mode)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GDPR Compliance Guide](https://gdpr.eu/cookies/) 