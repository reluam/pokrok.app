# Deployment Guide - Testovací a Produkční Prostředí

## Branching Strategie

### Branches:
- **`main`** - Produkční prostředí (automaticky deploy na produkci)
- **`staging`** - Testovací prostředí (automaticky deploy na testovací URL)

### Workflow:

**DEFAULTNÍ WORKFLOW - Vždy pushuj na staging:**

1. **Lokální vývoj:**
   ```bash
   # Vytvoř feature branch z staging (volitelné)
   git checkout staging
   git pull origin staging
   git checkout -b feature/nazev-feature
   
   # Dělej změny...
   git add .
   git commit -m "Popis změn"
   ```

2. **Testování na staging (DEFAULT):**
   ```bash
   # Použij defaultní deploy skript
   ./scripts/deploy.sh
   
   # Nebo ručně:
   git checkout staging
   git merge feature/nazev-feature  # pokud jsi na feature branchi
   git push origin staging
   ```
   → Vercel automaticky vytvoří deployment na staging URL

3. **Nasazení na produkci (POUZE po testování):**
   ```bash
   # Použij production deploy skript (s bezpečnostními kontrolami)
   ./scripts/deploy-production.sh
   
   # Nebo ručně:
   git checkout main
   git pull origin main
   git merge staging
   git push origin main
   ```
   → Vercel automaticky vytvoří deployment na produkci

## Nastavení na Vercelu

### 1. Vytvoření Staging Branch

```bash
# Vytvoř staging branch z main
git checkout main
git checkout -b staging
git push origin staging
```

### 2. Nastavení v Vercel Dashboard

1. Jdi do **Project Settings** → **Git**
2. Nastav **Production Branch** na `main`
3. V **Preview Deployments** zkontroluj, že jsou povolené

### 3. Nastavení Staging Environment (DOPORUČENO)

**Pro správné fungování `test.pokrok.app` použij Preview Domain:**

1. **Přidej Preview Domain:**
   - V produkčním projektu jdi do **Settings** → **Domains**
   - Klikni na **"Add Domain"**
   - Zadej: `test.pokrok.app`
   - Vyber **"Preview"** (ne Production)
   - Vercel ti ukáže DNS záznamy, které musíš nastavit

2. **Nastav DNS záznamy:**
   - Pro `test.pokrok.app` přidej DNS záznamy podle instrukcí Vercelu (obvykle CNAME nebo A record)

3. **Přiřaď Preview Domain k staging branch:**
   - V **Settings** → **Domains** najdi `test.pokrok.app`
   - Klikni na **"Configure"** nebo **"Edit"**
   - V sekci **"Assign to Branch"** vyber `staging`
   - Ulož změny

**Výsledek:**
- **Produkce**: `pokrok.app` → main branch (production deployment)
- **Staging**: `test.pokrok.app` → staging branch (preview deployment s custom domain)

**Výhody tohoto řešení:**
- ✅ Jednodušší správa - jeden projekt
- ✅ Sdílené nastavení (environment variables, build settings)
- ✅ Preview deployments jsou navrženy pro testování

### 4. Environment Variables

Ujisti se, že máš nastavené environment variables pro:
- **Production** (main branch)
- **Preview** (všechny ostatní branche včetně staging)

V **Project Settings** → **Environment Variables** nastav:
- `DATABASE_URL` - pro production i preview
- Ostatní potřebné proměnné

## Helper Skripty

V projektu jsou připravené helper skripty v `scripts/`:
- `deploy.sh` - **Defaultní deploy** - Push na staging (používej tento pro běžné testování)
- `deploy-production.sh` - Push na produkci (s potvrzením - použij pouze po testování na staging)

## Tipy

- **Vždy testuj na staging před pushnutím na main**
- **Používej feature branche** pro větší změny
- **Commituj často** s popisnými zprávami
- **Před merge do main** zkontroluj, že staging funguje správně

