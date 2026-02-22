# Funnel leadů a Notion CRM

## Co je implementované

- **Formulář** na stránce Koučink (`/koucing#rezervace`) a v sekci Koučink na homepage (ChooseYourPath).
- Po vyplnění jména a e-mailu se lead uloží do DB (Neon) a odešle do Notionu (pokud jsou nastavené env proměnné). Následně se otevře **vlastní rezervační modál** na webu: uživatel vybere termín ze slotů definovaných v adminu. Po potvrzení se rezervace uloží a do ClickUp se vytvoří úkol s termínem (zobrazení v ClickUp kalendáři). Dostupné sloty se filtrují podle Google Kalendáře (konflikty s událostmi).

## Migrace databáze

Jednorázově spusť (na produkci nebo lokálně s `DATABASE_URL`):

```
GET /api/migrate-leads
```

Tím se vytvoří tabulka `leads`.

Pro rezervace spusť také:

```
GET /api/migrate-booking
```

Tím se vytvoří tabulky `booking_slots` a `bookings`.

## Notion – nastavení

1. V Notionu vytvoř novou **databázi** (např. „Leads“ nebo „Konzultace“).
2. Přidej vlastnosti s **přesně těmito názvy a typy**:
   - **Jméno** – Title
   - **E-mail** – Text (nebo Email, pokud máš)
   - **Zdroj** – Select (přidej možnosti: „Koučink“, „Homepage“, „Funnel“)
   - **Stav** – Select (např. „Nový“, „Kontaktován“, „Rezervováno“)
   - **Datum** – Date
   - **Poznámka** – Text (nepovinné)
   - **UTM** – Text (nepovinné)
