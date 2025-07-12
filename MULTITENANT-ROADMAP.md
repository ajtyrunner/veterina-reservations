# 🏢 Multitenant Transformace - Roadmap

## 📋 Přehled
Transformace rezervačního systému na plně multitenant architekturu, která umožní provozovat více nezávislých business pod jednou aplikací.

## 🎯 Cíle
1. **Kompletní izolace dat** mezi tenanty
2. **Škálovatelnost** pro stovky tenantů
3. **Customizace** per tenant (branding, content, pravidla)
4. **Jednotná správa** a monitoring
5. **SaaS připravenost** včetně billingu

## 📊 Fáze implementace

### Fáze 1: Databázová architektura (2-3 týdny)
- [ ] **Přidat tenant_id ke všem tabulkám**
  ```prisma
  model User {
    id        String   @id
    tenantId  String
    tenant    Tenant   @relation(fields: [tenantId], references: [id])
    // ... další pole
    
    @@index([tenantId])
  }
  ```
- [ ] **Row Level Security (RLS) policies**
- [ ] **Composite indexy** pro tenant_id + často používané sloupce
- [ ] **Migrace stávajících dat** na default tenant
- [ ] **Backup strategie** per tenant

### Fáze 2: API Middleware a Security (2 týdny)
- [ ] **Tenant resolution middleware**
  ```typescript
  // Z subdomain, custom domain, nebo header
  app.use(tenantMiddleware)
  ```
- [ ] **Automatické filtrování queries**
  ```typescript
  // Všechny queries automaticky filtrované
  where: { 
    ...userWhere,
    tenantId: req.tenantId 
  }
  ```
- [ ] **API rate limiting** per tenant
- [ ] **Tenant-aware caching**
- [ ] **Cross-tenant security audit**

### Fáze 3: Frontend Multi-tenancy (2-3 týdny)
- [ ] **Subdomain routing**
  - `kadernictvi.app.cz`
  - `veterina.app.cz`
  - `fitness.app.cz`
- [ ] **Custom domain support**
  - `rezervace.mojefirma.cz`
- [ ] **Tenant context provider**
  ```tsx
  <TenantProvider tenantId={tenantId}>
    <App />
  </TenantProvider>
  ```
- [ ] **Dynamic imports** pro tenant-specific komponenty
- [ ] **Tenant-aware routing**

### Fáze 4: Content Management System (3-4 týdny)
- [ ] **ContentTemplate model**
  ```prisma
  model ContentTemplate {
    id          String @id
    tenantId    String
    locale      String
    key         String
    value       Json
    
    @@unique([tenantId, locale, key])
  }
  ```
- [ ] **Default templates** pro různé business typy
  - Veterina
  - Kadeřnictví
  - Fitness
  - Univerzální
- [ ] **Admin UI pro správu textů**
- [ ] **Placeholder system**
  - `{{BUSINESS_NAME}}`
  - `{{STAFF_ROLE}}`
  - `{{SERVICE_NAME}}`
- [ ] **Import/Export šablon**

### Fáze 5: Tenant Configuration (2 týdny)
- [ ] **TenantSettings model**
  ```prisma
  model TenantSettings {
    id                String @id
    tenantId          String @unique
    businessHours     Json
    bookingRules      Json
    emailSettings     Json
    paymentSettings   Json
    features          Json // enabled/disabled features
  }
  ```
- [ ] **Feature flags** per tenant
- [ ] **Business rules engine**
  - Minimální doba rezervace
  - Storno podmínky
  - Pracovní doba
- [ ] **Timezone support**
- [ ] **Locale settings**

### Fáze 6: Branding a Styly (2 týdny)
- [ ] **Theme system**
  ```typescript
  interface TenantTheme {
    colors: {
      primary: string
      secondary: string
      accent: string
    }
    fonts: {
      heading: string
      body: string
    }
    logo: string
    favicon: string
  }
  ```
- [ ] **CSS-in-JS theming**
- [ ] **Logo a favicon upload**
- [ ] **Email template branding**
- [ ] **PDF branding** (reporty, faktury)

### Fáze 7: Tenant Onboarding (2-3 týdny)
- [ ] **Signup flow**
  1. Výběr typu businessu
  2. Základní informace
  3. Výběr subdomény
  4. Import dat (volitelné)
