#!/usr/bin/env python3
"""Rewrite the # Lekce sections in 14 health wiki files."""
import os

BASE = "wiki/04-health"

# Each entry: (filepath, new_lekce_content)
files = {}

# ============================================================
# 1. health-nutr-macros.md (icon: Apple)
# ============================================================
files[f"{BASE}/01-health-course-nutrition/health-nutr-macros.md"] = r"""# Lekce

## Lekce 1 — Co jsou makroživiny
*id: `health-l-nutr-macros-a` · typ: intro · xp: 10*

### 1. Úvod lekce

# Makroživiny
*ikona: Apple*

V této lekci pochopíš, co jsou **bílkoviny, sacharidy a tuky** — tři základní stavební bloky všeho, co jíš. Zjistíš, kolik kalorií každá z nich dodává, k čemu je tvé tělo potřebuje a proč žádná z nich není „zlá".

#### EN

# Macronutrients
*icon: Apple*

In this lesson you'll understand what **protein, carbs, and fats** are — the three main building blocks of everything you eat. You'll learn how many calories each provides, what your body needs them for, and why none of them is "evil."

### 2. Text

Když sníš jídlo, tělo ho rozloží na základní živiny a využije je pro energii, stavbu svalů, tvorbu hormonů a tisíce dalších procesů. Tyto živiny se dělí do dvou skupin:

**Makroživiny** — potřebuješ jich denně v gramech: bílkoviny, sacharidy, tuky.

**Mikroživiny** — stačí v miligramech (vitamíny, minerály).

Tři hlavní makroživiny mají různou kalorickou hodnotu: **bílkoviny 4 kcal/g**, **sacharidy 4 kcal/g**, **tuky 9 kcal/g**. Bílkoviny stavějí svaly a tkáně, sacharidy dodávají rychlou energii, tuky tvoří hormony a chrání buněčné membrány.

#### EN

When you eat, your body breaks food down into basic nutrients and uses them for energy, building muscle, making hormones, and thousands of other processes. These nutrients fall into two groups:

**Macronutrients** — you need them in grams per day: protein, carbs, fats.

**Micronutrients** — you only need milligrams (vitamins, minerals).

The three main macronutrients have different calorie values: **protein 4 kcal/g**, **carbs 4 kcal/g**, **fats 9 kcal/g**. Protein builds muscle and tissue, carbs provide quick energy, and fats make hormones and protect cell membranes.

### 3. Kvíz

**Otázka:** Která z následujících skupin obsahuje VŠECHNY tři hlavní makroživiny?

- **✅ Bílkoviny, sacharidy, tuky**
  Přesně. Tohle jsou tři hlavní makroživiny — tělo je potřebuje denně v gramech. Každá má svou nezastupitelnou roli.
- ❌ Vitamíny, minerály, voda
  To jsou důležité látky, ale ne makroživiny. Vitamíny a minerály jsou mikroživiny (potřebuješ je v malých množstvích). Voda je vlastní kategorie.
- ❌ Cukry, vláknina, kofein
  Cukry jsou jen jedním druhem sacharidu, vláknina je nestravitelný sacharid a kofein vůbec není živina.
- ❌ Bílkoviny, vláknina, alkohol
  Bílkoviny jsou makroživina, ale vláknina je podtyp sacharidu a alkohol je samostatná kategorie (dodává kalorie, ale tělu neprospívá).

#### EN

**Question:** Which of the following groups contains ALL THREE main macronutrients?

- **✅ Protein, carbs, fats**
  Exactly. These are the three main macronutrients — your body needs all three in grams per day. Each plays an irreplaceable role.
- ❌ Vitamins, minerals, water
  Those are important substances, but not macronutrients. Vitamins and minerals are micronutrients (needed in small amounts). Water is its own category.
- ❌ Sugars, fiber, caffeine
  Sugars are just one type of carb, fiber is an indigestible carb, and caffeine isn't a nutrient at all.
- ❌ Protein, fiber, alcohol
  Protein is a macronutrient, but fiber is a subtype of carb and alcohol is its own category (it provides calories but doesn't benefit the body).

### 4. Text

Každá makroživina má jinou roli a rychlost zpracování. Proto je užitečné rozložit příjem podle denního rytmu: **sacharidy kolem tréninku** (rychlé palivo pro svaly), **bílkoviny rovnoměrně přes den** (každé 3–5 hodin pro maximální využití), **tuky kdykoli** (ale ne obrovské porce těsně před cvičením).

Praktické pravidlo pro nastavení maker: nejdřív urči bílkoviny (1,6–2,2 g/kg při hubnutí a tréninku), pak tuky (minimálně 0,8 g/kg pro hormony) a sacharidy doplní zbytek do cílových kalorií.

#### EN

Each macronutrient has a different role and processing speed. That's why it helps to time your intake around your day: **carbs around training** (fast fuel for muscles), **protein evenly spread throughout the day** (every 3–5 hours for maximum use), **fats whenever** (just not huge portions right before exercise).

A practical rule for setting your macros: first set protein (1.6–2.2 g/kg when dieting and training), then fats (at least 0.8 g/kg for hormones), and let carbs fill in the rest up to your calorie target.

### 5. Kvíz

**Otázka:** Proč 1 gram tuku obsahuje víc než dvakrát víc kalorií než 1 gram bílkovin nebo sacharidů?

- **✅ Tuky mají hustší chemickou strukturu, ze které tělo dokáže vytěžit víc energie — 9 kcal na gram oproti 4 kcal**
  Přesně. Tuk je nejefektivnější způsob, jak tělo ukládá energii — proto je tuková tkáň tak hustá. 1 kg tuku obsahuje asi 7 700 kcal.
- ❌ Tuky obsahují víc živin, takže tělo z nich získá víc energie
  „Víc živin" není přesné. Tuky jsou samy o sobě živina. Vyšší kalorická hustota je dána chemickou strukturou — víc vazeb uhlík-vodík.
- ❌ Je to jen marketing — kalorie jsou všude stejné
  Není to marketing. Hodnota 9 kcal/g pro tuky a 4 kcal/g pro bílkoviny a sacharidy je stanovena přesnými laboratorními měřeními (kalorimetrií).

#### EN

**Question:** Why does 1 gram of fat contain more than twice the calories of 1 gram of protein or carbs?

- **✅ Fats have a denser chemical structure from which the body can extract more energy — 9 kcal per gram versus 4 kcal**
  Exactly. Fat is the most efficient way the body stores energy — which is why fat tissue is so dense. 1 kg of fat contains about 7,700 kcal.
- ❌ Fats contain more nutrients, so the body gets more energy from them
  "More nutrients" isn't accurate. Fats are themselves a nutrient. The higher calorie density comes from chemical structure — more carbon-hydrogen bonds.
- ❌ It's just marketing — calories are the same everywhere
  It isn't marketing. The values of 9 kcal/g for fats and 4 kcal/g for protein and carbs are determined by precise lab measurements (calorimetry).

### 6. Klíčový poznatek

**Bílkoviny stavějí, sacharidy palí, tuky drží hormonální systém v chodu.** Žádná z těchto tří skupin není „zlá" — problém je vždycky nerovnováha nebo extrémní množství, ne samotná makroživina.

#### EN

**Protein builds, carbs fuel, fats run your hormonal system.** None of the three groups is "evil" — the problem is always imbalance or extreme amounts, never the macronutrient itself.

### 7. Kvíz

**Otázka:** Představ si, že chceš zhubnout a vyřadíš ze stravy úplně všechny tuky. Po měsíci máš suchou kůži, padající vlasy a horší soustředění. Proč?

- **✅ Tuky jsou nezbytné pro tvorbu hormonů, vstřebávání vitamínů a stavbu buněčných membrán — bez nich tělo nedokáže normálně fungovat**
  Přesně. Kůže potřebuje tuky pro zachování bariéry, mozek (60 % tuku!) je potřebuje pro neurony, hormonální systém pro tvorbu testosteronu a estrogenu.
- ❌ Asi máš málo spánku nebo stresu
  Možná, ale primární příčina je vyřazení tuků. I s perfektním spánkem bys měl/a podobné problémy.
- ❌ Měl/a bys jíst víc bílkovin, ty by tuky nahradily
  Bílkoviny tuky nenahradí — mají úplně jinou roli. Tělo potřebuje obě.

#### EN

**Question:** Imagine you want to lose weight and cut out all fats from your diet. After a month you have dry skin, hair loss, and worse focus. Why?

- **✅ Fats are essential for making hormones, absorbing vitamins, and building cell membranes — without them the body can't function normally**
  Exactly. Skin needs fats to maintain its barrier, the brain (60 % fat!) needs them for neurons, the hormonal system needs them to make testosterone and estrogen.
- ❌ You probably slept badly or were stressed
  Maybe, but the primary cause is cutting fats. Even with perfect sleep you'd have similar problems.
- ❌ You should eat more protein, that would replace fats
  Protein doesn't replace fats — they have completely different roles. The body needs both.

### 8. Kvíz

**Otázka:** Která z následujících strategií je nejvíce podporována vědeckým konsenzem o zdravé stravě?

- **✅ Vyvážený příjem všech tří makroživin s důrazem na nezpracované potraviny a dostatek bílkovin**
  Přesně. Žádný „extrém" (žádné tuky, žádné sacharidy, jen jeden typ jídla) není dlouhodobě vědecky podpořený.
- ❌ Vyřadit jednu makroživinu úplně a „přestavět" metabolismus
  Některé extrémní diety mohou krátkodobě fungovat, ale dlouhodobě často způsobují deficity a hormonální nerovnováhy.
- ❌ Jíst jen jeden druh jídla, aby tělo vědělo, co dostává
  „Mono diety" nejsou podporované. Pestrost je důležitá — žádná jednotlivá potravina nemá vše, co tělo potřebuje.

#### EN

**Question:** Which of the following strategies is most supported by scientific consensus on healthy eating?

- **✅ Balanced intake of all three macronutrients, with an emphasis on unprocessed foods and enough protein**
  Exactly. No "extreme" (no fats, no carbs, just one type of food) is supported long-term by science.
- ❌ Cut one macronutrient entirely to "reprogram" metabolism
  Some extreme diets can work short-term, but long-term they often cause deficiencies and hormonal imbalances.
- ❌ Eat only one type of food so the body knows what it's getting
  "Mono diets" aren't supported. Variety is important — no single food has everything the body needs.

### 9. Kvíz

**Otázka:** Kolik kcal má 1 g bílkoviny vs. 1 g tuku?

- **✅ Bílkoviny 4 kcal/g, tuky 9 kcal/g**
  Správně. Proto je tuk tak kaloricky hustý — 1 lžíce olivového oleje má ~120 kcal.
- ❌ Bílkoviny 9 kcal/g, tuky 4 kcal/g
  Je to naopak. Tuky mají víc kalorií na gram než bílkoviny nebo sacharidy.
- ❌ Obojí 7 kcal/g
  Bílkoviny a sacharidy mají 4 kcal/g, tuky 9 kcal/g. Toto číslo si zapamatuj pro počítání maker.

#### EN

**Question:** How many kcal are in 1 g of protein vs. 1 g of fat?

- **✅ Protein 4 kcal/g, fat 9 kcal/g**
  Correct. That's why fat is so calorie-dense — 1 tablespoon of olive oil is ~120 kcal.
- ❌ Protein 9 kcal/g, fat 4 kcal/g
  It's the other way around. Fat has more calories per gram than protein or carbs.
- ❌ Both 7 kcal/g
  Protein and carbs are 4 kcal/g, fat is 9 kcal/g. You need to memorize this for counting macros.
"""

