# Průvodce migrací databáze

## Jak spustit migraci

### Metoda 1: Přes API endpoint (doporučeno)

1. **Spusťte dev server:**
   ```bash
   npm run dev
   ```

2. **Spusťte migraci pomocí curl nebo prohlížeče:**
   ```bash
   curl -X POST http://localhost:3001/api/migrate
   ```
   
   Nebo otevřete v prohlížeči:
   ```
   http://localhost:3001/api/migrate
   ```
   (a použijte nástroj pro vývojáře k odeslání POST požadavku)

3. **Zkontrolujte stav migrace:**
   ```bash
   curl http://localhost:3001/api/migrate
   ```

### Metoda 2: Přímo v databázi (pro pokročilé)

Pokud máte přímý přístup k PostgreSQL databázi (např. přes Neon dashboard nebo psql):

1. **Připojte se k databázi** pomocí vašeho `DATABASE_URL`

2. **Spusťte SQL migraci:**
   ```sql
   -- Spusťte obsah souboru migrations/002_add_featured_and_small_things.sql
   ```

   Nebo zkopírujte a vložte obsah souboru `migrations/002_add_featured_and_small_things.sql` do SQL editoru.

### Co migrace dělá?

Migrace `002_add_featured_and_small_things.sql`:

1. **Přidá pole do tabulky `articles`:**
   - `featured` (BOOLEAN) - označuje, zda je článek zobrazen na hlavní stránce
   - `featuredOrder` (INTEGER) - pořadí zobrazení na hlavní stránce

2. **Vytvoří novou tabulku `small_things`:**
   - Pro ukládání malých tipů pro kvalitnější život
   - Obsahuje: id, title, description, source_url, displayOrder

3. **Vytvoří tabulku `small_things_page`:**
   - Pro ukládání úvodního textu stránky "Malé věci"

### Kontrola po migraci

Po spuštění migrace můžete zkontrolovat:

1. **Zda existují nové sloupce:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'articles' 
   AND column_name IN ('featured', 'featuredOrder');
   ```

2. **Zda existují nové tabulky:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name IN ('small_things', 'small_things_page');
   ```

### Řešení problémů

**Chyba: "column already exists"**
- To je v pořádku, migrace používá `IF NOT EXISTS`, takže se nic nepokazí
- Migrace je idempotentní - můžete ji spustit vícekrát bezpečně

**Chyba: "table already exists"**
- Stejně jako výše, migrace je navržena tak, aby byla bezpečná při opakovaném spuštění

**Chyba připojení k databázi**
- Zkontrolujte, zda je `DATABASE_URL` správně nastaven v `.env.local`
- Zkontrolujte, zda máte přístup k databázi

### Produkční nasazení

Na produkci (Vercel) můžete spustit migraci:

1. **Přes API endpoint** (pokud je endpoint veřejně dostupný):
   ```
   POST https://vasadomena.cz/api/migrate
   ```

2. **Nebo přímo v databázi** přes Neon dashboard nebo jiný SQL klient

**Poznámka:** Migrační endpoint je momentálně bez autentizace pro testování. Pro produkci byste měli přidat autentizaci zpět.
