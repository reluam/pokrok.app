# Implementační plán: Application-Level Encryption s User-Specific Key Derivation

## Přehled

Tento dokument popisuje kompletní implementační plán pro šifrování textových dat v aplikaci Pokrok pomocí Application-Level Encryption s User-Specific Key Derivation.

**Cíl:** Zašifrovat všechna textová pole (názvy, popisy) v tabulkách: areas, goals, daily_steps, habits, goal_metrics, metrics.

---

## Fáze 0: Příprava infrastruktury

### Krok 0.1: Vytvoření encryption helper modulu

**Soubor:** `pokrok-game-web/lib/encryption.ts`

```typescript
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const KEY_LENGTH = 32
const PBKDF2_ITERATIONS = 100000
const PBKDF2_DIGEST = 'sha256'

/**
 * Derives encryption key for a specific user
 * Uses PBKDF2 with master key + user ID as salt
 */
function getEncryptionKey(userId: string): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY
  
  if (!masterKey) {
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is not set')
  }
  
  if (masterKey.length < 32) {
    throw new Error('ENCRYPTION_MASTER_KEY must be at least 32 characters long')
  }
  
  // Derive key using PBKDF2: master key as password, userId as salt
  return crypto.pbkdf2Sync(
    masterKey,
    userId,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST
  )
}

/**
 * Encrypts a text string for a specific user
 * Returns Base64 encoded string: {iv}:{authTag}:{encryptedData}
 */
export function encrypt(text: string | null | undefined, userId: string): string | null {
  // Handle null/undefined/empty strings
  if (!text || text.trim() === '') {
    return null
  }
  
  try {
    const key = getEncryptionKey(userId)
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    
    const tag = cipher.getAuthTag()
    
    // Format: iv:tag:encrypted (all Base64)
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts an encrypted string for a specific user
 * Expects format: {iv}:{authTag}:{encryptedData} (all Base64)
 */
export function decrypt(encryptedText: string | null | undefined, userId: string): string | null {
  // Handle null/undefined/empty strings
  if (!encryptedText || encryptedText.trim() === '') {
    return null
  }
  
  try {
    const key = getEncryptionKey(userId)
    const parts = encryptedText.split(':')
    
    if (parts.length !== 3) {
      // Try to decrypt as plain text (for migration period)
      // This allows gradual migration without breaking existing data
      console.warn('Invalid encrypted format, treating as plain text:', encryptedText.substring(0, 50))
      return encryptedText
    }
    
    const [ivStr, tagStr, encrypted] = parts
    
    const iv = Buffer.from(ivStr, 'base64')
    const tag = Buffer.from(tagStr, 'base64')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    // During migration, if decryption fails, return original (might be plain text)
    console.warn('Decryption failed, returning original text (migration mode)')
    return encryptedText
  }
}

/**
 * Checks if a string is encrypted (has the expected format)
 */
export function isEncrypted(text: string | null | undefined): boolean {
  if (!text) return false
  const parts = text.split(':')
  return parts.length === 3 && parts.every(part => {
    try {
      Buffer.from(part, 'base64')
      return true
    } catch {
      return false
    }
  })
}

/**
 * Encrypts an object's specified fields
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  userId: string,
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...obj }
  
  for (const field of fieldsToEncrypt) {
    if (field in encrypted && encrypted[field] != null) {
      encrypted[field] = encrypt(encrypted[field], userId) as any
    }
  }
  
  return encrypted
}

/**
 * Decrypts an object's specified fields
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  userId: string,
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...obj }
  
  for (const field of fieldsToDecrypt) {
    if (field in decrypted && decrypted[field] != null) {
      decrypted[field] = decrypt(decrypted[field], userId) as any
    }
  }
  
  return decrypted
}

/**
 * Encrypts JSONB checklist field
 */
export function encryptChecklist(checklist: any[] | null | undefined, userId: string): any[] | null {
  if (!checklist || !Array.isArray) {
    return null
  }
  
  return checklist.map(item => ({
    ...item,
    text: item.text ? encrypt(item.text, userId) : item.text
  }))
}

/**
 * Decrypts JSONB checklist field
 */
export function decryptChecklist(checklist: any[] | null | undefined, userId: string): any[] | null {
  if (!checklist || !Array.isArray) {
    return null
  }
  
  return checklist.map(item => ({
    ...item,
    text: item.text ? decrypt(item.text, userId) : item.text
  }))
}
```

