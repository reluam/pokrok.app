# Prompt pro AI: Vytvoření blogu a prezentační stránky

Tento prompt slouží k vytvoření webové stránky podobné Žiju life – osobní blog, prezentační stránka s hero sekcí, přehledem služeb a newsletterem. Přizpůsob si jméno projektu, barvy a texty podle svých potřeb.

---

## Kontext a cíle

Vytvoř mi osobní prezentační web s blogem v duchu těchto zásad:

- **Teplý, lidský design** – nepůsobit korporátně ani sterilně
- **Herní / hravé prvky** – mírně natáčené karty, ručně kreslené podtržítka, jemné animace
- **Jasná struktura** – hero → o mě → jak převzít řízení (3 cesty) → newsletter/kontakt
- **Blog s různými typy obsahu** – články, videa, knihy, odkazy – s filtry a jednotným gridem
- **Newsletter** – odběr s potvrzením emailem, zobrazení odeslaných newsletterů na blogu

---

## Technologie

- **Framework:** Next.js 16+ (App Router)
- **Styling:** Tailwind CSS 4
- **Jazyk:** TypeScript
- **Ikony:** lucide-react
- **Markdown:** react-markdown + remark-gfm pro blog články
- **E-maily:** Resend (volitelně)
- **Databáze:** Neon PostgreSQL nebo JSON soubory pro jednoduchý start

---

## Design systém

### Barvy (CSS proměnné)

```css
:root {
  --background: #FDFDF7;        /* krémové pozadí */
  --foreground: #171717;        /* hlavní text */
  --accent-primary: #FF8C42;    /* oranžová – CTA, odkazy, zvýraznění */
  --accent-primary-hover: #FF6B1A;
  --accent-secondary: #4ECDC4;  /* sekundární (teal) */
  --accent-tertiary: #B0A7F5;   /* terciární (fialová) */
}
```

