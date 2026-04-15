---
id: cb-b22
type: model
slug: base-rate-neglect
category: probability_biases
difficulty: 2
icon: BarChart3
related:
  - cb-b21
  - cb-b50
---

# Zanedbání základní míry
*EN: Base Rate Neglect*

## Krátký popis

Tendence ignorovat obecnou statistickou pravděpodobnost (základní míru) a místo toho se soustředit na konkrétní informace o daném případu.

### EN

The tendency to ignore general statistical probability (the base rate) and focus instead on specific information about the individual case.

## Plné vysvětlení

Když hodnotíme pravděpodobnost, často přehlížíme základní statistiku a zaměřujeme se na živé, konkrétní detaily. Kahneman a Tversky ukázali, že lidé systematicky ignorují „base rate" — tedy jak častý je jev v populaci — když dostanou poutavý příběh nebo popis. Místo racionálního propočtu se necháme unést tím, jak dobře příběh „sedí" na naši představu.

### EN

When judging probability, we often overlook the underlying statistics and focus on vivid, specific details. Kahneman and Tversky showed that people systematically ignore the "base rate" — how common something is in the population — when they're given a compelling story or description. Instead of reasoning things through, we get swept up in how well the story "fits" our mental image.

## Příklad ze života

Lékař ti řekne, že test na vzácnou nemoc vyšel pozitivní. Než začneš panikařit, je důležité vědět, že nemoc má jen 1 z 10 000 lidí a test má 5% falešnou pozitivitu. Ve skutečnosti je šance, že jsi nemocný, stále velmi nízká — ale většina lidí základní míru výskytu úplně přehlédne.

### EN

A doctor tells you a test for a rare disease came back positive. Before you panic, it's important to know that only 1 in 10,000 people have the disease and the test has a 5% false-positive rate. In reality your chance of being sick is still very low — but most people completely overlook the base rate.

## Časté chyby

Častou chybou je ztotožňovat přesnost testu s pravděpodobností výsledku. I velmi přesný test může dávat většinu falešně pozitivních výsledků, pokud je testovaná vlastnost vzácná.

### EN

A common mistake is to equate the test's accuracy with the probability of the result. Even a very accurate test can produce mostly false positives if the thing being tested for is rare.

---

# Lekce

## Lekce 1 — Úvod
*id: `cb-l-b22a` · typ: intro · xp: 10*

### 1. Úvod lekce

# Zanedbání základní míry
*ikona: Target*

V této lekci pochopíš, proč mozek systematicky **ignoruje základní statistiku** a místo toho se chytí dramatického příběhu. Projdeme slavný medicínský paradox, který mate i lékaře — a naučíš se klást správnou otázku dřív, než přijmeš jakýkoli závěr.

#### EN

# Base Rate Neglect
*icon: Target*

In this lesson you'll understand why the brain systematically **ignores base statistics** and latches onto a vivid story instead. We'll walk through a famous medical paradox that trips up even doctors — and you'll learn to ask the right question before accepting any conclusion.

### 2. Text

Představ si, že ti lékař sdělí: test na vzácnou nemoc ukázal pozitivní výsledek. Test má 99% přesnost. Máš pocit, že jsi téměř jistě nemocný.

#### EN

Imagine your doctor tells you: a test for a rare disease came back positive. The test is 99% accurate. You feel almost certain you're sick.

### 3. Kvíz

**Otázka:** Jaká je SKUTEČNÁ pravděpodobnost, že pacient je nemocný? Nemoc postihuje 1 z 10 000 lidí. Test má 99% senzitivitu (správně zachytí nemocné) a 1% falešně pozitivních (zdravé označí jako nemocné).

- **✅ Asi 1 % — falešně pozitivní výsledky u zdravých lidí zcela přečíslují skutečně nemocné v populaci**
  Správně! Z 10 000 lidí bude 1 skutečně nemocný (test ho zachytí) a asi 100 zdravých bude falešně pozitivních. Takže pozitivní test znamená šanci asi 1 ze 101, tedy necelé 1 %!
- ❌ 99 % — test s 99% senzitivitou přenáší svou přesnost přímo na pravděpodobnost diagnózy
  To je přesně ta past! 99% přesnost neznamená 99% šanci na nemoc. Musíš zohlednit, jak vzácná nemoc je. U vzácných nemocí většina pozitivních testů jsou falešné poplachy.
