---
id: cb-b53
type: model
slug: insensitivity-to-sample-size
category: probability_biases
difficulty: 3
icon: Database
related:
  - cb-b23
  - cb-b52
---

# Necitlivost k velikosti vzorku
*EN: Insensitivity to Sample Size*

## Krátký popis

Tendence činit silné závěry z malých vzorků dat, aniž bychom zohlednili, že malé vzorky jsou přirozeně méně spolehlivé.

### EN

The tendency to draw strong conclusions from small samples without considering that small samples are naturally less reliable.

## Plné vysvětlení

Lidé intuitivně nechápou, že malé vzorky mají mnohem větší variabilitu než velké. Recenze se 4,9 hvězdami od 5 hodnotitelů nám přijde přesvědčivější než 4,5 od 500 hodnotitelů — přitom ten druhý údaj je mnohem spolehlivější. Náš mozek nerozlišuje mezi „5 lidí říká" a „5 000 lidí říká", protože se soustředíme na obsah informace, ne na její statistickou sílu.

### EN

People don't intuitively grasp that small samples vary much more than large ones. A 4.9-star rating from 5 reviewers feels more convincing than 4.5 from 500 reviewers — yet the second number is far more reliable. Our brain doesn't distinguish between "5 people say" and "5,000 people say," because we focus on the content of the information, not its statistical weight.

## Příklad ze života

Kamarád ti doporučí zubaře se slovy „všichni tři lidi, co tam byli, byli spokojení". Jiný zubař má 4,3 z 200 recenzí. První zní lépe, ale tři spokojení pacienti nemají skoro žádnou vypovídací hodnotu — ten druhý je statisticky mnohem spolehlivější volba.

### EN

A friend recommends a dentist saying "all three people who went there were happy." Another dentist has 4.3 out of 200 reviews. The first one sounds better, but three happy patients carry almost no information — the second is statistically a far more reliable choice.

## Časté chyby

Lidé ztotožňují „100 % spokojených" s kvalitou, aniž by se podívali na velikost vzorku. V malých vzorcích jsou extrémní výsledky (ať pozitivní, nebo negativní) mnohem běžnější než ve velkých.

### EN

People equate "100% satisfied" with quality without looking at sample size. In small samples, extreme results (positive or negative) are far more common than in large ones.

---

# Lekce

## Lekce 1 — Úvod
*id: `cb-l-b53a` · typ: intro · xp: 10*

### 1. Úvod lekce

# Necitlivost k velikosti vzorku
*ikona: Target*

V této lekci pochopíš, proč mozek **zachází s malými i velkými vzorky dat stejně** — přestože jejich spolehlivost je dramaticky odlišná. Naučíš se klíčovou otázku, která ochrání tvá rozhodnutí před chybami z nedostatku dat.

#### EN

# Insensitivity to Sample Size
*icon: Target*

In this lesson you'll understand why the brain **treats small and large samples of data the same way** — even though their reliability is dramatically different. You'll learn the key question that protects your decisions from errors caused by too little data.

### 2. Text

Představ si, že si vybíráš pekárnu online. Jedna má 5 recenzí — samé pětky. Druhá má 500 recenzí s průměrem 4,7. Která je spolehlivější volba?

#### EN

Imagine you're choosing a bakery online. One has 5 reviews — all five stars. The other has 500 reviews averaging 4.7. Which is the more reliable choice?

### 3. Scénář

**Situace:** Pavlin přítel jí namítne: „Ale 5 recenzí je málo. Mohli je napsat majitelovi kamarádi. 500 recenzí je mnohem spolehlivější vzorek."

**Otázka:** Která pekárna je spolehlivější volba?

- **✅ „Krajíc" se 4,7 ze 500 recenzí — větší vzorek dramaticky snižuje náhodnou variabilitu a dělá z hodnocení spolehlivý signál**
  Správně! 5 recenzí může být cokoli — kamarádi majitele, jeden šťastný den, náhoda. 500 recenzí s průměrem 4,7 je statisticky robustní hodnocení.
- ❌ „U Novotných" — dokonalé skóre 5,0 odráží konzistentní excelenci, neboť každý z pěti nezávislých hodnotitelů přidělil maximální hodnocení bez výjimky
  To je přesně ta past! Ignoruješ velikost vzorku. 5,0 z 5 recenzí je téměř bezvýznamné — malý vzorek může ukázat cokoli.