# ============================================================
# 2. health-nutr-protein.md (icon: Dumbbell)
# ============================================================
files[f"{BASE}/01-health-course-nutrition/health-nutr-protein.md"] = r"""# Lekce

## Lekce 1 — Proč bílkoviny rozhodují
*id: `health-l-nutr-protein-a` · typ: intro · xp: 10*

### 1. Úvod lekce

# Bílkoviny
*ikona: Dumbbell*

V této lekci pochopíš, proč jsou **bílkoviny nejdůležitější makroživinou pro sportovce** i pro kohokoli, kdo chce být zdravý. Projdeme si, kolik jich potřebuješ, jak je rozložit přes den a proč bez nich svaly prostě nerostou.

#### EN

# Protein
*icon: Dumbbell*

In this lesson you'll understand why **protein is the most important macronutrient for athletes** and anyone who wants to be healthy. We'll cover how much you need, how to spread it throughout the day, and why without it muscles simply won't grow.

### 2. Text

Bílkoviny tvoří aminokyseliny, které jsou doslova stavebními kostkami svalů, kůže, vlasů, enzymů a hormonů. Z 20 aminokyselin si tělo 11 dokáže vyrobit samo, ale 9 musíš přijmout ze stravy — tzv. **esenciální aminokyseliny**.

Bez dostatečného příjmu tělo nemá materiál pro opravu ani růst. Optimální příjem pro dospělé je 1,2–1,6 g/kg tělesné hmotnosti denně, pro silové sportovce a při hubnutí **1,6–2,2 g/kg**.

#### EN

Protein is made of amino acids, which are literally the building blocks of muscle, skin, hair, enzymes, and hormones. Of the 20 amino acids, your body can make 11 on its own, but 9 have to come from food — these are the **essential amino acids**.

Without enough intake, your body has no material for repair or growth. The optimal intake for adults is 1.2–1.6 g/kg of body weight per day, and for strength athletes or anyone dieting it's **1.6–2.2 g/kg**.

### 3. Kvíz

**Otázka:** Proč bílkoviny nestačí jen k večeři v jedné velké dávce?

- **✅ Svalová proteosyntéza se aktivuje na 3–5 hodin po každé dávce bílkovin — rovnoměrné rozložení do 3–5 porcí po 20–40 g ji maximalizuje**
  Přesně. Tělo svaly buduje v pulzech. Jedna megadávka 150 g najednou není efektivnější — přebytek se oxiduje na energii.
- ❌ Tělo dokáže vstřebat jen 30 g najednou a zbytek se vyloučí
  To je zjednodušený mýtus. Tělo vstřebá i víc, ale pro svalovou syntézu je rovnoměrné rozložení efektivnější.
- ❌ Na timingu vůbec nezáleží, jen na celkovém příjmu
  Celkový příjem je důležitější, ale timing má měřitelný vliv na svalovou syntézu — studie to opakovaně ukazují.

#### EN

**Question:** Why isn't it enough to eat all your protein at dinner in one big dose?

- **✅ Muscle protein synthesis is activated for 3–5 hours after each protein dose — spreading 3–5 servings of 20–40 g throughout the day maximizes it**
  Exactly. Your body builds muscle in pulses. One mega-dose of 150 g at once isn't more effective — the excess is oxidized for energy.
- ❌ The body can only absorb 30 g at a time and excretes the rest
  That's an oversimplified myth. The body absorbs more, but for muscle synthesis, even distribution is more effective.
- ❌ Timing doesn't matter at all, only total intake
  Total intake matters more, but timing has a measurable impact on muscle synthesis — studies have shown this repeatedly.

### 4. Text

Kvalita bílkovin záleží na aminokyselinovém profilu. **Živočišné zdroje** (maso, vejce, mléčné výrobky) obsahují všechny esenciální aminokyseliny v dobrém poměru. **Rostlinné zdroje** je třeba kombinovat (luštěniny + obilniny) nebo používat sóju/tofu, které mají kompletní profil. **Leucin** (obsažený hlavně v živočišných bílkovinách) je klíčovým spouštěčem proteosyntézy.

#### EN

Protein quality depends on the amino acid profile. **Animal sources** (meat, eggs, dairy) contain all essential amino acids in a good ratio. **Plant sources** need to be combined (legumes + grains) or you can use soy/tofu, which have a complete profile. **Leucine** (found mainly in animal protein) is the key trigger for protein synthesis.

### 5. Kvíz

**Otázka:** Muž 80 kg, trénuje 4x týdně. Kolik bílkovin denně?

- **✅ 128–176 g (1,6–2,2 g/kg)**
  Přesně. Jeho potřeba je výrazně vyšší než „obecné" doporučení 0,8 g/kg (to by bylo jen 64 g).
- ❌ 64 g (0,8 g/kg)
  To je minimum pro sedavého člověka k přežití — ne pro trénujícího, který chce růst svalů.
- ❌ 300 g (3,75 g/kg)
  Zbytečně moc — nad 2,2 g/kg už efekt roste jen minimálně. Přebytek se jen „spálí" jako energie.

#### EN

**Question:** A man weighing 80 kg, training 4 times a week. How much protein per day?

- **✅ 128–176 g (1.6–2.2 g/kg)**
  Exactly. His needs are much higher than the "general" recommendation of 0.8 g/kg (which would only be 64 g).
- ❌ 64 g (0.8 g/kg)
  That's the survival minimum for a sedentary person — not for a lifter who wants to grow muscle.
- ❌ 300 g (3.75 g/kg)
  Way too much — above 2.2 g/kg the effect barely grows. The excess is just "burned" for energy.

### 6. Klíčový poznatek

**Trénink je signál k růstu. Bílkoviny jsou stavební materiál.** Bez obojího svaly neporostou — ani s nejlepším plánem ve fitku. Cíl: 1,6–2,2 g/kg, rozložené do 3–5 porcí přes den.

#### EN

**Training is the signal to grow. Protein is the building material.** Without both, muscles won't grow — not even with the best gym plan. Target: 1.6–2.2 g/kg, spread across 3–5 servings throughout the day.

### 7. Kvíz

**Otázka:** Je pravda, že „vysoké bílkoviny ničí ledviny"?

- **✅ Ne — u zdravých lidí studie žádné poškození neprokázaly**
  Správně. Meta-analýzy ukázaly, že vysokoproteinová strava nepoškozuje ledviny u zdravých lidí. Pozor jen u již nemocných ledvin.
- ❌ Ano, nad 100 g denně je nebezpečné
  To je mýtus, který se drží i přes opakované vědecké vyvrácení. U zdravých lidí riziko neexistuje.
- ❌ Ano, ale jen z červeného masa
  Zdroj bílkovin na funkci ledvin nemá vliv u zdravých lidí. Zdraví ledvin se řídí jinými faktory.

#### EN

**Question:** Is it true that "high protein destroys your kidneys"?

- **✅ No — studies show no damage in healthy people**
  Correct. Meta-analyses showed that a high-protein diet does not harm the kidneys of healthy people. Caution only applies to people with existing kidney disease.
- ❌ Yes, over 100 g a day is dangerous
  That's a myth that persists despite repeated scientific debunking. In healthy people, the risk doesn't exist.
- ❌ Yes, but only from red meat
  The source of protein doesn't affect kidney function in healthy people. Kidney health is governed by other factors.

### 8. Kvíz

**Otázka:** Představ si, že jsi vegetarián/ka a vážíš 60 kg. Potřebuješ ~100 g bílkovin denně. Která strategie je nejrozumnější?

- **✅ Kombinovat zdroje přes den: tvaroh + vejce ke snídani, tofu + čočka k obědu, jogurt + sýr k večeři**
  Přesně. Rovnoměrné rozložení z různých zdrojů pokrývá leucin, vlákninu i mikronutrienty. Rostlinné zdroje potřebují o ~10–15 % vyšší celkový příjem než živočišné pro stejný efekt.
- ❌ 5 odměrek proteinového prášku denně a nic dalšího
  Celé jídlo je vždy lepší — obsahuje i další živiny. Protein prášek je jen doplněk.
- ❌ Jen salát a ovoce, ty přece obsahují bílkoviny
  Salát a ovoce obsahují minimum bílkovin (1–2 g na porci). Bez koncentrovaných zdrojů 100 g nikdy nedosáhneš.

#### EN

**Question:** Imagine you're a vegetarian weighing 60 kg. You need ~100 g of protein per day. Which strategy is most sensible?

- **✅ Combine sources throughout the day: quark + eggs for breakfast, tofu + lentils for lunch, yogurt + cheese for dinner**
  Exactly. Even distribution from different sources covers leucine, fiber, and micronutrients. Plant sources need about 10–15 % more total intake than animal sources for the same effect.
- ❌ 5 scoops of protein powder a day and nothing else
  Whole food is always better — it contains other nutrients too. Protein powder is just a supplement.
- ❌ Just salad and fruit, they contain protein too
  Salad and fruit contain minimal protein (1–2 g per serving). Without concentrated sources you'll never hit 100 g.

### 9. Kvíz

**Otázka:** Studie Mortona et al. (2018) analyzovala 49 studií. Jaký je optimální příjem bílkovin pro nárůst svalů?

- **✅ ~1,6 g/kg — nad 2,2 g/kg už efekt neroste**
  Přesně. Přesto je v ČR běžné doporučení „0,8 g/kg" — to je minimum pro přežití sedavého člověka, ne pro sportovce.
- ❌ 0,8 g/kg — standardní doporučení stačí
  0,8 g/kg je minimum pro bazální funkce. Pro růst svalů je to zcela nedostačující.
- ❌ 4+ g/kg — čím víc, tím lépe
  Nad 2,2 g/kg už nárůst efektu prakticky mizí. Extrémně vysoké dávky nepřinášejí dodatečný benefit.

#### EN

**Question:** Morton et al. (2018) analyzed 49 studies. What's the optimal protein intake for muscle growth?

- **✅ ~1.6 g/kg — above 2.2 g/kg the effect plateaus**
  Exactly. Yet the common recommendation in the Czech Republic is "0.8 g/kg" — that's the survival minimum for a sedentary person, not for an athlete.
- ❌ 0.8 g/kg — the standard recommendation is enough
  0.8 g/kg is the minimum for basic functions. For muscle growth it's completely insufficient.
- ❌ 4+ g/kg — the more the better
  Above 2.2 g/kg the additional effect practically disappears. Extremely high doses bring no extra benefit.
"""

