# Shrnutí oprav výkonu - Upcoming View

## Identifikovaný problém

**SQL dotaz načítal VŠECHNY recurring steps bez ohledu na date range!**

### Původní problém v SQL:
```sql
WHERE user_id = ? 
  AND (date >= ? AND date <= ? OR frequency IS NOT NULL)
```

**Co to znamenalo:**
- `OR frequency IS NOT NULL` = načíst VŠECHNY recurring steps (i mimo date range)
- Pokud máte 100 recurring steps → načte se všech 100
- Pokud máte 1000 recurring steps → načte se všech 1000
- Pak se všechny dekryptují synchronně
- Pak se všechny filtrují na klientovi

**To způsobovalo:**
- Načtení tisíců zbytečných záznamů z databáze
- Pomalé dekryptování všech těchto záznamů
- Pomalé filtrování na klientovi

## Opravené SQL dotazy

### 1. Date range query (`startDate` && `endDate`)
**Soubor:** `lib/cesta-db.ts:1319-1345`

**Před:**
```sql
AND (date >= ? AND date <= ? OR frequency IS NOT NULL)
```

**Po:**
```sql
AND (
  -- Non-recurring steps with date in range
  (frequency IS NULL AND date >= ? AND date <= ?)
  OR
  -- Recurring steps with current_instance_date or date in range
  (frequency IS NOT NULL AND (
    (current_instance_date >= ? AND current_instance_date <= ?)
    OR
    (current_instance_date IS NULL AND date >= ? AND date <= ?)
  ))
)
```

### 2. Single date query
**Soubor:** `lib/cesta-db.ts:1295-1318`

Stejná oprava - filtruje recurring steps podle `current_instance_date` nebo `date` v date range.

## Přidané performance logging

### GameWorldView
- Čas fetch requestu
- Čas JSON parse
- Počet načtených kroků
- Čas setState

### API Route (/api/daily-steps)
- Čas SQL query
- Počet vrácených kroků
- Čas dekryptování
- Čas normalizace

### UpcomingView
- Čas výpočtu `allFeedSteps`
- Čas výpočtu `upcomingSteps`
- Počet zpracovaných kroků

## Jak použít logy

1. Otevřete Developer Tools → Console
2. Načtěte `/planner`
3. Podívejte se na logy s prefixem `[Performance]` a `[API Performance]`
4. Najděte, který krok trvá nejdéle

### Očekávané výsledky po opravě:

**Před:**
```
[Performance] Loaded 1500 steps  // Všechny recurring steps
[Performance] Decrypted 1500 steps in 8000ms  // Pomalé!
```

**Po:**
```
[Performance] Loaded 150 steps  // Pouze relevantní kroky
[Performance] Decrypted 150 steps in 800ms  // Rychlé!
```

## Další možné optimalizace

Pokud stále trvá dlouho, zkontrolujte:

1. **Počet načtených kroků**
   - Pokud je >500, možná je problém v date range (90 dní zpět)

2. **Dekryptování**
   - Pokud trvá >1000ms pro 100+ kroků, možná je problém v encryption knihovně

3. **SQL dotaz**
   - Pokud trvá >2000ms, zkontrolujte indexy
   - Spusťte `EXPLAIN` na dotaz

4. **Network latency**
   - Pokud fetch trvá dlouho, může být problém v síti nebo serveru

