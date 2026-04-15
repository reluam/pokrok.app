# Snaps Wiki

> Hand-curated index všech tracků, kurzů, modelů a lekcí v aplikaci.
> Inspirováno Karpathyho [neural-net-to-LLM gistem](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — jedno místo, kde je vidět celá struktura znalostí.

Tento adresář je **Obsidian vault**. Otevři ho v Obsidianu (`File → Open vault → snaps/wiki`) a získáš graph view, backlinks, full-text search a všechny ostatní features.

## Statistiky

| Tracks | Courses | Models | Lessons | Steps |
|---:|---:|---:|---:|---:|
| 8 | 36 | 175 | 594 | 2 546 |

## Tracks

| # | Track | Kurzy | Modely | Lekce | Popis |
|---:|---|---:|---:|---:|---|
| 1 | [[01-hf/_track\|Jak funguje člověk?]] | 3 | 15 | 60 | Základy o těle, mozku a společnosti |
| 2 | [[02-cb/_track\|Kognitivní zkreslení]] | 10 | 54 | 151 | Rozpoznej pasti vlastní mysli |
| 3 | [[03-mm/_track\|Mentální modely]] | 3 | 12 | 24 | Nástroje pro lepší rozhodování |
| 4 | [[04-health/_track\|Zdraví a fitness]] | 5 | 22 | 88 | Tělo, výživa, síla a regenerace |
| 5 | [[05-mindfulness/_track\|Mindfulness a meditace]] | 4 | 16 | 64 | Klid mysli, dech, přítomnost |
| 6 | [[06-productivity/_track\|Produktivita a návyky]] | 4 | 17 | 68 | Návyky, čas, fokus, systémy |
| 7 | [[07-mindsets/_track\|Mindsets]] | 4 | 17 | 68 | Postoje, které mění život |
| 8 | [[08-performance/_track\|Výkon]] | 3 | 12 | 48 | Flow, peak performance, mistrovství |

## Struktura adresáře

```
wiki/
├── README.md                    # tento soubor
├── ARCHITECTURE.md              # jak se lekce zobrazují, jaké interakce
├── 01-hf/                       # track: Jak funguje člověk?
│   ├── _track.md                # meta tracku
│   ├── 01-hf-course-body/       # kurz: Tělo
│   │   ├── _course.md           # meta kurzu
│   │   ├── hf-body-sleep.md     # model + všechny jeho lekce v jednom souboru
│   │   └── ...
│   └── ...
├── 02-cb/
│   └── ...
└── _orphans/                    # modely, které nejsou v žádném kurzu
```

## Jak editovat

1. **Otevři soubor modelu** v Obsidianu (např. `02-cb/01-cb-course-01/cb-f01.md`).
2. **Uprav text.** Frontmatter (mezi `---`) zachovej, struktura sekcí (`## Krátký popis`, `## Plné vysvětlení`, ...) musí zůstat. Lekce mají povinnou metadata řádku hned pod nadpisem (`*id: \`xxx\` · typ: ... · xp: N*`).
3. **Tvoje vlastní poznámky** můžeš psát uvnitř `%% poznámka %%` (Obsidian native komentáře). **Tyhle se NEdostanou do TS / aplikace.** Použij je třeba pro:
   - TODO si přepsat větu
   - poznámky pro sebe
   - dočasné varianty znění
4. **EN překlad** (volitelný): pod každou `## Sekci` můžeš přidat `### EN` subheading; uvnitř lekcí pak `#### EN`. Detaily v [[ARCHITECTURE]] → "Bilingvální obsah".
5. **Spusť sync** (viz níže) — změny se propíšou do `data/models/*.ts` a `data/lessons/*.ts`.

## Jak spustit sync agenta

Tři způsoby — vyber si, co ti vyhovuje:

### 1) Z terminálu (nejrychlejší)

```bash
cd snaps
npm run wiki:sync          # propíše změny z markdownů do TS
npm run wiki:sync:dry      # ukáž, co by se stalo, ale nezapisuj
npm run wiki:export        # PŘEPÍŠE wiki z aktuálního TS (použij, když edituješ TS přímo)
```

### Hromadný EN překlad přes Claude API

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run wiki:translate:dry                          # ukáž, co by se přeložilo
npm run wiki:translate -- --limit 5                 # přelož 5 modelů (test)
npm run wiki:translate -- --tracks-courses          # včetně titles tracků/kurzů
npm run wiki:translate                              # přelož všechno chybějící
npm run wiki:translate -- --model cb-f01            # jen jeden model
npm run wiki:translate -- --claude-model claude-haiku-4-5-20251001  # levnější model
```

Skript je **idempotent** — přeskočí pole, která už mají EN. Po překladu spusť `npm run wiki:sync`, aby se EN propagoval do `data/`. Detaily v komentáři v `scripts/wiki/translate.mjs`.

Sync vypíše seznam změněných souborů a regeneruje data files. Žádný side-effect na běžící Expo.

### 2) Přes Claude Code subagent

V Claude Code napiš:

> Spusť wiki-sync agenta

Claude zavolá subagent definovaný v `.claude/agents/wiki-sync.md`, který:
- spustí `npm run wiki:sync`,
- pokud parser narazí na neplatný markdown, opraví ho,
- ukáže ti shrnutí, co se změnilo.

Hodí se, když uděláš větší změnu nebo když si nejsi jistý formátem.

### 3) Slash command

V Claude Code (po prvním nastavení) napiš `/wiki-sync`. Spustí stejného subagenta.

## Jak funguje change-detection

Sync vede stav v `wiki/.sync-state.json` (gitignored). V něm jsou SHA-256 hashe všech markdown souborů z posledního syncu. Při dalším spuštění:

1. Sync přepočítá hashe všech souborů.
2. Porovná je proti uloženému stavu.
3. Vypíše `Changed: N, added: M, removed: K`.
4. Vždy regeneruje **celou** TS data sadu (i když změna je v jednom souboru) — protože soubory se grupují do TS modulů (např. `cb-course-01/*.md` → `data/models/foundations.ts`).

To znamená: i když uděláš jeden tiny edit, sync přepíše několik TS souborů. Diff bude ale minimální (deterministický serializer).

## FAQ

**Q: Mohu editovat TS soubory přímo?**
A: Můžeš, ale wiki bude zastaralá. Spusť pak `npm run wiki:export` pro regeneraci wiki ze zdroje. Pokud uděláš obojí naráz, vyhrává poslední spuštěný script.

**Q: Co když přejmenuju model nebo přidám nový?**
A: Sync to zvládne, ale aktuálně řadí nové modely do `mental-models.ts`. Pokud chceš jiný TS soubor, edituj sync.mjs nebo přesuň ručně.

**Q: Můžu přidat novou lekci?**
A: Ano. V markdownu modelu přidej `## Lekce N — Typ` blok, vygeneruj nové ID (např. `cb-l-f01d`) a vyplň metadata řádku. Sync ho zachytí.

**Q: Co Obsidian pluginy?**
A: Doporučuju **Templater** pro nové lekce a **Dataview** pro custom indexy nad frontmatterem (např. „všechny lekce s xp > 15"). Vault funguje out-of-the-box.

## Související

- [[ARCHITECTURE]] — jak `LessonEngine` zobrazuje lekce a jaké jsou interakce
- `../data/` — TS source soubory (auto-generované ze sync skriptu)
- `../scripts/wiki/` — export.mjs, sync.mjs, lib.mjs
- `../.claude/agents/wiki-sync.md` — definice subagenta
