# 🚀 SPRÁVNÉ POŘADÍ NASAZENÍ

⚠️ **DŮLEŽITÉ:** URLs se získávají až po nasazení! Následujte přesně toto pořadí:

## 📋 FÁZE 1: Příprava
1. **Render účet** - registrace přes GitHub
2. **Vercel účet** - už máte
3. **Google Cloud Console** - OAuth setup

## 🗄️ FÁZE 2: Databáze (Render)
1. Vytvoření PostgreSQL na Render
2. **Zkopírování DATABASE_URL** 📝

## 🔧 FÁZE 3: Backend API (Render)
1. Nasazení Express API na Render
2. **Zkopírování API URL** 📝 (např. `https://veterina-api.onrender.com`)
3. Nastavení environment variables
4. Databáze migrace přes Render Shell

## 🌐 FÁZE 4: Frontend (Vercel)
1. Nasazení Next.js na Vercel
2. **Zkopírování Frontend URL** 📝 (např. `https://veterina-rezervace-xxx.vercel.app`)
3. Nastavení environment variables s **skutečnými URLs**

## 🔐 FÁZE 5: Google OAuth
1. Aktualizace OAuth s **skutečnou Vercel URL**
2. Redirect URIs: `https://your-actual-vercel-url.vercel.app/api/auth/callback/google`

## 🧪 FÁZE 6: Testování & Propojení
1. Test všech funkcí
2. Propojení s [veterina-svahy.cz](https://veterina-svahy.cz)

---

## 🔄 ENVIRONMENT VARIABLES FLOW

```
1. Render PostgreSQL    → DATABASE_URL
2. Render API          → API_URL 
3. Vercel Frontend     → NEXTAUTH_URL
4. Google OAuth        → CLIENT_ID + SECRET
```

**Všechny služby musí mít správné URLs navzájem!** 🔗 