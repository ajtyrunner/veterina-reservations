# 🚀 NASAZENÍ MVP - VETERINA-SVAHY.CZ

## Přehled nasazení
**Hosting:** Railway  
**Doména:** veterina-svahy.cz  
**Databáze:** Railway PostgreSQL  
**Services:** Frontend (Next.js) + API (Express) + Database  

---

## 📋 PŘEDPOKLADY

### 1. Railway účet
- Vytvořte účet na [railway.app](https://railway.app)
- Připojte GitHub repositář

### 2. Doména
- Zakoupte doménu `veterina-svahy.cz`
- Připravte si DNS management

### 3. Google OAuth
- Vytvořte Google Cloud projekt
- Nakonfigurujte OAuth consent screen
- Vytvořte OAuth 2.0 credentials

---

## 🔧 KROK ZA KROKEM

### 1. **Vytvoření Railway projektu**

```bash
# Nainstalujte Railway CLI
npm install -g @railway/cli

# Přihlášení
railway login

# Vytvoření projektu
railway new
```

### 2. **Nastavení PostgreSQL databáze**

V Railway dashboardu:
1. Klikněte "New Service" → "Database" → "PostgreSQL"
2. Počkejte na vytvoření
3. Zkopírujte DATABASE_URL z Variables tab

### 3. **Nasazení API služby**

```bash
# V root adresáři projektu
railway service create --name api

# Nastavení dockerfile pro API
railway vars set RAILWAY_DOCKERFILE_PATH=Dockerfile.api

# Nastavení environment variables
railway vars set NODE_ENV=production
railway vars set PORT=8000
railway vars set DATABASE_URL="vaše-database-url"
railway vars set NEXTAUTH_SECRET="váš-32-char-secret"
railway vars set FRONTEND_URL="https://veterina-svahy.cz"

# Deploy
railway up
```

### 4. **Nasazení Frontend služby**

```bash
# Vytvoření další služby
railway service create --name frontend

# Nastavení dockerfile pro frontend
railway vars set RAILWAY_DOCKERFILE_PATH=Dockerfile.web

# Environment variables
railway vars set NODE_ENV=production
railway vars set PORT=3000
railway vars set NEXTAUTH_URL="https://veterina-svahy.cz"
railway vars set API_URL="https://api-production-xxxx.up.railway.app"
railway vars set NEXT_PUBLIC_API_URL="https://api-production-xxxx.up.railway.app"
railway vars set GOOGLE_CLIENT_ID="váš-google-client-id"
railway vars set GOOGLE_CLIENT_SECRET="váš-google-client-secret"
railway vars set DATABASE_URL="vaše-database-url"

# Deploy
railway up
```

### 5. **Databáze migrace a seed**

```bash
# Připojení k produkční databázi
railway connect postgresql

# V novém terminálu s připojením k DB
npx prisma db push
npx prisma db seed
```

### 6. **Doména a DNS**

V Railway dashboard pro frontend service:
1. Jděte do "Settings" → "Environment" → "Domains"
2. Klikněte "Custom Domain"
3. Přidejte `veterina-svahy.cz` a `www.veterina-svahy.cz`
4. Zkopírujte CNAME hodnoty

U vašeho DNS providera:
```
Type: CNAME
Name: @
Value: production-frontend-xxxx.up.railway.app

Type: CNAME  
Name: www
Value: production-frontend-xxxx.up.railway.app
```

Pro API service:
```
Type: CNAME
Name: api
Value: production-api-xxxx.up.railway.app
```

---

## 🔐 SECURITY CHECKLIST

### Environment Variables
- [ ] `NEXTAUTH_SECRET` - 32+ znaků náhodný string
- [ ] `DATABASE_URL` - zabezpečené připojení
- [ ] `GOOGLE_CLIENT_SECRET` - produkční credentials
- [ ] Všechny URL používají HTTPS

### Google OAuth
- [ ] Authorized redirect URIs:
  - `https://veterina-svahy.cz/api/auth/callback/google`
  - `https://www.veterina-svahy.cz/api/auth/callback/google`
- [ ] Authorized JavaScript origins:
  - `https://veterina-svahy.cz`
  - `https://www.veterina-svahy.cz`

### Database
- [ ] Databáze je v private síti
- [ ] Pravidelné zálohy (Railway automatické)
- [ ] Monitoring zapnuté

---

## 📊 MONITORING A ÚDRŽBA

### Railway Dashboard
- Monitore využití resources
- Sledujte logy v real-time
- Nastavte alerting pro chyby

### Užitečné příkazy
```bash
# Zobrazení logů
railway logs --service api
railway logs --service frontend

# Restart služby
railway redeploy --service api

# Připojení k databázi
railway connect postgresql

# Zobrazení variables
railway vars
```

### Pravidelná údržba
- Sledujte výkon aplikace
- Aktualizujte dependencies
- Zálohujte důležitá data
- Kontrolujte security alerts

---

## 🚨 TROUBLESHOOTING

### Časté problémy

**1. Build failures**
```bash
# Zkontrolujte logy
railway logs

# Ověřte Dockerfile paths
railway vars get RAILWAY_DOCKERFILE_PATH
```

**2. Database connection**
```bash
# Test připojení
railway run npx prisma db ping
```

**3. Environment variables**
```bash
# Seznam všech variables
railway vars

# Přidání chybějící variable
railway vars set KEY=value
```

**4. Domain issues**
- Ověřte DNS propagaci (24-48h)
- Zkontrolujte CNAME záznamy
- Ujistěte se, že SSL certifikát je aktivní

---

## 💰 ODHADOVANÉ NÁKLADY

**Railway Starter Plan ($5/měsíc):**
- PostgreSQL databáze
- 2x Web services (Frontend + API)
- Custom domain
- SSL certifikát
- 500GB traffic/měsíc

**Google Cloud (Free tier):**
- OAuth 2.0 (zdarma pro většinu použití)

**Doména:**
- .cz doména: ~300-500 Kč/rok

**Celkem: ~$5/měsíc + doména**

---

## 🎯 GO-LIVE CHECKLIST

- [ ] Railway services nasazeny a běží
- [ ] Databáze migrovaná a seedovaná
- [ ] DNS záznamy nakonfigurovány
- [ ] SSL certifikáty aktivní
- [ ] Google OAuth funguje
- [ ] Testovací rezervace úspěšná
- [ ] Admin/doktor přihlášení testovány
- [ ] Monitoring nastaven
- [ ] Zálohy aktivní

**🚀 Aplikace je připravená pro produkci!** 