# Migration Guide - Encrypt Areas

## Problém
Data na produkci byla zašifrována špatným klíčem (z devu místo z produkce).

## Řešení

### Krok 1: Obnovit data ze snapshotu
Obnovte produkční databázi ze snapshotu před šifrováním (nebo ze snapshotu s plain text daty).

### Krok 2: Nastavit správný ENCRYPTION_MASTER_KEY na produkci
1. Jděte na Vercel Dashboard → Project → Settings → Environment Variables
2. Nastavte `ENCRYPTION_MASTER_KEY` pro Production environment
3. Použijte **produkční klíč** (ne klíč z devu!)
4. Klíč musí být minimálně 32 znaků dlouhý
5. Generovat nový klíč: `openssl rand -base64 32`

### Krok 3: Spustit migraci

**Možnost A: Přes API endpoint (doporučeno)**
1. Být přihlášen jako admin uživatel
2. Spustit POST request na: `https://www.pokrok.app/api/admin/migrate-encrypt-areas`
3. Použít curl nebo Postman:
```bash
curl -X POST https://www.pokrok.app/api/admin/migrate-encrypt-areas \
  -H "Cookie: __clerk_db_jwt=your-token"
```

**Možnost B: Přes Vercel CLI (pokud máte přístup)**
```bash
vercel env pull .env.production
# Upravit .env.production s DATABASE_URL a ENCRYPTION_MASTER_KEY z produkce
node scripts/migrate-encrypt-areas.js
```

### Krok 4: Ověřit výsledek
Zkontrolujte, že areas se zobrazují správně v aplikaci (dešifrované názvy).

---

## Oddělení Dev a Prod databází (Doporučeno)

### Neon Database Branching

Neon podporuje **branching** (větvení databází), což je ideální pro oddělení dev/prod prostředí.

**Struktura:**
- **Main Branch = Production** (hlavní, produkční databáze)
- **Dev Branch = Child branch z Main** (vývojová databáze vytvořená z Main)

**Výhody:**
- ✅ Samostatné databáze pro dev a prod
- ✅ Dev branch má stejné schema jako Main (automaticky)
- ✅ Snadné vytváření testovacích prostředí
- ✅ Snapshoty a rychlé obnovení
- ✅ Různé klíče pro různé prostředí
- ✅ Main zůstává jako zdroj pravdy (production)

**Jak nastavit:**

1. **Main Branch = Production:**
   - Main branch je vaše produkční databáze
   - Použijte Main branch connection string pro produkční DATABASE_URL na Vercel
   - Toto je váš "zdroj pravdy" pro produkci

2. **Vytvořit Dev Branch (Child z Main):**
   - Jděte na Neon Dashboard
   - Vyberte váš projekt
   - Vyberte Main branch
   - Klikněte na "Create Branch" nebo "Branch from Main"
   - Pojmenujte ho "development" nebo "dev"
   - Dev branch automaticky zkopíruje schema z Main
   - Tento branch použijte pro dev DATABASE_URL

3. **Environment Variables na Vercel:**

   **Production (Main branch):**
   ```
   DATABASE_URL=<main-branch-connection-string>
   ENCRYPTION_MASTER_KEY=<production-key>
   ```

   **Preview/Development (Dev branch):**
   ```
   DATABASE_URL=<dev-branch-connection-string>
   ENCRYPTION_MASTER_KEY=<dev-key>
   ```

4. **Migrace:**
   - Migrace na dev: Spustit na dev branch (s dev klíčem)
   - Migrace na prod: Spustit na Main branch (s produkčním klíčem)
   - Každý branch má svůj vlastní klíč

**Postup přechodu:**
1. ✅ Main branch už je vaše produkční databáze (žádná změna)
2. Vytvořit dev branch z Main na Neonu
3. Aktualizovat DATABASE_URL na Vercel pro Preview/Development environment → použít dev branch connection string
4. Nastavit ENCRYPTION_MASTER_KEY pro Preview/Development → použít dev klíč
5. Spustit migraci na dev branch (pokud tam jsou data)
6. Produkce zůstává na Main branch s produkčním klíčem

---

## Bezpečnostní poznámky

⚠️ **DŮLEŽITÉ:**
- Nikdy nesdílejte ENCRYPTION_MASTER_KEY mezi dev a prod
- Každé prostředí musí mít svůj vlastní klíč
- Produkční klíč musí být silný (min. 32 znaků)
- Klíč uložte bezpečně (Vercel Secrets, password manager)
- Při ztrátě klíče = ztráta dat (nelze dešifrovat)

