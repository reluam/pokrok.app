# Nasazení na ostrou (Vercel)

## 1. Build lokálně (kontrola)

```bash
npm run build
```

## 2. Vercel – první nasazení

**A) Přes Vercel CLI**

```bash
npx vercel --prod
```

Při prvním spuštění se tě Vercel zeptá na přihlášení a propojení projektu. Vyber existující projekt nebo vytvoř nový; root zůstane `./`.

**B) Přes GitHub**

1. Nahraj projekt na GitHub (pokud ještě není).
2. Na [vercel.com](https://vercel.com) → **Add New** → **Project** → import z GitHubu.
3. Root: `ziju-life` (nebo kořen repa, pokud je monorepo).
4. Build Command: `npm run build`, Output: Next.js (detekuje se automaticky).

## 3. Env proměnné na Vercelu

V **Project → Settings → Environment Variables** nastav (pro Production, případně Preview):

| Proměnná | Povinné | Popis |
|----------|---------|--------|
| `DATABASE_URL` | ano | Connection string z Neon (PostgreSQL) |
| `ADMIN_PASSWORD` | ano | Heslo do /admin – **silné heslo na produkci** |
| `RESEND_API_KEY` | doporučeno | Odesílání e-mailů |
| `RESEND_FROM_EMAIL` | doporučeno | Odesílatel (ověřená doména v Resend) |
| `CONTACT_EMAIL` | doporučeno | Kam posílat zprávy z formuláře |
| `NEXT_PUBLIC_APP_URL` | doporučeno | Plná URL webu, např. `https://ziju.life` |
| `NEXT_PUBLIC_SITE_URL` | doporučeno | Stejně jako APP_URL (newsletter odkazy) |
| `NEXT_PUBLIC_CAL_LINK` | volitelné | Cal.com odkaz |
| `NOTION_API_KEY` | volitelné | Notion integrace (leady) |
| `NOTION_DATABASE_ID` | volitelné | ID Notion databáze |
| `CLICKUP_API_TOKEN` | volitelné | ClickUp (úkoly po rezervaci) |
| `CLICKUP_LIST_ID` | volitelné | ID listu v ClickUp |
| `GOOGLE_CLIENT_ID` | volitelné | OAuth – kalendář (bez JSON klíče) |
| `GOOGLE_CLIENT_SECRET` | volitelné | OAuth kalendář |
| `GOOGLE_OAUTH_REDIRECT_URI` | volitelné | Např. `https://ziju.life/api/admin/google-auth/callback` |
| `CRON_SECRET` | volitelné | Secret pro cron (newsletter) – vygeneruj náhodný řetězec |
| `SKLONOVANI_JMEN_API_KEY` | volitelné | API pro skloňování jmen |
| `USE_RESEND_CONTACTS` | volitelné | `true` = Resend jako zdroj kontaktů pro kampaně |

Po přidání env proměnných spusť **Redeploy** (Deployments → … → Redeploy).

## 4. Migrace databáze na produkci

Po prvním nasazení jednorázově zavolej (v prohlížeči nebo curl – endpointy nemají auth, spouštěj jen jednou):

- **Leady:**  
  `https://tvoje-domena.cz/api/migrate-leads`
- **Rezervace:**  
  `https://tvoje-domena.cz/api/migrate-booking`

Tím se vytvoří tabulky `leads`, `booking_slots`, `bookings`, `weekly_availability` atd. v produkční DB (ta, která je v `DATABASE_URL` na Vercelu).

## 5. Doména

V **Project → Settings → Domains** přidej vlastní doménu (např. `ziju.life`) a podle návodu nastav DNS (A/CNAME na Vercel).

## 6. Cron (newsletter)

V `vercel.json` je nastaven cron pro odesílání newsletterů. Na Vercelu v projektu **Settings → Cron Jobs** by měl být záznam. Pro ověření requestu nastav env `CRON_SECRET` a v cron jobu na Vercelu přidej hlavičku `Authorization: Bearer <CRON_SECRET>` (pokud to tvůj kód kontroluje).

---

**Shrnutí:** `npm run build` → nahraj na Vercel (CLI nebo GitHub) → nastav env → redeploy → spusť migrace → nastav doménu.
