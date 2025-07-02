# 📞 IMPLEMENTACE TELEFONNÍCH ČÍSEL A TENANT DEFAULT KONTAKTŮ

## 🎯 Cíl
Přidat telefonní čísla pro uživatele a defaultní kontaktní údaje pro tenanta jako fallback pro komunikaci.

## 📋 Změny schématu

### User model
```prisma
model User {
  // ... existující pole ...
  phone        String?      // Telefonní číslo (volitelné, pro INTERNAL i GOOGLE/OAuth)
  // ... zbytek polí ...
}
```

### Tenant model
```prisma
model Tenant {
  // ... existující pole ...
  
  // Defaultní kontaktní údaje pro komunikaci (fallback pro doktory)
  defaultEmail String?  // Email pro notifikace, pokud doktor nemá vlastní
  defaultPhone String?  // Telefon pro komunikaci, pokud doktor nemá vlastní
  
  // ... zbytek polí ...
}
```

## 🚀 Migrace

### 1. Vytvoření migrace
```bash
source ~/.nvm/nvm.sh && nvm use 22.16.0
npx prisma migrate dev --name add_phone_and_tenant_defaults
```

### 2. Po migraci - aktualizace seed.ts
Uncommentovat všechny phone pole v `prisma/seed.ts`:

```typescript
// Z:
// phone: '+420 777 123 456', // TODO: Po migraci uncomment

// Na:
phone: '+420 777 123 456', // Telefonní číslo
```

### 3. Aktualizace contact.ts utility
Po migraci uncommentovat v `apps/api/src/utils/contact.ts`:

```typescript
// Tenant query
select: { 
  id: true,
  defaultEmail: true, // uncomment
  defaultPhone: true  // uncomment
}

// User query  
select: { 
  email: true,
  phone: true // uncomment
}

// Result mapping
defaultEmail: tenant?.defaultEmail || null, // uncomment
defaultPhone: tenant?.defaultPhone || null  // uncomment
```

## 🛠️ Nové utility funkce

### `getDoctorContactInfo(doctorId, tenantId)`
```typescript
// Vrací kontaktní údaje doktora s fallback na tenant defaults
{
  email: string | null,  // doktor.email || tenant.defaultEmail
  phone: string | null   // doktor.phone || tenant.defaultPhone
}
```

### `getUserEmail(userId, tenantId)` / `getUserPhone(userId, tenantId)`
```typescript
// Vrací uživatelské údaje s fallback na tenant defaults
```

## 📊 Seed data

### Tenant defaults
```typescript
{
  slug: 'svahy',
  name: 'Veterinární ordinace Svahy',
  defaultEmail: 'ordinace@veterina-svahy.cz',
  defaultPhone: '+420 581 791 886',
  // ...
}
```

### User phone numbers
```typescript
// Admin
phone: '+420 777 123 456'

// Doktoři - ZÁMĚRNĚ PRÁZDNÉ pro testování fallback logiky
'lucia.friedlaenderova': phone: null  // → tenant.defaultPhone
'jana.ambruzova': phone: null         // → tenant.defaultPhone  
'klara.navratilova': phone: null      // → tenant.defaultPhone
'martina.simkova': phone: null        // → tenant.defaultPhone

// Všichni doktoři používají tenant default email: 'ordinace@veterina-svahy.cz'

// Google OAuth uživatel
phone: '+420 777 999 888' // může být získán z Google profilu
```

## 🔄 Použití v aplikaci

### V notifikačním systému
```typescript
import { getDoctorContactInfo } from '../utils/contact'

const contact = await getDoctorContactInfo(doctorId, tenantId)
if (contact.email) {
  await sendEmail(contact.email, subject, body)
}
if (contact.phone) {
  await sendSMS(contact.phone, message)
}
```

### Google OAuth integrace
```typescript
// V auth.ts při Google sign-in
const profile = {
  email: user.email,
  name: user.name,
  phone: user.phone_number, // Z Google profilu (pokud dostupné)
  image: user.image
}
```

## ✅ Checklist po migraci

- [ ] Migrace úspěšně proběhla
- [ ] Seed data obsahují phone pole
- [ ] Contact utility funkce jsou aktualizované
- [ ] Notifikační systém používá nové fallback kontakty
- [ ] Google OAuth zachytává phone číslo z profilu
- [ ] Testování fallback logiky:
  - [ ] Doktor bez phone → tenant.defaultPhone  
  - [ ] Doktor s email = tenant default → používá tenant defaulty
  - [ ] Admin má vlastní phone → používá vlastní
  - [ ] Google uživatel má phone → používá vlastní

## 🎉 Výhody

1. **Flexibilní kontakty** - každý doktor může mít vlastní, nebo použije ordinační
2. **Tenant centralizace** - jedna konfigurace pro celou ordinaci
3. **OAuth kompatibilita** - phone může být získáno z externích providerů
4. **Backward compatibility** - stávající uživatelé bez phone čísel fungují
5. **Cache optimalizace** - tenant defaults jsou cachovány pro rychlost

---

**📌 POZOR:** Všechny změny seed souboru jsou připravené, ale zakomentované dokud neproběhne migrace! 