- ❌ 50 % — bez zohlednění individuálních rizikových faktorů pacienta je výsledek symetricky neurčitý
  Další informace máme — víme, jak vzácná nemoc je. A právě to dramaticky mění výsledek. Skutečná šance je pod 1 %.

#### EN

**Question:** What is the REAL probability that the patient is sick? The disease affects 1 in 10,000 people. The test has 99% sensitivity (correctly identifies sick people) and a 1% false-positive rate (flags healthy people as sick).

- **✅ About 1% — false positives among healthy people vastly outnumber the truly sick in the population**
  Correct! Out of 10,000 people, 1 is actually sick (the test catches them) and about 100 healthy people will test positive. So a positive test means a roughly 1-in-101 chance, just under 1%!
- ❌ 99% — a test with 99% sensitivity transfers its accuracy directly to the probability of a diagnosis
  That's exactly the trap! 99% accuracy doesn't mean a 99% chance of being sick. You have to factor in how rare the disease is. For rare diseases, most positive tests are false alarms.
- ❌ 50% — without factoring in individual patient risk factors the outcome is symmetrically indeterminate
  We do have more info — we know how rare the disease is. And that dramatically changes the result. The real chance is under 1%.

### 4. Text

Tomuto zkreslení se říká Opomíjení základní míry (Base Rate Neglect). Mozek ignoruje „základní míru" — jak běžná nebo vzácná věc je — a místo toho se chytí konkrétní, dramatické informace (99% přesnost testu).

#### EN

