# Plán optimalizace datové spotřeby

## Současný stav
- **Spotřeba dat**: ~1 GB za hodinu
- **Cíl**: 1-5 MB za hodinu (redukce o 99.5-99.9%)

## Identifikované problémy

### 1. Načítání celých seznamů při každé změně
- Po vytvoření/úpravě stepu se načítají **všechny steps** znovu
- Po toggle habit se načítají **všechny habits** znovu
- GET endpointy vracejí celé objekty i když se změnilo jen jedno pole

### 2. Žádné lokální úložiště
- Data se načítají znovu při každé navigaci
- Žádné cachování na klientovi
- Cache-busting parametry (`?t=${Date.now()}`) zabraňují cachování

### 3. Žádné delta updates
- Server vrací celé seznamy místo pouze změn
- Žádné versioning/timestamps pro detekci změn

### 4. Žádné debouncing/batching
- Každá akce spouští samostatný request
- Žádné hromadné operace

### 5. Neefektivní transport
- Vše přes REST API (HTTP overhead)
- Žádné WebSockets nebo SSE
- Žádné ETags/If-Modified-Since

---

## Plán implementace

### Fáze 1: Lokální úložiště a Optimistic UI (Priorita: VYSOKÁ)
**Cíl**: Snížit počet requestů o 80-90%

#### 1.1 Implementace IndexedDB pro lokální cache
- **Knihovna**: `idb` (lightweight wrapper nad IndexedDB)
- **Struktura**:
  ```typescript
  interface LocalCache {
    goals: { data: Goal[], lastSync: number, version: number }
    habits: { data: Habit[], lastSync: number, version: number }
    dailySteps: { data: DailyStep[], lastSync: number, version: number }
    areas: { data: Area[], lastSync: number, version: number }
  }
  ```

#### 1.2 Optimistic UI updates
- Při změně (toggle, create, update) **okamžitě** aktualizovat lokální cache
- UI se aktualizuje bez čekání na server
- Změny se odesílají na server v pozadí

#### 1.3 Background sync queue
- Všechny změny se ukládají do fronty
- Batch odesílání každých 2-5 sekund nebo při 5+ změnách
- Retry mechanismus pro failed requests

**Očekávaný efekt**: Redukce requestů z ~1000/hodinu na ~100-200/hodinu

---

### Fáze 2: Delta Updates a Versioning (Priorita: VYSOKÁ)
**Cíl**: Snížit velikost odpovědí o 90-95%

#### 2.1 Přidání `updated_at` timestampů do všech tabulek
- Zajištění, že všechny entity mají `updated_at` pole
- Index na `updated_at` pro rychlé dotazy

#### 2.2 Nový endpoint: `/api/sync/delta`
```typescript
GET /api/sync/delta?since=2024-01-01T00:00:00Z&types=goals,habits,steps

Response:
{
  goals: { updated: Goal[], deleted: string[] },
  habits: { updated: Habit[], deleted: string[] },
  dailySteps: { updated: DailyStep[], deleted: string[] },
  serverTime: "2024-01-01T12:00:00Z"
}
```

#### 2.3 Klient posílá `If-Modified-Since` header
- Server vrací `304 Not Modified` pokud nejsou změny
- Pokud jsou změny, vrací pouze změněné záznamy

#### 2.4 Partial updates v PUT/PATCH
- Místo vracení celého objektu, vracet pouze změněná pole:
```typescript
PUT /api/daily-steps/[id]
Response: { id, completed, updated_at } // pouze změněná pole
```

**Očekávaný efekt**: Redukce velikosti odpovědí z ~100 KB na ~1-5 KB na request

---

### Fáze 3: Debouncing a Batching (Priorita: STŘEDNÍ)
**Cíl**: Snížit počet requestů při rychlých interakcích

#### 3.1 Debouncing pro text inputy
- Při editaci title/description: čekat 500ms po posledním stisku
- Při drag & drop: okamžitý optimistic update, server update po 1s

#### 3.2 Batch operations endpoint
```typescript
POST /api/batch
Body: {
  operations: [
    { type: 'toggle_step', stepId: '...', completed: true },
    { type: 'toggle_habit', habitId: '...', date: '...' },
    { type: 'update_step', stepId: '...', fields: {...} }
  ]
}
```

#### 3.3 Queue management
- Shromažďovat změny do fronty
- Odesílat batch každých 2-5 sekund nebo při 5+ změnách
- Priorita: okamžité změny (completion) > editace > ostatní

