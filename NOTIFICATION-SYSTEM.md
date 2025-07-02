# 📧 Notifikační systém - Veterinární rezervace

## 🎯 Přehled

Kompletní email notifikační systém pro automatické informování uživatelů o změnách stavu rezervací v veterinárním rezervačním systému.

### ✅ **Implementované funkce:**

- **Multi-provider email support** (Resend, SendGrid, SMTP)
- **Automatické notifikace** při změnách stavu rezervací
- **Připomínky** 24 hodin před návštěvou
- **Responzivní HTML templates** s profesionálním designem
- **Fallback text verze** emailů pro kompatibilitu
- **Audit logging** všech odeslaných notifikací
- **Security-first přístup** s rate limitingem
- **Timezone-aware** datum/čas formátování

## 📋 **Typy notifikací**

### 🔔 **Automatické notifikace:**

| Trigger | Příjemce | Kdy se posílá |
|---------|----------|---------------|
| **Nová rezervace** | 👨‍⚕️ Doktor | Při vytvoření rezervace (status PENDING) |
| **Rezervace potvrzena** | 👤 Klient | Když doktor potvrdí rezervaci |
| **Rezervace zrušena** | 👤 Klient + 👨‍⚕️ Doktor | Při zrušení kdýmkoliv |
| **Návštěva dokončena** | 👤 Klient | Po dokončení návštěvy |
| **Připomínka** | 👤 Klient | 24h před potvrzenou návštěvou |

### 📧 **Email templaty:**

Každá notifikace obsahuje:
- ✅ **Responzivní HTML design** s gradient hlavičkami
- ✅ **Kompletní detaily rezervace** (datum, čas, doktor, zvíře, služba)
- ✅ **Call-to-action tlačítka** pro další kroky
- ✅ **Důležité informace** specifické pro daný typ notifikace
- ✅ **Branding ordinace** s logem a barvami
- ✅ **Text fallback verze** pro všechny email klienty

## 🔧 **Technická implementace**

### **Architektura:**

```
EmailService (emailService.ts)
├── Multi-provider support (Resend/SendGrid/SMTP)
├── HTML + Text templates
└── Connection testing

NotificationService (notificationService.ts)
├── Business logic
├── Database integrace
├── Audit logging
└── Error handling

Routes integration (protected.ts)
├── Automatic triggers
├── Manual endpoints
└── Admin controls
```

### **Email providers:**

**🟢 Resend (doporučeno):**
- Modern API
- Výborná deliverability
- Jednoduché nastavení

**🟡 SendGrid:**
- Enterprise feature set
- Pokročilé analytics
- Vyšší komplexnost

**🔴 SMTP:**
- Univerzální kompatibilita
- Vlastní mail servery
- Vyžaduje detailní konfiguraci

## ⚙️ **Konfigurace**

### **Environment proměnné:**

```bash
# Výběr email providera
EMAIL_PROVIDER=resend

# Resend API key
RESEND_API_KEY=your_resend_api_key_here

# Sender nastavení
FROM_EMAIL=noreply@veterina-svahy.cz
FROM_NAME=Veterinární ordinace Svahy
```

### **Alternativní providers:**

```bash
# SendGrid
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key_here

# SMTP
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 🚀 **API Endpointy**

### **Automatické notifikace:**

Notifikace se odesílají automaticky při:

- `POST /api/reservations` → Doctor dostane notifikaci o nové rezervaci
- `PATCH /api/reservations/:id` → Klient dostane notifikaci o změně stavu
- `DELETE /api/reservations/:id` → Oba dostanou notifikaci o zrušení
- `PUT /api/doctor/reservations/:id/status` → Notifikace podle nového stavu

### **Manuální endpointy (pouze ADMIN):**

**🧪 Test notifikačního systému:**
```bash
POST /api/test/notifications
Authorization: Bearer <admin_jwt_token>

