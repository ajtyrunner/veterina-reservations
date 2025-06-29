# 🚀 NASAZENÍ MVP - VERCEL + RENDER (ZDARMA)

## 📊 Přehled nasazení
- **Frontend:** Vercel (Next.js) - `https://veterina-rezervace.vercel.app`
- **Backend:** Render (Express API) - `https://veterina-api.onrender.com`  
- **Database:** Render (PostgreSQL 256MB) - zdarma
- **Celkové náklady:** 0 Kč/měsíc 💸

---

## 🔥 KROK 1: Nasazení Backend na Render

### 1.1 Vytvoření Render účtu
1. Jděte na [render.com](https://render.com)
2. Registrujte se pomocí GitHub účtu
3. Připojte tento repositář

### 1.2 Vytvoření PostgreSQL databáze
1. V Render dashboardu klikněte **"New +"**
2. Vyberte **"PostgreSQL"**
3. Nastavení:
   ```
   Name: veterina-db
   Database: veterina_reservations
   User: postgres
   Region: Frankfurt (nejblíže ČR)
   Plan: Free
   ```
4. Klikněte **"Create Database"**
5. **Zkopírujte si DATABASE_URL** (budeme potřebovat)

### 1.3 Nasazení Express API
1. Klikněte **"New +"** → **"Web Service"**
2. Připojte GitHub repo: `veterina-reservations`
3. Nastavení:
   ```
   Name: veterina-api
   Region: Frankfurt
   Branch: main
   Runtime: Node
   Build Command: cd apps/api && npm install && npm run build
   Start Command: cd apps/api && npm start
   Plan: Free
   ```

### 1.4 Environment Variables pro API
V Render dashboardu pro API service přidejte:
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://postgres:password@dpg-xxx.frankfurt-postgres.render.com/veterina_reservations
NEXTAUTH_SECRET=vygenerovaný-32-char-secret
FRONTEND_URL=https://your-project-name-xxx.vercel.app
```

### 1.5 Databáze migrace
Po nasazení API:
1. V Render dashboardu jděte do "Shell" záložky API
2. Spusťte:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

---

## 🌐 KROK 2: Nasazení Frontend na Vercel

### 2.1 Import projektu
1. Jděte na [vercel.com](https://vercel.com)
2. Klikněte **"New Project"**
3. Import z GitHub: `veterina-reservations`
4. Nastavení:
   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

### 2.2 Environment Variables pro Frontend
⚠️ **NEXTAUTH_URL musí být skutečná URL z Vercel po nasazení!**

```bash
# ⚠️ DŮLEŽITÉ: Získáte po nasazení na Vercel
NEXTAUTH_URL=https://your-project-name-xxx.vercel.app

NEXTAUTH_SECRET=stejný-jako-na-render
DATABASE_URL=stejný-jako-na-render
GOOGLE_CLIENT_ID=váš-google-client-id
GOOGLE_CLIENT_SECRET=váš-google-client-secret
API_URL=https://veterina-api.onrender.com
NEXT_PUBLIC_API_URL=https://veterina-api.onrender.com
NODE_ENV=production
```

### 2.3 Deploy
1. Klikněte **"Deploy"**
2. Počkejte na build (2-3 minuty)
3. Hotovo! Aplikace běží na `https://veterina-rezervace.vercel.app`

---

## 🔐 KROK 3: Konfigurace Google OAuth

### 3.1 Google Cloud Console
1. Jděte na [console.cloud.google.com](https://console.cloud.google.com)
2. Vytvořte nový projekt nebo použijte existující
3. Aktivujte "Google+ API"

### 3.2 OAuth credentials
1. Jděte do "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
2. Application type: "Web application"
3. Authorized JavaScript origins:
   ```
   https://your-project-name-xxx.vercel.app
   ```
   ⚠️ **Použijte skutečnou URL z Vercel!**
4. Authorized redirect URIs:
   ```
   https://your-project-name-xxx.vercel.app/api/auth/callback/google
   ```
   ⚠️ **Použijte skutečnou URL z Vercel!**
5. Zkopírujte Client ID a Client Secret

### 3.3 Aktualizace Environment Variables
Přidejte do Vercel i Render:
```bash
GOOGLE_CLIENT_ID=váš-skutečný-client-id
GOOGLE_CLIENT_SECRET=váš-skutečný-client-secret
```

---

## 🧪 KROK 4: Testování

### 4.1 Ověření služeb
- ✅ **Frontend:** `https://your-project-name-xxx.vercel.app`
- ✅ **API Health:** `https://veterina-api.onrender.com/health`
- ✅ **Database:** Připojení přes API

### 4.2 Funkcionalita test
1. **Přihlášení klientů:** Google OAuth
2. **Přihlášení personálu:** `/portal/team`
3. **Vytvoření rezervace:** Kompletní flow
4. **Admin funkce:** Správa rezervací

---

## 🎯 PROPOJENÍ S HLAVNÍM WEBEM

Na [veterina-svahy.cz](https://veterina-svahy.cz) přidejte odkaz:

```html
<a href="https://your-project-name-xxx.vercel.app" 
   class="btn btn-primary">
   📅 Rezervovat termín online
</a>
```

⚠️ **Nahraďte URL skutečnou adresou z Vercel!**

---

## ⚠️ OMEZENÍ FREE TIER

### Render (Backend):
- **Cold starts:** 20-30s po neaktivitě
- **PostgreSQL:** 256MB bez backupů
- **Compute:** 512MB RAM, shared CPU

### Vercel (Frontend):
- **Bandwidth:** 100GB/měsíc
- **Build time:** 45 min/měsíc
- **Serverless functions:** 100GB-Hrs/měsíc

### 📈 Upgrade cesta
Když MVP poroste:
1. **Render Pro** ($7/měsíc) - bez cold starts
2. **Vercel Pro** ($20/měsíc) - více bandwidth
3. **Database backup** řešení

---

## 🚨 TROUBLESHOOTING

### Časté problémy:

**1. Cold start Render API**
- Normální u free tier
- Řešení: upgrade na Pro

**2. CORS chyby**
- Zkontrolujte FRONTEND_URL v API
- Ověřte API_URL ve frontend

**3. Google OAuth chyby**
- Zkontrolujte redirect URIs
- Ověřte domain v OAuth consent

**4. Database connection**
- Ověřte DATABASE_URL na obou službách
- Zkontrolujte Prisma schema sync

---

## ✅ GO-LIVE CHECKLIST

- [ ] Render PostgreSQL databáze vytvořena
- [ ] Render API nasazeno a běží na `/health`
- [ ] Vercel frontend nasazen
- [ ] Environment variables nastaveny
- [ ] Google OAuth nakonfigurováno
- [ ] Database migrace a seed
- [ ] Testovací rezervace úspěšná
- [ ] Admin/doktor login test
- [ ] Propojení s hlavním webem

**🎉 MVP je live na `https://your-project-name-xxx.vercel.app`!**

---

## 💡 DALŠÍ KROKY

1. **Custom doména:** Později můžete přidat vlastní subdoménu
2. **Monitoring:** Render má basic monitoring zdarma  
3. **Logs:** Dostupné v obou dashboardech
4. **Scaling:** Upgrade plánů podle potřeby

**Náklady MVP:** 0 Kč/měsíc 🎯 