### Krok 0.2: Environment variable setup

**Soubor:** `.env.local` (přidat)
```bash
# Encryption Master Key (min 32 characters, generate with: openssl rand -base64 32)
ENCRYPTION_MASTER_KEY=your-secret-master-key-here-min-32-chars
```

**Soubor:** `env-template.txt` (aktualizovat)
```bash
ENCRYPTION_MASTER_KEY=your-secret-master-key-here-min-32-chars
```

### Krok 0.3: Unit testy pro encryption modul

**Soubor:** `pokrok-game-web/lib/__tests__/encryption.test.ts`

```typescript
import { encrypt, decrypt, isEncrypted } from '../encryption'

describe('Encryption', () => {
  const testUserId = 'test-user-123'
  const originalKey = process.env.ENCRYPTION_MASTER_KEY
  
  beforeAll(() => {
    // Set test master key
    process.env.ENCRYPTION_MASTER_KEY = 'test-master-key-min-32-characters-long'
  })
  
  afterAll(() => {
    // Restore original key
    if (originalKey) {
      process.env.ENCRYPTION_MASTER_KEY = originalKey
    }
  })
  
  test('encrypts and decrypts text correctly', () => {
    const original = 'Test text to encrypt'
    const encrypted = encrypt(original, testUserId)
    const decrypted = decrypt(encrypted, testUserId)
    
    expect(decrypted).toBe(original)
    expect(isEncrypted(encrypted)).toBe(true)
  })
  
  test('handles null and empty strings', () => {
    expect(encrypt(null, testUserId)).toBeNull()
    expect(encrypt('', testUserId)).toBeNull()
    expect(decrypt(null, testUserId)).toBeNull()
  })
  
  test('different users produce different encrypted values', () => {
    const text = 'Same text'
    const encrypted1 = encrypt(text, 'user-1')
    const encrypted2 = encrypt(text, 'user-2')
    
    expect(encrypted1).not.toBe(encrypted2)
    // But both should decrypt correctly
    expect(decrypt(encrypted1, 'user-1')).toBe(text)
    expect(decrypt(encrypted2, 'user-2')).toBe(text)
  })
})
```

---

## Fáze 1: Implementace pro Areas (Oblasti)

### Krok 1.1: Identifikace funkcí k úpravě

**Soubory k úpravě:**
- `lib/cesta-db.ts` - funkce pro areas
- `app/api/cesta/areas/route.ts` - API routes

**Funkce k úpravě:**
- `getAreasByUserId()` - přidat dešifrování
- `createArea()` - přidat šifrování
- `updateArea()` - přidat šifrování při zápisu, dešifrování při čtení

### Krok 1.2: Úprava `lib/cesta-db.ts`

**Najít funkce:**
```typescript
// Před:
export async function getAreasByUserId(userId: string): Promise<Area[]> {
  const areas = await sql`SELECT * FROM areas WHERE user_id = ${userId}`
  return areas as Area[]
}

// Po:
import { decryptFields } from './encryption'

export async function getAreasByUserId(userId: string): Promise<Area[]> {
  const areas = await sql`SELECT * FROM areas WHERE user_id = ${userId}`
  return areas.map(area => decryptFields(area, userId, ['name', 'description'])) as Area[]
}
```

**Pro createArea a updateArea:**
```typescript
import { encryptFields } from './encryption'

export async function createArea(areaData: Partial<Area>): Promise<Area> {
  const encryptedData = encryptFields(areaData, areaData.user_id!, ['name', 'description'])
  // ... existing SQL INSERT
}

export async function updateArea(areaId: string, updates: Partial<Area>): Promise<Area> {
  // Get userId first
  const existing = await sql`SELECT user_id FROM areas WHERE id = ${areaId}`
  const userId = existing[0]?.user_id
  
  if (!userId) throw new Error('Area not found')
  
  const encryptedUpdates = encryptFields(updates, userId, ['name', 'description'])
  // ... existing SQL UPDATE
}
```

