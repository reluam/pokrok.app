# Možnosti šifrování textových dat v Pokroku

## Přehled dat k šifrování

### Oblasti (Areas)
- `name` (VARCHAR(255))
- `description` (TEXT)

### Cíle (Goals)
- `title` (VARCHAR(255))
- `description` (TEXT)

### Kroky (Daily Steps)
- `title` (VARCHAR(255))
- `description` (TEXT)
- `checklist` (JSONB - obsahuje text položek checklistu)

### Návyky (Habits)
- `name` (VARCHAR(255))
- `description` (TEXT)

### Metriky cílů (Goal Metrics)
- `name` (VARCHAR(255))
- `description` (TEXT)
- `unit` (VARCHAR(50))

### Metriky (Legacy Metrics)
- `name` (VARCHAR(255))
- `description` (TEXT)
- `unit` (VARCHAR(50))

## Možnosti implementace šifrování

### 1. **Application-Level Encryption (AES-256-GCM) - DOPORUČENO**

**Popis:** Šifrování na úrovni aplikace před uložením do databáze. Data jsou zašifrovaná vždy, když opustí aplikaci, a dešifrovaná při načtení.

**Výhody:**
- ✅ Plná kontrola nad šifrováním
- ✅ Data jsou šifrovaná v databázi (ochrana při úniku dat)
- ✅ Možnost použít user-specific encryption keys
- ✅ Nezávislé na databázovém provideru
- ✅ Funguje s PostgreSQL i jinými databázemi
- ✅ Možnost migrace existujících dat

**Nevýhody:**
- ⚠️ Větší složitost implementace
- ⚠️ Nutnost správy šifrovacích klíčů
- ⚠️ Mírný výkonnostní overhead (šifrování/dešifrování)
- ⚠️ Nelze vyhledávat v zašifrovaných datech (full-text search)
- ⚠️ Nelze řadit podle zašifrovaných polí

**Implementace:**
- Použít `crypto` modul z Node.js (built-in, bez externích závislostí)
- Algoritmus: AES-256-GCM (Galois/Counter Mode) - zajišťuje autentizaci i šifrování
- Šifrovací klíč: odvozený z uživatelského hesla/secretu nebo uložený v environment variables
- Formát: Base64 string pro ukládání do TEXT sloupce

**Key Management Možnosti:**
- **A) Master Key (nejjednodušší):** Jeden klíč pro všechny uživatele (v environment variable)
  - ✅ Jednoduchá implementace
  - ⚠️ Kompromitace klíče = kompromitace všech dat
  
- **B) User-Specific Key (doporučeno):** Každý uživatel má svůj klíč odvozený z jeho unikátního secretu
  - ✅ Lepší bezpečnost - kompromitace jednoho klíče neovlivní ostatní
  - ⚠️ Složitější správa - klíč musí být uložen bezpečně
  
- **C) Key Derivation (hybrid):** Master key + user ID pro odvození unikátního klíče
  - ✅ Kombinuje výhody obou přístupů
  - ✅ Relativně jednoduchá implementace

**Příklad struktury:**
```typescript
// Encryption helper
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

function getEncryptionKey(userId: string): Buffer {
  // Derive key from master key + user ID
  const masterKey = process.env.ENCRYPTION_MASTER_KEY!
  return crypto.pbkdf2Sync(masterKey, userId, 100000, KEY_LENGTH, 'sha256')
}

function encrypt(text: string, userId: string): string {
  const key = getEncryptionKey(userId)
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const tag = cipher.getAuthTag()
  
  // Combine: iv + tag + encrypted
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`
}

