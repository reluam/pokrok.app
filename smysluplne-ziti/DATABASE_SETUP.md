# Nastavení databáze Neon PostgreSQL

## 1. Získání Connection Stringu z Neon

1. Přihlaste se do [Neon Dashboard](https://console.neon.tech)
2. Vyberte svůj projekt
3. Přejděte na **Connection Details**
4. Zkopírujte **Connection String** (formát: `postgresql://user:password@host/database`)

## 2. Nastavení Environment Variable

### Lokálně (.env.local)

Vytvořte nebo upravte soubor `.env.local` v kořenovém adresáři:

```env
DATABASE_URL='postgresql://user:password@host/database?sslmode=require&channel_binding=require'
```

**Poznámka:** `.env.local` je v `.gitignore`, takže se necommitne do repozitáře.

### Na produkci (Vercel/ostatní)

Přidejte `DATABASE_URL` do environment variables na vašem hosting provideru:

**Vercel:**
1. Jděte do projektu v Vercel Dashboard
2. Settings → Environment Variables
3. Přidejte `DATABASE_URL` s hodnotou z Neon (stejný connection string jako lokálně, nebo vytvořte nový v Neon pro produkci)

**Důležité:** Na produkci použijte stejný connection string nebo vytvořte nový v Neon dashboardu pro produkční prostředí.

## 3. Spuštění migrace

### Automaticky při prvním spuštění

Migrace se spustí automaticky při prvním volání API, pokud tabulky neexistují.

### Manuálně přes API

1. Přihlaste se do admin rozhraní (`/admin`)
2. Otevřete konzoli prohlížeče (F12)
3. Spusťte:

```javascript
fetch('/api/migrate', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log(data))
```

### Nebo přes curl:

```bash
curl -X POST https://your-domain.com/api/migrate \
  -H "Cookie: admin-auth=authenticated"
```

## 4. Migrace existujících dat

Pokud máte data v `data/articles.json` a `data/inspiration.json`, migrace je automaticky přenese do databáze při prvním spuštění.

## 5. Ověření

Po migraci by měly fungovat:
- ✅ Vytváření článků
- ✅ Úprava článků
- ✅ Mazání článků
- ✅ Správa inspirací

Všechny operace nyní používají PostgreSQL místo souborů.
