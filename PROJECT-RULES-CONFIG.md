# 📋 PROJECT RULES CONFIG - Pravidla pro práci na veterinárním rezervačním systému

## 🎯 **ZÁKLADNÍ PRAVIDLA PROJEKTU**

### **1. DATABÁZOVÁ BEZPEČNOST**
```yaml
database:
  type: "production"
  provider: "postgresql"
  location: "Railway"
  
  migration_rules:
    - "❌ NEVER drop columns without backup"
    - "❌ NEVER delete data without confirmation"
    - "✅ ALWAYS use nullable columns for new fields"
    - "✅ ALWAYS test migrations on staging first"
    - "✅ ALWAYS have rollback plan ready"
    - "✅ ALWAYS use transactions for complex operations"
    
  prisma_commands:
    generate: "source ~/.nvm/nvm.sh && npx prisma generate"
    migrate: "source ~/.nvm/nvm.sh && npx prisma migrate dev --name <name>"
    seed: "source ~/.nvm/nvm.sh && npx tsx prisma/seed.ts"
    studio: "source ~/.nvm/nvm.sh && npx prisma studio"
    
  migration_strategy:
    phase1: "Add new nullable columns"
    phase2: "Seed default data"
    phase3: "Migrate existing data"
    phase4: "Add constraints"
    phase5: "Remove old columns (if needed)"
```

### **2. NODE.JS VERZE MANAGEMENT**
```yaml
node_version:
  system: "16.20.2"  # Starší verze v systému
  required: "22.16.0"  # Požadovaná verze z NVM
  
  mandatory_command:
    before_any_js_operation: "source ~/.nvm/nvm.sh"
    
  examples:
    - "source ~/.nvm/nvm.sh && npm install"
    - "source ~/.nvm/nvm.sh && npm run dev"
    - "source ~/.nvm/nvm.sh && npx prisma generate"
```

### **3. MULTI-TENANT ARCHITEKTURA**
```yaml
tenant_architecture:
  current_model: "subdomain-based"
  target_model: "tenant.slotnito.cz"
  
  tenant_isolation:
    - "✅ ALL database queries MUST filter by tenantId"
    - "✅ ALL API endpoints MUST validate tenant access"
    - "✅ ALL content MUST be tenant-aware"
    - "❌ NEVER mix tenant data"
    - "❌ NEVER hardcode tenant-specific values"
    
  url_structure:
    current: "veterina-reservations.vercel.app"
    target: "tenant.slotnito.cz"
    examples:
      - "veterina-svahy.slotnito.cz"
      - "brno-vet.slotnito.cz"
      - "psikocky.slotnito.cz"
```

### **4. CONTENT SYSTEM PRAVIDLA**
```yaml
content_system:
  philosophy: "No hardcoded UI texts or styling"
  
  hardcoded_content_policy:
    - "❌ NEVER hardcode UI labels in components"
    - "❌ NEVER hardcode colors in Tailwind classes"
    - "❌ NEVER hardcode email templates"
    - "❌ NEVER hardcode business-specific terms"
    - "✅ ALWAYS use content provider for texts"
    - "✅ ALWAYS use dynamic styling system"
    - "✅ ALWAYS provide fallback values"
    
  content_keys:
    naming_convention: "snake_case"
    structure: "category.subcategory.key"
    examples:
      - "ui.buttons.reserve_appointment"
      - "forms.labels.pet_name"
      - "emails.subjects.appointment_confirmed"
      
  fallback_strategy:
    level1: "tenant.customContent[key]"
    level2: "template.labels[key]"
    level3: "fallback parameter"
    level4: "key itself"
```

### **5. STYLING SYSTEM PRAVIDLA**
```yaml
styling_system:
  approach: "Dynamic CSS Variables + Tailwind"
  
  color_management:
    - "❌ NEVER use hardcoded colors (orange-400, blue-500)"
    - "✅ ALWAYS use CSS variables (--color-primary)"
    - "✅ ALWAYS load colors from tenant.colorScheme"
    - "✅ ALWAYS provide default color fallbacks"
    
  css_variables:
    primary: "--color-primary"
    secondary: "--color-secondary"
    accent: "--color-accent"
    neutral: "--color-neutral"
    
  tailwind_integration:
    config_location: "tailwind.config.ts"
    dynamic_colors: "theme.extend.colors"
    runtime_updates: "updateTailwindConfig()"
```

### **6. GOOGLE OAUTH PRAVIDLA**
```yaml
google_oauth:
  architecture: "Per-tenant Google Client ID"
  
  implementation_rules:
    - "❌ NEVER use single global Google Client ID"
    - "✅ ALWAYS configure per tenant"
    - "✅ ALWAYS validate domain restrictions"
    - "✅ ALWAYS store credentials securely"
    
  configuration:
    client_id: "tenant.googleClientId"
    client_secret: "tenant.googleClientSecret"
    redirect_uri: "https://tenant.slotnito.cz/api/auth/callback/google"
    
  domain_restrictions:
    - "Configure authorized domains per tenant"
    - "Restrict to tenant's organization domain"
    - "Validate email domain on login"
```