# ============================================================
# 3. health-nutr-fats.md (icon: Droplet)
# ============================================================
files[f"{BASE}/01-health-course-nutrition/health-nutr-fats.md"] = r"""# Lekce

## Lekce 1 — Proč tuky nejsou nepřítel
*id: `health-l-nutr-fats-a` · typ: intro · xp: 10*

### 1. Úvod lekce

# Tuky ve stravě
*ikona: Droplet*

V této lekci pochopíš, proč jsou tuky **nezbytnou součástí stravy**, ne nepřítelem. Projdeme si typy tuků, proč bez nich nefungují hormony ani vitamíny, a jediný typ, kterému se opravdu vyplatí vyhýbat.

#### EN

# Dietary Fats
*icon: Droplet*

In this lesson you'll understand why fats are an **essential part of your diet**, not the enemy. We'll cover the types of fat, why hormones and vitamins can't work without them, and the only type that's truly worth avoiding.

### 2. Text

V 80. a 90. letech proběhla „low-fat" vlna kvůli špatné interpretaci studií. Dnes víme, že tuky jsou nezbytné — jen záleží na typu. Doporučený příjem je **20–35 % kalorií**. Pod 20 % klesá produkce hormonů.

Tuky dělíme podle struktury:

**Nasycené** (máslo, sádlo, kokos, maso) — stabilní, vhodné na vaření. Nedávné meta-analýzy neukázaly jasnou souvislost s kardiovaskulárními chorobami při běžném příjmu.

**Mononenasycené** (olivový olej, avokádo, mandle) — důležité pro srdce a mozek.

**Polynenasycené — omega-3 a omega-6** (ryby, lněné semínko, ořechy) — omega-3 (EPA, DHA) z tučných ryb jsou protizánětlivé.

**Trans-tuky** (margariny, fastfood, průmyslově ztužené) — jediný typ, kterému se vědecky jednoznačně vyplatí vyhnout.

#### EN

The 80s and 90s saw a "low-fat" wave based on misinterpreted studies. Today we know fat is essential — it's the type that matters. The recommended intake is **20–35 % of calories**. Below 20 %, hormone production drops.

Fats are categorized by structure:

**Saturated** (butter, lard, coconut, meat) — stable, good for cooking. Recent meta-analyses haven't shown a clear link to cardiovascular disease at normal intake.

**Monounsaturated** (olive oil, avocado, almonds) — important for the heart and brain.

**Polyunsaturated — omega-3 and omega-6** (fish, flaxseed, nuts) — omega-3 (EPA, DHA) from fatty fish is anti-inflammatory.

**Trans fats** (margarines, fast food, industrially hydrogenated) — the only type science has flagged as unambiguously worth avoiding.

### 3. Kvíz

**Otázka:** Představ si, že 5 let držíš „low-fat" stravu — žádné žloutky, jen libové maso. Máš vypadávající vlasy, suchou pleť a nepravidelný cyklus. Co je nejpravděpodobnější příčina?

- **✅ Tuky jsou nezbytné pro hormony, vitamín D (rozpustný v tucích) a celkové zdraví — dlouhodobý nízký příjem způsobil celý komplex problémů**
  Přesně. Vitamíny A, D, E, K jsou rozpustné v tucích — bez tuku se nevstřebávají. Pohlavní hormony se stavějí z cholesterolu a tuků.
- ❌ Musíš jíst ještě méně tuků
  Naopak — tvé tělo trpí nedostatkem. Méně tuků by situaci jen zhoršilo.
- ❌ Problém je v sacharidech
  Symptomy jasně ukazují na nedostatek tuků a z nich plynoucích hormonů a vitamínů.

#### EN

**Question:** Imagine you've been on a "low-fat" diet for 5 years — no egg yolks, just lean meat. You have hair loss, dry skin, and an irregular cycle. What's the most likely cause?

- **✅ Fats are essential for hormones, vitamin D (fat-soluble), and overall health — long-term low intake caused this whole cluster of problems**
  Exactly. Vitamins A, D, E, and K are fat-soluble — without fat they don't get absorbed. Sex hormones are built from cholesterol and fats.
- ❌ You need to eat even less fat
  The opposite — your body is starved of it. Less fat would make the situation worse.
- ❌ The problem is carbs
  The symptoms clearly point to a lack of fats and the hormones and vitamins that come with them.

### 4. Text

Klíčové je poměr omega-3 ku omega-6. Ideál je ~1:4, ale moderní západní strava má ~1:20 — příliš mnoho omega-6 z rafinovaných olejů. Omega-3 (EPA, DHA) z tučných ryb jsou protizánětlivé, podporují srdce, mozek i klouby. Ryby obsahují EPA a DHA přímo, zatímco z lněného semínka je konverze na DHA jen ~5 %. Proto: **losos, makrela nebo sardinky 2x týdně**.

#### EN

The key is the omega-3 to omega-6 ratio. The ideal is about 1:4, but the modern Western diet sits around 1:20 — too much omega-6 from refined oils. Omega-3 (EPA, DHA) from fatty fish is anti-inflammatory and supports your heart, brain, and joints. Fish contains EPA and DHA directly, while flax conversion to DHA is only ~5 %. So: **salmon, mackerel, or sardines 2 times a week**.

### 5. Kvíz

**Otázka:** Studie PREDIMED (2013) na ~7 500 lidech ukázala, že středomořská strava s olivovým olejem a ořechy snížila kardiovaskulární události o 30 % oproti „low-fat" skupině. Co z toho plyne?

- **✅ Zdravé tuky nejsou nepřítel — jsou součástí řešení. Typ tuku rozhoduje víc než celkové množství.**
  Přesně. Trans-tuky vyhoď, omega-3 přidej, nasycené v rozumných množstvích neškodí.
- ❌ Všechny tuky jsou zdravé, jez jich kolik chceš
  Ne — 9 kcal/g znamená, že se snadno přejíš. A trans-tuky jsou jednoznačně škodlivé.
- ❌ Studie je nespolehlivá, tuky jsou vždy špatné
  PREDIMED je jedna z největších randomizovaných studií na toto téma a její závěry potvrzují další výzkumy.

#### EN

**Question:** The PREDIMED study (2013) on ~7,500 people showed that a Mediterranean diet with olive oil and nuts cut cardiovascular events by 30 % compared with the "low-fat" group. What does this mean?

- **✅ Healthy fats aren't the enemy — they're part of the solution. The type of fat matters more than the total amount.**
  Exactly. Cut trans fats, add omega-3, and saturated fats in reasonable amounts do no harm.
- ❌ All fats are healthy, eat as much as you want
  No — 9 kcal/g means it's easy to overeat. And trans fats are unambiguously harmful.
- ❌ The study is unreliable, fats are always bad
  PREDIMED is one of the largest randomized trials on this topic and its findings are confirmed by further research.

### 6. Klíčový poznatek

**Tuky jsou tvůj spojenec.** Olivový olej, ryby, ořechy — denně. Margarín, fastfood a průmyslové pečivo — pryč. Typ tuku rozhoduje víc než celkové množství.

#### EN

**Fats are your ally.** Olive oil, fish, nuts — daily. Margarine, fast food, and industrial baked goods — gone. The type of fat matters more than the total amount.

### 7. Kvíz

**Otázka:** Kolik tuků denně pro 70 kg ženu na 2 000 kcal?

- **✅ ~55–75 g (25–33 % kalorií)**
  Přesně. 25–33 % z 2 000 kcal je 500–650 kcal, což při 9 kcal/g dělá 55–75 g tuků.
- ❌ 20 g (10 %)
  To je pod minimem pro hormonální zdraví. Pod 20 % klesá produkce pohlavních hormonů.
- ❌ 150 g (65 %)
  To už je keto — pro většinu lidí zbytečně vysoko a nepraktické.

#### EN

**Question:** How much fat per day for a 70 kg woman on 2,000 kcal?

- **✅ ~55–75 g (25–33 % of calories)**
  Exactly. 25–33 % of 2,000 kcal is 500–650 kcal, which at 9 kcal/g works out to 55–75 g of fat.
- ❌ 20 g (10 %)
  That's below the minimum for hormonal health. Below 20 %, sex hormone production drops.
- ❌ 150 g (65 %)
  That's keto territory — unnecessarily high for most people and impractical.

### 8. Kvíz

**Otázka:** Proč jsou omega-3 z ryb lepší než omega-3 z lněného semínka?

- **✅ Ryby obsahují EPA a DHA přímo, zatímco z lnu je konverze na DHA jen ~5 %**
  Přesně. Lněné semínko má ALA, které musí tělo konvertovat na EPA/DHA — konverze je neefektivní. Ryby dávají finální produkty přímo.
- ❌ Obojí je stejné
  Ne — biologicky aktivní formy jsou EPA a DHA, které jsou jen v mořských zdrojích.
- ❌ Lněné semínko je lepší, protože je rostlinné
  Rostlinné neznamená automaticky biologicky lepší. Pro omega-3 jsou ryby výrazně efektivnější.

#### EN

**Question:** Why is fish omega-3 better than flaxseed omega-3?

- **✅ Fish contains EPA and DHA directly, while flax conversion to DHA is only ~5 %**
  Exactly. Flaxseed has ALA, which your body must convert to EPA/DHA — the conversion is inefficient. Fish delivers the final products directly.
- ❌ Both are the same
  No — the biologically active forms are EPA and DHA, which are only in marine sources.
- ❌ Flaxseed is better because it's plant-based
  Plant-based doesn't automatically mean biologically better. For omega-3, fish is far more efficient.

### 9. Kvíz

**Otázka:** Představ si, že nakupuješ v supermarketu a chceš vybrat „zdravé" tuky. V košíku máš: máslo, olivový olej, lososa, margarín „rostlinný", vlašské ořechy a ztužený tuk na pečení. Které jsou problematické?

- **✅ Margarín a ztužený tuk — obsahují trans-tuky, které zvyšují LDL a snižují HDL cholesterol**
  Přesně. Trans-tuky jsou jediné vědecky jednoznačně škodlivé. WHO doporučuje příjem pod 1 % kalorií, ideálně nulu.
- ❌ Máslo — nasycené tuky způsobují infarkty
  Nedávné meta-analýzy neukázaly jasnou souvislost mezi nasycenými tuky a kardiovaskulárním onemocněním. Máslo v rozumných porcích je v pořádku.
- ❌ Losos — má moc tuků
  Losos je jeden z nejzdravějších zdrojů díky omega-3. Doporučení je tučné ryby 2x týdně.

#### EN

**Question:** Imagine you're shopping at a supermarket and want to pick "healthy" fats. In your cart: butter, olive oil, salmon, "plant-based" margarine, walnuts, and hydrogenated baking fat. Which are problematic?

- **✅ Margarine and hydrogenated fat — they contain trans fats, which raise LDL and lower HDL cholesterol**
  Exactly. Trans fats are the only fats science has flagged as unambiguously harmful. The WHO recommends keeping intake below 1 % of calories, ideally zero.
- ❌ Butter — saturated fats cause heart attacks
  Recent meta-analyses haven't shown a clear link between saturated fats and cardiovascular disease. Butter in reasonable amounts is fine.
- ❌ Salmon — it has too much fat
  Salmon is one of the healthiest sources thanks to its omega-3. The recommendation is fatty fish 2 times a week.
"""