This bias is called Base Rate Neglect. The brain ignores the "base rate" — how common or rare something is — and latches on to specific, dramatic information instead (the test's 99% accuracy).

### 5. Klíčový poznatek

Přesnost testu NENÍ totéž co pravděpodobnost, že máš nemoc. Vždy se ptej: „Jak běžná je ta věc, kterou testuji?" Základní míra (prevalence) je klíčová informace, kterou mozek rád ignoruje.

#### EN

A test's accuracy is NOT the same as the probability that you have the disease. Always ask: "How common is the thing I'm testing for?" The base rate (prevalence) is the key piece of information the brain loves to ignore.

## Lekce 2 — Scénář
*id: `cb-l-b22b` · typ: scenario · xp: 15*

### 1. Text

Viktor čte v novinách: „Podezřelý odpovídá profilu sériového vraha — introvert, žije sám, sbírá nože." Viktor si říká: „Jasně, to je ten vrah!"

#### EN

Viktor reads in the paper: "The suspect fits the profile of a serial killer — introvert, lives alone, collects knives." Viktor thinks: "Obviously, that's the killer!"

### 2. Scénář

**Situace:** V Česku je asi 10 milionů lidí. Sériových vrahů je možná 2-3. Ale introvertů, kteří žijí sami a mají neobvyklé koníčky, jsou desítky tisíc.

**Otázka:** Proč je Viktorův úsudek chybný?

- **✅ Ignoruje základní míru — lidí pasujících na tento popis je v populaci tisíckrát víc než sériových vrahů**
  Přesně! „Odpovídá profilu" zní děsivě, ale profilu odpovídají tisíce nevinných lidí. Bez zohlednění základní míry je profil téměř bezcenný.
- ❌ Kriminalistické profily prošly vědeckou validací a vykazují vysokou prediktivní přesnost v identifikaci pachatelů
  I kdyby profil byl přesný, problém zůstává: lidí odpovídajících profilu je obrovské množství, zatímco skutečných vrahů je minimum.
- ❌ Viktor správně identifikuje reprezentativní shodu — profil je legitimní diagnostický nástroj pro první fázi vyšetřování
  Čekání na důkazy je správné, ale profil bez základní míry je zavádějící, ne „dobrý začátek". Je to stejná chyba jako u testu na vzácnou nemoc.

#### EN

**Situation:** The Czech Republic has about 10 million people. There might be 2–3 serial killers. But there are tens of thousands of introverts who live alone and have unusual hobbies.

**Question:** Why is Viktor's judgment wrong?

- **✅ He ignores the base rate — people matching this description outnumber serial killers in the population by thousands to one**
  Exactly! "Fits the profile" sounds scary, but thousands of innocent people fit the profile. Without the base rate, the profile is almost worthless.
- ❌ Forensic profiles have undergone scientific validation and show high predictive accuracy for identifying perpetrators
  Even if the profile were accurate, the problem remains: huge numbers of people match the profile while actual killers are a tiny minority.
- ❌ Viktor correctly identifies a representational match — a profile is a legitimate diagnostic tool for the initial phase of an investigation
  Waiting for evidence is right, but a profile without a base rate is misleading, not a "good start." It's the same mistake as with the rare-disease test.

### 3. Text

Proč mozek ignoruje základní míry? Protože příběhy jsou silnější než čísla. „Introvert sbírající nože" je živý příběh. „1 z 10 milionů" je abstraktní číslo. Systém 1 miluje příběhy a ignoruje statistiku.

#### EN

Why does the brain ignore base rates? Because stories are more powerful than numbers. "A knife-collecting introvert" is a vivid story. "1 in 10 million" is an abstract number. System 1 loves stories and ignores statistics.

### 4. Scénář

**Situace:** Kamarádka říká: „Sousedka vyhrála v loterii! Měla bych taky zkusit — lidi kolem mě vyhrávají!"

**Otázka:** Jaké zkreslení tu působí?

- **✅ Opomíjení základní míry — výhry sousedky zachytí pozornost, zatímco miliony nezdokumentovaných proher zůstávají neviditelné**
  O výhrách se píše v novinách. O milionech proher ne. Mozek tak přeceňuje pravděpodobnost výhry, protože ignoruje základní míru (šance 1 : miliony).
- ❌ Hráčský klam — sousedčina výhra signalizuje lokální štěstí, takže kamarádka soudí, že je „na řadě" v rámci svého okolí
  Hráčský klam je o „vyrovnávání". Tady jde o něco jiného — přeceňuje pravděpodobnost výhry, protože slyšela o jedné konkrétní výhře.
- ❌ Nemá žádné zkreslení — empirická observace výhry v blízkém okolí je racionální vstup pro přehodnocení osobního rozhodnutí
  Její uvažování „lidi kolem mě vyhrávají" je klasické opomíjení základní míry. Jeden případ jí zkreslil vnímání pravděpodobnosti.

#### EN

**Situation:** A friend says: "My neighbor won the lottery! I should try too — people around me are winning!"

**Question:** Which bias is at play here?

- **✅ Base rate neglect — wins in her neighbourhood capture attention while millions of undocumented losses stay invisible**
  Wins make the news. Millions of losses don't. So the brain overestimates the chance of winning because it ignores the base rate (odds of 1 in millions).
- ❌ Gambler's fallacy — the neighbour's win signals a local luck cluster, so she reasons she is now "due" within her social circle
  The gambler's fallacy is about "evening out." This is different — she's overestimating the odds of winning because she heard about one specific win.
- ❌ There's no bias — an empirical observation of a win in her immediate environment is a rational input for re-evaluating her personal decision
  Her reasoning "people around me are winning" is classic base rate neglect. One case skewed her perception of probability.

### 5. Klíčový poznatek

Když slyšíš konkrétní příběh, vždy se ptej: „Jak časté je to CELKOVĚ?" Jeden případ je anekdota, ne statistika. Základní míra je nudná, ale nezbytná pro správný úsudek.

#### EN

When you hear a specific story, always ask: "How common is this OVERALL?" One case is an anecdote, not a statistic. The base rate is boring but essential for sound judgment.

## Lekce 3 — Aplikace
*id: `cb-l-b22c` · typ: application · xp: 20*

### 1. Text

Opomíjení základní míry ovlivňuje i profesionály. Studie ukázaly, že i lékaři často špatně interpretují výsledky testů, protože ignorují prevalenci nemoci. A právníci přeceňují důkazní sílu „profilů" podezřelých.

#### EN

Base rate neglect affects professionals too. Studies have shown that even doctors often misinterpret test results because they ignore the disease's prevalence. And lawyers overrate the evidentiary strength of suspect "profiles."

### 2. Kvíz

**Otázka:** Bezpečnostní systém na letišti správně detekuje 95 % teroristů a má 3 % falešně pozitivních. Na letišti projde denně 100 000 lidí a teroristů je v průměru 0. Kolik falešných poplachů denně systém vyrobí?

- **✅ 3 000 falešných poplachů denně — a při nulové základní míře teroristů je prakticky každý z nich plané varování**
  3 % z 100 000 = 3 000 nevinných lidí zastavených denně. A protože teroristů je téměř nula, prakticky KAŽDÝ poplach je falešný. To je cena ignorování základní míry při designu systémů.
- ❌ Přibližně 95 zachycených hrozeb — systém s 95% senzitivitou detekuje 95 z každých 100 procházejících teroristů
  Zaměňuješ senzitivitu (zachycení skutečných hrozeb) s celkovým počtem poplachů. 3 % falešně pozitivních z 100 000 lidí je 3 000 poplachů.
- ❌ Záleží na aktuálním stupni hrozby a intenzitě provozu, protože algoritmická citlivost systému se dynamicky přizpůsobuje
  Matematika je jasná: 3 % ze 100 000 = 3 000. Základní míra (téměř nulový počet teroristů) znamená, že systém vytváří tisíce zbytečných poplachů.

#### EN

**Question:** An airport security system correctly detects 95% of terrorists and has a 3% false-positive rate. 100,000 people pass through the airport every day and the average number of terrorists is 0. How many false alarms does the system generate per day?

- **✅ 3,000 false alarms per day — and with a near-zero base rate of terrorists, practically every single one is a false flag**
  3% of 100,000 = 3,000 innocent people stopped every day. And since the number of terrorists is nearly zero, essentially EVERY alarm is false. That's the price of ignoring base rates when designing systems.
- ❌ About 95 detected threats — a system with 95% sensitivity detects 95 out of every 100 terrorists passing through
  You're confusing sensitivity (catching real threats) with the total number of alarms. 3% false positives out of 100,000 people is 3,000 alarms.
- ❌ It depends on the current threat level and traffic volume, since the system's algorithmic sensitivity adjusts dynamically
  The math is clear: 3% of 100,000 = 3,000. The base rate (nearly zero terrorists) means the system produces thousands of pointless alarms.

### 3. Scénář

**Situace:** Filip zvažuje podnikání. Přečetl si příběhy úspěšných podnikatelů — Elona Muska, Tomáše Bati. Říká si: „Když oni to dokázali, můžu i já!"

**Otázka:** Jakou základní míru Filip ignoruje?

- **✅ Základní míra selhání podniků — drtivá většina startupů zkrachuje a příběhy Muska nebo Bati jsou statistické odlehlé výjimky**
  Asi 90 % startupů selže v prvních 5 letech. Filip vidí Muska a Baťu, ale nevidí miliony těch, kteří zkrachovali. Příběhy přeživších zkreslují jeho vnímání šancí.
- ❌ Filipovi chybí tzv. podnikatelský kapitálový index — kombinace zkušeností, sítě a rizikové tolerance, kterou Musk nebo Baťa měli od počátku
  Zkušenosti jsou relevantní, ale hlavní chyba je jinde — Filip přeceňuje pravděpodobnost úspěchu, protože ignoruje základní míru selhání.
- ❌ Filip nepodléhá žádnému zkreslení — modelování úspěšných vzorů je ověřená metoda motivační kognice, která zvyšuje podnikatelský výkon
  Motivace je fajn, ale plánování založené na výjimkách místo na základních mírách je recept na zklamání.

#### EN

**Situation:** Filip is thinking about starting a business. He's been reading stories of successful entrepreneurs — Elon Musk, Tomáš Baťa. He tells himself: "If they did it, so can I!"

**Question:** Which base rate is Filip ignoring?

- **✅ The base rate of business failure — the vast majority of startups collapse, and Musk or Baťa are statistical outliers, not the norm**
  About 90% of startups fail in the first 5 years. Filip sees Musk and Baťa but doesn't see the millions who went bust. Survivor stories distort his sense of the odds.
- ❌ Filip lacks the entrepreneurial capital index — the combination of experience, network, and risk tolerance that Musk or Baťa had from the start
  Experience matters, but the main error is elsewhere — Filip is overestimating success probability because he's ignoring the base rate of failure.
- ❌ Filip isn't ignoring anything — modelling successful patterns is a validated method of motivational cognition that boosts entrepreneurial performance
  Motivation is fine, but planning based on exceptions instead of base rates is a recipe for disappointment.

### 4. Klíčový poznatek

Praktický debiasing: Před jakýmkoli rozhodnutím si polož otázku „Jaká je základní míra?" Kolik lidí v mé situaci uspěje/selže/onemocní? Teprve potom zvažuj konkrétní příběhy a detaily.

#### EN

Practical debiasing: before any decision, ask "What's the base rate?" How many people in my situation succeed / fail / get sick? Only then should you weigh specific stories and details.