- [ ] **Setup wizard**
  - Nastavení pracovní doby
  - Vytvoření služeb
  - Nastavení cen
  - První uživatelé
- [ ] **Trial period** management
- [ ] **Demo data** pro testování
- [ ] **Onboarding emails**

### Fáze 8: Billing a Subscriptions (3-4 týdny)
- [ ] **Subscription model**
  ```prisma
  model Subscription {
    id            String @id
    tenantId      String @unique
    plan          SubscriptionPlan
    status        SubscriptionStatus
    currentPeriodEnd DateTime
    // ... další pole
  }
  ```
- [ ] **Integrace platební brány** (Stripe/PayPal)
- [ ] **Plány a limity**
  - Free: 50 rezervací/měsíc
  - Basic: 500 rezervací/měsíc
  - Pro: neomezeno
- [ ] **Usage tracking**
- [ ] **Invoice generation**
- [ ] **Payment reminders**

### Fáze 9: Performance a Scaling (2-3 týdny)
- [ ] **Database sharding** strategie
- [ ] **Multi-tenant caching**
  - Redis namespace per tenant
- [ ] **CDN pro assets**
- [ ] **Background job queues** per tenant
- [ ] **Database connection pooling**
- [ ] **Query optimization**
  - Tenant-aware indexes
  - Materialized views

### Fáze 10: Monitoring a Analytics (2 týdny)
- [ ] **Tenant-specific dashboards**
- [ ] **Usage analytics**
  - Počet rezervací
  - Aktivní uživatelé
  - API usage
- [ ] **Error tracking** per tenant
- [ ] **Performance monitoring**
- [ ] **Alerting system**
- [ ] **Admin super-dashboard**

### Fáze 11: Migration Tools (1-2 týdny)
- [ ] **Data import wizards**
  - CSV import
  - API migration
- [ ] **Tenant cloning** (pro testování)
- [ ] **Data export** tools
- [ ] **Backup/Restore** per tenant
- [ ] **Tenant archiving**

### Fáze 12: Documentation a Training (průběžně)
- [ ] **API dokumentace** s tenant kontextem
- [ ] **Admin manual**
- [ ] **Tenant onboarding guide**
- [ ] **Security best practices**
- [ ] **Performance tuning guide**

## 🔒 Security Checklist
- [ ] Tenant isolation na všech úrovních
- [ ] SQL injection protection s tenant context
- [ ] Cross-tenant data leak prevention
- [ ] Audit logging per tenant
- [ ] GDPR compliance per tenant
- [ ] Data encryption at rest
- [ ] Secure tenant switching pro admins

## 📈 Metriky úspěchu
1. **Technické**
   - Response time < 200ms pro 95% requests
   - 99.9% uptime SLA
   - Zero cross-tenant data leaks

2. **Business**
   - Onboarding time < 10 minut
   - Tenant churn rate < 5%
   - Support tickets < 1 per tenant/měsíc

## 🚀 Quick Wins (lze implementovat rychle)
1. **Tenant context v API** (3 dny)
2. **Basic subdomain routing** (2 dny)
3. **Tenant-specific logo** (1 den)
4. **Email template variables** (2 dny)
5. **Basic usage tracking** (2 dny)

## ⚠️ Rizika a mitigace
1. **Performance degradace**
   - Řešení: Pravidelné load testing, indexy
2. **Složitost migrace**
   - Řešení: Postupná migrace, rollback plány
3. **Security vulnerabilities**
   - Řešení: Security audit, penetration testing
4. **Vendor lock-in**
   - Řešení: Abstrakce nad externí služby

## 💰 Odhad nákladů
- Development: 3-4 měsíce (2-3 developers)
- Infrastructure: +50% současných nákladů
- Maintenance: +1 DevOps engineer

## 📅 Timeline
- **Q1 2025**: Fáze 1-3 (Core architecture)
- **Q2 2025**: Fáze 4-6 (Customization)
- **Q3 2025**: Fáze 7-9 (Business features)
- **Q4 2025**: Fáze 10-12 (Polish & optimize)

---

*Tento dokument je living document a bude průběžně aktualizován.*