# ============================================================
# 4. health-nutr-carbs.md (icon: Zap)
# ============================================================
files[f"{BASE}/01-health-course-nutrition/health-nutr-carbs.md"] = r"""# Lekce

## Lekce 1 — Sacharidy jako palivo
*id: `health-l-nutr-carbs-a` · typ: intro · xp: 10*

### 1. Úvod lekce

# Sacharidy
*ikona: Zap*

V této lekci pochopíš, proč jsou sacharidy **hlavním palivem pro mozek a svaly** — a proč nejsou nepřítelem. Projdeme si rozdíl mezi rychlými a pomalými sacharidy, glykemický index a jak složit jídlo tak, aby ti energie vydržela stabilně.

#### EN

# Carbohydrates
*icon: Zap*

In this lesson you'll understand why carbs are the **main fuel for your brain and muscles** — and why they aren't the enemy. We'll cover the difference between fast and slow carbs, the glycemic index, and how to compose a meal so your energy stays stable.

### 2. Text

Sacharidy dělíme na **jednoduché** (cukry — ovoce, med, sladkosti) a **komplexní** (škroby — rýže, brambory, ovesné vločky, luštěniny). **Glykemický index (GI)** měří, jak rychle jídlo zvýší glukózu v krvi.

Po **rychlých sacharidech** (bílé pečivo, cukr, limonády) glukóza prudce vystoupí, inzulin reaguje silně a za hodinu přichází „crash" — hlad a únava. Po **pomalých sacharidech s vlákninou** (ovesné vločky, luštěniny, celozrnný chléb) glukóza stoupá pomalu a energie drží stabilně hodiny.

Mozek spotřebuje ~120 g glukózy denně — sacharidy rozhodně nejsou „nepotřebné".

#### EN

Carbs are split into **simple** (sugars — fruit, honey, sweets) and **complex** (starches — rice, potatoes, oats, legumes). The **glycemic index (GI)** measures how fast a food raises blood glucose.

After **fast carbs** (white bread, sugar, soda), glucose spikes sharply, insulin reacts strongly, and within an hour comes the "crash" — hunger and fatigue. After **slow carbs with fiber** (oats, legumes, whole-grain bread), glucose rises slowly and energy stays stable for hours.

Your brain uses ~120 g of glucose a day — carbs are definitely not "unnecessary."

### 3. Kvíz

**Otázka:** Představ si, že snídáš bílý rohlík s marmeládou a sladké kakao. V 10:30 přichází „crash" — únava, nepozornost, chuť na sladké. Proč?

- **✅ Bílý rohlík s marmeládou má vysoký glykemický index — rychle zvýší krevní cukr a pak nastane strmý pokles. Vláknina v ovesných vločkách by vstřebávání zpomalila.**
  Přesně. Rafinované sacharidy = rychlé vyplavení inzulinu = následný pokles glukózy. Záměna za vločky s ořechy by crash eliminovala.
- ❌ Vločky mají víc kalorií
  Ne — kalorie mohou být podobné. Rozdíl je v rychlosti zpracování a následné stabilitě glukózy.
- ❌ Kakao je problém, vločky neobsahují cukr
  Vločky jsou sacharidy — jen jiného typu. Rozdíl je v komplexnosti, vláknině a rychlosti trávení.

#### EN

**Question:** Imagine you have a white bread roll with jam and sweet cocoa for breakfast. At 10:30 the "crash" hits — fatigue, poor focus, sugar cravings. Why?

- **✅ A white bread roll with jam has a high glycemic index — it spikes blood sugar fast and then crashes. Fiber in oats would slow absorption.**
  Exactly. Refined carbs = rapid insulin release = subsequent glucose drop. Switching to oats with nuts would eliminate the crash.
- ❌ Oats have more calories
  No — calorie counts can be similar. The difference is in processing speed and glucose stability afterward.
- ❌ Cocoa is the problem, oats contain no sugar
  Oats are carbs — just a different type. The difference is in complexity, fiber, and how fast they digest.

### 4. Text

Pro vytrvalostní sportovce jsou sacharidy nezbytné — glykogen ve svalech stačí na ~90 minut tvrdé zátěže. Pro silové sportovce také, ale v menší míře (60 g před tréninkem stačí). Extrémně nízké sacharidy u nesportovců způsobují mlhavé myšlení, protože mozek bez dostatku glukózy funguje hůř.

**Keto dieta** má své místo — u některých lidí s epilepsií, u ultra-vytrvalců, někdy při hubnutí. Ale pro běžného silového sportovce obvykle zhoršuje výkon a nedává dodatečné výhody oproti vyvážené stravě.

#### EN

Carbs are essential for endurance athletes — muscle glycogen lasts about 90 minutes of hard effort. For strength athletes too, but in smaller amounts (60 g before training is enough). Extremely low carbs in non-athletes cause brain fog because the brain works worse without enough glucose.

**Keto** has its place — for some people with epilepsy, for ultra-endurance athletes, sometimes during dieting. But for the average strength athlete it usually hurts performance without offering extra benefits over a balanced diet.

### 5. Kvíz

**Otázka:** Představ si, že nasadíš přísnou keto dietu — 3 týdny jen maso, vejce, máslo a zelenina. V posilovně jsi výrazně slabší, jsi unavený a v práci hůř přemýšlíš. Ale na váze jsi shodil 3 kg. Co se děje?

- **✅ Bez sacharidů jsou glykogenové zásoby nízké — pro silový trénink je to klíčové palivo. 3 kg jsou z velké části voda (1 g glykogenu váže 3 g vody).**
  Přesně. Prvotní rychlé „hubnutí" na keto je hlavně voda a glykogen, ne tuk. A síla padá, protože svaly nemají své primární palivo.
- ❌ Keto prostě funguje a měl bys být spokojený
  „3 kg" nejsou známkou úspěchu, pokud je to voda a svaly. Pro silového sportovce keto obvykle zhoršuje výkon.
- ❌ Musíš jíst víc bílkovin
  Bílkoviny nejsou primárním palivem pro krátké intenzivní série — sacharidy ano. Problém je v chybějícím glykogenu.

#### EN

**Question:** Imagine you go on a strict keto diet — 3 weeks of only meat, eggs, butter, and vegetables. In the gym you're noticeably weaker, you're tired, and you think less clearly at work. But the scale is down 3 kg. What's going on?

- **✅ Without carbs, glycogen stores are low — and that's a key fuel for strength training. The 3 kg is largely water (1 g of glycogen binds 3 g of water).**
  Exactly. The fast initial "weight loss" on keto is mostly water and glycogen, not fat. And strength drops because muscles lack their primary fuel.
- ❌ Keto just works and you should be happy
  The "3 kg" loss isn't a win if it's water and muscle. For a strength athlete, keto usually hurts performance.
- ❌ You need to eat more protein
  Protein isn't the primary fuel for short, intense sets — carbs are. The problem is missing glycogen.

### 6. Klíčový poznatek

**Sacharidy jsou tvoje palivo, ne tvůj nepřítel.** Vyber komplexní, nastav množství podle aktivity a energie bude stabilní. Keto není magie — pro silový trénink potřebuješ sacharidy.

#### EN

**Carbs are your fuel, not your enemy.** Pick complex ones, set the amount to match your activity, and your energy will stay stable. Keto isn't magic — for strength training you need carbs.

### 7. Kvíz

**Otázka:** Který zdroj sacharidů je nejlepší pro běžný den?

- **✅ Ovesné vločky, brambory, rýže, luštěniny, ovoce, celozrnné pečivo**
  Přesně. Komplexní, s vlákninou, mikronutrienty. Dávají stabilní energii a sytí.
- ❌ Bílý cukr, limonády, bílé pečivo
  Rafinované sacharidy bez vlákniny — způsobují výkyvy glukózy a nezasytí.
- ❌ Žádné sacharidy, jen maso
  Úplná absence není nutná ani ideální pro většinu lidí. Komplexní sacharidy jsou cenným palivem a zdrojem vlákniny.

#### EN

**Question:** Which carb source is best for a normal day?

- **✅ Oats, potatoes, rice, legumes, fruit, whole-grain bread**
  Exactly. Complex, with fiber and micronutrients. They deliver steady energy and keep you full.
- ❌ White sugar, soda, white bread
  Refined carbs without fiber — they cause glucose swings and don't fill you up.
- ❌ No carbs, just meat
  Total absence isn't necessary or ideal for most people. Complex carbs are valuable fuel and a source of fiber.

### 8. Kvíz

**Otázka:** Kolik sacharidů pro silového sportovce 80 kg?

- **✅ ~300–400 g (3–5 g/kg) v aktivních dnech**
  Přesně. Pro silový trénink s energií a regenerací je to optimum. Na dny odpočinku lze snížit.
- ❌ 50 g denně
  Pro aktivního člověka je to málo — glykogen nedoplní, výkon klesne.
- ❌ 1 000 g denně
  Zbytečně hodně — nadbytek kalorií se uloží jako tuk.

#### EN

**Question:** How many carbs for an 80 kg strength athlete?

- **✅ ~300–400 g (3–5 g/kg) on active days**
  Exactly. For strength training with energy and recovery, that's the sweet spot. On rest days you can dial it back.
- ❌ 50 g per day
  Too low for an active person — glycogen won't refill and performance will drop.
- ❌ 1,000 g per day
  Unnecessarily high — the excess calories will be stored as fat.

### 9. Kvíz

**Otázka:** Studie porovnávající izokalorické diety opakovaně ukazují: při stejných kaloriích a bílkovinách je ztráta tuku podobná napříč sacharidovými úrovněmi. Co z toho plyne?

- **✅ Sacharidy samy o sobě „nezpůsobují" tloušťku — rozhoduje celková kalorická bilance a dostatek bílkovin**
  Přesně. Rozdíl mezi dietami je v pocitu sytosti, výkonu a dlouhodobé udržitelnosti, ne v magickém efektu jedné makroživiny.
- ❌ Všechny diety jsou stejně dobré
  Ne — liší se v udržitelnosti a výkonu. Ale kalorický deficit je vždy klíčový faktor pro hubnutí.
- ❌ Sacharidy jsou zbytečné, když chceš zhubnout
  Sacharidy podporují tréninkový výkon a sytost. Při stejných kaloriích nedávají víc tuku než jiné makroživiny.

#### EN

**Question:** Studies comparing isocaloric diets repeatedly show: at equal calories and protein, fat loss is similar across carb levels. What does this mean?

- **✅ Carbs by themselves don't "cause" fat gain — what decides is the overall calorie balance and enough protein**
  Exactly. The difference between diets is in fullness, performance, and long-term sustainability, not in the magic effect of one macronutrient.
- ❌ All diets are equally good
  No — they differ in sustainability and performance. But a calorie deficit is always the key factor for fat loss.
- ❌ Carbs are unnecessary when you want to lose weight
  Carbs support training performance and satiety. At equal calories they don't produce more fat than other macronutrients.
"""

