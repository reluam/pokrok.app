# Coach CRM & Client Portal (`cccp`)

Samostatná Next.js appka pro jednoduché CRM (leady) a klientský portál.

## Databáze (Neon Postgres)

1. Vytvoř si **nový projekt / databázi** v [Neon](https://console.neon.tech) jen pro tuto appku.
2. Zkopíruj connection string (PostgreSQL) a vlož ho do `.env.local` v kořeni projektu:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

3. Spusť **jednorázovou inicializaci DB** (např. z dočasného skriptu nebo server action) voláním funkce:

```ts
import { initializeCoachCrmDatabase } from "./lib/db";

await initializeCoachCrmDatabase();
```

Tato funkce vytvoří tabulky:

- `leads`
- `clients`
- `sessions`
- `session_templates`
- `payments`

> Poznámka: Schéma je navržené jako minimální MVP a můžeš ho dál rozšiřovat podle potřeby.