### Krok 1.3: Úprava API routes

**Soubor:** `app/api/cesta/areas/route.ts`

Zkontrolovat, že všechny CREATE/UPDATE operace používají funkce z `cesta-db.ts` (které už budou šifrovat).

### Krok 1.4: Migration script pro existující data

**Soubor:** `pokrok-game-web/scripts/migrate-encrypt-areas.ts`

```typescript
import { neon } from '@neondatabase/serverless'
import { encrypt } from '../lib/encryption'

const sql = neon(process.env.DATABASE_URL!)

async function migrateAreas() {
  console.log('🔄 Starting areas encryption migration...')
  
  // Get all areas
  const areas = await sql`
    SELECT id, user_id, name, description 
    FROM areas 
    WHERE name IS NOT NULL OR description IS NOT NULL
  `
  
  console.log(`📊 Found ${areas.length} areas to encrypt`)
  
  let successCount = 0
  let errorCount = 0
  
  for (const area of areas) {
    try {
      const updates: any = {}
      
      // Encrypt name if not already encrypted
      if (area.name && !area.name.includes(':')) {
        updates.name = encrypt(area.name, area.user_id)
      }
      
      // Encrypt description if not already encrypted
      if (area.description && !area.description.includes(':')) {
        updates.description = encrypt(area.description, area.user_id)
      }
      
      if (Object.keys(updates).length > 0) {
        await sql`
          UPDATE areas 
          SET ${sql(updates)}, updated_at = NOW()
          WHERE id = ${area.id}
        `
        successCount++
      }
    } catch (error) {
      console.error(`❌ Error encrypting area ${area.id}:`, error)
      errorCount++
    }
  }
  
  console.log(`✅ Migration complete: ${successCount} successful, ${errorCount} errors`)
}

migrateAreas().catch(console.error)
```

---

## Fáze 2: Implementace pro Goals (Cíle)

### Krok 2.1: Úprava `lib/cesta-db.ts`

**Funkce k úpravě:**
- `getGoalsByUserId()` - přidat dešifrování
- `createGoal()` - přidat šifrování
- `updateGoal()` - přidat šifrování při zápisu, dešifrování při čtení
- `getGoalById()` - přidat dešifrování

**Příklad:**
```typescript
export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  const goals = await sql`
    SELECT g.*, a.name as area_name
    FROM goals g
    LEFT JOIN areas a ON g.area_id = a.id
    WHERE g.user_id = ${userId}
    ORDER BY g.created_at DESC
  `
  
  return goals.map(goal => decryptFields(goal, userId, ['title', 'description'])) as Goal[]
}
```

### Krok 2.2: Úprava API routes

**Soubor:** `app/api/goals/route.ts`
- Zkontrolovat, že používá funkce z `cesta-db.ts`

### Krok 2.3: Migration script

**Soubor:** `pokrok-game-web/scripts/migrate-encrypt-goals.ts`

(Stejná struktura jako pro areas)

---

## Fáze 3: Implementace pro Daily Steps (Kroky)

### Krok 3.1: Úprava `lib/cesta-db.ts`

**Funkce k úpravě:**
- `getDailyStepsByUserId()` - přidat dešifrování
- `createDailyStep()` - přidat šifrování
- `updateDailyStep()` - přidat šifrování při zápisu, dešifrování při čtení

**Speciální případ - checklist:**
```typescript
export async function getDailyStepsByUserId(...): Promise<DailyStep[]> {
  const steps = await sql`SELECT * FROM daily_steps WHERE ...`
  
  return steps.map(step => {
    const decrypted = decryptFields(step, userId, ['title', 'description'])
    // Decrypt checklist items
    if (step.checklist) {
      decrypted.checklist = decryptChecklist(step.checklist, userId)
    }
    return decrypted
  }) as DailyStep[]
}
```

### Krok 3.2: Úprava API routes

