/**
 * Texty a jazykové tabulky Milanova světa. Přeneseno 1:1 ze samostatné hry
 * (github.com/reluam/milanuvsvet) — obsah se needituje bez rozmyslu, je to
 * napsaná satira, ne UI stringy.
 *
 * Ceny se drží interně v korunách; angličtina je přepočítává na dolary přes FX.
 */
import type { Lang } from "@/lib/dictionaries";
import { dec } from "./numbers";

export const FX: Record<Lang, number> = { cs: 1, en: 20 };

export const SCALES:  Record<Lang, [number, string][]> = {
  cs: [
    [1e6,"milionu"],[1e9,"miliardy"],[1e12,"bilionu"],[1e15,"biliardy"],
    [1e18,"trilionu"],[1e21,"triliardy"],[1e24,"kvadrilionu"],[1e27,"kvadriliardy"],
    [1e30,"kvintilionu"],[1e33,"kvintiliardy"],[1e36,"sextilionu"],[1e39,"sextiliardy"],
    [1e42,"septilionu"],[1e45,"septiliardy"],[1e48,"oktilionu"],[1e51,"oktiliardy"],
    [1e54,"nonilionu"],[1e57,"noniliardy"],[1e60,"decilionu"],[1e63,"deciliardy"]
  ],
  en: [
    [1e6,"million"],[1e9,"billion"],[1e12,"trillion"],[1e15,"quadrillion"],
    [1e18,"quintillion"],[1e21,"sextillion"],[1e24,"septillion"],[1e27,"octillion"],
    [1e30,"nonillion"],[1e33,"decillion"],[1e36,"undecillion"],[1e39,"duodecillion"],
    [1e42,"tredecillion"],[1e45,"quattuordecillion"],[1e48,"quindecillion"],[1e51,"sexdecillion"],
    [1e54,"septendecillion"],[1e57,"octodecillion"],[1e60,"novemdecillion"],[1e63,"vigintillion"]
  ]
};

export const TIMES: Record<Lang, [number, string][]> = {
  cs: [[1,"minuty"],[60,"hodiny"],[1440,"dne"],[525600,"roku"],
       [52560000,"století"],[525600000,"tisíciletí"],[7.25e15,"stáří vesmíru"]],
  en: [[1,"minutes"],[60,"hours"],[1440,"days"],[525600,"years"],
       [52560000,"centuries"],[525600000,"millennia"],[7.25e15,"× the age of the universe"]]
};

export const SAYINGS: Record<Lang, string[]> = {
  cs: ["Přijďte zítra.","To není naše agenda.","Chybí vám kolek.","Formulář B‑17/c, ne B‑17/b.",
       "Kolegyně je na obědě.","Máte to špatně vyplněné.","Tady se nerazítkuje.","Doneste to ověřené.",
       "Úřední hodiny končí za pět minut.","Vezměte si lísteček.","Číslo 47, okénko 3.",
       "To vám nemůžu říct po telefonu.","Systém je zrovna dole.","Potřebujete výpis z katastru.",
       "Bez plné moci ani ránu.","Lhůta je třicet dnů. Od doručení.","Kdo vám to takhle vyplnil?",
       "To razítko už dva roky nepoužíváme.","Podejte to znovu.","Zítra je státní svátek.",
       "Tiskopis se změnil v lednu.","Jste si jistý, že jste tady správně?","Musí to podepsat i manželka.",
       "Poplatek 500 Kč, jen v hotovosti.","To řeší jiný odbor.","Vraťte se s občankou."],
  en: ["Come back tomorrow.","That's not our department.","Your duty stamp is missing.",
       "Form B‑17/c, not B‑17/b.","My colleague is at lunch.","You've filled it in wrong.",
       "We don't stamp things here.","Bring it back certified.","We close in five minutes.",
       "Take a ticket.","Number 47, window 3.","I can't tell you that over the phone.",
       "The system is down right now.","You need an extract from the registry.",
       "Not a chance without power of attorney.","The deadline is thirty days. From delivery.",
       "Who filled this in for you?","We stopped using that stamp two years ago.","File it again.",
       "Tomorrow is a public holiday.","The form changed in January.","Are you sure you're in the right place?",
       "Your wife has to sign it too.","A fee of 500 crowns, cash only.","Another department handles that.",
       "Come back with your ID card."]
};