- ❌ Porovnání není možné bez normalizace na kategorii, lokalitu a cenový segment — jinak srovnáváme vzorky ze dvou odlišných trhů
  Porovnat můžeme, ale musíme zohlednit velikost vzorku. 500 recenzí s 4,7 je mnohem spolehlivější signál než 5 recenzí s 5,0.

#### EN

**Situation:** Pavla's boyfriend pushes back: "But 5 reviews is nothing. They could have been written by the owner's friends. 500 reviews is a much more reliable sample."

**Question:** Which bakery is the more reliable choice?

- **✅ "Krajíc" with 4.7 from 500 reviews — the larger sample dramatically reduces random variability and makes the rating a reliable signal**
  Correct! 5 reviews can be anything — the owner's friends, one lucky day, chance. 500 reviews averaging 4.7 is a statistically robust rating.
- ❌ "U Novotných" — a perfect 5.0 score reflects consistent excellence, since every one of the five independent reviewers assigned the maximum rating without exception
  That's exactly the trap! You're ignoring sample size. 5.0 out of 5 reviews is nearly meaningless — a small sample can show anything.
- ❌ Comparison isn't possible without normalising for category, location, and price segment — otherwise we're comparing samples from two different markets
  We can compare, but we have to account for sample size. 500 reviews at 4.7 is a much more reliable signal than 5 reviews at 5.0.

### 4. Text

Necitlivost na velikost vzorku (Insensitivity to Sample Size) je tendence posuzovat data bez ohledu na to, z kolika pozorování pocházejí. Mozek zachází s průměrem z 5 dat stejně jako s průměrem z 5 000 dat — ale spolehlivost je dramaticky odlišná.

#### EN

Insensitivity to Sample Size is the tendency to judge data without considering how many observations it's based on. The brain treats an average of 5 data points the same as an average of 5,000 — but the reliability is dramatically different.

### 5. Klíčový poznatek

Pravidlo: Čím menší vzorek, tím extrémnější výsledky (oběma směry). Pět recenzí může být 5,0 nebo 1,0 — obojí je nespolehlivé. Vždy se ptej: „Z kolika dat tento závěr vychází?"

#### EN

Rule: the smaller the sample, the more extreme the results (in both directions). Five reviews can be 5.0 or 1.0 — both are unreliable. Always ask: "How many data points is this conclusion based on?"

## Lekce 2 — Scénář
*id: `cb-l-b53b` · typ: scenario · xp: 15*

### 1. Text

Manažerka Alena testuje dva nové prodejní přístupy. Tým A (3 lidé) zvýšil prodeje o 50 %. Tým B (30 lidí) zvýšil prodeje o 15 %. Alena chce zavést přístup týmu A pro celou firmu.

#### EN

Manager Alena is testing two new sales approaches. Team A (3 people) boosted sales by 50%. Team B (30 people) boosted sales by 15%. Alena wants to roll out Team A's approach across the whole company.

### 2. Scénář

**Situace:** Analytik ji upozorní: „Tým A měl jen 3 lidi. Jeden výjimečný prodejce mohl celý výsledek zkreslit. 50% nárůst z tak malého vzorku je statisticky nespolehlivý."

**Otázka:** Má analytik pravdu?

- **✅ Ano — tři lidé nejsou dostatečný vzorek pro spolehlivý závěr, výsledek mohl zkreslovat jeden výjimečný prodejce v týmu**
  Správně! Jeden skvělý prodejce v týmu A mohl vytvořit iluzi, že přístup funguje. 30 lidí v týmu B je mnohem spolehlivější vzorek.
- ❌ Ne — 50% nárůst je statisticky signifikantní i v malém vzorku, pokud je interní variabilita týmu nízká a všichni tři dosáhli podobných výsledků
  Ignoruješ velikost vzorku! 50 % ze 3 lidí je statisticky nevypovídající. Mohl to být jeden výjimečný člověk, ne účinný přístup.
- ❌ Měli by replikovat test se stejnými týmy, protože opakování na identickém vzorku eliminuje vliv výběrové chyby a potvrdí robustnost výsledku
  Opakování je dobrý nápad, ale s větším vzorkem — ne opět se 3 lidmi. Replikace malého vzorku nepřinese lepší data.

