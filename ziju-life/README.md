# Žiju life

Web pro projekt "Žiju life" na doméně ziju.life. Projekt je postaven na autenticitě, hravosti a sdílení cesty "profesionálního začátečníka", který dešifruje život.

## Technologie

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **App Router** - Next.js routing

## Spuštění projektu

```bash
# Instalace závislostí
npm install

# Spuštění development serveru
npm run dev

# Build pro produkci
npm run build

# Spuštění produkčního buildu
npm start
```

Otevři [http://localhost:3000](http://localhost:3000) v prohlížeči.

## Struktura projektu

```
ziju-life/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home page
│   ├── inspirace/         # Inspirace stránka
│   │   └── [id]/         # Detail inspirace
│   ├── admin/
│   │   └── inspirace/    # Admin pro správu inspirací
│   ├── kafe/              # Kafe stránka
│   ├── o-mne/             # O mně stránka
│   └── api/
│       └── inspiration/   # API endpointy pro inspirace
├── components/            # React komponenty
│   ├── Navigation.tsx     # Navigační menu
│   ├── Hero.tsx           # Hero sekce
│   ├── Philosophy.tsx     # Filozofie sekce
│   ├── Coffee.tsx         # Kafe sekce
│   ├── ContentGrid.tsx    # Grid s obsahem
│   ├── About.tsx          # O mně sekce
│   └── Footer.tsx         # Footer
├── lib/
│   └── inspiration.ts     # Funkce pro práci s inspiracemi
├── data/
│   └── inspiration.json  # Data inspirací (JSON soubor)
└── app/globals.css        # Globální styly
```

## Design systém

- **Pozadí**: #FFFAF5
- **Akcenty**: #FF6B35 (sytě oranžová)
- **Font**: Geist Sans
- **Styl**: Mobile-first, hodně whitespace, moderní a hravý

## Funkce

- ✅ Responsivní navigace s hamburger menu pro mobil
- ✅ Hero sekce s Playground Manifesto
- ✅ Sekce Filozofie
- ✅ Sekce Kafe
- ✅ Grid s obsahem (Inspirace)
- ✅ Sekce O mně
- ✅ Footer
- ✅ Všechny stránky (Inspirace, Kafe, O mně)
- ✅ Systém pro správu inspirací
  - Typy: Blog, Video, Kniha, Článek, Ostatní
  - Admin rozhraní pro přidávání/editaci
  - Video přehrávání (YouTube, Vimeo)
  - Blog editor s Markdown/HTML podporou

## Poznámky

- Navigace obsahuje odkaz na Skool komunitu
- Email pro kontakt: ahoj@ziju.life (lze změnit v `/app/kafe/page.tsx`)
- Všechny odkazy na Skool jsou nastavené na `https://www.skool.com/zijem-life-3913`
