# Nastavení cron jobu pro připomínkové emaily

## Připomínkové emaily

Systém automaticky posílá připomínkové emaily klientům **24 hodin před** jejich rezervací.

## Varianta A: Automatické vytvoření (doporučeno)

Použijte [cron-job.org REST API](https://docs.cron-job.org/rest-api.html) a skript vytvoří cron job za vás.

1. **Získejte API klíč** na [cron-job.org](https://cron-job.org) → Settings → API

2. **Do `.env.local` doplňte:**
   ```
   CRON_JOB_ORG_API_KEY=vas_api_klic
   NEXT_PUBLIC_APP_URL=https://vasadomena.cz
   CRON_SECRET_TOKEN=vas_nahodny_token  # openssl rand -hex 32
   ```

3. **Spusťte skript (jednou po deployi):**
   ```bash
   cd cccp && node scripts/setup-cron-job.js
   ```
   Skript vytvoří job „Booking Reminders“ (nebo aktualizuje existující) s voláním každou hodinu.

## Varianta B: Ruční nastavení na cron-job.org

1. **Vytvořte účet** na [cron-job.org](https://cron-job.org) (zdarma)

2. **Vytvořte nový cron job:**
   - **Title**: `Booking Reminders`
   - **Address (URL)**: `https://vasadomena.cz/api/cron/send-booking-reminders?token=VAŠE_SECRET_TOKEN`
   - **Schedule**: `0 * * * *` (každou hodinu)
   - **Request method**: `GET`

3. **Bezpečnostní token:** Vytvořte token (např. `openssl rand -hex 32`) a nastavte `CRON_SECRET_TOKEN` v `.env.local`.

4. **Testování:**
   - Po vytvoření cron jobu můžete endpoint otestovat ručně:
     ```bash
     curl "https://vasadomena.cz/api/cron/send-booking-reminders?token=vas_token"
     ```
   - Měli byste dostat JSON odpověď s počtem odeslaných emailů

## Jak to funguje

- Cron job se volá **každou hodinu**
- Kontroluje bookings s `scheduled_at` mezi **24h a 25h** od nynějška
- Posílá připomínku pouze pokud:
  - Status je `pending` nebo `confirmed`
  - `reminder_sent_at` je `NULL` (ještě nebyla odeslána)
- Po úspěšném odeslání se nastaví `reminder_sent_at = NOW()`

## Alternativní řešení

Pokud používáte **Vercel**, můžete použít Vercel Cron Jobs místo cron-job.org:

1. Vytvořte soubor `vercel.json` v kořeni projektu:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/send-booking-reminders",
         "schedule": "0 * * * *"
       }
     ]
   }
   ```

2. V endpointu použijte Vercel Cron Secret pro autentizaci:
   ```typescript
   const authHeader = request.headers.get("authorization");
   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```

## Monitoring

- Cron job loguje počet odeslaných emailů a případné chyby
- Můžete sledovat logy v cron-job.org dashboardu nebo v aplikaci
- V případě chyb se emaily neposílají, ale rezervace zůstává v databázi