# ============================================================
# 5. health-nutr-micronutrients.md (icon: Leaf)
# ============================================================
files[f"{BASE}/01-health-course-nutrition/health-nutr-micronutrients.md"] = r"""# Lekce

## Lekce 1 — Vitamíny a minerály
*id: `health-l-nutr-micronutrients-a` · typ: intro · xp: 10*

### 1. Úvod lekce

# Mikroživiny
*ikona: Leaf*

V této lekci pochopíš, proč **vitamíny a minerály** potřebuješ v malých množstvích, ale jejich nedostatek má obrovské dopady na zdraví i výkon. Zjistíš, které deficity jsou v ČR nejčastější, a proč multivitamíny „naslepo" většinou nefungují.

#### EN

# Micronutrients
*icon: Leaf*

In this lesson you'll understand why you need **vitamins and minerals** in small amounts, but a deficiency has huge consequences for your health and performance. You'll learn which deficiencies are most common in the Czech Republic and why "blind" multivitamins usually don't work.

### 2. Text

Mikroživiny zahrnují 13 vitamínů (A, C, D, E, K, B-komplex) a asi 15 minerálů (železo, vápník, hořčík, zinek, jód, selen...). V ČR jsou nejčastější deficity: **vitamín D** (v zimě 60–80 % dospělých), **železo** (menstruující ženy), **B12** (vegani), hořčík a jód.

Vitamín D není vlastně vitamín — je to hormon. Reguluje kolem 200 genů, ovlivňuje imunitu, kosti, svaly, náladu a hormonální systém. Optimum v krvi je 75–125 nmol/L. Pod 50 je deficit, pod 30 těžký deficit. V ČR je v zimě málo UVB záření, takže tělo vitamín D samo nevyrobí.

#### EN

Micronutrients include 13 vitamins (A, C, D, E, K, B complex) and about 15 minerals (iron, calcium, magnesium, zinc, iodine, selenium...). The most common deficiencies in the Czech Republic: **vitamin D** (in winter 60–80 % of adults), **iron** (menstruating women), **B12** (vegans), magnesium, and iodine.

Vitamin D isn't really a vitamin — it's a hormone. It regulates about 200 genes and affects immunity, bones, muscles, mood, and your hormonal system. The optimal blood level is 75–125 nmol/L. Below 50 is deficient, below 30 is severely deficient. In winter, the Czech Republic gets too little UVB radiation for your body to produce it.

### 3. Kvíz

**Otázka:** Jaký suplement má v ČR smysl brát téměř všem bez krevního testu?

- **✅ Vitamín D3 v zimě (listopad–březen), ~1 000–2 000 IU denně**
  Přesně. Studie ukazují, že 60–80 % Čechů má v zimě deficit. Suplementace D3 je bezpečná, levná a efektivní.
- ❌ Multivitamín „pro jistotu"
  Multivitamíny obsahují malé dávky všeho — pokud nemáš konkrétní deficit, pravděpodobně neřeší nic. Lepší je cílená suplementace.
- ❌ Vitamín C ve vysokých dávkách
  Studie o megadávkách vitamínu C na prevenci nachlazení byly negativní. Normální strava pokryje potřebu u většiny lidí.

#### EN

**Question:** Which supplement makes sense to take without a blood test for almost everyone in the Czech Republic?

- **✅ Vitamin D3 in winter (November–March), ~1,000–2,000 IU per day**
  Exactly. Studies show 60–80 % of Czechs are deficient in winter. D3 supplementation is safe, cheap, and effective.
- ❌ A multivitamin "just in case"
  Multivitamins contain small doses of everything — if you don't have a specific deficiency, they probably solve nothing. Targeted supplementation is better.
- ❌ High-dose vitamin C
  Studies on megadoses of vitamin C for cold prevention have been negative. A normal diet covers the need for most people.

### 4. Text

Vegetariáni a vegani mají zvýšené riziko deficitů: **B12** (suplementovat — je prakticky jen v živočišných produktech), **železo** (kombinovat s vitamínem C pro vstřebávání), zinek, omega-3 (z řas nebo lnu) a vitamín D. Studie ukazují, že suplementace bez deficitu nepřináší žádný benefit a někdy může škodit (např. vitamín E ve vysokých dávkách, beta-karoten u kuřáků).

Praktické zdroje z potravy: Železo — červené maso, játra, tmavě zelená zelenina. Hořčík — ořechy, kakao, celozrnné. Zinek — hovězí, semínka, sýry. Jód — jodidovaná sůl, mořské ryby. Vápník — mléčné výrobky, mák, sardinky s kostmi.

#### EN

Vegetarians and vegans have a higher risk of deficiencies: **B12** (supplement — it's practically only in animal products), **iron** (combine with vitamin C for absorption), zinc, omega-3 (from algae or flax), and vitamin D. Studies show that supplementing without a deficiency provides no benefit and can sometimes cause harm (e.g. high-dose vitamin E, beta-carotene in smokers).

Practical food sources: Iron — red meat, liver, dark green vegetables. Magnesium — nuts, cocoa, whole grains. Zinc — beef, seeds, cheese. Iodine — iodized salt, sea fish. Calcium — dairy, poppy seeds, sardines with bones.

### 5. Kvíz

**Otázka:** Představ si, že jsi vegetarián/ka 5 let. Poslední rok cítíš únavu, mravenčení v rukou a obtížně se soustředíš. Krevní test ukáže B12 na hranici deficitu. Co je příčinou?

- **✅ Vitamín B12 je prakticky jen v živočišných produktech. Vejce a mléčné výrobky dávají málo — potřebuješ suplement.**
  Přesně. B12 se vytváří bakteriemi v živočišných tkáních. Rostlinné zdroje ho mají minimum. Vegetariáni a hlavně vegani potřebují suplement.
- ❌ Chybí ti vitamín C
  Vitamín C je dobrý na vstřebávání železa, ale symptomy (mravenčení, kognitivní potíže) ukazují přímo na B12.
- ❌ Je to jen únava z práce
  Mravenčení a kognitivní potíže jsou klasické symptomy deficitu B12 — dlouhodobý deficit může poškodit nervy. Test to potvrdil.

#### EN

**Question:** Imagine you've been a vegetarian for 5 years. For the past year you feel tired, have tingling in your hands, and have trouble focusing. A blood test shows B12 near deficient. What's the cause?

- **✅ Vitamin B12 is practically only in animal products. Eggs and dairy provide little — you need a supplement.**
  Exactly. B12 is made by bacteria found in animal tissue. Plant sources contain almost none. Vegetarians, and especially vegans, need a supplement.
- ❌ You're missing vitamin C
  Vitamin C helps iron absorption, but the specific symptoms (tingling, cognitive issues) point directly to B12.
- ❌ It's just work fatigue
  Tingling and cognitive issues are classic B12 deficiency symptoms — long-term deficiency can damage nerves. The test confirmed it.

### 6. Klíčový poznatek

**Nehádej — nech si udělat krev.** Pak cíleně doplň, co chybí. Základ je pestrá strava; multivitamín naslepo je často plýtvání peněz. Pro většinu Čechů v zimě: D3 1 000–2 000 IU. Pro vegetariány: B12.

#### EN

**Don't guess — get bloodwork.** Then target what's actually missing. The foundation is a varied diet; a blind multivitamin is often a waste of money. For most Czechs in winter: D3 1,000–2,000 IU. For vegetarians: B12.

### 7. Kvíz

**Otázka:** Která suplementace je v ČR problematická/nadbytečná u většiny lidí?

- **✅ Drahé multivitamíny „pro celkovou imunitu" bez testu**
  Přesně. Bez znalosti deficitu je to plýtvání. Lepší je investovat do krevního testu a pak cíleně.
- ❌ Cílená suplementace po krevním testu
  Cílená suplementace je efektivní a podložená vědou.
- ❌ Pestrá strava
  Pestrá strava je základ — pokryje většinu mikroživin pro většinu lidí.

#### EN

**Question:** Which supplementation is problematic or unnecessary for most people in the Czech Republic?

- **✅ Expensive multivitamins "for overall immunity" with no test**
  Exactly. Without knowing what's deficient, it's a waste. Better to invest in a blood test and then target.
- ❌ Targeted supplementation after a blood test
  Targeted supplementation is effective and backed by science.
- ❌ A varied diet
  A varied diet is the foundation — it covers most micronutrients for most people.

### 8. Kvíz

**Otázka:** Studie Martineau et al. (2017) ukázala, že vitamín D3 snižuje riziko respiračních infekcí u lidí s deficitem. O kolik procent?

- **✅ O 19 %**
  Přesně. Další studie ukazují zlepšení síly, nálady a hormonů. Dávka 1 000–2 000 IU je bezpečná a dostatečná pro většinu dospělých.
- ❌ O 90 % — vitamín D je zázračný lék
  19 % je významné, ale ne zázračné. Vitamín D není všelék — je jedním z mnoha faktorů imunity.
- ❌ O 0 % — suplementace nefunguje
  Studie jasně prokázala benefit u lidí s deficitem. U lidí bez deficitu je efekt menší.

#### EN

**Question:** Martineau et al. (2017) showed that vitamin D3 reduces the risk of respiratory infections in deficient people. By how much?

- **✅ By 19 %**
  Exactly. Other studies show improvements in strength, mood, and hormones. A dose of 1,000–2,000 IU is safe and sufficient for most adults.
- ❌ By 90 % — vitamin D is a miracle cure
  19 % is significant but not miraculous. Vitamin D isn't a cure-all — it's one of many factors in immunity.
- ❌ By 0 % — supplementation doesn't work
  The study clearly proved a benefit in deficient people. In non-deficient people, the effect is smaller.

### 9. Kvíz

**Otázka:** Představ si, že na jaře ti naměří vitamín D na 45 nmol/L. Chodíš 4x týdně do fitka a chceš optimální výkon. Co uděláš?

- **✅ Suplementovat 1 000–2 000 IU D3 denně po dobu zimy a jara, na podzim kontrola**
  Přesně. Pro optimální výkon a imunitu chceš 75+ nmol/L. Jen strava nestačí — potřebuješ cílenou suplementaci.
- ❌ Opálit se na soláriu
  Solárium je rizikové (rakovina kůže) a UVB dávka nespolehlivá. Suplementace je bezpečnější.
- ❌ Jíst 5x týdně losos
  Losos má ~500 IU na 100 g — abys doplnil/a potřebu, musel/a bys jíst abnormálně moc ryb. Suplementace je praktičtější.

#### EN

**Question:** Imagine your spring blood test shows vitamin D at 45 nmol/L. You train 4 times a week and want optimal performance. What do you do?

- **✅ Supplement 1,000–2,000 IU of D3 daily through winter and spring, with a check in the fall**
  Exactly. For optimal performance and immunity you want 75+ nmol/L. Diet alone won't cut it — you need targeted supplementation.
- ❌ Hit the tanning bed
  Tanning beds are risky (skin cancer) and the UVB dose is unreliable. Supplementation is safer.
- ❌ Eat salmon 5 times a week
  Salmon has ~500 IU per 100 g — you'd have to eat an absurd amount of fish to cover the need. Supplementation is more practical.
"""

# Continue with remaining 10 files...
# Due to the massive size, I'll write a second script for the rest.

def process_file(filepath, new_lekce):
    with open(filepath, 'r') as f:
        content = f.read()

    parts = content.split('\n# Lekce\n', 1)
    if len(parts) != 2:
        print(f"ERROR: Could not split {filepath}")
        return False

    new_content = parts[0] + '\n' + new_lekce.strip() + '\n'

    with open(filepath, 'w') as f:
        f.write(new_content)

    print(f"OK: {filepath}")
    return True

for filepath, content in files.items():
    process_file(filepath, content)

print(f"\nProcessed {len(files)} files")
