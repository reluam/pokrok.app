# Deployment Checklist pro planner.pokrok.app

## ✅ Kódové změny (hotovo)
- [x] Aktualizován `getBaseUrl()` - fallback na `https://planner.pokrok.app`
- [x] Aktualizován `getClerkUrls()` - používá `planner.pokrok.app` místo starých URL
- [x] Aktualizován `env.example` s novými URL
- [x] Middleware má redirect z `/game` na `/main-panel`
- [x] Všechny nové routy jsou v middleware jako protected routes

## 📋 Vercel Deployment

### 1. Environment Variables v Vercel
Nastavte následující environment variables v Vercel dashboardu:

```
NEXT_PUBLIC_SITE_URL=https://planner.pokrok.app
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/main-panel
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/main-panel
```

### 2. Doména v Vercel
1. Jděte do Vercel projektu → Settings → Domains
2. Přidejte doménu: `planner.pokrok.app`
3. Nastavte jako primary domain (pokud je to hlavní doména)

### 3. DNS Konfigurace
V DNS provideru (kde máte pokrok.app) nastavte:
- **CNAME record**: `planner` → `cname.vercel-dns.com` (nebo podle Vercel instrukcí)

## 🔐 Clerk Configuration

### 1. Clerk Dashboard - Redirect URLs
V Clerk dashboardu přidejte do **Allowed redirect URLs**:
- `https://planner.pokrok.app`
- `https://planner.pokrok.app/main-panel`
- `https://planner.pokrok.app/sign-in`
- `https://planner.pokrok.app/sign-up`
- `https://planner.pokrok.app/cs/main-panel`
- `https://planner.pokrok.app/en/main-panel`
- `https://planner.pokrok.app/cs/sign-in`
- `https://planner.pokrok.app/en/sign-up`

### 2. Clerk Dashboard - Allowed Origins
Přidejte do **Allowed origins**:
- `https://planner.pokrok.app`

### 3. Clerk Dashboard - After Sign In/Up URLs
Nastavte:
- **After sign in URL**: `/main-panel`
- **After sign up URL**: `/main-panel`

## 🧪 Testing po nasazení

1. **Základní testy:**
   - [ ] Otevřít `https://planner.pokrok.app` - mělo by zobrazit landing page
   - [ ] Kliknout na Sign In - mělo by přesměrovat na `/sign-in`
   - [ ] Po přihlášení - mělo by přesměrovat na `/main-panel`
   - [ ] Navigace mezi stránkami (`/goals`, `/habits`, `/steps`, atd.)

2. **Redirect testy:**
   - [ ] `/game` → `/main-panel` (backward compatibility)
   - [ ] `/cs/game` → `/cs/main-panel`
   - [ ] `/en/game` → `/en/main-panel`

3. **Authentication testy:**
   - [ ] Sign in flow funguje
   - [ ] Sign up flow funguje
   - [ ] Sign out funguje
   - [ ] Protected routes vyžadují autentizaci

4. **Routing testy:**
   - [ ] Všechny nové routy fungují (`/main-panel`, `/goals`, `/habits`, `/steps`, `/settings`, `/help`, `/workflows`, `/areas`, `/statistics`, `/achievements`)
   - [ ] Locale routing funguje (`/cs/main-panel`, `/en/main-panel`)

## 📝 Poznámky

- Middleware automaticky přesměrovává `/game` na `/main-panel` pro zpětnou kompatibilitu
- Všechny nové routy jsou chráněné autentizací
- Cron job pro generování recurring instances je nastaven v `vercel.json`

