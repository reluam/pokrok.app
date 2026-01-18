# Gemini API Setup

## ✅ Kód je připraven pro Gemini API

Kód byl upraven pro použití Google Gemini API místo OpenAI.

## 🔑 Nastavení API klíče

1. Přidej do `.env.local`:

```env
GEMINI_API_KEY=tvůj_api_klíč_zde
```

**⚠️ DŮLEŽITÉ:** API klíč je citlivá informace! Nikdy ho necommituj do Gitu. Přidej `.env.local` do `.gitignore`.

2. Restartuj dev server:

```bash
npm run dev
```

## 📦 Instalace závislostí

```bash
npm install
```

Tím se nainstaluje `@google/generative-ai` SDK.

## 🚀 Limity Gemini API

- ✅ **60 requests/minutu** (3,600/hodinu, 86,400/den)
- ✅ **Zdarma** pro začátek
- ✅ **Dostatečné** pro testování a malý počet uživatelů

## 🧪 Testování

1. Otevři aplikaci
2. Přejdi do asistenta
3. Zkus příkazy:
   - "Odškrkni všechny dnešní návyky jako hotové"
   - "Vytvoř cíl: Koupit nové auto do 2 let"
   - "Potřebuju na auto našetřit 500 000 CZK"

## 📝 Poznámky

- Model: `gemini-1.5-flash` (rychlejší a levnější než Pro, stále velmi dobrá kvalita)
- Function calling je plně podporováno
- Odpovědi jsou v češtině
- **⚠️ BEZPEČNOST:** API klíč je citlivá informace - nikdy ho necommituj do Gitu!

## 🔒 Bezpečnost

**DŮLEŽITÉ:** API klíč, který jsi poslal, by měl být:
1. ✅ Přidán do `.env.local` (tento soubor je v `.gitignore`)
2. ❌ **NIKDY** necommitován do Gitu
3. ❌ **NIKDY** nesdílen veřejně

Pokud jsi API klíč omylem commitnul, **okamžitě ho zruš** na https://aistudio.google.com/app/apikey a vytvoř nový!