3. V Notionu: **Settings → Connections** u této databáze přidej svoji **Integration** (vytvoř ji na [notion.so/my-integrations](https://www.notion.so/my-integrations)).
4. Z integration zkopíruj **Internal Integration Secret** → do `.env.local` jako `NOTION_API_KEY`.
5. Otevři databázi v prohlížeči, z URL zkopíruj ID (řetězec mezi `notion.so/` a `?v=`):  
   `https://notion.so/XXXXX?v=...` → `NOTION_DATABASE_ID=XXXXX`

Do `.env.local` (a na Vercel):

```
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...
```

Bez těchto proměnných se leadi ukládají jen do Neonu, do Notionu se neposílají.

## Rezervace termínu (vlastní modál + ClickUp + Google Kalendář)

Po odeslání formuláře se otevře **vlastní modál** na webu: načtou se dostupné termíny z adminu (sekce Rezervace), přefiltrované podle obsazenosti v Google Kalendáři. Uživatel vybere slot a potvrdí rezervaci. Rezervace se uloží do DB a do **ClickUp** se vytvoří úkol s due date = termín (zobrazí se v ClickUp kalendáři).

### ClickUp – nastavení

1. V ClickUp vytvoř **List** (nebo použij existující) pro konzultace.
2. **Kde najít List ID:**
   - V levém sidebaru **najeď na název listu** → klikni na **tři tečky (...)** → **Copy link**.
   - Nebo otevři list a v horní liště (breadcrumbs) klikni na **tři tečky** vedle názvu listu → **Copy link**.
   - Zkopírovaná URL vypadá např.: `https://app.clickup.com/123456/v/li/90123456789`
   - **List ID je číslo za `/li/`** → v příkladu je to `90123456789`. (Starší URL může mít `/list/90123456789` – použij číslo za `/list/`.)
3. V ClickUp: **Profil (avatar) → Settings → Apps → API Token** – vygeneruj **Personal API Token**.
4. Do `.env.local` (a na Vercel) přidej:
   ```
   CLICKUP_API_TOKEN=tvůj_token
   CLICKUP_LIST_ID=123456789
   ```
   List ID můžeš místo env nastavit v Admin → Nastavení → Rezervace (ClickUp List ID).

**Jeden úkol na lead:** Vždy jen **jeden** ClickUp úkol: při vyplnění jména a e-mailu bez rezervace → **„Jméno – Reach out“** (Status **REACH OUT**). Po dokončení rezervace se tentýž úkol aktualizuje na **„Jméno – datum“** a Status **MEETING**. Všechny údaje jsou i v popisu úkolu.

**Custom pole (volitelné):** Nastav v **Admin → Nastavení → Rezervace – ClickUp**: pole E-mail, Zdroj, Jméno, Status (field ID) a option ID pro „Reach out“ a „Konzultace / Meeting“. Prázdné pole = fallback na .env (`CLICKUP_FIELD_MAIL`, `CLICKUP_FIELD_ZDROJ`, …). Bez nastavení se použije jen název a popis úkolu.

**Když se úkol nevytvoří:** Zkontroluj `CLICKUP_API_TOKEN` a `CLICKUP_LIST_ID`. V logu (Vercel) uvidíš chybu.

### E-maily (Resend)

Po **potvrzení rezervace** se odešlou dva e-maily:
- **Klient** dostane potvrzení na svůj e-mail (termín, délka).
- **Ty** dostaneš na `matej@ziju.life` (nebo na adresu z `BOOKING_ADMIN_EMAIL` / `CONTACT_EMAIL`) přehled o nové rezervaci.

K odesílání se používá Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`). Bez nastaveného Resend se rezervace uloží, ale e-maily nepoletí.

**Připomínka 24 h před schůzkou:** Klient dostane e-mail s připomínkou. Nastavení **programátorsky z adminu** (doporučeno):
1. V [cron-job.org](https://console.cron-job.org/) → Settings zkopíruj **API key**.
2. Do .env (a na Vercelu) přidej: `CRONJOB_ORG_API_KEY=tvůj_api_klíč`, `CRON_SECRET=náhodný_řetězec`, `NEXT_PUBLIC_SITE_URL=https://ziju.life` (nebo tvoje doména).
3. V **Admin → Nastavení** v sekci Rezervace klikni na **„Nastavit cron na cron-job.org“**. Tím se přes API vytvoří (nebo aktualizuje) job, který každou hodinu volá `GET /api/cron/booking-reminders` s hlavičkou `Authorization: Bearer <CRON_SECRET>`.

Ruční nastavení na cron-job.org: vytvoř job s URL `https://tvoje-domena.cz/api/cron/booking-reminders`, metoda GET, každou hodinu, hlavička `Authorization: Bearer <CRON_SECRET>` (nebo `?secret=<CRON_SECRET>`).

Po první nasazení s připomínkami spusť znovu migraci rezervací (`GET /api/migrate-booking`), aby v tabulce `bookings` byl sloupec `reminder_sent_at`.

### Google Kalendář – konflikty slotů

Aby se v modálu nezobrazovaly sloty, kdy už máš v kalendáři událost (včetně osobních bloků), nastav **Google Service Account** a sdílení kalendáře. Kompletní krok-za-krokem návod je v **[GOOGLE_CALENDAR_NAVOD.md](./GOOGLE_CALENDAR_NAVOD.md)**.

Stručně: projekt v [Google Cloud Console](https://console.cloud.google.com/) → povolit **Google Calendar API** → vytvořit **Service Account** a stáhnout JSON → celý JSON do env `GOOGLE_SERVICE_ACCOUNT_JSON` → kalendář sdílet na `client_email` z JSON s právem „See all event details“. V Admin → Nastavení můžeš nastavit **Google Calendar ID** (výchozí `primary`).

Bez `GOOGLE_SERVICE_ACCOUNT_JSON` se sloty nefiltrují podle kalendáře (zobrazí se všechny z adminu).

---

## Funnel pro reklamy (`/form/koucing`)

Mobile-first vícekrokový funnel (uvítání → 2 otázky → kontakt → rezervační modál). Leady z funnelu mají `source: "funnel"`; v Notionu se zobrazí jako zdroj **Funnel**. Odpovědi z kroků se ukládají do pole Poznámka.

**Subdomény pro funnel:** Aby na adresách `https://form.ziju.life` nebo `https://coaching.ziju.life` běžel funnel, postupuj takto:

1. **Vercel** – v projektu (stejný jako ziju.life) jdi do **Settings → Domains**, klikni **Add** a zadej:
   - `form.ziju.life`
   - `coaching.ziju.life`
   
   Vercel ti u každé domény ukáže, co máš nastavit v DNS (většinou CNAME na `cname.vercel-dns.com`).

2. **DNS** (u poskytovatele domény ziju.life, např. Cloudflare, Wedos, OVH):
   - Přidej záznam typu **CNAME** pro každou subdoménu:
     - Název/host: `form` → Cíl: hodnota z Vercelu (např. `cname.vercel-dns.com`)
     - Název/host: `coaching` → Cíl: hodnota z Vercelu (např. `cname.vercel-dns.com`)
   - *(Přesnou hodnotu „Cíl“ ti ukáže Vercel u každé domény – může být jiná podle projektu)*

3. V projektu je v `next.config.ts` rewrite: při požadavku na host `form.ziju.life` nebo `coaching.ziju.life` (kořen `/`) se zobrazí stránka `/form/koucing`. Po uložení DNS a ověření domén ve Vercelu tedy obě adresy zobrazí funnel.
