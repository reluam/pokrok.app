# Free Tier Možnosti pro AI Asistenta

## 🎯 Doporučení pro začátek

### 1. **Groq API** ⭐ NEJLEPŠÍ PRO ZAČÁTEK
- ✅ **Úplně zdarma** - žádné kreditní karty
- ✅ **Velmi rychlé** - inference za milisekundy
- ✅ **Velké limity**: 14,400 requests/den (600/hodinu)
- ✅ **Podporuje**: Llama 3, Mixtral, atd.
- ✅ **Function calling**: Podporuje tool use
- ⚠️ **Nevýhoda**: Menší modely než GPT-4, ale stále velmi dobré

**Jak začít:**
1. Zaregistruj se na https://console.groq.com
2. Získej API klíč
3. Uprav kód pro Groq místo OpenAI

**Cena:** $0 (zdarma)

---

### 2. **OpenAI API** - Free Credit
- ✅ **$5 zdarma** při registraci (stačí na ~1000-2000 dotazů s GPT-3.5)
- ✅ **Vynikající kvalita** - GPT-3.5 Turbo nebo GPT-4
- ✅ **Perfektní function calling**
- ⚠️ **Nevýhoda**: Po vyčerpání $5 musíš platit

**Jak začít:**
1. Zaregistruj se na https://platform.openai.com
2. Získej $5 free credit
3. Použij GPT-3.5 Turbo (levnější než GPT-4)

**Cena:** $5 zdarma, pak ~$0.0005-0.002 za dotaz (GPT-3.5 Turbo)

---

### 3. **Anthropic Claude API** - Free Tier
- ✅ **$5 zdarma** při registraci
- ✅ **Vynikající kvalita** - Claude 3 Haiku (nejlevnější)
- ✅ **Bezpečnostní features**
- ⚠️ **Nevýhoda**: Po vyčerpání $5 musíš platit

**Jak začít:**
1. Zaregistruj se na https://console.anthropic.com
2. Získej $5 free credit
3. Použij Claude 3 Haiku (nejlevnější model)

**Cena:** $5 zdarma, pak ~$0.00025 za 1K tokens (Haiku)

---

### 4. **Google Gemini API** - Free Tier
- ✅ **Zdarma** - 60 requests/minutu
- ✅ **Dobrá kvalita**
- ✅ **Function calling** (tool use)
- ⚠️ **Nevýhoda**: Rate limiting (60/min)

**Jak začít:**
1. Získej API klíč na https://aistudio.google.com/app/apikey
2. Použij Gemini Pro model

**Cena:** $0 (zdarma, s rate limits)

---

### 5. **Ollama** - Lokální (100% zdarma)
- ✅ **Úplně zdarma** - běží lokálně
- ✅ **Žádné limity**
- ✅ **Soukromí** - data nikam neposíláš
- ⚠️ **Nevýhoda**: Vyžaduje vlastní server, pomalejší

**Jak začít:**
1. Nainstaluj Ollama: https://ollama.ai
2. Stáhni model: `ollama pull llama3` nebo `ollama pull mistral`
3. Použij lokální API

**Cena:** $0 (zdarma, ale potřebuješ server)

---

## 📊 Srovnání

| Provider | Free Tier | Kvalita | Rychlost | Function Calling | Doporučení |
|----------|-----------|---------|----------|------------------|------------|
| **Groq** | ✅ Velké limity | ⭐⭐⭐⭐ | ⚡⚡⚡⚡⚡ | ✅ | ⭐⭐⭐⭐⭐ |
| **OpenAI** | $5 credit | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡ | ✅ | ⭐⭐⭐⭐ |
| **Anthropic** | $5 credit | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡ | ✅ | ⭐⭐⭐⭐ |
| **Gemini** | 60/min | ⭐⭐⭐⭐ | ⚡⚡⚡⚡ | ✅ | ⭐⭐⭐ |
| **Ollama** | Neomezeně | ⭐⭐⭐ | ⚡⚡ | ⚠️ Omezené | ⭐⭐ |

---

## 🚀 Doporučený postup

### Fáze 1: Začátek (0-100 uživatelů)
**Použij Groq API** - zdarma, rychlé, dostatečné limity

### Fáze 2: Růst (100-1000 uživatelů)
**Použij OpenAI GPT-3.5 Turbo** - levné (~$0.002/dotaz), dobrá kvalita

### Fáze 3: Scale (1000+ uživatelů)
**Použij OpenAI GPT-4 Turbo nebo Anthropic Claude** - nejlepší kvalita, ale dražší

---

## 💻 Implementace pro Groq

Můžeš upravit `/app/api/assistant/execute/route.ts`:

```typescript
// Místo OpenAI:
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const response = await groq.chat.completions.create({
  model: 'llama-3.1-70b-versatile', // nebo 'mixtral-8x7b-32768'
  messages: [...],
  tools: functionDefinitions,
  tool_choice: 'auto',
  temperature: 0.3
})
```

---

## 💡 Tipy pro úsporu

1. **Použij menší modely** - GPT-3.5 místo GPT-4 (10x levnější)
2. **Optimalizuj kontext** - posílej jen nezbytné informace
3. **Cache odpovědi** - podobné dotazy cacheuj
4. **Rate limiting** - max 10-20 dotazů/minutu na uživatele
5. **Fallback** - pokud free tier selže, použij jednodušší logiku

---

## 📝 Závěr

**Pro začátek doporučuji Groq API** - je zdarma, rychlé, a má dostatečné limity pro testování a malý počet uživatelů. Jakmile budeš mít více uživatelů, můžeš přejít na OpenAI GPT-3.5 Turbo (stále velmi levné) nebo GPT-4 (nejlepší kvalita).

