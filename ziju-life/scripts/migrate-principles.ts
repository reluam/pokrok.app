/**
 * Migration script: import principles from Můj kompas page into inspirations table.
 * Run with: npx tsx scripts/migrate-principles.ts
 */

// Load .env.local manually before anything else
import { readFileSync } from "fs";
import { join } from "path";

try {
  const envPath = join(process.cwd(), ".env.local");
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env.local not found — rely on process.env
}

import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL env variable");
  process.exit(1);
}

const sql = neon(connectionString);

// ── Data (from /app/muj-kompas/page.tsx) ──────────────────────────────────────

type Category = "zaklad" | "principy" | "pilulky";

interface Resource {
  label: string;
  href: string;
  external?: boolean;
  prefix?: string;
}

interface Principle {
  id: string;
  category: Category;
  emoji: string;
  title: string;
  subtitle?: string;
  lead: string;
  body: string[];
  tips?: string[];
  resources?: Resource[];
}

const CATEGORY_MAP: Record<Category, string> = {
  zaklad: "Základ",
  principy: "Principy",
  pilulky: "Pilulky",
};

const PRINCIPLES: Principle[] = [
  // ZÁKLAD
  {
    id: "spanek", category: "zaklad", emoji: "🌙",
    title: "Spánek", subtitle: "Aktualizace systému",
    lead: "Spánek není luxus — je to naprostý základ. Mozek není izolovaný od těla. Žádný time management tě nezachrání, pokud ignoruješ základní fyzické potřeby.",
    body: [
      "Osobně jsem nikdy neměl velký problém s usínáním nebo vstáváním. Důvod je ten, že jsem pravděpodobně od mala přirozeně dodržoval dobrou spánkovou hygienu.",
    ],
    tips: [
      "Vstávej každý den ve stejnou dobu — i o víkendu.",
      "Hodinu před spánkem nepoužívej obrazovky.",
      "Poslední kávu (kofein) pij nejpozději kolem 15:00.",
    ],
  },
  {
    id: "strava", category: "zaklad", emoji: "🥩",
    title: "Strava", subtitle: "Palivo",
    lead: "Naše tělo si miliony let zvykalo na určitý způsob stravování. Abychom se o tělo starali dobře, musíme mu dávat správný typ paliva.",
    body: [
      "Pak jsme před 10 000 lety zdomestikovali zvířata a začali pěstovat plodiny pro masy. V posledních 60 letech jsme to dotáhli do extrému ve formě rafinovaných cukrů.",
    ],
    tips: [
      "Kompletně odstraň rafinované cukry (sladkosti, zákusky, limonády).",
      "Sniž příjem sacharidů — méně brambor, rýže, ideálně ven s pečivem.",
      "Zvyš příjem zdravých tuků a zeleniny (tučné ryby, avokádo, ořechy, brokolice...).",
    ],
  },
  {
    id: "pohyb", category: "zaklad", emoji: "🚶‍♂️",
    title: "Pohyb", subtitle: "Čištění hlavy",
    lead: "Jako lovci a sběrači jsme byli většinu dne na nohách. Tak se naše tělo vyvíjelo. Dnes jsme přikováni k židlím — a platíme za to.",
    body: [
      "S domestikací a specializací se pohyb omezil. V posledním století jsme to dotáhli do extrému — většinu dne se vůbec nehýbeme.",
    ],
    tips: [
      "Zahaj den protažením nebo cvičením — jóga je naprosto ideální.",
      "Každé 2 hodiny se na 5 minut projdi.",
      "Nachoď za den minimálně 10 000 kroků (20 000 je ještě lepších).",
    ],
  },
  {
    id: "odpocinek", category: "zaklad", emoji: "🛑",
    title: "Odpočinek", subtitle: "Regenerace",
    lead: "Aby náš mozek i tělo fungovaly optimálně, potřebují dostatek odpočinku. Minimem je alespoň jeden celý den v týdnu bez práce.",
    body: [
      "Míra odpočinku závisí na mnoha faktorech — jak moc se hýbeme, jíme a spíme. Jako naprosté minimum se od biblických dob doporučuje alespoň jeden celý volný den.",
    ],
    tips: [
      "Vyhraď si jeden den v týdnu s absolutním zákazem jakékoliv práce.",
      "V době odpočinku buď v přítomném okamžiku — nepřemýšlej nad minulostí ani budoucností.",
      "Když se přes den cítíš vyčerpaně, dej si 30–60 minut aktivity nesouvisející s prací.",
    ],
  },
  // PRINCIPY
  {
    id: "skola", category: "principy", emoji: "🎓",
    title: "Co se ve škole neučí?",
    lead: "Ve škole tě připravovali na testy, ne na hru jménem život. Neučili tě, jak zacházet s penězi, emocemi, vlastní energií ani vztahy.",
    body: [
      "Většinu důležitých dovedností se učíš až za pochodu — v práci, ve vztazích, v krizi. Je to náročné, ale má to jednu výhodu: můžeš si nastavit vlastní pravidla hry.",
      "Čím dřív přijmeš, že \u201Eškolní hru\u201D máš za sebou a teď hraješ tu vlastní, tím snáz si dovolíš hledat lepší systém pro sebe — ne pro vysvědčení.",
    ],
  },
  {
    id: "zodpovednost", category: "principy", emoji: "🎯",
    title: "Za svůj život jsi zodpovědný pouze ty sám.",
    lead: "Nikdo jiný nemůže žít tvůj život za tebe. V určitém bodě si prostě musíš říct: \u201EJe to na mně.\u201C",
    body: [
      "Můžeš mít podporu, kouče, partnera, komunitu. Ale rozhodnutí, která děláš každé ráno, večer i mezi tím, za tebe nikdo neudělá.",
      "To není tlak, ale svoboda. Jakmile to přijmeš, můžeš s vlastním životem mnohem víc experimentovat.",
    ],
  },
  {
    id: "cernobile", category: "principy", emoji: "🌈",
    title: "Skoro nic není pouze černobílé.",
    lead: "Život se nedá žít jen v režimu ano/ne. Mezi tím je obrovský prostor, kde si můžeš nastavit vlastní pravidla.",
    body: [
      "Buď práce, nebo svoboda. Buď rodina, nebo kariéra. Buď stabilita, nebo zážitky. Tenhle způsob přemýšlení tě zbytečně zamyká.",
      "Mezi černou a bílou je spousta odstínů. A právě tam si můžeš začít skládat život podle sebe — ne podle škatulek ostatních.",
    ],
  },
  {
    id: "smysl", category: "principy", emoji: "✨",
    title: "Svůj životní smysl tvoříš každodenními kroky.",
    lead: "Smysl nepřijde shora jako jeden velký \u201Eaha moment\u201D. Vzniká z malých voleb, které děláš dnes a zítra.",
    body: [
      "Často čekáme na jeden zlomový okamžik, který nám \u201Evysvětlí život\u201D. V praxi smysl vzniká z drobných rozhodnutí — čemu říkáš ano, čemu ne, kam dáváš energii.",
      "Můžeš začít maličkostmi: jedním projektem, jedním návykem, jedním rozhovorem, který už dlouho odkládáš.",
    ],
  },
  {
    id: "sebevedomi", category: "principy", emoji: "💪",
    title: "Sebevědomí si vybuduješ děláním těžkých věcí.",
    lead: "Sebevědomí není afirmace v zrcadle, ale důkaz. Přichází, když děláš kroky, do kterých se ti nechce — a ustojíš je.",
    body: [
      "Můžeš si opakovat, že na to máš. Ale dokud si to neověříš v reálném světě, hlava tomu stejně úplně nevěří.",
      "Každý malý \u201Etěžký krok\u201D — nepříjemný hovor, odmítnutí, nový projekt — je malý důkaz pro sebevědomí: \u201EZvládl jsem to. Dám i další věc.\u201C",
    ],
  },
  {
    id: "hotove", category: "principy", emoji: "✅",
    title: "Hotové je lepší než dokonalé.",
    lead: "Perfekcionismus je chytře maskovaný strach. Dokončené věci mění život — ne ty rozdělané.",
    body: [
      "Můžeš měsíce ladit detaily projektu nebo newsletteru — ale dokud to nepublikuješ, realita ti nedá žádnou zpětnou vazbu. Zůstaneš v bezpečí vlastní hlavy.",
      "Když začneš cílit na \u201Edost dobré na odeslání\u201D místo dokonalosti, posuneš se násobně rychleji. Učíš se z reálných reakcí, ne z hypotetických scénářů.",
    ],
  },
  {
    id: "intuice", category: "principy", emoji: "🔮",
    title: "Intuice pracuje ve tvůj prospěch.",
    lead: "Intuice není magie. Je to zhuštěná zkušenost tvého mozku, která se ozývá dřív, než ji stihneš rozumově vysvětlit.",
    body: [
      "Když máš z člověka, spolupráce nebo rozhodnutí \u201Edivný pocit\u201D, v pozadí běží spousta drobných signálů, které tvůj mozek dávno viděl — jen je neumíš hned pojmenovat.",
      "Intuici se vyplatí brát vážně, ale ne slepě. Použij ji jako první kompas a doplň rozumem: \u201ECo přesně na téhle situaci mi nesedí?\u201C",
    ],
  },
  // PILULKY
  {
    id: "mozek", category: "pilulky", emoji: "🧠",
    title: "Tvůj mozek je hloupější, než si myslíš.",
    lead: "Většinu času jedeš na autopilota — zkratky, emoce a příběhy v hlavě často vyhrávají nad realitou.",
    body: [
      "Mozek není nástroj na \u201Epravdu\u201D. Je to nástroj na přežití: šetřit energii, držet se známého, vyhýbat se riziku a mít pravdu za každou cenu.",
      "Když s tím začneš počítat, přestaneš se divit vlastním přešlapům. Místo sebemrskání začneš stavět systémy, které s autopilotem umí pracovat.",
    ],
  },
  {
    id: "vazne-sebe", category: "pilulky", emoji: "😄",
    title: "Neber se tak vážně.",
    lead: "Ego miluje drama. Humor a lehkost ti vrátí nadhled — a často i odvahu.",
    body: [
      "Když bereš všechno smrtelně vážně, každá chyba je katastrofa a každý pohled ostatních je soud. Tím si zbytečně přidáváš tlak.",
      "Lehkovážnost není nezodpovědnost. Je to schopnost udržet si odstup: \u201ETohle jsem udělal špatně. Neznamená to, že jsem špatný.\u201C",
    ],
  },
  {
    id: "vazne-svet", category: "pilulky", emoji: "🌍",
    title: "A neber svět okolo tak vážně.",
    lead: "Spousta \u201Epravidel\u201D je jen společenská hra. Když to uvidíš, přestaneš se bát pohybu.",
    body: [
      "Lidé často působí sebejistě, ale uvnitř řeší podobné věci jako ty: nejistotu, porovnávání, strach z odmítnutí. Svět není tak pevný a soudný, jak se tváří.",
      "Když přestaneš čekat \u201Epovolení\u201D, začneš tvořit. A zjistíš, že většina bariér byla jen v hlavě.",
    ],
  },
  {
    id: "zvirata", category: "pilulky", emoji: "🦁",
    title: "Pod povrchem jsme stále jen zvířata.",
    lead: "V úplném základu jsme biologické mašiny. Často si myslíme, že \u201Ejsme nad tím\u201D, ale nejsme.",
    body: [
      "Nálada, motivace i sebeovládání nejsou jen \u201Esíla vůle\u201D. Jsou to hormony, spánek, jídlo, pohyb, stres a prostředí. Proto sekce Základ není \u201Eself-care\u201D, ale infrastruktura.",
      "Když tohle přijmeš, přestaneš moralizovat vlastní výkyvy a začneš je řídit jako systém — ne jako charakterovou vadu.",
    ],
  },
  {
    id: "jedna-vec", category: "pilulky", emoji: "🪄",
    title: "Žádná jedna věc to zázračně nevyřeší.",
    lead: "Žádný \u201Ehack\u201D to za tebe neodžije. Funguje jen kombinace malých kroků v čase.",
    body: [
      "Je lákavé věřit, že existuje jeden kurz, jedna kniha nebo jedna metoda, která všechno přepne. Realita je střízlivější — a zároveň mnohem víc pod tvojí kontrolou.",
      "Když přestaneš hledat zázrak a začneš skládat systém (spánek, jídlo, pohyb, vztahy, práce, pozornost), život se začne zlepšovat bez magie.",
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildContent(p: Principle): string {
  const parts: string[] = [];
  for (const para of p.body) {
    parts.push(para);
  }
  if (p.tips && p.tips.length > 0) {
    parts.push("\n## Tipy");
    for (const tip of p.tips) {
      parts.push(`- ${tip}`);
    }
  }
  return parts.join("\n\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Ensure princip is allowed in the type constraint
  try {
    await sql`ALTER TABLE inspirations DROP CONSTRAINT IF EXISTS inspirations_type_check`;
    await sql`ALTER TABLE inspirations ADD CONSTRAINT inspirations_type_check CHECK (type IN ('blog', 'video', 'book', 'article', 'other', 'music', 'reel', 'princip'))`;
    console.log("Updated type constraint to include 'princip'");
  } catch (e) {
    console.warn("Could not update type constraint:", e);
  }

  // Ensure/create inspiration categories for the 3 groups
  const categoryIds: Record<Category, string> = {} as Record<Category, string>;

  for (const [key, label] of Object.entries(CATEGORY_MAP) as [Category, string][]) {
    // Try to find existing category by name
    const existing = await sql`SELECT id FROM inspiration_categories WHERE name = ${label} LIMIT 1`;
    if (existing.length > 0) {
      categoryIds[key] = existing[0].id;
      console.log(`Category "${label}" already exists: ${existing[0].id}`);
    } else {
      const id = `cat_princip_${key}_${Date.now()}`;
      const now = new Date();
      await sql`
        INSERT INTO inspiration_categories (id, name, created_at, updated_at)
        VALUES (${id}, ${label}, ${now}, ${now})
      `;
      categoryIds[key] = id;
      console.log(`Created category "${label}": ${id}`);
    }
  }

  // Insert principles
  let inserted = 0;
  let skipped = 0;

  for (const p of PRINCIPLES) {
    // Check if already exists (by matching title)
    const existing = await sql`SELECT id FROM inspirations WHERE type = 'princip' AND title = ${p.title} LIMIT 1`;
    if (existing.length > 0) {
      console.log(`Skipping existing: ${p.title}`);
      skipped++;
      continue;
    }

    const id = `princip_${p.id}_${Date.now()}`;
    const now = new Date();
    const content = buildContent(p);
    const description = p.lead;
    const categoryId = categoryIds[p.category];

    await sql`
      INSERT INTO inspirations (
        id, type, title, description, url, content, is_active,
        category_id, created_at, updated_at
      ) VALUES (
        ${id},
        'princip',
        ${p.title},
        ${description},
        ${"/muj-kompas"},
        ${content},
        ${true},
        ${categoryId},
        ${now},
        ${now}
      )
    `;
    console.log(`Inserted: ${p.title}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