### **7. DEPLOYMENT PRAVIDLA**
```yaml
deployment:
  frontend: "Vercel"
  backend: "Railway"
  database: "Railway PostgreSQL"
  
  deployment_process:
    1: "Test locally with NVM"
    2: "Run type checking"
    3: "Test database migrations"
    4: "Commit with descriptive message"
    5: "Push to GitHub"
    6: "Monitor automatic deployment"
    
  environment_variables:
    - "DATABASE_URL" # Railway PostgreSQL
    - "NEXTAUTH_URL" # Dynamic per tenant
    - "NEXTAUTH_SECRET" # Shared secret
    - "GOOGLE_CLIENT_ID" # Per tenant (legacy)
    - "GOOGLE_CLIENT_SECRET" # Per tenant (legacy)
```

### **8. BEZPEČNOSTNÍ PRAVIDLA**
```yaml
security:
  authentication:
    - "✅ ALWAYS use JWT tokens"
    - "✅ ALWAYS validate tenant access"
    - "✅ ALWAYS implement rate limiting"
    - "❌ NEVER store passwords in plain text"
    - "❌ NEVER expose sensitive data in logs"
    
  data_validation:
    - "✅ ALWAYS validate input data"
    - "✅ ALWAYS sanitize email content"
    - "✅ ALWAYS use parameterized queries"
    - "❌ NEVER trust user input"
    - "❌ NEVER execute dynamic SQL"
    
  tenant_isolation:
    - "✅ ALWAYS filter by tenantId"
    - "✅ ALWAYS validate tenant ownership"
    - "✅ ALWAYS use tenant-scoped queries"
    - "❌ NEVER allow cross-tenant access"
    - "❌ NEVER leak tenant data"
```

### **9. KÓDOVACÍ STANDARDY**
```yaml
coding_standards:
  language: "TypeScript"
  formatting: "Prettier"
  linting: "ESLint"
  
  naming_conventions:
    files: "kebab-case" # user-profile.tsx
    functions: "camelCase" # getUserProfile()
    components: "PascalCase" # UserProfile
    constants: "UPPER_SNAKE_CASE" # MAX_RETRY_COUNT
    
  component_structure:
    - "Props interface first"
    - "Main component function"
    - "Helper functions below"
    - "Default export at bottom"
    
  error_handling:
    - "✅ ALWAYS handle async errors"
    - "✅ ALWAYS provide user-friendly messages"
    - "✅ ALWAYS log errors for debugging"
    - "❌ NEVER let errors crash the app"
    - "❌ NEVER expose technical details to users"
```

### **10. TESTOVACÍ PRAVIDLA**
```yaml
testing:
  approach: "Test critical paths"
  
  test_priorities:
    1: "Tenant isolation"
    2: "Authentication flows"
    3: "Content loading"
    4: "Database migrations"
    5: "API endpoints"
    
  test_commands:
    unit: "source ~/.nvm/nvm.sh && npm test"
    integration: "source ~/.nvm/nvm.sh && npm run test:integration"
    e2e: "source ~/.nvm/nvm.sh && npm run test:e2e"
    
  test_data:
    - "✅ ALWAYS use test tenants"
    - "✅ ALWAYS clean up after tests"
    - "✅ ALWAYS test with realistic data"
    - "❌ NEVER test with production data"
    - "❌ NEVER modify production database"
```

### **11. CONTENT MIGRATION PRAVIDLA**
```yaml
content_migration:
  strategy: "Gradual replacement"
  
  migration_phases:
    phase1: "Database schema update"
    phase2: "Content service implementation"
    phase3: "Component refactoring"
    phase4: "Email template migration"
    phase5: "Subdomain routing"
    
  migration_rules:
    - "✅ ALWAYS maintain backward compatibility"
    - "✅ ALWAYS provide fallback content"
    - "✅ ALWAYS test each phase thoroughly"
    - "❌ NEVER break existing functionality"
    - "❌ NEVER remove fallbacks too early"
    
  content_audit:
    ui_texts: "127 instances found"
    styling: "89 instances found"
    email_templates: "43 instances found"
    
  replacement_strategy:
    1: "Identify hardcoded content"
    2: "Create content templates"
    3: "Implement content provider"
    4: "Replace hardcoded values"
    5: "Test and validate"
```

### **12. MONITORING A DEBUGGING**
```yaml
monitoring:
  logging_level: "INFO in production, DEBUG in development"
  
  log_categories:
    - "Authentication events"
    - "Tenant operations"
    - "Content loading"
    - "Database queries"
    - "Email notifications"
    
  debugging_tools:
    - "Prisma Studio for database"
    - "Browser DevTools for frontend"
    - "Railway logs for backend"
    - "Vercel logs for deployment"
    
  error_tracking:
    - "✅ ALWAYS log errors with context"
    - "✅ ALWAYS include tenant information"
    - "✅ ALWAYS sanitize sensitive data"
    - "❌ NEVER log passwords or tokens"
    - "❌ NEVER expose internal errors to users"
```