**Očekávaný efekt**: Redukce requestů při rychlých interakcích o 70-80%

---

### Fáze 4: Efektivnější transport (Priorita: NÍZKÁ - dlouhodobý)
**Cíl**: Snížit HTTP overhead

#### 4.1 Server-Sent Events (SSE) pro real-time updates
- Endpoint: `/api/events`
- Server pushuje změny klientovi
- Klient aktualizuje lokální cache při přijetí eventu

#### 4.2 WebSockets (volitelné, pro real-time collaboration)
- Pouze pokud bude potřeba multi-user real-time
- Pro single-user není nutné

#### 4.3 ETags a HTTP caching
- Server generuje ETag pro každý resource
- Klient posílá `If-None-Match` header
- Server vrací `304 Not Modified` pokud se nezměnilo

**Očekávaný efekt**: Snížení HTTP overhead o 30-50%

---

## Implementační priority

### ✅ Fáze 1 (KRITICKÁ) - 1-2 týdny
1. IndexedDB wrapper a cache layer
2. Optimistic UI updates
3. Background sync queue
4. **Očekávaný efekt**: Redukce dat o 80-90%

### ✅ Fáze 2 (VYSOKÁ) - 1 týden
1. Delta sync endpoint
2. Versioning v databázi
3. Partial updates
4. **Očekávaný efekt**: Redukce dat o dalších 5-10%

### ✅ Fáze 3 (STŘEDNÍ) - 3-5 dní
1. Debouncing
2. Batch operations
3. **Očekávaný efekt**: Redukce requestů o 20-30%

### ⏳ Fáze 4 (NÍZKÁ) - dlouhodobě
1. SSE/WebSockets
2. ETags
3. **Očekávaný efekt**: Finální optimalizace

---

## Technické detaily

### IndexedDB Schema
```typescript
// Database: pokrok_cache
// Stores:
// - goals: { id, data, updated_at, version }
// - habits: { id, data, updated_at, version }
// - dailySteps: { id, data, updated_at, version }
// - areas: { id, data, updated_at, version }
// - syncState: { lastSync: timestamp, version: number }
```

### Sync Strategy
```typescript
1. Načíst data z IndexedDB (okamžitě)
2. Zobrazit UI s cached daty
3. V pozadí: delta sync s serverem
4. Aktualizovat IndexedDB s novými daty
5. Re-render UI pouze pokud se data změnila
```

### Background Sync Queue
```typescript
interface SyncQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: 'goal' | 'habit' | 'step' | 'area'
  data: any
  timestamp: number
  retries: number
}

// Odeslat batch každých 2-5 sekund nebo při 5+ změnách
```

---

## Měření úspěchu

### Metriky před optimalizací
- Requesty: ~1000/hodinu
- Data: ~1 GB/hodinu
- Průměrná velikost requestu: ~1 MB

### Cílové metriky
- Requesty: ~50-100/hodinu (redukce 90-95%)
- Data: ~1-5 MB/hodinu (redukce 99.5-99.9%)
- Průměrná velikost requestu: ~10-50 KB

### Monitoring
- Logovat počet requestů za hodinu
- Logovat velikost dat za hodinu
- Dashboard pro sledování spotřeby

---

## Rizika a mitigace

### Riziko 1: Konflikty při offline editaci
**Mitigace**: 
- Last-write-wins s timestampem
- Conflict resolution UI pro uživatele

### Riziko 2: Ztráta dat při selhání sync
**Mitigace**:
- Retry mechanismus s exponential backoff
- Lokální backup před sync
- Warning UI pokud sync selhal

### Riziko 3: IndexedDB quota limits
**Mitigace**:
- Cleanup starých dat (starší než 90 dní)
- Komprese dat
- Fallback na localStorage pro malá data

---

## Odhadovaný čas implementace

- **Fáze 1**: 1-2 týdny (kritická)
- **Fáze 2**: 1 týden (vysoká priorita)
- **Fáze 3**: 3-5 dní (střední priorita)
- **Fáze 4**: 1-2 týdny (nízká priorita, dlouhodobě)

**Celkem**: 3-4 týdny pro kritické optimalizace (Fáze 1-2)

---

## Následné kroky

1. ✅ Vytvořit TODO list pro implementaci
2. ✅ Začít s Fází 1 (IndexedDB + Optimistic UI)
3. ✅ Implementovat delta sync (Fáze 2)
4. ✅ Přidat debouncing a batching (Fáze 3)
5. ⏳ Dlouhodobě: SSE/WebSockets (Fáze 4)