**Soubor:** `app/api/daily-steps/route.ts`
- V POST/PUT: šifrovat před uložením
- V GET: dešifrovat po načtení

### Krok 3.3: Migration script

**Soubor:** `pokrok-game-web/scripts/migrate-encrypt-steps.ts`

**Speciální logika pro checklist:**
```typescript
// Encrypt checklist items
if (step.checklist && Array.isArray(step.checklist)) {
  const encryptedChecklist = step.checklist.map((item: any) => ({
    ...item,
    text: item.text ? encrypt(item.text, step.user_id) : item.text
  }))
  updates.checklist = JSON.stringify(encryptedChecklist)
}
```

---

## Fáze 4: Implementace pro Habits (Návyky)

### Krok 4.1: Úprava `lib/cesta-db.ts`

**Funkce k úpravě:**
- `getHabitsByUserId()` - přidat dešifrování
- `createHabit()` - přidat šifrování
- `updateHabit()` - přidat šifrování při zápisu, dešifrování při čtení

### Krok 4.2: Úprava API routes

**Soubor:** `app/api/habits/route.ts`

### Krok 4.3: Migration script

**Soubor:** `pokrok-game-web/scripts/migrate-encrypt-habits.ts`

---

## Fáze 5: Implementace pro Goal Metrics (Metriky cílů)

### Krok 5.1: Úprava `lib/cesta-db.ts`

**Funkce k úpravě:**
- `getGoalMetricsByGoalId()` - přidat dešifrování
- `createGoalMetric()` - přidat šifrování
- `updateGoalMetric()` - přidat šifrování při zápisu, dešifrování při čtení

**Pole k šifrování:** `name`, `description`, `unit`

### Krok 5.2: Úprava API routes

**Soubor:** `app/api/goal-metrics/route.ts`

### Krok 5.3: Migration script

**Soubor:** `pokrok-game-web/scripts/migrate-encrypt-goal-metrics.ts`

---

## Fáze 6: Implementace pro Legacy Metrics

### Krok 6.1: Úprava `lib/cesta-db.ts`

**Funkce k úpravě:**
- `getMetricsByStepId()` - přidat dešifrování
- `createMetric()` - přidat šifrování
- `updateMetric()` - přidat šifrování při zápisu, dešifrování při čtení

### Krok 6.2: Migration script

**Soubor:** `pokrok-game-web/scripts/migrate-encrypt-metrics.ts`

---

## Fáze 7: Testování a validace

### Krok 7.1: Unit testy

- Test encryption/decryption helper funkcí
- Test databázových funkcí s mock daty
- Test edge cases (null, empty strings, special characters)

### Krok 7.2: Integration testy

- Test vytvoření nového cíle/kroku/návyku (mělo by být zašifrované)
- Test načtení existujících dat (mělo by se dešifrovat)
- Test aktualizace (mělo by se znovu zašifrovat)

### Krok 7.3: End-to-end testy

- Vytvoření nového cíle → kontrola v DB (zašifrované) → načtení (dešifrované)
- Migrace existujících dat → kontrola, že se správně zašifrovala

### Krok 7.4: Performance testy

- Měření overhead šifrování/dešifrování
- Batch operace (100+ záznamů najednou)
- Load testy

---

## Fáze 8: Postupná migrace existujících dat

### Krok 8.1: Backup strategie

**Před migrací:**
1. Vytvořit full backup databáze
2. Exportovat všechna data do JSON (pro rollback)
3. Otestovat migraci na testovací databázi

### Krok 8.2: Migrační postup

**Pro každou tabulku:**
1. Spustit migration script
2. Validovat, že data jsou zašifrovaná
3. Otestovat dešifrování
4. Zkontrolovat, že aplikace funguje správně

**Pořadí migrace:**
1. Areas (nejjednodušší)
2. Goals
3. Daily Steps (+ checklist)
4. Habits
5. Goal Metrics
6. Legacy Metrics

### Krok 8.3: Validace po migraci

