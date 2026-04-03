// Per-area coaching questions from the life coaching workbook

export interface AreaQuestionSet {
  key: string;
  label: string;
  emoji: string;
  questions: string[];
}

export const AREA_QUESTIONS: AreaQuestionSet[] = [
  {
    key: "kariera",
    label: "Kariéra a práce",
    emoji: "💼",
    questions: [
      "Co se ti v oblasti kariéry nejvíce povedlo — na co jsi hrdý/á?",
      "Co se ti naopak nepovedlo nebo čeho v práci lituješ?",
      "Co tě na tvé práci nejvíce baví a co tě nejvíce vyčerpává?",
      "Kdybys mohl/a dělat cokoliv bez finančního tlaku, co bys dělal/a?",
      "Kdyby ses za rok ohlédl/a zpět, co by tě potěšilo, že jsi v kariéře změnil/a?",
    ],
  },
  {
    key: "finance",
    label: "Finance",
    emoji: "💰",
    questions: [
      "Co se ti ve financích nejvíce povedlo — co funguje?",
      "Co se ti nepovedlo nebo co bys ve vztahu k penězům udělal/a jinak?",
      "Jsi spíš spoříč nebo utrácíš? Jak se s tím cítíš?",
      "Co tě ohledně financí nejvíce stresuje?",
      "Kdyby ses za rok ohlédl/a zpět, co by tě potěšilo, že jsi ve financích změnil/a?",
    ],
  },
  {
    key: "zdravi",
    label: "Zdraví a tělo",
    emoji: "💪",
    questions: [
      "Co se ti v oblasti zdraví nejvíce povedlo — co funguje?",
      "Co se ti nepovedlo nebo co zanedbáváš?",
      "Máš dostatek energie na to, co chceš dělat? Jak se cítíš ve svém těle?",
      "Co ti nejčastěji brání v péči o zdraví?",
      "Kdyby ses za rok ohlédl/a zpět, co by tě potěšilo, že jsi ve zdraví změnil/a?",
    ],
  },
  {
    key: "rodina",
    label: "Rodina a partnerský vztah",
    emoji: "❤️",
    questions: [
      "Co se ti v nejbližších vztazích nejvíce povedlo — co funguje?",
      "Co se ti nepovedlo nebo čeho lituješ?",
      "Cítíš se ve svých vztazích viděn/a a pochopen/a?",
      "Co by tvoji nejbližší řekli, že by si od tebe přáli víc?",
      "Kdyby ses za rok ohlédl/a zpět, co by tě potěšilo, že jsi ve vztazích změnil/a?",
    ],
  },
  {
    key: "pratele",
    label: "Přátelství a sociální život",
    emoji: "🤝",
    questions: [
      "Co se ti v přátelstvích nejvíce povedlo — na jaké vztahy jsi hrdý/á?",
      "Co se ti nepovedlo nebo jaký vztah tě trápí?",
      "Máš ve svém okolí lidi, kteří tě inspirují a zvedají?",
      "Kdy sis naposledy vědomě vybral/a, s kým chceš trávit čas?",
      "Kdyby ses za rok ohlédl/a zpět, co by tě potěšilo, že jsi v sociálním životě změnil/a?",
    ],
  },
  {
    key: "rozvoj",
    label: "Osobní rozvoj",
    emoji: "🧠",
    questions: [
      "V čem ses za posledních 5 let nejvíce rozvinul/a — na co jsi hrdý/á?",
      "Kde cítíš, že stagnaješ nebo se nevzděláváš, jak bys chtěl/a?",
      "Jaká dovednost nebo znalost by ti teď nejvíce změnila život?",
      "Co tě nejčastěji brání v osobním rozvoji?",
      "Kdyby ses za rok ohlédl/a zpět, co by tě potěšilo, že jsi v rozvoji změnil/a?",
    ],
  },
  {
    key: "volny",
    label: "Volný čas a záliby",
    emoji: "🎨",
    questions: [
      "Co tě ve volném čase nejvíce nabíjí — co funguje?",
      "Co ti chybí nebo co jsi přestal/a dělat a stýská se ti po tom?",
      "Kdy sis naposledy opravdu odpočinul/a bez pocitu viny?",
      "Co tě jako dítě nebo mladého člověka bavilo a co jsi opustil/a?",
      "Kdyby ses za rok ohlédl/a zpět, co by tě potěšilo, že jsi ve volném čase změnil/a?",
    ],
  },
  {
    key: "smysl",
    label: "Duchovnost a smysl",
    emoji: "🌌",
    questions: [
      "Ve kterých momentech se cítíš nejvíce sám/sama sebou — kde jsi v proudu?",
      "Co tě v životě nejvíce trápí z hlediska smyslu nebo směřování?",
      "Co dává tvému životu hlubší smysl — co tě přesahuje?",
      "Kdy ses naposledy cítil/a vděčný/á a naplněný/á? Co to způsobilo?",
      "Kdyby ses za rok ohlédl/a zpět, co by tě potěšilo, že jsi ve smyslu a duchovnu změnil/a?",
    ],
  },
];
