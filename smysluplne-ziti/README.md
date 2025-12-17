# Smysluplné žití - Web

Webová stránka projektu Smysluplné žití zaměřená na osobní rozvoj, plánování života a dosahování cílů.

## Funkce

- **Bookování coaching sezení** - formulář pro rezervaci individuálních sezení
- **Sekce aplikací** - přehled dostupných aplikací (aktuálně Pokrok)
- **Inspirace** - články, videa a knihy pro osobní rozvoj
- **O projektu** - informace o projektu, jeho vizi a hodnotách

## Technologie

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide React (ikony)

## Instalace

```bash
npm install
```

## Spuštění vývojového serveru

```bash
npm run dev
```

Otevřete [http://localhost:3001](http://localhost:3001) ve vašem prohlížeči.

## Build pro produkci

```bash
npm run build
npm start
```

## Struktura projektu

```
smysluplne-ziti/
├── app/
│   ├── layout.tsx      # Hlavní layout s navigací a footerem
│   ├── page.tsx        # Hlavní stránka
│   └── globals.css     # Globální styly
├── components/
│   ├── Navigation.tsx       # Navigační menu
│   ├── Footer.tsx           # Footer stránky
│   ├── Hero.tsx             # Úvodní sekce
│   ├── BookingSection.tsx   # Sekce pro bookování
│   ├── AppsSection.tsx      # Sekce s aplikacemi
│   ├── InspirationSection.tsx  # Sekce inspirace
│   └── AboutSection.tsx     # Sekce o projektu
└── ...
```

## TODO

- [ ] Implementovat backend pro odesílání rezervačních formulářů
- [ ] Přidat více aplikací do sekce aplikací
- [ ] Aktualizovat odkazy v sekci inspirace
- [ ] Přidat více obsahu do sekce inspirace
- [ ] Implementovat kontaktní formulář
- [ ] Přidat blog sekci