### **13. DOKUMENTAČNÍ PRAVIDLA**
```yaml
documentation:
  language: "Czech"
  format: "Markdown"
  
  required_docs:
    - "API endpoints documentation"
    - "Database schema changes"
    - "Content template structure"
    - "Deployment procedures"
    - "Security guidelines"
    
  documentation_updates:
    - "✅ ALWAYS update docs with code changes"
    - "✅ ALWAYS include examples"
    - "✅ ALWAYS explain breaking changes"
    - "❌ NEVER leave outdated documentation"
    - "❌ NEVER assume knowledge without explanation"
```

### **14. PERFORMANCE PRAVIDLA**
```yaml
performance:
  targets:
    page_load: "<2 seconds"
    api_response: "<500ms"
    content_loading: "<100ms"
    
  optimization_rules:
    - "✅ ALWAYS cache content templates"
    - "✅ ALWAYS optimize database queries"
    - "✅ ALWAYS use lazy loading"
    - "❌ NEVER load unnecessary data"
    - "❌ NEVER block UI with slow operations"
    
  caching_strategy:
    content: "In-memory cache with TTL"
    tenant_data: "Redis cache (future)"
    api_responses: "HTTP cache headers"
```

### **15. BACKUP A RECOVERY**
```yaml
backup:
  database: "Railway automatic backups"
  frequency: "Daily"
  retention: "30 days"
  
  recovery_procedures:
    - "Test backup restoration monthly"
    - "Document recovery steps"
    - "Maintain offline backups"
    - "Test rollback procedures"
    
  disaster_recovery:
    rto: "< 4 hours" # Recovery Time Objective
    rpo: "< 1 hour"  # Recovery Point Objective
```

---

## 🚨 **KRITICKÁ UPOZORNĚNÍ**

### **⚠️ PRODUKČNÍ DATABÁZE**
```yaml
critical_warnings:
  - "🔴 PRODUCTION DATABASE IS LIVE - NO DIRECT MODIFICATIONS"
  - "🔴 ALWAYS USE MIGRATIONS FOR SCHEMA CHANGES"
  - "🔴 NEVER DELETE DATA WITHOUT BACKUP"
  - "🔴 ALWAYS TEST MIGRATIONS ON STAGING FIRST"
  - "🔴 NEVER COMMIT SENSITIVE DATA TO GIT"
```

### **⚠️ TENANT ISOLATION**
```yaml
tenant_isolation_warnings:
  - "🔴 NEVER ALLOW CROSS-TENANT DATA ACCESS"
  - "🔴 ALWAYS VALIDATE TENANT OWNERSHIP"
  - "🔴 NEVER HARDCODE TENANT-SPECIFIC VALUES"
  - "🔴 ALWAYS FILTER BY TENANT_ID"
```

### **⚠️ CONTENT SYSTEM**
```yaml
content_system_warnings:
  - "🔴 NEVER HARDCODE UI TEXTS IN COMPONENTS"
  - "🔴 NEVER HARDCODE COLORS IN TAILWIND CLASSES"
  - "🔴 ALWAYS PROVIDE FALLBACK VALUES"
  - "🔴 NEVER BREAK EXISTING FUNCTIONALITY"
```

---

## 📊 **IMPLEMENTAČNÍ CHECKLIST**

### **Před každou změnou:**
- [ ] Načtení NVM: `source ~/.nvm/nvm.sh`
- [ ] Backup databáze (pokud měním schema)
- [ ] Test na staging prostředí
- [ ] Rollback plán připraven
- [ ] Dokumentace aktualizována

### **Při implementaci content systému:**
- [ ] Databázová migrace testována
- [ ] Fallback mechanismus implementován
- [ ] Tenant isolation zachována
- [ ] Backward compatibility zajištěna
- [ ] Performance impact vyhodnocen

### **Po implementaci:**
- [ ] Funkcionální testy prošly
- [ ] Produkční databáze nepoškozena
- [ ] Existing tenanti fungují
- [ ] Dokumentace aktualizována
- [ ] Monitoring nastaveno

---

## 🎯 **CÍLE PROJEKTU**

### **Krátkodobé (1-3 měsíce):**
1. Implementace dynamického content systému
2. Migrace na subdomain architekturu
3. Per-tenant Google OAuth
4. Univerzální template system

### **Střednědobé (3-6 měsíců):**
1. Onboarding nových tenantů
2. Multi-obor support
3. A/B testing framework
4. Performance optimalizace

### **Dlouhodobé (6-12 měsíců):**
1. Škálování na 100+ tenantů
2. Automatizovaný onboarding
3. Advanced analytics
4. Mobile aplikace

---

**Verze konfigurace:** 1.0
**Poslední aktualizace:** 2024-01-15
**Odpovědnost:** Cursor AI Agent

> **Poznámka:** Tato konfigurace je živý dokument a bude aktualizována s každou významnou změnou v projektu. 