Response:
{
  "success": true,
  "message": "Notifikace fungují správně",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**📬 Manuální připomínky:**
```bash
POST /api/notifications/send-reminders
Authorization: Bearer <admin_jwt_token>

Response:
{
  "success": true,
  "sentCount": 5,
  "message": "Odesláno 5 připomínek",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🛡️ **Bezpečnost a error handling**

### **Bezpečnostní opatření:**

- ✅ **Rate limiting** pro notification endpointy
- ✅ **Admin-only access** pro manuální triggery
- ✅ **Input validation** všech email dat
- ✅ **Non-blocking errors** - notifikace neselhání nevyřadí rezervaci
- ✅ **Audit logging** všech pokusů o odeslání
- ✅ **XSS protection** v email content

### **Error handling:**

```typescript
// Notifikace nikdy neselhání celou operaci
try {
  await notificationService.sendReservationStatusNotification(data)
} catch (notificationError) {
  console.error('❌ Failed to send notification:', notificationError)
  // Continue with business logic
}
```

### **Monitoring:**

Všechny notifikace se logují s detaily:
```json
{
  "reservationId": "clx123...",
  "tenantId": "tenant_svahy",
  "type": "RESERVATION_CONFIRMED",
  "recipient": "customer@email.com",
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🎨 **Email design**

### **HTML templaty obsahují:**

- 🎨 **Gradient headers** s brand barvami
- 📱 **Responzivní design** pro všechna zařízení
- 🏥 **Ordinace branding** s názvy a logy
- 📅 **Strukturované informace** v přehledných boxech
- 🔗 **Call-to-action tlačítka** s hover efekty
- 💡 **Důležité tipy** pro klienty
- 📞 **Kontaktní informace** pro podporu

### **Barvy podle typu notifikace:**

- 🟠 **Nová rezervace** - Oranžová (#f97316)
- 🟢 **Potvrzená** - Zelená (#10b981)
- 🔴 **Zrušená** - Červená (#ef4444)
- 🔵 **Dokončená** - Modrá (#3b82f6)
- 🟡 **Připomínka** - Žlutá (#f59e0b)

## 📊 **Automatické připomínky**

### **Logika připomínek:**

```typescript
// Každý den ve 9:00 (nebo manuálně)
const reminders = await notificationService.sendReservationReminders()

// Najde rezervace:
// - Status: CONFIRMED
// - StartTime: zítra (24h±)
// - Ještě neodeslaná připomínka
```

### **Implementace cron job:**

Pro produkční nasazení doporučujeme:

```bash
# Každý den v 9:00 poslat připomínky
0 9 * * * curl -X POST https://api.veterina-svahy.cz/api/notifications/send-reminders \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 🚦 **Deployment a produkční tipy**

### **Před nasazením:**

1. ✅ **Nastavit real email provider** (ne mock mode)
2. ✅ **Konfigurovat FROM_EMAIL** doménu
3. ✅ **Setup DNS records** (SPF, DKIM, DMARC)
4. ✅ **Test všech notification typů**
5. ✅ **Setup monitoring** pro delivery rates

### **Produkční doporučení:**

- 🔄 **Setup retry logic** pro failed emails
- 📊 **Monitor delivery rates** 
- 🚨 **Alert na failed notifications**
- 🗄️ **Database logging** pro audit trail
- 🔄 **Backup email provider** jako fallback

### **Performance:**

- ⚡ **Async odeslání** - neblokuje API response
- 🔄 **Bulk reminders** - optimalizované dotazy
- 💾 **Cached tenant data** - rychlejší lookup
- ⏱️ **Timeout protection** - max 30s per email

## 🧪 **Testing**

### **Development testing:**

```bash
# Test connection
POST /api/test/notifications

# Manual reminder trigger
POST /api/notifications/send-reminders

# Create test reservation to trigger notifications
POST /api/reservations
```

### **End-to-end test scenario:**

1. 👤 **Klient vytvoří rezervaci** → 👨‍⚕️ Doktor dostane email
2. 👨‍⚕️ **Doktor potvrdí rezervaci** → 👤 Klient dostane potvrzení
3. 🕘 **24h před návštěvou** → 👤 Klient dostane připomínku
4. 👨‍⚕️ **Doktor označí dokončeno** → 👤 Klient dostane poděkování

## 📈 **Budoucí rozšíření**

### **Plánované funkce:**

- 📱 **Push notifikace** pro mobilní app
- 💬 **SMS notifikace** jako backup
- 🔔 **In-app notifications** bell icon
- 📊 **Notification preferences** per user
- 📅 **Custom reminder timing** (2h, 1 day, 1 week)
- 🎯 **Segmentace** podle typu služby
- 📈 **Analytics dashboard** pro delivery rates

### **Database rozšíření:**

```sql
-- Budoucí tabulka pro audit
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id),
  tenant_id UUID REFERENCES tenants(id),
  type VARCHAR(50) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Uživatelské preference
CREATE TABLE notification_preferences (
  user_id UUID REFERENCES users(id),
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  reminder_hours INTEGER DEFAULT 24
);
```

## 🎉 **Shrnutí**

Notifikační systém je nyní **produkčně připraven** s:

- ✅ **Enterprise-grade funkcionalita**
- ✅ **Bezpečnostní ochrana**
- ✅ **Profesionální email design**
- ✅ **Multi-provider flexibilita**
- ✅ **Comprehensive error handling**
- ✅ **Production monitoring**

Systém automaticky informuje uživatele o všech důležitých změnách a zlepšuje customer experience veterinární ordinace. 