**Pro každou tabulku:**
```typescript
// Validation script
async function validateEncryption(table: string, userId: string) {
  const records = await sql`SELECT * FROM ${sql(table)} WHERE user_id = ${userId} LIMIT 10`
  
  for (const record of records) {
    // Try to decrypt
    const decrypted = decryptFields(record, userId, ['name', 'title', 'description'])
    
    // Verify it's different from original (if was encrypted)
    if (isEncrypted(record.name)) {
      console.log('✅ Name is encrypted')
    }
    
    // Verify decryption works
    if (decrypted.name && isEncrypted(record.name)) {
      console.log('✅ Decryption successful')
    }
  }
}
```

---

## Rollback plán

### Pokud se něco pokazí:

**Krok 1: Zastavit nové šifrování**
- Nastavit feature flag `ENABLE_ENCRYPTION=false`
- Aplikace přestane šifrovat nová data

**Krok 2: Rollback migrace**
```typescript
// Rollback script - dešifruje všechna data zpět na plain text
async function rollbackEncryption(table: string) {
  const records = await sql`SELECT * FROM ${sql(table)}`
  
  for (const record of records) {
    const decrypted = decryptFields(record, record.user_id, ['name', 'title', 'description'])
    await sql`UPDATE ${sql(table)} SET ... WHERE id = ${record.id}`
  }
}
```

**Krok 3: Obnovit z backupu**
- Pokud rollback nefunguje, obnovit z backupu

---

## Checklist implementace

### Fáze 0: Infrastruktura
- [ ] Vytvořit `lib/encryption.ts`
- [ ] Přidat `ENCRYPTION_MASTER_KEY` do `.env.local`
- [ ] Vytvořit unit testy pro encryption
- [ ] Otestovat encryption/decryption na testovacích datech

### Fáze 1: Areas
- [ ] Upravit `getAreasByUserId()` - dešifrování
- [ ] Upravit `createArea()` - šifrování
- [ ] Upravit `updateArea()` - šifrování
- [ ] Otestovat vytvoření nové oblasti
- [ ] Otestovat načtení oblasti
- [ ] Vytvořit migration script
- [ ] Spustit migraci na testovací DB
- [ ] Validovat migraci
- [ ] Spustit migraci na produkci

### Fáze 2: Goals
- [ ] Upravit `getGoalsByUserId()` - dešifrování
- [ ] Upravit `getGoalById()` - dešifrování
- [ ] Upravit `createGoal()` - šifrování
- [ ] Upravit `updateGoal()` - šifrování
- [ ] Otestovat všechny operace
- [ ] Vytvořit migration script
- [ ] Spustit migraci

### Fáze 3: Daily Steps
- [ ] Upravit `getDailyStepsByUserId()` - dešifrování
- [ ] Upravit `createDailyStep()` - šifrování
- [ ] Upravit `updateDailyStep()` - šifrování
- [ ] Upravit checklist encryption/decryption
- [ ] Otestovat všechny operace včetně checklistu
- [ ] Vytvořit migration script (včetně checklistu)
- [ ] Spustit migraci

### Fáze 4: Habits
- [ ] Upravit `getHabitsByUserId()` - dešifrování
- [ ] Upravit `createHabit()` - šifrování
- [ ] Upravit `updateHabit()` - šifrování
- [ ] Otestovat všechny operace
- [ ] Vytvořit migration script
- [ ] Spustit migraci

### Fáze 5: Goal Metrics
- [ ] Upravit všechny funkce pro goal metrics
- [ ] Otestovat všechny operace
- [ ] Vytvořit migration script
- [ ] Spustit migraci

### Fáze 6: Legacy Metrics
- [ ] Upravit všechny funkce pro metrics
- [ ] Otestovat všechny operace
- [ ] Vytvořit migration script
- [ ] Spustit migraci

### Fáze 7: Testování
- [ ] Unit testy pro všechny funkce
- [ ] Integration testy
- [ ] End-to-end testy
- [ ] Performance testy
- [ ] Load testy

### Fáze 8: Dokumentace
- [ ] Dokumentovat encryption v kódu
- [ ] Aktualizovat README s informacemi o šifrování
- [ ] Vytvořit runbook pro správu klíčů
- [ ] Vytvořit dokumentaci pro rollback

