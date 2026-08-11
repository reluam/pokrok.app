import type { Bi } from "@/lib/about";

/**
 * Krátké myšlenky — „desatero" věcí, na které Matěj v životě přišel.
 * Vychází z principů na žiju.life (scripts/migrate-principles.ts), ale jsou
 * přepsané do první osoby: nejsou to rady čtenáři, ale co si myslí o sobě.
 * Anglické verze jsou překlad, ne originál — při úpravách měň obě.
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
    title: { cs: "Ve škole mě nenaučili to podstatné.", en: "School didn't teach me the important part." },
    lead: {
      cs: "Připravovali mě na testy, ne na hru jménem život. Nikdo mi neukázal, jak zacházet s penězi, emocemi, vlastní energií ani vztahy.",
      en: "They prepared me for tests, not for the game called life. Nobody showed me how to handle money, emotions, my own energy or relationships.",
    },
    body: [
      {
        cs: "Většinu důležitých dovedností se učím až za pochodu — v práci, ve vztazích, v krizi. Je to náročné, ale má to jednu výhodu: můžu si nastavit vlastní pravidla hry.",
        en: "I learn most of the important skills on the move — at work, in relationships, in a crisis. It's hard, but it has one upside: I get to set my own rules.",
      },
      {
        cs: "Čím dřív jsem přijal, že „školní hru\" mám za sebou a teď hraju tu vlastní, tím snáz jsem si dovolil hledat lepší systém pro sebe — ne pro vysvědčení.",
        en: "The sooner I accepted that the school game was over and I was playing my own, the easier it got to look for a better system for myself — not for a report card.",
      },
    ],
  },
  {
    id: "zodpovednost",
    title: { cs: "Za svůj život jsem zodpovědný pouze já sám.", en: "I alone am responsible for my life." },
    lead: {
      cs: "Nikdo jiný nemůže žít můj život za mě. V určitém bodě jsem si prostě musel říct: „Je to na mně.\"",
      en: "Nobody else can live my life for me. At some point I simply had to say: it's on me.",
    },
    body: [
      {
        cs: "Můžu mít podporu, kouče, partnerku, komunitu. Ale rozhodnutí, která dělám každé ráno, večer i mezi tím, za mě nikdo neudělá.",
        en: "I can have support, a coach, a partner, a community. But the decisions I make every morning, every evening and in between — nobody makes those for me.",
      },
      {
        cs: "Není to tlak, ale svoboda. Jakmile jsem to přijal, můžu s vlastním životem mnohem víc experimentovat.",
        en: "That's not pressure, it's freedom. Once I accepted it, I could experiment with my own life far more.",
      },
    ],
  },
  {
    id: "cernobile",
    title: { cs: "Skoro nic není pouze černobílé.", en: "Almost nothing is only black and white." },
    lead: {
      cs: "Život se nedá žít jen v režimu ano/ne. Mezi tím je obrovský prostor, kde si můžu nastavit vlastní pravidla.",
      en: "Life can't be lived in yes/no mode. In between there's a huge space where I get to set my own rules.",
    },
    body: [
      {
        cs: "Buď práce, nebo svoboda. Buď rodina, nebo kariéra. Buď stabilita, nebo zážitky. Tenhle způsob přemýšlení mě zbytečně zamykal.",
        en: "Either work or freedom. Either family or career. Either stability or adventure. That way of thinking used to lock me in for no reason.",
      },
      {
        cs: "Mezi černou a bílou je spousta odstínů. A právě tam si skládám život podle sebe — ne podle škatulek ostatních.",
        en: "Between black and white there are plenty of shades. That's exactly where I assemble a life of my own — not one built from other people's boxes.",
      },
    ],
  },
  {
    id: "smysl",
    title: { cs: "Svůj životní smysl tvořím každodenními kroky.", en: "I build my purpose with everyday steps." },
    lead: {
      cs: "Smysl nepřišel shora jako jeden velký „aha moment\". Vzniká z malých voleb, které dělám dnes a zítra.",
      en: "Purpose never arrived from above as one big aha moment. It grows out of the small choices I make today and tomorrow.",
    },
    body: [
      {
        cs: "Dlouho jsem čekal na jeden zlomový okamžik, který mi „vysvětlí život\". V praxi smysl vzniká z drobných rozhodnutí — čemu říkám ano, čemu ne, kam dávám energii.",
        en: "For a long time I waited for the one turning point that would explain life to me. In practice, purpose comes from small decisions — what I say yes to, what I refuse, where my energy goes.",
      },
      {
        cs: "Začínám maličkostmi: jedním projektem, jedním návykem, jedním rozhovorem, který už dlouho odkládám.",
        en: "I start small: one project, one habit, one conversation I've been putting off for ages.",
      },
    ],
  },
  {
    id: "sebevedomi",
    title: { cs: "Sebevědomí si buduju děláním těžkých věcí.", en: "I build confidence by doing hard things." },
    lead: {
      cs: "Sebevědomí pro mě není afirmace v zrcadle, ale důkaz. Přichází, když udělám krok, do kterého se mi nechce — a ustojím ho.",
      en: "Confidence isn't an affirmation in the mirror for me, it's evidence. It shows up when I take a step I don't feel like taking — and hold my ground.",
    },
    body: [
      {
        cs: "Můžu si opakovat, že na to mám. Ale dokud si to neověřím v reálném světě, hlava tomu stejně úplně nevěří.",
        en: "I can keep telling myself I've got this. But until I test it in the real world, my head doesn't quite buy it.",
      },
      {
        cs: "Každý malý „těžký krok\" — nepříjemný hovor, odmítnutí, nový projekt — je pro mě malý důkaz: „Zvládl jsem to. Dám i další věc.\"",
        en: "Every small hard step — an awkward call, a rejection, a new project — is a small piece of evidence for me: I handled that. I can handle the next one too.",
      },
    ],
  },
  {
    id: "hotove",
    title: { cs: "Hotové je lepší než dokonalé.", en: "Done beats perfect." },
    lead: {
      cs: "Perfekcionismus je můj chytře maskovaný strach. Život mi mění dokončené věci — ne ty rozdělané.",
      en: "Perfectionism is my fear in a clever disguise. What changes my life is the things I finish — not the ones I keep polishing.",
    },
    body: [
      {
        cs: "Umím měsíce ladit detaily projektu nebo newsletteru — ale dokud to nevypustím ven, realita mi nedá žádnou zpětnou vazbu. Zůstanu v bezpečí vlastní hlavy.",
        en: "I can spend months polishing a project or a newsletter — but until I put it out there, reality gives me no feedback at all. I just stay safe inside my own head.",
      },
      {
        cs: "Když cílím na „dost dobré na odeslání\" místo dokonalosti, posunu se násobně rychleji. Učím se z reálných reakcí, ne z hypotetických scénářů.",
        en: "When I aim for good enough to ship instead of perfect, I move several times faster. I learn from real reactions, not hypothetical ones.",
      },
    ],
  },
  {
    id: "intuice",
    title: { cs: "Intuice pracuje v můj prospěch.", en: "My intuition is working for me." },
    lead: {
      cs: "Intuice není magie. Je to zhuštěná zkušenost mého mozku, která se ozve dřív, než ji stihnu rozumově vysvětlit.",
      en: "Intuition isn't magic. It's my brain's compressed experience speaking up before I can explain it rationally.",
    },
    body: [
      {
        cs: "Když mám z člověka, spolupráce nebo rozhodnutí „divný pocit\", běží v pozadí spousta drobných signálů, které můj mozek dávno viděl — jen je neumím hned pojmenovat.",
        en: "When a person, a deal or a decision gives me a weird feeling, a lot of small signals are running in the background — my brain saw them long ago, I just can't name them yet.",
      },
      {
        cs: "Beru ji vážně, ale ne slepě. Používám ji jako první kompas a doplním rozumem: „Co přesně mi na téhle situaci nesedí?\"",
        en: "I take it seriously, but not blindly. I use it as a first compass, then add reason: what exactly about this doesn't sit right?",
      },
    ],
  },
  {
    id: "mozek",
    title: { cs: "Můj mozek je hloupější, než si myslím.", en: "My brain is dumber than I think." },
    lead: {
      cs: "Většinu času jedu na autopilota — zkratky, emoce a příběhy v hlavě mi běžně vyhrávají nad realitou.",
      en: "Most of the time I'm on autopilot — shortcuts, emotions and the stories in my head routinely beat reality.",
    },
    body: [
      {
        cs: "Mozek není nástroj na „pravdu\". Je to nástroj na přežití: šetřit energii, držet se známého, vyhýbat se riziku a mít pravdu za každou cenu.",
        en: "The brain isn't a truth device. It's a survival device: save energy, stick to the familiar, avoid risk, and be right at any cost.",
      },
      {
        cs: "Když s tím počítám, přestanu se divit vlastním přešlapům. Místo sebemrskání stavím systémy, které s autopilotem umí pracovat.",
        en: "When I factor that in, my own missteps stop surprising me. Instead of beating myself up, I build systems that work with the autopilot.",
      },
    ],
  },
  {
    id: "vazne-sebe",
    title: { cs: "Neberu se tak vážně.", en: "I don't take myself that seriously." },
    lead: {
      cs: "Moje ego miluje drama. Humor a lehkost mi vrací nadhled — a často i odvahu.",
      en: "My ego loves drama. Humour and lightness give me perspective back — and often courage too.",
    },
    body: [
      {
        cs: "Když beru všechno smrtelně vážně, každá chyba je katastrofa a každý pohled ostatních je soud. Tím si jen přidávám tlak.",
        en: "When I take everything deadly seriously, every mistake is a disaster and every glance is a verdict. I'm just piling pressure on myself.",
      },
      {
        cs: "Lehkovážnost není nezodpovědnost. Je to schopnost udržet si odstup: „Tohle jsem udělal špatně. Neznamená to, že jsem špatný.\"",
        en: "Lightness isn't irresponsibility. It's the ability to keep some distance: I did that badly. It doesn't mean I'm bad.",
      },
    ],
  },
  {
    id: "vazne-svet",
    title: { cs: "A svět okolo taky ne.", en: "And I don't take the world that seriously either." },
    lead: {
      cs: "Spousta „pravidel\" je jen společenská hra. Když jsem to uviděl, přestal jsem se bát pohybu.",
      en: "A lot of the rules are just a social game. Once I saw that, I stopped being afraid to move.",
    },
    body: [
      {
        cs: "Lidé kolem mě často působí sebejistě, ale uvnitř řeší podobné věci jako já: nejistotu, porovnávání, strach z odmítnutí. Svět není tak pevný a soudný, jak se tváří.",
        en: "People around me look confident, but inside they're dealing with the same things I am: uncertainty, comparison, fear of rejection. The world is less solid and less judgmental than it pretends.",
      },
      {
        cs: "Když jsem přestal čekat „povolení\", začal jsem tvořit. A zjistil jsem, že většina bariér byla jen v mojí hlavě.",
        en: "When I stopped waiting for permission, I started making things. And I found out most of the barriers were only in my head.",
      },
    ],
  },
  {
    id: "zvirata",
    title: { cs: "Pod povrchem jsme pořád jen zvířata.", en: "Underneath, we're still animals." },
    lead: {
      cs: "V úplném základu jsem biologická mašina. Rád si myslím, že „jsem nad tím\", ale nejsem.",
      en: "At the very bottom I'm a biological machine. I like to think I'm above it. I'm not.",
    },
    body: [
      {
        cs: "Moje nálada, motivace i sebeovládání nejsou jen „síla vůle\". Jsou to hormony, spánek, jídlo, pohyb, stres a prostředí.",
        en: "My mood, motivation and self-control aren't just willpower. They're hormones, sleep, food, movement, stress and environment.",
      },
      {
        cs: "Když jsem to přijal, přestal jsem moralizovat vlastní výkyvy a začal je řídit jako systém — ne jako charakterovou vadu.",
        en: "Once I accepted that, I stopped moralising about my own swings and started managing them as a system — not as a character flaw.",
      },
    ],
  },
  {
    id: "jedna-vec",
    title: { cs: "Žádná jedna věc to zázračně nevyřeší.", en: "No single thing will magically fix it." },
    lead: {
      cs: "Žádný „hack\" to za mě neodžije. Funguje jen kombinace malých kroků v čase.",
      en: "No hack will live it for me. Only a combination of small steps over time actually works.",
    },
    body: [
      {
        cs: "Je lákavé věřit, že existuje jeden kurz, jedna kniha nebo jedna metoda, která všechno přepne. Realita je střízlivější — a zároveň mnohem víc pod mojí kontrolou.",
        en: "It's tempting to believe there's one course, one book or one method that flips everything. Reality is more sober — and far more under my control.",
      },
      {
        cs: "Když přestanu hledat zázrak a skládám systém (spánek, jídlo, pohyb, vztahy, práce, pozornost), život se začne zlepšovat bez magie.",
        en: "When I stop looking for a miracle and assemble a system — sleep, food, movement, relationships, work, attention — life improves without any magic.",
      },
    ],
  },
];
