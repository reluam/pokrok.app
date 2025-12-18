# Nastavení emailů pro rezervace coaching sezení

## Resend - Free Email Service

Používáme **Resend** - moderní emailovou službu s generózním free tierem:
- ✅ **3000 emailů zdarma měsíčně**
- ✅ Jednoduchá integrace s Next.js
- ✅ Platí se až při větším trafficu
- ✅ Skvělá deliverability

### 1. Vytvoření účtu na Resend

1. Jděte na [resend.com](https://resend.com)
2. Vytvořte si zdarma účet
3. Po přihlášení přejděte do **API Keys**
4. Vytvořte nový API klíč (např. "Production" nebo "Development")
5. Zkopírujte API klíč

### 2. Ověření domény (DŮLEŽITÉ pro produkci!)

**Proč ověřit doménu?**
- ✅ Emaily nebudou chodit do spamu
- ✅ Lepší deliverability (doručitelnost)
- ✅ Profesionální vzhled (email z vaší domény)
- ✅ SPF, DKIM a DMARC záznamy pro bezpečnost

**Jak ověřit doménu v Resend:**

1. V Resend dashboardu přejděte na **Domains**
2. Klikněte na **Add Domain**
3. Zadejte svou doménu (např. `smysluplneziti.cz`)
4. Resend vám poskytne DNS záznamy, které musíte přidat do GoDaddy:
   - **SPF záznam** (TXT)
   - **DKIM záznam** (TXT) 
   - **DMARC záznam** (TXT) - volitelný, ale doporučený

5. **Přidání DNS záznamů v GoDaddy:**
   - Přihlaste se do GoDaddy
   - Přejděte na **DNS Management** pro vaši doménu
   - Přidejte záznamy, které Resend poskytl
   - Počkejte na propagaci (obvykle 5-30 minut)

6. Po ověření můžete posílat emaily z `noreply@smysluplneziti.cz` nebo `info@smysluplneziti.cz`

**Pro testování** můžete použít `onboarding@resend.dev` (funguje bez ověření, ale může jít do spamu).

### 3. Vytvořte soubor `.env.local`

V kořenovém adresáři projektu vytvořte soubor `.env.local`:

```env
# Resend API Key (získáte v Resend dashboardu)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email, ze kterého se budou emaily odesílat
# Pro testování použijte: onboarding@resend.dev
# Pro produkci použijte ověřenou doménu: noreply@vasadomena.cz
FROM_EMAIL=onboarding@resend.dev

# Email, kam mají přijít rezervace
RECIPIENT_EMAIL=vas@email.cz
```

### 4. Instalace závislostí

```bash
npm install
```

### 5. Restart serveru

Po vytvoření `.env.local` restartujte dev server:

```bash
npm run dev
```

## Testování

Po nastavení můžete otestovat formulář na stránce `/coaching`. Po odeslání byste měli obdržet:
- Email s rezervací na váš `RECIPIENT_EMAIL`
- Potvrzovací email klientovi na email, který vyplnil ve formuláři

## Proč emaily chodí do spamu?

**Vývojové prostředí (onboarding@resend.dev):**
- ❌ Email není z ověřené domény
- ❌ Chybí SPF/DKIM záznamy
- ❌ Emailové klienty to považují za podezřelé
- ✅ **Řešení:** Ověřte doménu v Resend

**Produkční prostředí (s ověřenou doménou):**
- ✅ Email je z vaší domény
- ✅ SPF/DKIM záznamy jsou nastavené
- ✅ Resend má dobrou reputaci
- ✅ Emaily by měly chodit do inboxu, ne do spamu

**Doporučení:**
- Pro produkci **vždy** ověřte doménu v Resend
- Použijte profesionální email adresu (např. `noreply@smysluplneziti.cz`)
- Přidejte DMARC záznam pro ještě lepší deliverability

## Ceny Resend

- **Free tier:** 3000 emailů/měsíc zdarma
- **Pro:** $20/měsíc za 50,000 emailů
- **Business:** $80/měsíc za 200,000 emailů

Pro začátek je free tier více než dostatečný!

## Bezpečnost

- **Nikdy** necommitněte `.env.local` do gitu (je již v `.gitignore`)
- API klíč uchovávejte v bezpečí
- V produkci použijte environment proměnné na vašem hosting provideru (Vercel, Netlify, atd.)

## Alternativní služby (pokud byste potřebovali více)

- **SendGrid** - 100 emailů denně zdarma (3000/měsíc)
- **Mailgun** - 5000 emailů zdarma měsíčně (první 3 měsíce), pak 1000/měsíc
- **Brevo (Sendinblue)** - 300 emailů denně zdarma