---

## Rizika a mitigace

### Riziko 1: Ztráta master keyu
**Mitigace:**
- Záloha klíče na bezpečném místě (password manager, secure vault)
- Key rotation plán (pravidelné změny klíče)
- Dokumentace procesu obnovy

### Riziko 2: Performance overhead
**Mitigace:**
- Batch dešifrování (paralelní zpracování)
- Caching dešifrovaných dat (s opatrností - ne cacheovat citlivá data)
- Monitoring performance metrik

### Riziko 3: Zapomenutí šifrování na některých místech
**Mitigace:**
- Type safety (TypeScript)
- Code review checklist
- Unit testy, které kontrolují šifrování
- Linter rules (pokud možné)

### Riziko 4: Problémy s migrací
**Mitigace:**
- Postupné nasazení (table by table)
- Rollback možnost
- Validace po každé fázi
- Testování na kopii produkční DB

### Riziko 5: Kompatibilita s existujícími daty
**Mitigace:**
- Graceful handling - pokud dešifrování selže, vrátit originál (migration mode)
- Detekce, zda je text už zašifrovaný
- Postupná migrace (ne všechna data najednou)

---

## Odhadované úsilí

| Fáze | Úkol | Odhad (hodiny) |
|------|------|----------------|
| 0 | Infrastruktura (encryption modul, testy) | 4-8 |
| 1 | Areas implementace + migrace | 4-6 |
| 2 | Goals implementace + migrace | 4-6 |
| 3 | Daily Steps implementace + migrace | 6-8 |
| 4 | Habits implementace + migrace | 4-6 |
| 5 | Goal Metrics implementace + migrace | 3-4 |
| 6 | Legacy Metrics implementace + migrace | 3-4 |
| 7 | Testování a validace | 6-8 |
| 8 | Dokumentace | 2-4 |
| **Celkem** | | **36-54 hodin** |

---

## Postup implementace (doporučený)

1. **Týden 1:** Fáze 0 (infrastruktura) + Fáze 1 (Areas) - testování
2. **Týden 2:** Fáze 2 (Goals) + Fáze 3 (Daily Steps) - testování
3. **Týden 3:** Fáze 4 (Habits) + Fáze 5 (Goal Metrics) + Fáze 6 (Legacy Metrics)
4. **Týden 4:** Testování, migrace na produkci, dokumentace

---

## Další úvahy

### Search a Sorting
- Full-text search nebude fungovat na zašifrovaných datech
- **Řešení:** Search pouze na frontendu po dešifrování, nebo vytvořit searchable index (hash/fingerprint)

### Backup a Recovery
- Zálohy budou obsahovat zašifrovaná data
- Master key musí být zálohován samostatně
- Recovery proces musí zahrnovat klíč

### Compliance
- GDPR: Data jsou "encrypted at rest" ✅
- "Right to be forgotten": Smazání klíče = data jsou nepoužitelná

### Monitoring
- Logovat chyby šifrování/dešifrování
- Monitorovat performance overhead
- Alert při selhání šifrování

---

## Konkrétní příklady kódu

### Příklad 1: Úprava `getGoalsByUserId()`

**Před:**
```typescript
export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  try {
    cleanupGoalsCache()
    const cached = goalsCache.get(userId)
    if (cached && (Date.now() - cached.timestamp) < GOALS_CACHE_TTL) {
      return cached.goals as Goal[]
    }

    const goals = await sql`
      SELECT g.*, a.name as area_name
      FROM goals g
      LEFT JOIN areas a ON g.area_id = a.id
      WHERE g.user_id = ${userId}
      ORDER BY g.created_at DESC
    `
    const goalsArray = goals as Goal[]
    
    // Cache the result
    if (goalsCache.size < MAX_CACHE_SIZE) {
      goalsCache.set(userId, { goals: goalsArray, timestamp: Date.now() })
    }
    
    return goalsArray
  } catch (error) {
    console.error('Error fetching goals:', error)
    return []
  }
}
```