- Pozadí: jemně krémová (#FDFDF7) nebo bílá s lehkým overlay
- Karty a sekce: `bg-white` s `border-2 border-black/5`, `hover:border-accent/50`
- Odkazy a CTA: barva accent (#FF8C42)

### Typografie

- **Body text:** Baloo 2 (Google Font) – kulatý, přátelský
- **Nadpisy:** Nunito – tučné (800), s jemným `text-shadow` pro zvýraznění
- **Navigace a footer:** Nunito

```css
/* Příklad pro nadpisy */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-nunito);
  font-weight: 800;
  -webkit-text-stroke: 0.5px currentColor;
  text-shadow: 0.5px 0.5px 0 currentColor, 0.3px 0.3px 0 currentColor;
  letter-spacing: -0.02em;
}
```

### Ručně kreslené podtržítko

Klíčová fráze v hero má podtržítko, které vypadá ručně nakreslené:

```css
.hand-drawn-underline::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0; right: 0;
  height: 8px;
  background: #FF8C42;
  opacity: 0.3;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  transform: rotate(-1deg);
}
```

### Textury a efekty

- `paper-texture` – jemná textura papíru na sekcích (volitelně)
- `backdrop-blur` na hero overlay pro čitelnost textu
- Karty v blogu mírně natočené: `transform: rotate(-0.5deg)` / `rotate(0.5deg)` střídavě podle indexu

### Tlačítka

- Zaoblená: `rounded-full`
- Hover: `hover:shadow-xl hover:-translate-y-1`
- Třída `.btn-playful` pro jemnou animaci

---

## Struktura stránek

### 1. Domovská stránka (Home)

Sekce v pořadí:

1. **Hero** – velký nadpis s ručně kresleným podtržítkem na klíčové frázi, podnadpis, CTA tlačítko; pozadí obrázek + overlay
2. **O mně (Medailonek)** – foto v „ručně nakresleném rámečku“, text vedle; sekce `bg-white/50 paper-texture`
3. **Jak převzít řízení (ChooseYourPath)** – 3 karty v gridu:
   - Inspirace / Blog → odkaz na blog
   - Komunita → externí odkaz
   - Koučink / Služba → odkaz na detail
4. **Newsletter / Kontakt** – formulář na odběr newsletteru, volitelně odkaz na komunitu

### 2. Navigace

- Sticky, `bg-white/50 backdrop-blur-sm`, logo vlevo
- Odkazy: Blog, Komunita, Koučing, O mně
- Mobilní: hamburger menu

### 3. Blog (seznam)

- Filtry: Všechno | Blog | Newslettery (nebo další typy)
- Grid `md:grid-cols-2 lg:grid-cols-3` – karty s:
  - ikonou podle typu (blog, video, kniha, článek, newsletter)
  - badge s typem obsahu
  - nadpis, popis, autor (pokud je)
  - pro videa: YouTube/Vimeo thumbnail
- Karty: `rounded-2xl`, `hover:border-accent/50`, `hover:shadow-xl hover:-translate-y-1`, střídavý mírný rotation
- Kliknutím → detail článku / newsletteru

### 4. Detail článku (Blog)

- Zpět na blog
- Ikona + typ obsahu
- Nadpis, autor
- Pro blog: Markdown obsah s `react-markdown`
- Pro video: embed (YouTube/Vimeo)
- Pro ostatní: popis + odkaz „Otevřít“
- Volitelně: sdílení (Facebook, Twitter, kopírovat odkaz)
- **Selection Share Bar** – při označení textu plovoucí panel: Kopírovat (text + odkaz), Sdílet na Twitter (formát „z webu (url) from @handle“)

### 5. Blockquotes (citáty)

- Levý okraj oranžový (`border-left: 4px solid #FF8C42`)
- Gradient pozadí: vlevo světlé (#FFF5ED), vpravo oranžové (#FF8C42) – `linear-gradient(to right, #FFF5ED 55%, #FF8C42 55%)`
- Kurzíva, padding, margin

### 6. Další stránky

- O mně – rozšířený příběh
- Komunita – popis + odkaz
- Koučing / Služba – co nabízíš, CTA
- Kontakt – formulář
- GDPR, Odhlášení newsletteru

---

## Datový model

### Inspirace / Blog položky

```ts
interface InspirationItem {
  id: string;
  type: 'blog' | 'video' | 'book' | 'article' | 'other' | 'newsletter';
  title: string;
  description: string;
  url?: string;        // externí odkaz
  author?: string;
  content?: string;    // Markdown pro blog
  thumbnail?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

- Blog položky mohou mít `content` v Markdownu a zobrazují se na `/blog/[id]`
- Newslettery mají `body` v HTML, zobrazení na `/newsletter/[id]`
- Data: JSON soubor `data/inspiration.json` nebo databáze

---

## Klíčové komponenty k implementaci

1. **Hero** – nadpis, podnadpis, CTA, pozadí + overlay
2. **HandDrawnFrame** – wrapper kolem fota s „ručně kresleným“ efektem
3. **DecorativeShapes** – jemné geometrické tvary v pozadí (volitelně)
4. **ChooseYourPath** – 3 karty s ikonami a CTA
5. **StayInContact / Newsletter** – formulář odběru
6. **Navigation** – sticky, logo, odkazy, mobilní menu
7. **Footer** – logo, odkazy, sociální ikony, certifikáty (volitelně)
8. **SelectionShareBar** – plovoucí panel při výběru textu (Kopírovat + Twitter)
9. **CookieConsent** – souhlas s cookies (volitelně)

---

## API endpointy (minimální)

- `GET /api/inspiration` – seznam inspirací/blogu
- `GET /api/newsletters` – odeslané newslettery pro blog
- `POST /api/newsletter/subscribe` – odběr newsletteru
- `GET /api/newsletter/confirm?token=...` – potvrzení odběru
- `POST /api/contact` – kontaktní formulář (volitelně)

---

## Checklist pro AI

- [ ] Next.js App Router, TypeScript, Tailwind
- [ ] Barvy a fonty dle design systému
- [ ] Hero s hand-drawn underline na klíčové frázi
- [ ] 3 karty „Jak převzít řízení“ s ikonami
- [ ] Blog grid s filtry a typy obsahu
- [ ] Detail článku s Markdown, video embed, blockquote styly
- [ ] Blockquote s gradientem (světlá levá, oranžová pravá strana)
- [ ] Selection Share Bar při výběru textu
- [ ] Newsletter formulář + potvrzení emailem
- [ ] Sticky navigace + mobilní menu
- [ ] Footer s odkazy
- [ ] Karty mírně natočené, hover efekty

---

## Příklad struktury složek

```
app/
  layout.tsx          # Fonty, metadata, Navigation, Footer
  page.tsx            # Home: Hero, Medailonek, ChooseYourPath, StayInContact
  blog/
    page.tsx          # Seznam s filtry
    [id]/page.tsx     # Detail článku / inspirace
  newsletter/
    [id]/page.tsx     # Detail newsletteru
  o-mne/page.tsx
  komunita/page.tsx
  koucing/page.tsx
  kontakt/page.tsx
components/
  Hero.tsx
  Navigation.tsx
  Footer.tsx
  ChooseYourPath.tsx
  HandDrawnFrame.tsx
  StayInContact.tsx
  SelectionShareBar.tsx
  ...
```

---

Přizpůsob tento prompt svému projektu: změň názvy sekcí, barvy, texty a přidej/odeber funkce podle potřeby. AI by mělo být schopné z něj vygenerovat funkční web s podobnou atmosférou a strukturou.