export const UI = {
  cs: {
    bandOffice:"Městský úřad · odbor evidence nemovitostí · okénko č. 3",
    bandForm:"Formulář MU‑1/b", bandFormWhat:"· žádost o zápis do katastru",
    tagline:"Každý problém má svou cenu. Stačí ji jen zaplatit.",
    kMinutes:"Minut na úřadě", kAccount:"Na účtě", kYield:"Výnos",
    kPerStamp:"Za jedno razítko", kProps:"Nemovitostí",
    kTotalEarned:"Celkem vyděláno", kAwards:"Vyznamenání",
    filingSheet:"Podací arch", stampUnit:"MIN.",
    arcTop:"MĚSTSKÝ ÚŘAD", arcBot:"ODBOR NEMOVITOSTÍ",
    hint:'Klikni na razítko. Každé orazítkování je <b>minuta</b> promarněná na úřadě — a za promarněný čas se přece platí.',
    tabProps:"Nemovitosti", tabUps:"Vylepšení", tabAch:"Vyznamenání",
    buyInLots:"Kupovat po",
    sound:"Zvuk", soundOff:"Zvuk vypnut",
    reset:"Nová žádost", resetSure:"Opravdu zahodit postup?",
    footer:"Hra se ukládá sama do prohlížeče · cíl je z principu nedosažitelný",
    startBand:"Městský úřad · podatelna", startBand2:"Vyplňte hůlkovým písmem",
    lead1:"Milan má odpověď na jakýkoli tvůj životní problém. Stačí mít dost peněz a problém zmizí. Tak co řešíš?",
    lead2:"Protože většina z nás tolik peněz nemá, je tu dole návod od Milana, jak k nim přijít. Vyber si ze tří možností tu, která sedí na tvou životní situaci, a pusť se do pohodového života!",
    box4:"Kolonka 4: kategorie žadatele — vyberte jednu (po odeslání ji už nelze změnit)",
    startWarn:"Kategorie určuje, kolik korun ti přinese jedna minuta na úřadě. Změnit ji jde jen podáním nové žádosti, čímž se veškerý postup ruší.",
    upsTitle:"Vylepšení",
    upsIntro:"Najeď na položku v mřížce. Vylepšení se odemykají tím, jak roste tvá agenda.",
    upsEmpty:"Zatím není co vylepšovat. Klikej a kupuj nemovitosti — vylepšení se odemknou sama.",
    notAwarded:"Neuděleno",
    teaser:"Kup předchozí nemovitost a odhalí se.",
    effClick:"Razítko vynáší 2× víc minut.",
    effGlobal:function(m: number){ return "Všechno vynáší " + String(m).replace(".", ",") + "× víc."; },
    effMarry:"Sazba stoupne z 1 Kč na 10 Kč za minutu na úřadě.",
    cantAfford:" — zatím nemáš", canBuy:" — můžeš koupit",
    perSec:function(v: string){ return v + " Kč za sekundu"; },
    rateLine:function(v: number){ return "sazba " + v + " Kč za minutu"; },
    stampsTotal:function(v: string){ return v + " razítek celkem"; },
    ofKinds:function(a: number, b: number){ return a + " z " + b + " druhů"; },
    totalRate:function(v: string, tot: string){ return v + " min/s · celkem " + tot; },
    nothingYet:"to je nic",
    noteBought:"Zapsáno do katastru",
    noteAch:"Úřední vyznamenání",
    noteWedding:"Svatba proběhla",
    noteWeddingTxt:"Milan se oženil. Sazba je od teď 10 Kč za minutu — a teď teprve začíná ten pravý záhrab.",
    noteFirm:"Podíl ve firmě",
    noteFirmTxt:"Ukázalo se, že firma pro tebe není to pravé ořechové. Na firmě bohužel nic nevyděláš. Dobrá zpráva je, že kromě 4 milionů už ani nic neproděláš.",
    noteBox4:"Kolonka 4 přijata",
    noteBox4Txt:"Zatím ti minuta nese 1 Kč. V záložce Vylepšení na tebe čeká položka za 0 Kč.",
    noteOffline:"Zatímco jste stál ve frontě…",
    noteOfflineTxt:function(time: string, mins: string, money: string){
      return "Za " + time + " nepřítomnosti ti nateklo " + mins + " minut a " + money + ".";
    },
    infinity:"nekonečno", queue:" ve frontě", currency:"Kč",
    minPerSec:"min/s", min:"min"
  },
  en: {
    bandOffice:"City hall · property records department · window no. 3",
    bandForm:"Form MU‑1/b", bandFormWhat:"· application for entry in the land registry",
    tagline:"Every problem has its price. You just have to pay it.",
    kMinutes:"Minutes at the office", kAccount:"In the account", kYield:"Yield",
    kPerStamp:"Per stamp", kProps:"Properties",
    kTotalEarned:"Total earned", kAwards:"Commendations",
    filingSheet:"Filing sheet", stampUnit:"MIN",
    arcTop:"CITY HALL", arcBot:"PROPERTY DEPARTMENT",
    hint:'Click the stamp. Every stamping is a <b>minute</b> wasted at the office — and wasted time does pay.',
    tabProps:"Properties", tabUps:"Upgrades", tabAch:"Commendations",
    buyInLots:"Buy in lots of",
    sound:"Sound", soundOff:"Sound off",
    reset:"New application", resetSure:"Really discard your progress?",
    footer:"The game saves itself in your browser · the goal is unreachable by design",
    startBand:"City hall · filing office", startBand2:"Please use block capitals",
    lead1:"Milan has an answer to any problem in your life. Just have enough money and the problem disappears. So what's the trouble?",
    lead2:"Since most of us don't have that kind of money, below is Milan's guide to getting it. Pick whichever of the three options matches your situation in life and get on with the easy life!",
    box4:"Box 4: applicant category — choose one (it cannot be changed after submission)",
    startWarn:"The category decides how much one minute at the office earns you. It can only be changed by filing a new application, which cancels all your progress.",
    upsTitle:"Upgrades",
    upsIntro:"Hover over an item in the grid. Upgrades unlock as your paperwork grows.",
    upsEmpty:"Nothing to upgrade yet. Keep clicking and buying property — upgrades unlock on their own.",
    notAwarded:"Not awarded",
    teaser:"Buy the previous property to reveal it.",
    effClick:"The stamp yields 2× more minutes.",
    effGlobal:function(m: number){ return "Everything yields " + m + "× more."; },
    effMarry:"The rate rises from 0.05 USD to 0.50 USD per minute at the office.",
    cantAfford:" — can't afford it yet", canBuy:" — you can buy it",
    perSec:function(v: string){ return v + " USD per second"; },
    rateLine:function(v: number){ return "rate: " + dec(v / FX.en, 2, "en") + " USD per minute"; },
    stampsTotal:function(v: string){ return v + " stamps in total"; },
    ofKinds:function(a: number, b: number){ return a + " of " + b + " kinds"; },
    totalRate:function(v: string, tot: string){ return v + " min/s · " + tot + " in total"; },
    nothingYet:"nothing yet",
    noteBought:"Entered in the land registry",
    noteAch:"Official commendation",
    noteWedding:"The wedding took place",
    noteWeddingTxt:"Milan got married. The rate is 0.50 USD per minute from now on — and only now does the real grind begin.",
    noteFirm:"A stake in a company",
    noteFirmTxt:"Turns out the company wasn't quite your cup of tea. You won't earn a thing on it. The good news is that apart from the 200 grand, you won't lose anything more either.",
    noteBox4:"Box 4 accepted",
    noteBox4Txt:"For now a minute earns you 0.05 USD. There is an item waiting for you in the Upgrades tab for 0 USD.",
    noteOffline:"While you were waiting in line…",
    noteOfflineTxt:function(time: string, mins: string, money: string){
      return "Over " + time + " away you accumulated " + mins + " minutes and " + money + ".";
    },
    infinity:"infinity", queue:" in line", currency:"USD",
    minPerSec:"min/s", min:"min"
  }
};