**Po:**
```typescript
import { decryptFields } from './encryption'

export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  try {
    cleanupGoalsCache()
    const cached = goalsCache.get(userId)
    if (cached && (Date.now() - cached.timestamp) < GOALS_CACHE_TTL) {
      // Decrypt cached data
      return cached.goals.map((goal: Goal) => 
        decryptFields(goal, userId, ['title', 'description'])
      ) as Goal[]
    }

    const goals = await sql`
      SELECT g.*, a.name as area_name
      FROM goals g
      LEFT JOIN areas a ON g.area_id = a.id
      WHERE g.user_id = ${userId}
      ORDER BY g.created_at DESC
    `
    
    // Decrypt all goals
    const goalsArray = goals.map(goal => 
      decryptFields(goal, userId, ['title', 'description'])
    ) as Goal[]
    
    // Cache the decrypted result (or cache encrypted and decrypt on read?)
    // Option A: Cache encrypted (saves memory, decrypt on read)
    // Option B: Cache decrypted (faster reads, but data in memory)
    // For now, we'll cache encrypted and decrypt on read
    if (goalsCache.size < MAX_CACHE_SIZE) {
      goalsCache.set(userId, { goals: goals as Goal[], timestamp: Date.now() })
    }
    
    return goalsArray
  } catch (error) {
    console.error('Error fetching goals:', error)
    return []
  }
}
```

### Příklad 2: Úprava `createGoal()`

**Před:**
```typescript
export async function createGoal(goalData: Partial<Goal>): Promise<Goal> {
  const id = crypto.randomUUID()
  // ... existing logic ...
  
  const goal = await sql`
    INSERT INTO goals (
      id, user_id, title, description, target_date, ...
    ) VALUES (
      ${id}, ${goalData.user_id}, ${goalData.title}, ${goalData.description}, ...
    ) RETURNING *
  `
  return goal[0] as Goal
}
```

**Po:**
```typescript
import { encryptFields } from './encryption'

export async function createGoal(goalData: Partial<Goal>): Promise<Goal> {
  const id = crypto.randomUUID()
  
  if (!goalData.user_id) {
    throw new Error('user_id is required')
  }
  
  // Encrypt text fields before inserting
  const encryptedData = encryptFields(goalData, goalData.user_id, ['title', 'description'])
  
  // ... existing logic for other fields ...
  
  const goal = await sql`
    INSERT INTO goals (
      id, user_id, title, description, target_date, ...
    ) VALUES (
      ${id}, ${encryptedData.user_id}, ${encryptedData.title}, ${encryptedData.description}, ...
    ) RETURNING *
  `
  
  // Decrypt before returning (so API returns decrypted data)
  return decryptFields(goal[0], goalData.user_id, ['title', 'description']) as Goal
}
```

### Příklad 3: Úprava `updateGoal()`

**Před:**
```typescript
export async function updateGoalById(goalId: string, updates: Partial<Goal>): Promise<Goal> {
  const result = await sql`
    UPDATE goals 
    SET title = ${updates.title}, description = ${updates.description}, ...
    WHERE id = ${goalId}
    RETURNING *
  `
  return result[0] as Goal
}
```

**Po:**
```typescript
import { encryptFields, decryptFields } from './encryption'

export async function updateGoalById(goalId: string, updates: Partial<Goal>): Promise<Goal> {
  // First get the goal to know the user_id
  const existing = await sql`SELECT user_id FROM goals WHERE id = ${goalId}`
  if (existing.length === 0) {
    throw new Error('Goal not found')
  }
  const userId = existing[0].user_id
  
  // Encrypt text fields that are being updated
  const encryptedUpdates = encryptFields(updates, userId, ['title', 'description'])
  
  const result = await sql`
    UPDATE goals 
    SET 
      title = COALESCE(${encryptedUpdates.title}, goals.title),
      description = COALESCE(${encryptedUpdates.description}, goals.description),
      ...
    WHERE id = ${goalId}
    RETURNING *
  `
  
  // Decrypt before returning
  return decryptFields(result[0], userId, ['title', 'description']) as Goal
}
```