#### EN

**Situation:** An analyst warns her: "Team A had only 3 people. One exceptional salesperson could have skewed the whole result. A 50% jump from such a small sample is statistically unreliable."

**Question:** Is the analyst right?

- **✅ Yes — three people are not a sufficient sample for a reliable conclusion; one exceptional salesperson on the team could have skewed the entire result**
  Correct! One great salesperson on Team A could have created the illusion that the approach works. 30 people on Team B is a much more reliable sample.
- ❌ No — a 50% increase is statistically significant even in a small sample when the team's internal variability is low and all three achieved similar results
  You're ignoring sample size! 50% from 3 people is statistically meaningless. It could be one exceptional person, not an effective approach.
- ❌ They should replicate the test with the same teams, since repeating on an identical sample eliminates selection error and confirms the result's robustness
  A rerun is a good idea, but with a bigger sample — not another 3 people. Replicating a small sample won't produce better data.

### 3. Text

Klasický příklad: Kahneman zjistil, že nemocnice, kde se nejvíc rodí chlapečci, jsou malé nemocnice. A nemocnice, kde se nejvíc rodí holčičky? Taky malé nemocnice! Malé vzorky prostě produkují extrémnější výsledky — neříkají nic o realitě.

#### EN

A classic example: Kahneman found that the hospitals with the highest share of boys born are small hospitals. And the hospitals with the highest share of girls born? Also small hospitals! Small samples simply produce more extreme outcomes — they don't tell you anything about reality.

### 4. Scénář

**Situace:** Tvůj kamarád říká: „Znám tři lidi, kteří po covidu dostali očkování a onemocněli. Očkování nefunguje!"

**Otázka:** Jaké zkreslení tu působí?

- **✅ Necitlivost na velikost vzorku — tři osobní příběhy z milionů očkovaných jsou statisticky bezvýznamné a nemohou nic říkat o účinnosti vakcíny**
  Přesně! 3 příběhy z milionů očkovaných jsou statisticky bezvýznamné. Mozek ale zachází s osobní zkušeností 3 lidí stejně jako s klinickou studií s tisíci účastníky.
- ❌ Kamarád nepodléhá žádnému zkreslení — empirická observace tří onemocnění u očkovaných osob je validní primární data, která mohou iniciovat hypotézu
  Reportuje anekdoty, ne fakta. Fakt by byl: „Z milionů očkovaných měla X % vedlejší účinky." Tři příběhy jsou nespolehlivý vzorek.
- ❌ Jde o konfirmační zkreslení — kamarád selektivně shromažďuje negativní anekdoty a ignoruje pozitivní zkušenosti z okolí, čímž zkresluje svůj vzorek
  Konfirmační zkreslení může hrát roli, ale hlavní chyba je v tom, že 3 případy považuje za důkaz — to je necitlivost na velikost vzorku.

#### EN

**Situation:** Your friend says: "I know three people who got vaccinated against COVID and got sick. The vaccine doesn't work!"

**Question:** Which bias is at play here?

- **✅ Insensitivity to sample size — three personal stories out of millions vaccinated are statistically meaningless and cannot say anything about vaccine effectiveness**
  Exactly! 3 stories out of millions of vaccinated people are statistically meaningless. But the brain treats the personal experience of 3 people the same as a clinical trial with thousands of participants.
- ❌ No bias — empirical observation of three illness cases among vaccinated individuals is valid primary data that can legitimately initiate a hypothesis
  He's reporting anecdotes, not facts. A fact would be: "Out of millions vaccinated, X% had side effects." Three stories are an unreliable sample.
- ❌ This is confirmation bias — he selectively collects negative anecdotes and ignores positive experiences around him, thereby skewing his personal sample
  Confirmation bias may play a part, but the main error is taking 3 cases as proof — that's insensitivity to sample size.

### 5. Klíčový poznatek

Osobní zkušenost = malý vzorek. „Znám tři lidi, kteří..." není argument — je to anekdota. Pro spolehlivé závěry potřebuješ velký, reprezentativní vzorek. Vždy se ptej: „Z kolika případů to vychází?"

#### EN

Personal experience = a small sample. "I know three people who..." isn't an argument — it's an anecdote. For reliable conclusions you need a big, representative sample. Always ask: "How many cases is this based on?"
