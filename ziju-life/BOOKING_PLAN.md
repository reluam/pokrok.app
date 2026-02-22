# Vlastní rezervace + ClickUp – plán (aktualizováno o Google Calendar)

Tento dokument rozšiřuje plán o **respektování konfliktů z Google Kalendáře**: dostupné sloty se filtrují podle toho, zda v kalendáři už něco je (včetně osobních bloků).

---

## Nová sekce: Konflikty s Google Kalendářem

### Požadavek

- Když máš v adminu nastavený např. **pondělí 18:00–20:00** (jeden „blok“ nebo více slotů po 30 min), modál má nabízet jen ty časy, které **nepřekrývají** události v kalendáři.
- Příklad: v kalendáři máš event 18:00–19:00 → sloty 18:00 a 18:30 se **nesmí** nabízet; od 19:00 už ano.
- Zdroj pravdy: **Google Calendar** (propojený s ClickUp je vedlejší; kontrola přímo proti Google je vhodná, protože tam máš i osobní bloky a reálné obsazení).

### Implementace

1. **Google Calendar API – přístup k událostem**
   - Použít [Google Calendar API](https://developers.google.com/calendar/api/guides/overview) pro čtení eventů v daném časovém rozsahu.
   - **OAuth 2.0** (jednorázové přihlášení „připoj můj kalendář“ v adminu): uložit refresh token do `admin_settings` nebo do DB; pak na backendu před každým voláním slotů získat access token a volat `events.list` s `timeMin` / `timeMax`.
   - Alternativa: **Service Account** – kalendář sdílený na e‑mail service účtu (jednodušší na běh, ale vyžaduje manuální sdílení kalendáře).
   - V adminu: sekce „Google Kalendář“ – tlačítko „Připojit kalendář“ (OAuth flow) a uložení **Calendar ID** (např. `primary` nebo konkrétní ID kalendáře).

2. **Modul pro načtení obsazených intervalů**
   - Nový soubor např. **[lib/google-calendar.ts](ziju-life/lib/google-calendar.ts)** (nebo v rámci booking modulu):
     - Funkce `getBusyIntervals(calendarId: string, timeMin: Date, timeMax: Date): Promise<Array<{ start: Date, end: Date }>>`.
     - Volá Google Calendar API `events.list` s `singleEvents=true`, `timeMin`, `timeMax`; vrací pole intervalů, kdy je kalendář obsazený (včetně celodenních / vícedenních eventů, které s rozsahem překrývají).

3. **Propojení s výpočtem dostupných slotů**
   - **GET /api/booking/slots** (nebo interní funkce, kterou tento endpoint používá):
     - Načte „surové“ sloty z DB (`booking_slots`) v požadovaném rozsahu (např. příštích 14 dní).
     - Pro rozsah těchto slotů zavolá `getBusyIntervals(calendarId, timeMin, timeMax)`.
     - Každý slot (interval `[start_at, start_at + duration_minutes]`) porovná s `getBusyIntervals`: pokud existuje průnik s nějakým obsazeným intervalem, slot **se do odpovědi nezařadí** (nebo se označí jako nedostupný – doporučení: prostě nevrátit).
   - Výsledek: klient v modálu dostane jen sloty, které se nepřekrývají s Google Kalendářem.

4. **Admin**
   - V nastavení (nebo v sekci Rezervace): „Google Kalendář pro konflikty“:
     - Calendar ID (default `primary`).
     - Stav připojení („Připojeno“ / „Nepřipojeno“) a tlačítko OAuth „Připojit“ / „Odpojit“.
   - Uložení refresh tokenu bezpečně (šifrovaně nebo v env – podle tvých požadavků na bezpečnost).

5. **Chování při výpadku kalendáře**
   - Pokud Google Calendar API selže (token vypršel, síť, kvóta): doporučení **nefailovat celý endpoint**, ale vrátit sloty **bez filtrace** (všechny z DB) a zalogovat chybu. Uživatel uvidí všechny adminem nastavené sloty; může dojít k dvojité rezervaci, ale rezervace nepadne. Volitelně v adminu zobrazit varování „Kalendář se nepodařilo načíst, sloty nejsou filtrované“.

---

## Zbytek plánu (beze změny)

- Datový model: `booking_slots`, `bookings`; admin CRUD pro sloty; veřejné GET slotů a POST rezervace.
- Modál: nahrazení iframe vlastním výběrem slotu (načtení z GET /api/booking/slots, výběr, POST /api/booking/reserve).
- ClickUp: po rezervaci vytvoření úkolu s due date (zobrazení v ClickUp kalendáři); dokumentace získání API tokenu a List ID.
- Funnel a LeadForm: beze změny flow (openBookingPopup → nový modál se sloty).

Tím pádem modál **bere v potaz konfliktní eventy** z Google Kalendáře a nabízí jen volné časy.
