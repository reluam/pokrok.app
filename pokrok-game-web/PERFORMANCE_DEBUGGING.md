# Performance Debugging Guide

## Co se nyní loguje v konzoli

Po načtení `/planner` uvidíte v konzoli detailní logy:

### 1. GameWorldView - Načítání steps
```
[Performance] Starting fetch for daily steps... {startDate: "...", endDate: "..."}
[Performance] Fetch completed in XXX.XX ms
[Performance] JSON parse completed in XXX.XX ms
[Performance] Loaded X steps
[Performance] setState completed in XXX.XX ms
[Performance] Total loading time: XXX
```

### 2. API Route - /api/daily-steps
```
[API Performance] /api/daily-steps - userId: "...", startDate: "...", endDate: "..."
[Performance] SQL query returned X steps in XXXms
[Performance] Decrypted X steps in XXXms
[API Performance] getDailyStepsByUserId returned X steps in XXXms
[API Performance] Normalized X steps in XXXms
```

### 3. UpcomingView - Výpočty
```
[UpcomingView Performance] Computing allFeedSteps from X steps
[UpcomingView Performance] allFeedSteps computed: X steps in XXX.XXms
[UpcomingView Performance] Computing upcomingSteps from X steps
[UpcomingView Performance] upcomingSteps computed: X steps in XXX.XXms
```

## Jak interpretovat logy

### Pokud SQL query trvá dlouho (>2s):
- **Problém:** Databáze je pomalá nebo dotaz je neoptimalizovaný
- **Řešení:** Zkontrolovat indexy, EXPLAIN query

### Pokud dekryptování trvá dlouho (>1s pro 100+ kroků):
- **Problém:** Dekryptování je synchronní a blokuje
- **Řešení:** Možná přesunout na klienta nebo optimalizovat encryption

### Pokud JSON parse trvá dlouho (>500ms):
- **Problém:** Příliš velký payload
- **Řešení:** Omezit počet načtených kroků

### Pokud useMemo výpočty trvají dlouho (>500ms):
- **Problém:** Příliš mnoho kroků pro zpracování
- **Řešení:** Optimalizovat filtrování nebo omezit načítání

## Opravené problémy

### 1. SQL dotaz nyní filtruje recurring steps podle date range
**Před:**
```sql
WHERE user_id = ? 
  AND (date >= ? AND date <= ? OR frequency IS NOT NULL)
```
Načítalo VŠECHNY recurring steps bez ohledu na date range!

**Po:**
```sql
WHERE user_id = ?
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
Načítá pouze recurring steps, které mají `current_instance_date` nebo `date` v date range.

### 2. Přidáno detailní logování
- Každý krok načítání je nyní logován s časem
- Můžete přesně vidět, kde se tráví čas

## Co zkontrolovat v konzoli

1. **Kolik kroků se načítá?**
   - `[Performance] Loaded X steps`
   - Pokud je to >500, je to hodně

2. **Který krok trvá nejdéle?**
   - Porovnejte časy v logu
   - Najděte bottleneck

3. **Je SQL pomalý?**
   - `[Performance] SQL query returned X steps in XXXms`
   - Pokud >2000ms, problém je v databázi

4. **Je dekryptování pomalé?**
   - `[Performance] Decrypted X steps in XXXms`
   - Pokud >1000ms pro 100+ kroků, problém je v encryption

