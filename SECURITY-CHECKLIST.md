# 🔒 BEZPEČNOSTNÍ CHECKLIST - PRODUKČNÍ NASAZENÍ

## 🚨 KRITICKÉ - PŘED NASAZENÍM

### 1. **Google OAuth Credentials**
- [ ] **Vygenerujte NOVÉ Google OAuth credentials pro produkci**
- [ ] **Smažte stávající credentials z Google Cloud Console**
- [ ] **Nikdy necommitujte skutečné credentials do gitu**
- [ ] **Nastavte pouze produkční redirect URLs**

### 2. **Environment Variables**
- [ ] **Vygenerujte nový NEXTAUTH_SECRET (min 32 znaků)**
- [ ] **Použijte stejný NEXTAUTH_SECRET na všech službách**
- [ ] **Zkontrolujte že DATABASE_URL používá SSL**
- [ ] **Ověřte že všechny URLs používají HTTPS**

### 3. **Logging & Debugging**
- [ ] **Vypněte debug logování v produkci** (`debug: false` v auth.ts)
- [ ] **Zkontrolujte že se nelogují hesla/tokeny**
- [ ] **Nastavte NODE_ENV=production**

## ⚠️ VYSOKÉ RIZIKO

### 4. **Rate Limiting**
- [ ] **Implementujte rate limiting pro login endpointy**
- [ ] **Omezte bulk operace (max 1000 slotů)**
- [ ] **Přidejte rate limiting pro API endpointy**

### 5. **Error Handling**
- [ ] **Používejte generické error zprávy**
- [ ] **Neodhalujte systémové informace v errorech**
- [ ] **Logujte detailní chyby pouze server-side**

### 6. **CORS & Headers**
- [ ] **Omezte CORS pouze na produkční domény**
- [ ] **Ověřte security headers v next.config.js**
- [ ] **Vypněte development domény v produkci**

## 🔶 STŘEDNÍ RIZIKO

### 7. **Database Security**
- [ ] **Používejte SSL připojení k databázi**
- [ ] **Pravidelné zálohy nastaveány**
- [ ] **Monitoring databázových výkonů**

### 8. **Tenant Isolation**
- [ ] **Audit všech SQL queries na tenant filtrování**
- [ ] **Test cross-tenant access attempts**
- [ ] **Ověření tenant validace ve všech endpointech**

### 9. **Input Validation**
- [ ] **Implementujte JSON schema validaci**
- [ ] **Sanitace všech user inputs**
- [ ] **Validace file uploads (pokud budou)**

## 🟡 NÍZKÉ RIZIKO

### 10. **Monitoring & Alerting**
- [ ] **Nastavte error alerting**
- [ ] **Monitoring neočekávaného trafficu**
- [ ] **Log analysis for security incidents**

### 11. **Regular Maintenance**
- [ ] **Pravidelné aktualizace dependencies**
- [ ] **Security patch monitoring**
- [ ] **Penetration testing plánování**

---

## 🛡️ PRODUKČNÍ KONFIGURACE

### Google OAuth (NOVÝ!)
```
# Vytvořte NOVÉ credentials!
Authorized JavaScript origins:
- https://veterina-svahy.cz
- https://www.veterina-svahy.cz

Authorized redirect URIs:
- https://veterina-svahy.cz/api/auth/callback/google
- https://www.veterina-svahy.cz/api/auth/callback/google
```

### CORS konfigurace
```javascript
origin: [
  'https://veterina-svahy.cz',
  'https://www.veterina-svahy.cz'
], // Pouze produkční domény!
```

### Environment Variables
```bash
NODE_ENV=production
NEXTAUTH_SECRET=nový-64-char-hex-secret
NEXTAUTH_URL=https://veterina-svahy.cz
API_URL=https://api.veterina-svahy.cz
GOOGLE_CLIENT_ID=nový-client-id
GOOGLE_CLIENT_SECRET=nový-client-secret
```

---

## 🔍 PENETRATION TESTING TARGETS

### Authentication Bypass
- [ ] JWT token manipulation
- [ ] Session fixation attacks
- [ ] Role escalation attempts

### Data Access
- [ ] Cross-tenant data access
- [ ] SQL injection attempts
- [ ] XSS vulnerabilities

### Rate Limiting & DoS
- [ ] Brute force login attempts
- [ ] API endpoint flooding
- [ ] Bulk operation abuse

---

## 📞 INCIDENT RESPONSE

### V případě bezpečnostního incidentu:
1. **Okamžitě změňte NEXTAUTH_SECRET**
2. **Regenerujte Google OAuth credentials**
3. **Restartujte všechny services**
4. **Prověřte database logy**
5. **Informujte uživatele o změně hesel**

---

## ✅ DEPLOY CHECKLIST

Před nasazením do produkce:
- [ ] Všechny body v tomto checklistu jsou splněny
- [ ] Bezpečnostní audit proveden
- [ ] Penetration testing dokončen
- [ ] Incident response plán připraven
- [ ] Monitoring a alerting nastaveno
- [ ] Backup strategie implementována

**🔥 Nedeploy!!! bez dokončení kritických bodů!** 