# Vercel Setup - Staging a Production

## Aktuální nastavení:
- **Produkce**: `pokrok.app` → main branch
- **Staging**: `test.pokrok.app` → staging branch

## Problém:
Vercel očekává production deployment na main branch, ale staging branch není production deployment.

## Řešení - Preview Domain (DOPORUČENO):

**Výhody:**
- ✅ Jednodušší správa - jeden projekt místo dvou
- ✅ Sdílené nastavení (environment variables, build settings)
- ✅ Preview deployments jsou navrženy přesně pro tento use case
- ✅ Méně duplikace a správy

### Krok 1: Přidej Preview Domain

1. V produkčním projektu jdi do **Settings** → **Domains**
2. Klikni na **"Add Domain"**
3. Zadej: `test.pokrok.app`
4. Vyber **"Preview"** (ne Production)
5. Vercel ti ukáže DNS záznamy, které musíš nastavit

### Krok 2: Nastav DNS záznamy

Pro `test.pokrok.app` přidej DNS záznamy podle instrukcí Vercelu (obvykle CNAME nebo A record).

### Krok 3: Nastav Preview Domain pro staging branch

1. V **Settings** → **Domains** najdi `test.pokrok.app`
2. Klikni na **"Configure"** nebo **"Edit"**
3. V sekci **"Assign to Branch"** nebo **"Branch Assignment"** vyber `staging`
4. Ulož změny

### Výsledek:
- **Produkce**: `pokrok.app` → main branch (production deployment)
- **Staging**: `test.pokrok.app` → staging branch (preview deployment s custom domain)

## Alternativní řešení - Samostatný projekt:

Pokud preferuješ úplné oddělení, můžeš vytvořit samostatný Vercel projekt:

1. Vytvoř nový projekt v Vercelu
2. Importuj stejný Git repository
3. Nastav **Production Branch** na `staging`
4. Přidej `test.pokrok.app` jako production domain

**Nevýhody:**
- ❌ Duplikace nastavení (environment variables, build settings)
- ❌ Více správy (dva projekty)
- ❌ Musíš udržovat nastavení synchronizovaná

