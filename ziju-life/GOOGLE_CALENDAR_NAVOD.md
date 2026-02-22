# Návod: Google Kalendář pro rezervace

Aby se v rezervačním modálu nezobrazovaly termíny, kdy už máš v kalendáři událost, můžeš použít jednu z možností níže. **Nejjednodušší a bez JSON klíče je varianta A (OAuth).**

---

## Možnosti (od nejjednodušší)

| Možnost | Jak na to | Kdy použít |
|--------|-----------|-------------|
| **A) OAuth (doporučeno)** | V Google Cloud vytvoříš **OAuth klienta** (Client ID + Secret), do .env dáš tyto dvě hodnoty + redirect URI. V adminu jednou klikneš na **„Připojit Google Kalendář“** a přihlásíš se. Žádný JSON, žádné sdílení kalendáře na e-mail. | Většina případů, hlavně když organizace **zakazuje JSON klíče** (Service Account keys). |
| **B) Service Account (JSON)** | V Google Cloud vytvoříš Service Account a stáhneš JSON klíč, vložíš ho do env. Kalendář musíš sdílet na e-mail Service Accountu. | Když ti organizace JSON klíče **povoluje** a chceš „server-to-server“ bez přihlášení. |
| **C) Bez Google** | Nic nenastavuješ. Sloty se nefiltrují podle kalendáře – blokované časy řešíš jen v adminu (dostupnost po dnech / jednorázové termíny). | Nejjednodušší provoz bez integrace. |

---

# Varianta A: OAuth (bez JSON) – krok za krokem

Žádný stažený JSON. Stačí **Client ID**, **Client Secret** a **Redirect URI** (řetězce z Google Cloud). Organizace často blokují „Service Account keys“, ale **OAuth credentials** (OAuth 2.0 Client ID) většinou povolují.

## A1. Projekt a Calendar API

1. Otevři **[Google Cloud Console](https://console.cloud.google.com/)** a přihlas se účtem, u kterého máš kalendář.
2. Vytvoř nebo zvol **projekt** (např. „Ziju Life“).
3. **APIs & Services** → **Library** → vyhledej **Google Calendar API** → **Enable**.

## A2. OAuth 2.0 Client (ne Service Account)

1. **APIs & Services** → **Credentials**.
2. **+ Create Credentials** → **Create OAuth client ID**.
3. Pokud se zeptá na „Configure consent screen“, klikni **Configure consent screen**:
   - **User Type:** External (nebo Internal, pokud jde o Workspace a jen tvoje org).
   - Vyplň název aplikace (např. „Ziju Life Rezervace“), ulož.
4. Zpět v **Credentials** → **+ Create Credentials** → **OAuth client ID**.
5. **Application type:** Web application.
6. **Name:** např. „Ziju Life“.
7. **Authorized redirect URIs** → **Add URI** a zadej přesně:
   - Lokálně: `http://localhost:3000/api/admin/google-auth/callback`
   - Produkce: `https://tvojadomena.cz/api/admin/google-auth/callback` (nahraď svou doménou).
8. **Create**. Zobrazí se **Client ID** a **Client Secret** – zkopíruj je (Secret zobrazíš jen jednou; kdyby ne, vytvoř nový klienta).

## A3. Env proměnné

Do `.env.local` (a na Vercel do Environment Variables) přidej:

```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_OAUTH_REDIRECT_URI=https://tvojadomena.cz/api/admin/google-auth/callback
```

- Lokálně: `GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/admin/google-auth/callback`
- Hodnota **GOOGLE_OAUTH_REDIRECT_URI** musí být **stejná** jako jedna z „Authorized redirect URIs“ v OAuth klientovi.

## A4. Připojení kalendáře v adminu

1. Spusť aplikaci a přihlas se do **Admin**.
2. **Nastavení** → sekce **Rezervace – ClickUp a Google Kalendář**.
3. Klikni na **„Připojit Google Kalendář“**. Přesměruje tě to na Google – přihlas se a povol přístup ke kalendáři („See your calendar“).
4. Po schválení tě to vrátí do adminu a u kalendáře uvidíš **Připojeno**. Refresh token se uloží do DB; žádný JSON ani ruční kopírování.

Hotovo. Sloty se od teď filtrují podle tvého hlavního kalendáře (nebo podle **Google Calendar ID** v nastavení – „primary“ = hlavní kalendář).

---

# Varianta B: Service Account (s JSON klíčem)

Použij jen pokud máš povolené vytváření a stahování **JSON klíčů** u Service Accountů.

## B1. Projekt a Calendar API

Stejně jako A1: [Google Cloud Console](https://console.cloud.google.com/) → projekt → **APIs & Services** → **Library** → **Google Calendar API** → **Enable**.

## B2. Service Account a JSON klíč

1. **APIs & Services** → **Credentials** → **+ Create Credentials** → **Service account**.
2. Název (např. „Ziju Life Booking“) → **Create and Continue** → **Done**.
3. Klikni na vytvořený Service Account → záložka **Keys** → **Add key** → **Create new key** → **JSON** → **Create** (stáhne se soubor .json).

## B3. Env a sdílení kalendáře

1. Otevři stažený JSON a zkopíruj **celý obsah** na jeden řádek do `.env.local`:
   ```bash
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...",...}
   ```
2. Z JSONu zkopíruj **`client_email`** (např. `xxx@yyy.iam.gserviceaccount.com`).
3. V **[Google Kalendář](https://calendar.google.com/)** → u svého kalendáře **Settings and sharing** → **Share with specific people** → přidej tento **client_email** s oprávněním **See all event details**.

Bez tohoto sdílení aplikace neuvidí události v kalendáři.

---

# Varianta C: Bez Google

Nenastavuj žádné `GOOGLE_*` proměnné. Sloty se budou generovat jen z **Dostupnosti po dnech** a **jednorázových termínů** v adminu. Blokované časy si hlídáš sám v těchto nastaveních.

---

## Společné: Calendar ID

V **Admin → Nastavení** (nebo env **GOOGLE_CALENDAR_ID**) můžeš nastavit, který kalendář se má číst:
- **primary** = hlavní kalendář (výchozí),
- nebo konkrétní ID (v nastavení kalendáře v Google → „Integrate calendar“ → Calendar ID).

---

## Ověření (A nebo B)

1. V adminu nastav **Dostupnost po dnech** (např. Pondělí 9:00–12:00).
2. V Google Kalendáři vytvoř testovací událost (např. pondělí 10:00–11:00).
3. Otevři rezervační modál na webu – sloty 10:00 a 10:30 by se neměly zobrazit; ostatní v bloku ano.

Pokud to nefunguje (A): zkontroluj, že máš v .env **GOOGLE_CLIENT_ID**, **GOOGLE_CLIENT_SECRET** a **GOOGLE_OAUTH_REDIRECT_URI** a že redirect URI je přesně stejná jako v Google Cloud. Pak zkus v adminu znovu **„Připojit Google Kalendář“**.
