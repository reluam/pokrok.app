# Funnel leadů a Notion CRM

## Co je implementované

- **Formulář** na stránce Koučink (`/koucing#rezervace`) a v sekci Koučink na homepage (ChooseYourPath).
- Po vyplnění jména a e-mailu se lead uloží do DB (Neon) a odešle do Notionu (pokud jsou nastavené env proměnné). Následně se otevře **popup s cal.eu** pro výběr termínu (Rezervace běží přes cal.eu – viz níže).

## Migrace databáze

Jednorázově spusť (na produkci nebo lokálně s `DATABASE_URL`):

```
GET /api/migrate-leads
```

Tím se vytvoří tabulka `leads`.

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

## Rezervace termínu (Cal.com embed)

Bookovací tlačítka používají **@calcom/embed-react**: po odeslání formuláře se otevře Cal.com modal (month view, `matej-mauler/30min`). Konfigurace je v `components/BookingPopup.tsx` (namespace `30min`, `data-cal-link`). Volitelně můžeš v `.env.local` nastavit `NEXT_PUBLIC_CAL_EU_BOOKING_URL` pro redirect URL v API odpovědi.

---

## Funnel pro reklamy (`/form/koucing`)

Mobile-first vícekrokový funnel (uvítání → 2 otázky → kontakt → popup cal.eu). Leady z funnelu mají `source: "funnel"`; v Notionu se zobrazí jako zdroj **Funnel**. Odpovědi z kroků se ukládají do pole Poznámka.

**Subdoména form.ziju.life:** V Vercelu přidej doménu `form.ziju.life` k projektu a v DNS nastav CNAME na Vercel. V nastavení domény můžeš nastavit redirect na `/form/koucing`, nebo nasměruj root `form.ziju.life` na stejný projekt – pak v `next.config` přidej rewrite: `form.ziju.life` → `/form/koucing`.
