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
