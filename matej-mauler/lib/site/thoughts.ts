import type { Bi } from "@/lib/about";

/**
 * Krátké myšlenky — „desatero" věcí, na které Matěj v životě přišel.
 * České texty jsou převzaté 1:1 ze žiju.life (scripts/migrate-principles.ts);
 * anglické verze jsou překlad, ne originál — při úpravách měň obě.
 */
export type Thought = {
  id: string;
  title: Bi;
  lead: Bi;
  body: Bi[];
};

export const THOUGHTS: Thought[] = [
  {
    id: "skola",
    title: { cs: "Co se ve škole neučí?", en: "What school doesn't teach you" },
    lead: {
      cs: "Ve škole tě připravovali na testy, ne na hru jménem život. Neučili tě, jak zacházet s penězi, emocemi, vlastní energií ani vztahy.",
      en: "School prepared you for tests, not for the game called life. Nobody taught you how to handle money, emotions, your own energy or relationships.",
    },
    body: [
      {
        cs: "Většinu důležitých dovedností se učíš až za pochodu — v práci, ve vztazích, v krizi. Je to náročné, ale má to jednu výhodu: můžeš si nastavit vlastní pravidla hry.",
        en: "You learn most of the important skills on the move — at work, in relationships, in a crisis. It's hard, but it has one upside: you get to set your own rules.",
      },
      {
        cs: "Čím dřív přijmeš, že „školní hru\" máš za sebou a teď hraješ tu vlastní, tím snáz si dovolíš hledat lepší systém pro sebe — ne pro vysvědčení.",
        en: "The sooner you accept that the school game is over and you're playing your own, the easier it is to build a better system for yourself — not for a report card.",
      },
    ],
  },
  {
    id: "zodpovednost",
    title: { cs: "Za svůj život jsi zodpovědný pouze ty sám.", en: "You alone are responsible for your life." },
    lead: {
      cs: "Nikdo jiný nemůže žít tvůj život za tebe. V určitém bodě si prostě musíš říct: „Je to na mně.\"",
      en: "Nobody else can live your life for you. At some point you simply have to say: it's on me.",
    },
    body: [
      {
        cs: "Můžeš mít podporu, kouče, partnera, komunitu. Ale rozhodnutí, která děláš každé ráno, večer i mezi tím, za tebe nikdo neudělá.",
        en: "You can have support, a coach, a partner, a community. But the decisions you make every morning, every evening and in between — nobody makes those for you.",
      },
      {
        cs: "To není tlak, ale svoboda. Jakmile to přijmeš, můžeš s vlastním životem mnohem víc experimentovat.",
        en: "That's not pressure, it's freedom. Once you accept it, you can experiment with your own life far more.",
      },
    ],
  },
  {
    id: "cernobile",
    title: { cs: "Skoro nic není pouze černobílé.", en: "Almost nothing is only black and white." },
    lead: {
      cs: "Život se nedá žít jen v režimu ano/ne. Mezi tím je obrovský prostor, kde si můžeš nastavit vlastní pravidla.",
      en: "Life can't be lived in yes/no mode. In between there's a huge space where you get to set your own rules.",
    },
    body: [
      {
        cs: "Buď práce, nebo svoboda. Buď rodina, nebo kariéra. Buď stabilita, nebo zážitky. Tenhle způsob přemýšlení tě zbytečně zamyká.",
        en: "Either work or freedom. Either family or career. Either stability or adventure. This way of thinking locks you in for no reason.",
      },
      {
        cs: "Mezi černou a bílou je spousta odstínů. A právě tam si můžeš začít skládat život podle sebe — ne podle škatulek ostatních.",
        en: "Between black and white there are plenty of shades. That's exactly where you can start assembling a life of your own — not one built from other people's boxes.",
      },
    ],
  },
  {
    id: "smysl",
    title: { cs: "Svůj životní smysl tvoříš každodenními kroky.", en: "You build your purpose with everyday steps." },
    lead: {
      cs: "Smysl nepřijde shora jako jeden velký „aha moment\". Vzniká z malých voleb, které děláš dnes a zítra.",
      en: "Purpose doesn't arrive from above as one big aha moment. It grows out of the small choices you make today and tomorrow.",
    },
    body: [
      {
        cs: "Často čekáme na jeden zlomový okamžik, který nám „vysvětlí život\". V praxi smysl vzniká z drobných rozhodnutí — čemu říkáš ano, čemu ne, kam dáváš energii.",
        en: "We tend to wait for the one turning point that will explain life to us. In practice, purpose comes from small decisions — what you say yes to, what you refuse, where your energy goes.",
      },
      {
        cs: "Můžeš začít maličkostmi: jedním projektem, jedním návykem, jedním rozhovorem, který už dlouho odkládáš.",
        en: "You can start small: one project, one habit, one conversation you've been putting off for ages.",
      },
    ],
  },
  {
    id: "sebevedomi",
    title: { cs: "Sebevědomí si vybuduješ děláním těžkých věcí.", en: "Confidence is built by doing hard things." },
    lead: {
      cs: "Sebevědomí není afirmace v zrcadle, ale důkaz. Přichází, když děláš kroky, do kterých se ti nechce — a ustojíš je.",
      en: "Confidence isn't an affirmation in the mirror, it's evidence. It shows up when you take the steps you don't feel like taking — and hold your ground.",
    },
    body: [
      {
        cs: "Můžeš si opakovat, že na to máš. Ale dokud si to neověříš v reálném světě, hlava tomu stejně úplně nevěří.",
        en: "You can keep telling yourself you've got this. But until you test it in the real world, your head doesn't quite buy it.",
      },
      {
        cs: "Každý malý „těžký krok\" — nepříjemný hovor, odmítnutí, nový projekt — je malý důkaz pro sebevědomí: „Zvládl jsem to. Dám i další věc.\"",
        en: "Every small hard step — an awkward call, a rejection, a new project — is a small piece of evidence: I handled that. I can handle the next one too.",
      },
    ],
  },
  {
    id: "hotove",
    title: { cs: "Hotové je lepší než dokonalé.", en: "Done beats perfect." },
    lead: {
      cs: "Perfekcionismus je chytře maskovaný strach. Dokončené věci mění život — ne ty rozdělané.",
      en: "Perfectionism is fear in a clever disguise. Finished things change your life — unfinished ones don't.",
    },
    body: [
      {
        cs: "Můžeš měsíce ladit detaily projektu nebo newsletteru — ale dokud to nepublikuješ, realita ti nedá žádnou zpětnou vazbu. Zůstaneš v bezpečí vlastní hlavy.",
        en: "You can polish a project or a newsletter for months — but until you publish, reality gives you no feedback at all. You stay safe inside your own head.",
      },
      {
        cs: "Když začneš cílit na „dost dobré na odeslání\" místo dokonalosti, posuneš se násobně rychleji. Učíš se z reálných reakcí, ne z hypotetických scénářů.",
        en: "Aim for good enough to ship instead of perfect and you move several times faster. You learn from real reactions, not hypothetical ones.",
      },
    ],
  },
  {
    id: "intuice",
    title: { cs: "Intuice pracuje ve tvůj prospěch.", en: "Your intuition is working for you." },
    lead: {
      cs: "Intuice není magie. Je to zhuštěná zkušenost tvého mozku, která se ozývá dřív, než ji stihneš rozumově vysvětlit.",
      en: "Intuition isn't magic. It's your brain's compressed experience speaking up before you can explain it rationally.",
    },
    body: [
      {
        cs: "Když máš z člověka, spolupráce nebo rozhodnutí „divný pocit\", v pozadí běží spousta drobných signálů, které tvůj mozek dávno viděl — jen je neumíš hned pojmenovat.",
        en: "When a person, a deal or a decision gives you a weird feeling, a lot of small signals are running in the background — your brain saw them long ago, you just can't name them yet.",
      },
      {
        cs: "Intuici se vyplatí brát vážně, ale ne slepě. Použij ji jako první kompas a doplň rozumem: „Co přesně na téhle situaci mi nesedí?\"",
        en: "Take intuition seriously, but not blindly. Use it as a first compass, then add reason: what exactly about this doesn't sit right?",
      },
    ],
  },
  {
    id: "mozek",
    title: { cs: "Tvůj mozek je hloupější, než si myslíš.", en: "Your brain is dumber than you think." },
    lead: {
      cs: "Většinu času jedeš na autopilota — zkratky, emoce a příběhy v hlavě často vyhrávají nad realitou.",
      en: "Most of the time you're on autopilot — shortcuts, emotions and the stories in your head routinely beat reality.",
    },
    body: [
      {
        cs: "Mozek není nástroj na „pravdu\". Je to nástroj na přežití: šetřit energii, držet se známého, vyhýbat se riziku a mít pravdu za každou cenu.",
        en: "The brain isn't a truth device. It's a survival device: save energy, stick to the familiar, avoid risk, and be right at any cost.",
      },
      {
        cs: "Když s tím začneš počítat, přestaneš se divit vlastním přešlapům. Místo sebemrskání začneš stavět systémy, které s autopilotem umí pracovat.",
        en: "Once you factor that in, your own missteps stop surprising you. Instead of beating yourself up, you start building systems that work with the autopilot.",
      },
    ],
  },
  {
    id: "vazne-sebe",
    title: { cs: "Neber se tak vážně.", en: "Don't take yourself so seriously." },
    lead: {
      cs: "Ego miluje drama. Humor a lehkost ti vrátí nadhled — a často i odvahu.",
      en: "The ego loves drama. Humour and lightness give you perspective back — and often courage too.",
    },
    body: [
      {
        cs: "Když bereš všechno smrtelně vážně, každá chyba je katastrofa a každý pohled ostatních je soud. Tím si zbytečně přidáváš tlak.",
        en: "Take everything deadly seriously and every mistake is a disaster, every glance a verdict. You're just piling pressure on yourself.",
      },
      {
        cs: "Lehkovážnost není nezodpovědnost. Je to schopnost udržet si odstup: „Tohle jsem udělal špatně. Neznamená to, že jsem špatný.\"",
        en: "Lightness isn't irresponsibility. It's the ability to keep distance: I did that badly. It doesn't mean I'm bad.",
      },
    ],
  },
  {
    id: "vazne-svet",
    title: { cs: "A neber svět okolo tak vážně.", en: "And don't take the world so seriously either." },
    lead: {
      cs: "Spousta „pravidel\" je jen společenská hra. Když to uvidíš, přestaneš se bát pohybu.",
      en: "A lot of the rules are just a social game. Once you see that, you stop being afraid to move.",
    },
    body: [
      {
        cs: "Lidé často působí sebejistě, ale uvnitř řeší podobné věci jako ty: nejistotu, porovnávání, strach z odmítnutí. Svět není tak pevný a soudný, jak se tváří.",
        en: "People look confident, but inside they're dealing with the same things you are: uncertainty, comparison, fear of rejection. The world is less solid and less judgmental than it pretends.",
      },
      {
        cs: "Když přestaneš čekat „povolení\", začneš tvořit. A zjistíš, že většina bariér byla jen v hlavě.",
        en: "Stop waiting for permission and you start making things. And you find out most of the barriers were in your head.",
      },
    ],
  },
  {
    id: "zvirata",
    title: { cs: "Pod povrchem jsme stále jen zvířata.", en: "Underneath, we're still animals." },
    lead: {
      cs: "V úplném základu jsme biologické mašiny. Často si myslíme, že „jsme nad tím\", ale nejsme.",
      en: "At the very bottom we're biological machines. We like to think we're above it. We're not.",
    },
    body: [
      {
        cs: "Nálada, motivace i sebeovládání nejsou jen „síla vůle\". Jsou to hormony, spánek, jídlo, pohyb, stres a prostředí.",
        en: "Mood, motivation and self-control aren't just willpower. They're hormones, sleep, food, movement, stress and environment.",
      },
      {
        cs: "Když tohle přijmeš, přestaneš moralizovat vlastní výkyvy a začneš je řídit jako systém — ne jako charakterovou vadu.",
        en: "Accept that and you stop moralising about your own swings and start managing them as a system — not as a character flaw.",
      },
    ],
  },
  {
    id: "jedna-vec",
    title: { cs: "Žádná jedna věc to zázračně nevyřeší.", en: "No single thing will magically fix it." },
    lead: {
      cs: "Žádný „hack\" to za tebe neodžije. Funguje jen kombinace malých kroků v čase.",
      en: "No hack will live it for you. Only a combination of small steps over time actually works.",
    },
    body: [
      {
        cs: "Je lákavé věřit, že existuje jeden kurz, jedna kniha nebo jedna metoda, která všechno přepne. Realita je střízlivější — a zároveň mnohem víc pod tvojí kontrolou.",
        en: "It's tempting to believe there's one course, one book or one method that flips everything. Reality is more sober — and far more under your control.",
      },
      {
        cs: "Když přestaneš hledat zázrak a začneš skládat systém (spánek, jídlo, pohyb, vztahy, práce, pozornost), život se začne zlepšovat bez magie.",
        en: "Stop looking for a miracle and start assembling a system — sleep, food, movement, relationships, work, attention — and life improves without any magic.",
      },
    ],
  },
];
