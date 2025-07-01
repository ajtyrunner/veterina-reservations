# Google OAuth Setup pro Vercel Deployment

## Problém
Chyba `Error 400: redirect_uri_mismatch` při přihlašování přes Google na produkčním prostředí Vercel.

## Řešení

### 1. Aktualizace Google Cloud Console

1. **Otevřete Google Cloud Console**: https://console.cloud.google.com/
2. **Navigujte na**: APIs & Services → Credentials
3. **Vyberte váš OAuth 2.0 Client ID**: `1030866900635-o2ir60in8dd6avod3tedqkn7ml55iugk.apps.googleusercontent.com`

### 2. Přidejte Vercel URLs

#### Authorized JavaScript origins:
```
http://localhost:3000
http://svahy.lvh.me:3000
https://veterina-reservations.vercel.app
```

#### Authorized redirect URIs:
```
http://localhost:3000/api/auth/callback/google
http://svahy.lvh.me:3000/api/auth/callback/google
https://veterina-reservations.vercel.app/api/auth/callback/google
```

### 3. Pro Preview Deployments (volitelné)

Pokud chcete podporovat i Vercel preview deployments, přidejte:

#### Authorized JavaScript origins:
```
https://veterina-reservations-*.vercel.app
```

#### Authorized redirect URIs:
```
https://veterina-reservations-*.vercel.app/api/auth/callback/google
```

**Poznámka**: Google Cloud Console nemusí podporovat wildcards (`*`) pro všechny případy. Pokud wildcard nefunguje, budete muset přidat konkrétní preview URLs ručně.

### 4. Uložte změny

Klikněte na **"Save"** v Google Cloud Console.

### 5. Testování

1. Nasaďte změny na Vercel
2. Otevřete: https://veterina-reservations.vercel.app
3. Zkuste se přihlásit přes Google
4. Přihlášení by nyní mělo fungovat bez chyby `redirect_uri_mismatch`

## Další tipy

### Pro různá prostředí
- **Development**: `http://localhost:3000`
- **Local s custom domain**: `http://svahy.lvh.me:3000`
- **Production**: `https://veterina-reservations.vercel.app`
- **Preview**: `https://veterina-reservations-git-[branch]-[team].vercel.app`

### Časté problémy
1. **Zapomenutí https://**: Produkční URL musí začínat `https://`
2. **Trailing slash**: Někdy pomáhá přidat/odebrat `/` na konci URL
3. **Propagace změn**: Google Cloud změny se mohou projevit až za několik minut

### Debug
Pokud stále nefunguje:
1. Zkontrolujte přesnou redirect URL v browser dev tools
2. Porovnejte s nastavením v Google Cloud Console
3. Zkuste vymazat cookies a zkusit znovu 