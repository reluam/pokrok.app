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

### 3. Nastavení Staging Environment (volitelné)

Pro lepší organizaci můžeš vytvořit samostatný Vercel projekt pro staging:

1. Vytvoř nový projekt v Vercelu
2. Připoj stejný Git repository
3. Nastav **Production Branch** na `staging`
4. Přidej custom domain (např. `staging.tvojedomena.cz`)

Nebo použij Preview Deployments:
- Každý push do `staging` vytvoří preview URL
- Můžeš si nastavit custom domain pro staging branch v Project Settings

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