### Příklad 4: Úprava `getDailyStepsByUserId()` s checklistem

**Před:**
```typescript
export async function getDailyStepsByUserId(...): Promise<DailyStep[]> {
  const steps = await sql`
    SELECT ..., checklist, ...
    FROM daily_steps 
    WHERE user_id = ${userId} ...
  `
  return steps as DailyStep[]
}
```

**Po:**
```typescript
import { decryptFields, decryptChecklist } from './encryption'

export async function getDailyStepsByUserId(...): Promise<DailyStep[]> {
  const steps = await sql`
    SELECT ..., checklist, ...
    FROM daily_steps 
    WHERE user_id = ${userId} ...
  `
  
  return steps.map(step => {
    // Decrypt title and description
    const decrypted = decryptFields(step, userId, ['title', 'description'])
    
    // Decrypt checklist items
    if (step.checklist && Array.isArray(step.checklist)) {
      decrypted.checklist = decryptChecklist(step.checklist, userId)
    }
    
    return decrypted
  }) as DailyStep[]
}
```

### Příklad 5: Úprava `createDailyStep()` s checklistem

**Před:**
```typescript
export async function createDailyStep(stepData: Partial<DailyStep>): Promise<DailyStep> {
  const id = crypto.randomUUID()
  
  const step = await sql`
    INSERT INTO daily_steps (
      id, user_id, title, description, checklist, ...
    ) VALUES (
      ${id}, ${stepData.user_id}, ${stepData.title}, ${stepData.description}, 
      ${JSON.stringify(stepData.checklist)}, ...
    ) RETURNING *
  `
  return step[0] as DailyStep
}
```

**Po:**
```typescript
import { encryptFields, encryptChecklist, decryptFields, decryptChecklist } from './encryption'

export async function createDailyStep(stepData: Partial<DailyStep>): Promise<DailyStep> {
  const id = crypto.randomUUID()
  
  if (!stepData.user_id) {
    throw new Error('user_id is required')
  }
  
  // Encrypt title and description
  const encryptedData = encryptFields(stepData, stepData.user_id, ['title', 'description'])
  
  // Encrypt checklist items
  let encryptedChecklist = null
  if (stepData.checklist && Array.isArray(stepData.checklist)) {
    encryptedChecklist = encryptChecklist(stepData.checklist, stepData.user_id)
  }
  
  const step = await sql`
    INSERT INTO daily_steps (
      id, user_id, title, description, checklist, ...
    ) VALUES (
      ${id}, ${encryptedData.user_id}, ${encryptedData.title}, ${encryptedData.description}, 
      ${encryptedChecklist ? JSON.stringify(encryptedChecklist) : null}, ...
    ) RETURNING *
  `
  
  // Decrypt before returning
  const decrypted = decryptFields(step[0], stepData.user_id, ['title', 'description'])
  if (step[0].checklist) {
    decrypted.checklist = decryptChecklist(step[0].checklist, stepData.user_id)
  }
  
  return decrypted as DailyStep
}
```

---

## Závěr

Tento plán poskytuje kompletní roadmapu pro implementaci šifrování. Doporučuji postupovat fázi po fázi, s důkladným testováním po každé fázi, než přejdeme na další.

Po dokončení každé fáze by mělo následovat:
1. Code review
2. Testování na staging prostředí
3. Validace migrace
4. Postupné nasazení na produkci

### Důležité poznámky

1. **Caching:** Rozhodněte se, zda chcete cacheovat zašifrovaná nebo dešifrovaná data. Pro bezpečnost doporučuji cacheovat zašifrovaná a dešifrovat při čtení z cache.

2. **Migration mode:** Funkce `decrypt()` má "migration mode" - pokud dešifrování selže (text není zašifrovaný), vrátí originál. To umožňuje postupnou migraci bez breaking changes.

3. **Error handling:** Vždy ošetřete chyby šifrování/dešifrování. V production by měly být logovány, ale aplikace by neměla spadnout.

4. **Testing:** Před nasazením na produkci vždy otestujte na kopii produkční databáze s reálnými daty.