function decrypt(encryptedText: string, userId: string): string {
  const key = getEncryptionKey(userId)
  const [ivStr, tagStr, encrypted] = encryptedText.split(':')
  
  const iv = Buffer.from(ivStr, 'base64')
  const tag = Buffer.from(tagStr, 'base64')
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

---

### 2. **Database-Level Encryption (PostgreSQL pgcrypto)**

**Popis:** Použití PostgreSQL extension `pgcrypto` pro šifrování na úrovni databáze pomocí SQL funkcí.

**Výhody:**
- ✅ Šifrování přímo v SQL dotazech
- ✅ Možnost použít databázové funkce pro šifrování/dešifrování
- ✅ Data jsou šifrovaná v databázi

**Nevýhody:**
- ⚠️ Vyžaduje `pgcrypto` extension (musí být podporováno providerem)
- ⚠️ Klíč musí být dostupný v databázi (riziko)
- ⚠️ Složitější dotazy (encrypt/decrypt v SQL)
- ⚠️ Těžší migrace existujících dat
- ⚠️ Potenciální problém s Neon/serverless databázemi

**Příklad:**
```sql
-- Encrypt
INSERT INTO goals (title, description) VALUES (
  pgp_sym_encrypt('Goal Title', 'encryption_key'),
  pgp_sym_encrypt('Goal Description', 'encryption_key')
)

-- Decrypt
SELECT 
  pgp_sym_decrypt(title::bytea, 'encryption_key') as title,
  pgp_sym_decrypt(description::bytea, 'encryption_key') as description
FROM goals
```

---

### 3. **Field-Level Encryption s Transparentními wrapper funkcemi**

**Popis:** Vytvoření wrapper funkcí kolem databázových operací, které automaticky šifrují/dešifrují při čtení/zápisu.

**Výhody:**
- ✅ Transparentní pro většinu aplikace
- ✅ Centrální místo pro logiku šifrování
- ✅ Snadná migrace existujících dat
- ✅ Možnost postupného nasazení (field by field)

**Nevýhody:**
- ⚠️ Nutnost refaktoringu všech databázových operací
- ⚠️ Riziko zapomenutí šifrování na některých místech
- ⚠️ Debugging může být složitější

**Implementace:**
```typescript
// Wrapper funkce pro createGoal
async function createGoal(goalData: any) {
  const encryptedData = {
    ...goalData,
    title: goalData.title ? encrypt(goalData.title, goalData.user_id) : null,
    description: goalData.description ? encrypt(goalData.description, goalData.user_id) : null
  }
  return await sql`INSERT INTO goals ... RETURNING *`
}

// Automatické dešifrování při čtení
async function getGoalsByUserId(userId: string) {
  const goals = await sql`SELECT * FROM goals WHERE user_id = ${userId}`
  return goals.map(goal => ({
    ...goal,
    title: goal.title ? decrypt(goal.title, userId) : null,
    description: goal.description ? decrypt(goal.description, userId) : null
  }))
}
```

---

### 4. **Client-Side Encryption (End-to-End)**

**Popis:** Šifrování na klientovi (v prohlížeči/mobilní aplikaci) před odesláním na server.

**Výhody:**
- ✅ Nejvyšší úroveň bezpečnosti - server nikdy nevidí nezašifrovaná data
- ✅ Ochrana i před útoky na server
- ✅ GDPR compliant - "data at rest" jsou vždy zašifrovaná

**Nevýhody:**
- ⚠️ Velmi složitá implementace
- ⚠️ Nutnost správy klíčů na klientovi
- ⚠️ Problematické pro web (kam uložit klíč?)
- ⚠️ Nelze vyhledávat ani řadit na serveru
- ⚠️ Velmi složité pro existující aplikaci

---

## Doporučení

### Pro Pokrok doporučuji: **Application-Level Encryption s User-Specific Key Derivation**

**Důvody:**
1. ✅ Balancuje bezpečnost a jednoduchost implementace
2. ✅ Funguje s Neon/serverless PostgreSQL
3. ✅ Možnost postupného nasazení (table by table)
4. ✅ Možnost migrace existujících dat
5. ✅ Centrální správa šifrování v TypeScript/JavaScript

### Implementační strategie

**Fáze 1: Připravení infrastruktury**
- Vytvoření encryption helper modulu
- Nastavení master key v environment variables
- Vytvoření migračních skriptů

**Fáze 2: Postupné nasazení (table by table)**
1. Oblasti (Areas) - nejjednodušší, dobrý test
2. Cíle (Goals)
3. Kroky (Daily Steps) + checklist
4. Návyky (Habits)
5. Metriky (Goal Metrics + Legacy Metrics)

**Fáze 3: Migrace existujících dat**
- Batch migrace starých dat
- Validace dešifrování
- Rollback plán

### Technické detaily

**Šifrování:**
- Algoritmus: `aes-256-gcm`
- Key derivation: `pbkdf2` (100,000 iterací, SHA-256)
- Format: `{iv}:{authTag}:{encryptedData}` (vše Base64)

**Storage:**
- V databázi: TEXT sloupce (nahradit VARCHAR/TEXT)
- Formát: Base64 string (větší než originál, ale stále čitelný)

**Performance:**
- Overhead: ~1-5ms na šifrování/dešifrování (závisí na délce textu)
- Batch operace: možné paralelní zpracování
- Caching: dešifrovaná data lze cachovat (s opatrností)

### Rizika a mitigace

**Riziko 1: Ztráta master keyu**
- Mitigace: Záloha klíče na bezpečném místě, key rotation plán

**Riziko 2: Performance overhead**
- Mitigace: Batch dešifrování, caching, monitoring

**Riziko 3: Zapomenutí šifrování na některých místech**
- Mitigace: Type safety (TypeScript), unit testy, code review

**Riziko 4: Problémy s migrací**
- Mitigace: Postupné nasazení, rollback možnost, validace

### Odhadované úsilí

- **Příprava infrastructure:** 4-8 hodin
- **Implementace na jednu tabulku:** 2-4 hodiny
- **Migrace existujících dat:** 2-4 hodiny na tabulku
- **Testování a validace:** 4-8 hodin celkem
- **Celkem:** ~40-60 hodin práce

### Další úvahy

**Search a Sorting:**
- Full-text search nebude fungovat na zašifrovaných datech
- Řešení: 
  - Vytvořit searchable index před šifrováním (hash/fingerprint)
  - Použít externí search engine (např. Elasticsearch)
  - Nebo akceptovat, že search bude fungovat jen na frontendu po dešifrování

**Backup a Recovery:**
- Zálohy budou obsahovat zašifrovaná data
- Klíč musí být zálohován samostatně
- Recovery proces musí zahrnovat klíč

**Compliance:**
- GDPR: Data jsou "encrypted at rest" ✅
- Možnost "right to be forgotten" - smazání klíče = data jsou nepoužitelná

---

## Shrnutí možností

| Možnost | Bezpečnost | Složitost | Performance | Doporučení |
|---------|-----------|-----------|-------------|------------|
| Application-Level (AES-256-GCM) | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ DOPORUČENO |
| Database-Level (pgcrypto) | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ❌ Omezená podpora |
| Client-Side (E2E) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ❌ Příliš složité |
| Transparent Wrappers | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Dobré pro refactoring |

---

## Další kroky

Po rozhodnutí o přístupu můžeme připravit:
1. Detailní implementační plán
2. Code structure a helper moduly
3. Migration scripty
4. Testovací scénáře
5. Rollback plán

