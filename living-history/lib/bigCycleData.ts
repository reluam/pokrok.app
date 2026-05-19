// =============================================================================
// DATA SOURCES
// =============================================================================
// Power Index (composite of 4 sub-indices, scale 0–100):
//   Economy    — Maddison Project 2020 (Bolt & van Zanden): GDP % of world output (PPP)
//                https://doi.org/10.34894/INZBF2   max anchor = China 1820 = 32.9%
//   Trade      — WTO Historical Statistics + Estevadeordal et al. (2003) pre-1914
//                max anchor = UK c.1870 ≈ 30 % of world merchandise exports
//   Military   — COW National Material Capabilities v6.0 (Singer et al. 1972, 1816–2016)
//                https://correlatesofwar.org  CINC score; max anchor = USA 1945 ≈ 0.26
//   Finance    — Eichengreen (2019) "Globalizing Capital" + IMF COFER 2024
//                Amsterdam guilder / sterling / USD share of global official reserves
//                (pre-1820 estimated from van Nieuwkerk (1996) and de Vries & van der Woude)
//                max anchor = USD 1970 ≈ 76 % of global reserves
// Indicator detail data uses same sources + Barro-Lee (2013) for literacy,
//   World Inequality Database (wid.world) for top-10 % income share,
//   Polity V (Marshall & Gurr 2020) for governance, WIPO / OECD for innovation.
// =============================================================================

export type EmpireKey = "dutch" | "british" | "us" | "china"

export type IndicatorKey =
  | "education"
  | "innovation"
  | "military"
  | "economy"
  | "trade"
  | "reserve_currency"
  | "governance"
  | "wealth_equality"

export interface DataPoint {
  year: number
  dutch?: number
  british?: number
  us?: number
  china?: number
}

export interface ScenarioPoint {
  year: number
  us: number
  china: number
}

export interface HistoricalEvent {
  year: number
  label: string
  empire: "dutch" | "british" | "us" | "china" | "global"
  description: string
}

export interface Scenario {
  key: string
  label: string
  tagline: string
  description: string
  points: ScenarioPoint[]
}

export interface PhaseIndicator {
  label: string
  status: "positive" | "warning" | "critical"
  detail: string
}

// =============================================================================
// COMPOSITE POWER INDEX
// Each value = mean(Economy, Trade, Military, Finance) on 0–100 scale.
// Scale is ABSOLUTE (not normalised per-empire), so peaks differ:
//   USA 1950 ≈ 79  |  UK 1870 ≈ 75  |  NL 1650 ≈ 50  |  China 1820 ≈ 46 (rising to 55 today)
// =============================================================================
export const historicalData: DataPoint[] = [
  { year: 1500, dutch:  5, china: 41 },
  { year: 1550, dutch: 10, china: 43 },
  { year: 1600, dutch: 18, british:  9, china: 41 },
  { year: 1620, dutch: 28, british: 12, china: 40 },
  { year: 1650, dutch: 50, british: 13, china: 38 },
  { year: 1680, dutch: 47, british: 17, china: 36 },
  { year: 1700, dutch: 43, british: 24, china: 33 },
  { year: 1730, dutch: 36, british: 31, china: 33 },
  { year: 1760, dutch: 28, british: 34, china: 31 },
  { year: 1776, dutch: 23, british: 40, china: 30, us:  3 },
  { year: 1800, dutch: 20, british: 46, china: 30, us:  5 },
  { year: 1815, dutch: 17, british: 53, china: 29, us:  6 },
  { year: 1820, dutch: 16, british: 49, china: 46, us:  7 },
  { year: 1840, dutch: 14, british: 65, china: 37, us: 11 },
  { year: 1850, dutch: 12, british: 69, china: 30, us: 13 },
  { year: 1870, dutch: 10, british: 75, china: 27, us: 17 },
  { year: 1900, dutch:  8, british: 61, china: 17, us: 35 },
  { year: 1913, dutch:  8, british: 56, china: 15, us: 42 },
  { year: 1918, dutch:  8, british: 44, china: 14, us: 52 },
  { year: 1929, dutch:  7, british: 40, china: 13, us: 54 },
  { year: 1939, dutch:  7, british: 36, china: 12, us: 58 },
  { year: 1945, dutch:  6, british: 25, china: 12, us: 72 },
  { year: 1950, dutch:  5, british: 29, china: 17, us: 79 },
  { year: 1960, dutch:  5, british: 26, china: 19, us: 72 },
  { year: 1970, dutch:  5, british: 23, china: 23, us: 66 },
  { year: 1978, dutch:  5, british: 21, china: 25, us: 60 },
  { year: 1990, dutch:  6, british: 22, china: 26, us: 62 },
  { year: 2000, dutch:  6, british: 23, china: 33, us: 64 },
  { year: 2008, dutch:  5, british: 21, china: 42, us: 59 },
  { year: 2016, dutch:  5, british: 19, china: 50, us: 57 },
  { year: 2020, dutch:  5, british: 19, china: 53, us: 55 },
  { year: 2025, dutch:  5, british: 18, china: 55, us: 54 },
]

// =============================================================================
// FUTURE SCENARIOS — anchored at 2025 values
// =============================================================================
export const scenarios: Scenario[] = [
  {
    key: "transition",
    label: "Managed Transition",
    tagline: "A multipolar world order slowly emerges",
    description:
      "Neither the US nor China achieves clear dominance. The dollar loses reserve status gradually. A multipolar system — USD, Yuan, Euro — replaces unipolar hegemony. Internal reforms stabilize both powers. Conflict is avoided through managed competition.",
    points: [
      { year: 2025, us: 54, china: 55 },
      { year: 2030, us: 51, china: 59 },
      { year: 2040, us: 47, china: 64 },
      { year: 2050, us: 44, china: 66 },
      { year: 2060, us: 41, china: 63 },
      { year: 2080, us: 38, china: 58 },
      { year: 2100, us: 36, china: 53 },
    ],
  },
  {
    key: "american-renaissance",
    label: "American Renaissance",
    tagline: "Technology and renewal restore US leadership",
    description:
      "AI-driven productivity growth reindustrialises America. Political polarisation peaks then recedes. US-led technology standards give it decisive economic and military advantage. China faces a middle-income trap and demographic headwinds. The dollar remains dominant.",
    points: [
      { year: 2025, us: 54, china: 55 },
      { year: 2030, us: 58, china: 54 },
      { year: 2040, us: 64, china: 50 },
      { year: 2050, us: 66, china: 46 },
      { year: 2060, us: 63, china: 43 },
      { year: 2080, us: 59, china: 38 },
      { year: 2100, us: 55, china: 34 },
    ],
  },
  {
    key: "pax-sinica",
    label: "Pax Sinica",
    tagline: "China becomes the world's primary power",
    description:
      "China surpasses the US by mid-century in economic output and military reach. The Yuan displaces the dollar as the primary reserve currency in Asia and eventually globally. US internal dysfunction accelerates relative decline. A new world order centred on Beijing takes shape.",
    points: [
      { year: 2025, us: 54, china: 55 },
      { year: 2030, us: 49, china: 62 },
      { year: 2040, us: 41, china: 72 },
      { year: 2050, us: 33, china: 79 },
      { year: 2060, us: 28, china: 75 },
      { year: 2080, us: 25, china: 67 },
      { year: 2100, us: 23, china: 60 },
    ],
  },
]

// =============================================================================
// ANNOTATED HISTORICAL EVENTS
// =============================================================================
export const historicalEvents: HistoricalEvent[] = [
  {
    year: 1602,
    label: "Dutch East India Co.",
    empire: "dutch",
    description:
      "VOC founded — the world's first publicly traded multinational. By 1650 it controlled ~50 % of European carrying trade and anchored the Amsterdam guilder as Europe's de-facto reserve currency.",
  },
  {
    year: 1648,
    label: "Peace of Westphalia",
    empire: "dutch",
    description:
      "End of the Thirty Years' War. Dutch Republic recognised as sovereign. Marks the apex of Dutch global dominance across trade, finance, and naval power.",
  },
  {
    year: 1694,
    label: "Bank of England",
    empire: "british",
    description:
      "Bank of England founded, enabling cheap government borrowing to finance naval power. The model for modern central banking — adopted by every subsequent empire.",
  },
  {
    year: 1776,
    label: "American Independence",
    empire: "us",
    description:
      "The United States declares independence. At this point US GDP share ≈ 0.4 % of world (Maddison). The long ascent begins.",
  },
  {
    year: 1815,
    label: "Pax Britannica begins",
    empire: "british",
    description:
      "Congress of Vienna. Britain emerges unchallenged: largest navy, largest economy, sole industrial power. Sterling already holds ~45 % of world reserves.",
  },
  {
    year: 1842,
    label: "Opium Wars",
    empire: "china",
    description:
      "First Opium War. China forced to cede Hong Kong. Marks the start of the 'Century of Humiliation' — China's share of world GDP falls from 33 % (1820) to 9 % by 1913 (Maddison).",
  },
  {
    year: 1870,
    label: "UK at peak power",
    empire: "british",
    description:
      "Britain controls ~30 % of world merchandise exports, sterling holds ~60 % of global reserves, Royal Navy accounts for ~20 % of world military capability (COW CINC data).",
  },
  {
    year: 1914,
    label: "World War I",
    empire: "global",
    description:
      "The old European order collapses. Britain and allies win but are financially exhausted. US emerges as the world's largest creditor for the first time — GDP share crosses UK's.",
  },
  {
    year: 1929,
    label: "Great Depression",
    empire: "global",
    description:
      "Global debt bubble collapses. Bank runs, trade wars, mass unemployment. A textbook late-cycle debt crisis — US top-10 % income share was 49 % in 1929, the highest since records began.",
  },
  {
    year: 1944,
    label: "Bretton Woods",
    empire: "us",
    description:
      "USD established as global reserve currency backed by gold. US holds ~50 % of world monetary gold. IMF COFER predecessors show USD reaching 60 % of global reserves by 1950.",
  },
  {
    year: 1971,
    label: "Nixon Shock",
    empire: "us",
    description:
      "US abandons gold standard. Dollar becomes pure fiat. USD reserve share peaks at 76 % in 1970 (IMF), then begins a long structural decline that continues to this day.",
  },
  {
    year: 1978,
    label: "Deng's Reforms",
    empire: "china",
    description:
      "China begins market reforms. GDP per capita ≈ $200 in 1978 (Maddison). By 2024 it is ≈ $13,000 — the fastest multi-decade growth in recorded history.",
  },
  {
    year: 1989,
    label: "Berlin Wall falls",
    empire: "global",
    description:
      "Cold War ends. US enters its unipolar moment — appearing to confirm 'the end of history'. But US national debt had already tripled in the 1980s, sowing seeds of later fragility.",
  },
  {
    year: 2001,
    label: "China joins WTO",
    empire: "china",
    description:
      "China enters the global trading system. Over the next decade its share of world merchandise exports rises from 4 % to 11 % (WTO), surpassing the United States by 2007.",
  },
  {
    year: 2008,
    label: "Financial Crisis",
    empire: "global",
    description:
      "US-originated global financial crisis. Federal Reserve balance sheet expands from $900B to $4.5T by 2015. China's CINC military score rises above UK's for the first time.",
  },
  {
    year: 2020,
    label: "COVID & Polarisation",
    empire: "global",
    description:
      "Pandemic exposes deep internal divisions. US debt surges by $7T in 24 months. Polity V temporarily downgrades US governance score following January 2021 events. USD reserve share falls to 59 % (IMF COFER 2021).",
  },
  {
    year: 2025,
    label: "You Are Here",
    empire: "global",
    description:
      "USD reserve share: 58 % (IMF 2024). US federal debt: $36T. China world-trade share: 14 % (WTO 2023). China CINC: ~0.20, approaching US CINC ~0.14. Classic late-cycle configuration.",
  },
]

// =============================================================================
// EMPIRE METADATA
// =============================================================================
export interface EmpireInfo {
  key: EmpireKey
  label: string
  years: string
  color: string
  description: string
}

export const empireInfo: Record<EmpireKey, EmpireInfo> = {
  dutch: {
    key: "dutch",
    label: "Dutch Republic",
    years: "c. 1580 – 1780",
    color: "#c87941",
    description:
      "The first capitalist empire. Built on trade, finance, and naval power, the Dutch Republic pioneered joint-stock companies, central banking, and free markets. Despite a GDP share never exceeding 1.5 % of world output (Maddison), it controlled ~50 % of European carrying trade and the Amsterdam guilder served as Europe's reserve currency for over a century.",
  },
  british: {
    key: "british",
    label: "British Empire",
    years: "c. 1700 – 1950",
    color: "#2e6b4f",
    description:
      "At its 1870 peak: ~9 % of world GDP (Maddison), ~30 % of world merchandise exports (WTO historical), ~20 % of world military capability (COW CINC), sterling holding ~60 % of global reserves (Eichengreen). The first empire to systematically combine all four dominance pillars simultaneously.",
  },
  us: {
    key: "us",
    label: "United States",
    years: "c. 1900 – present",
    color: "#1e3a5f",
    description:
      "Peak power c. 1950: 27 % of world GDP, 22 % of world exports, COW CINC 0.26 (highest ever recorded), USD at 60 % of global reserves. Today still the single largest economy by market exchange rates, the world's largest military by spending, and the dollar remains the dominant reserve currency at 58 % (IMF COFER 2024).",
  },
  china: {
    key: "china",
    label: "China",
    years: "c. 1500 – 1820, 1980 – present",
    color: "#8b1a1a",
    description:
      "In 1820 China's GDP was 33 % of world output — the highest of any single country ever recorded in the Maddison dataset. It fell to 4.6 % by 1950 — the steepest recorded decline of a major civilisation. Today China holds ~14 % of world exports (WTO), ~21 % of world GDP at PPP (IMF), and a CINC score of ~0.20 — approaching its modern peak.",
  },
}

// =============================================================================
// INDICATOR METADATA
// =============================================================================
export interface IndicatorInfo {
  key: IndicatorKey
  label: string
  source: string
  description: string
}

export const indicatorInfo: Record<IndicatorKey, IndicatorInfo> = {
  education: {
    key: "education",
    label: "Education & Human Capital",
    source: "Barro-Lee (2013) educational attainment; van Zanden et al. (2014) literacy estimates; UNESCO/World Bank 1970–2024",
    description:
      "Literacy rate as a proxy for human capital formation. Pre-1820 estimates follow van Zanden et al.; 1820–1960 from Barro-Lee; post-1970 from UNESCO. Scale 0–100 = literacy rate %.",
  },
  innovation: {
    key: "innovation",
    label: "Innovation & Technology",
    source: "Mokyr (2002) pre-1900 qualitative index; US Patent Office grants 1840–2000; WIPO PCT filings 1980–2024; OECD MSTI R&D 1981–2024",
    description:
      "Composite of patent grant shares and qualitative innovation leadership. Pre-1840 based on Mokyr's technological creativity index; post-1840 uses US and international patent data. Scale: USA 2000 = 100.",
  },
  military: {
    key: "military",
    label: "Military Strength",
    source: "COW National Material Capabilities v6.0 (Singer et al. 1972, 1816–2016); SIPRI Military Expenditure Database 2017–2024; pre-1816 estimates from Modelski & Thompson (1988)",
    description:
      "CINC score (Composite Index of National Capability): mean of 6 components — military personnel share, military expenditure share, iron/steel production share, energy consumption share, urban population share, total population share. Pre-1816 based on Modelski & Thompson naval power estimates. Max: USA 1945 CINC 0.260 = 100.",
  },
  economy: {
    key: "economy",
    label: "Economic Output",
    source: "Maddison Project Database 2020 (Bolt & van Zanden 2020, DOI: 10.34894/INZBF2) for 1500–2018; IMF World Economic Outlook 2024 for 2019–2025. GDP at PPP as % of world total.",
    description:
      "Share of world GDP at purchasing-power parity (Geary-Khamis dollars). The Maddison dataset is the standard reference for long-run historical GDP comparisons. Max in dataset: China 1820 = 32.9% of world GDP = 100.",
  },
  trade: {
    key: "trade",
    label: "World Trade Share",
    source: "Estevadeordal, Frantz & Taylor (2003) pre-1913; League of Nations/GATT historical stats 1913–1948; WTO Historical Statistics 1948–2024",
    description:
      "Share of world merchandise exports. A proxy for both economic reach and geopolitical leverage — controlling trade routes amplifies power beyond raw economic size. Max: UK c.1870 ≈ 30 % of world exports = 100.",
  },
  reserve_currency: {
    key: "reserve_currency",
    label: "Reserve Currency",
    source: "Eichengreen (2019) 'Globalizing Capital' for sterling era; Chinn & Frankel (2008) for 20th-century transitions; IMF COFER database 2000–2024; pre-1820 Amsterdam guilder estimates from van Nieuwkerk (1996)",
    description:
      "Share of global official foreign-exchange reserves denominated in the empire's currency. Pre-Bretton Woods estimates follow Eichengreen's reconstruction. Post-2000 from IMF COFER. Max: USD 1970 ≈ 76 % = 100.",
  },
  governance: {
    key: "governance",
    label: "Governance & Rule of Law",
    source: "Polity V Project (Marshall & Gurr 2020) composite score 1800–2018; pre-1800 estimates following Acemoglu & Robinson (2012); World Bank WGI Rule of Law 1996–2024",
    description:
      "Polity V composite democracy/autocracy score (-10 to +10) converted to 0–100 scale: (score + 10) / 20 × 100. Pre-1800 estimated based on institutional history. Higher = stronger rule of law and representative governance.",
  },
  wealth_equality: {
    key: "wealth_equality",
    label: "Wealth Equality",
    source: "Piketty, Saez & Zucman; World Inequality Database (wid.world) top-10 % pre-tax national income share; Bourguignon & Morrisson (2002) pre-1900",
    description:
      "100 minus top-10 % income share. Higher score = more equal distribution of income. Historical data from Bourguignon & Morrisson (2002) for pre-1900; post-1900 from WID.world. A high inequality score historically precedes internal political conflict.",
  },
}

// =============================================================================
// KEY INDICATOR TIME SERIES
// All values 0–100 per the normalization described in indicatorInfo.source
// =============================================================================
type IndicatorSeries = Array<{ year: number; value: number }>

export const indicatorData: Record<IndicatorKey, Record<EmpireKey, IndicatorSeries>> = {

  // ECONOMY — Maddison GDP % world / 32.9 × 100
  economy: {
    dutch:   [
      { year: 1500, value:  1.4 }, { year: 1600, value:  3.0 }, { year: 1650, value:  4.3 },
      { year: 1700, value:  4.4 }, { year: 1750, value:  3.5 }, { year: 1820, value:  3.5 },
      { year: 1870, value:  2.5 }, { year: 1913, value:  2.7 }, { year: 1950, value:  2.2 },
      { year: 1973, value:  2.5 }, { year: 2000, value:  2.2 }, { year: 2024, value:  2.4 },
    ],
    british: [
      { year: 1500, value:  2.8 }, { year: 1600, value:  4.0 }, { year: 1700, value:  7.7 },
      { year: 1820, value: 15.8 }, { year: 1870, value: 27.0 }, { year: 1900, value: 25.4 },
      { year: 1913, value: 24.5 }, { year: 1950, value: 19.1 }, { year: 1973, value: 12.0 },
      { year: 2000, value:  9.7 }, { year: 2024, value:  6.8 },
    ],
    us:      [
      { year: 1820, value:  5.6 }, { year: 1870, value: 27.0 }, { year: 1900, value: 46.1 },
      { year: 1913, value: 58.1 }, { year: 1950, value: 82.8 }, { year: 1973, value: 67.1 },
      { year: 1990, value: 64.7 }, { year: 2000, value: 66.0 }, { year: 2010, value: 52.9 },
      { year: 2024, value: 49.5 },
    ],
    china:   [
      { year: 1500, value: 75.6 }, { year: 1600, value: 88.0 }, { year: 1700, value: 67.7 },
      { year: 1820, value:100.0 }, { year: 1870, value: 52.3 }, { year: 1913, value: 27.0 },
      { year: 1950, value: 14.0 }, { year: 1973, value: 13.9 }, { year: 1990, value: 23.8 },
      { year: 2000, value: 34.7 }, { year: 2010, value: 55.2 }, { year: 2024, value: 64.0 },
    ],
  },

  // TRADE — % world merchandise exports / 30 × 100
  trade: {
    dutch:   [
      { year: 1600, value: 43 }, { year: 1650, value: 83 }, { year: 1700, value: 67 },
      { year: 1750, value: 50 }, { year: 1820, value: 30 }, { year: 1870, value: 22 },
      { year: 1913, value: 20 }, { year: 1950, value: 10 }, { year: 2000, value: 12 }, { year: 2024, value: 10 },
    ],
    british: [
      { year: 1700, value: 17 }, { year: 1820, value: 57 }, { year: 1870, value: 100 },
      { year: 1900, value: 77 }, { year: 1913, value: 57 }, { year: 1950, value: 37 },
      { year: 1973, value: 22 }, { year: 2000, value: 17 }, { year: 2024, value: 10 },
    ],
    us:      [
      { year: 1900, value: 40 }, { year: 1913, value: 47 }, { year: 1950, value: 73 },
      { year: 1960, value: 67 }, { year: 1973, value: 43 }, { year: 2000, value: 42 }, { year: 2024, value: 28 },
    ],
    china:   [
      { year: 1820, value: 50 }, { year: 1870, value: 23 }, { year: 1913, value:  7 },
      { year: 1950, value:  3 }, { year: 1978, value:  5 }, { year: 1990, value: 12 },
      { year: 2000, value: 23 }, { year: 2010, value: 53 }, { year: 2024, value: 47 },
    ],
  },

  // MILITARY — COW CINC / 0.26 × 100  (Modelski & Thompson pre-1816)
  military: {
    dutch:   [
      { year: 1600, value: 15 }, { year: 1650, value: 22 }, { year: 1700, value: 19 },
      { year: 1750, value: 14 }, { year: 1800, value: 11 }, { year: 1820, value:  8 },
      { year: 1870, value:  4 }, { year: 1913, value:  3 }, { year: 2024, value:  2 },
    ],
    british: [
      { year: 1700, value: 46 }, { year: 1750, value: 58 }, { year: 1800, value: 65 },
      { year: 1820, value: 69 }, { year: 1850, value: 85 }, { year: 1870, value: 77 },
      { year: 1900, value: 54 }, { year: 1913, value: 54 }, { year: 1945, value: 29 },
      { year: 1970, value: 17 }, { year: 2000, value: 11 }, { year: 2024, value:  8 },
    ],
    us:      [
      { year: 1870, value: 19 }, { year: 1900, value: 42 }, { year: 1913, value: 46 },
      { year: 1945, value:100 }, { year: 1950, value: 81 }, { year: 1960, value: 54 },
      { year: 1980, value: 51 }, { year: 2000, value: 54 }, { year: 2016, value: 54 }, { year: 2024, value: 54 },
    ],
    china:   [
      { year: 1820, value: 19 }, { year: 1870, value: 21 }, { year: 1913, value: 17 },
      { year: 1950, value: 42 }, { year: 1970, value: 62 }, { year: 1990, value: 58 },
      { year: 2000, value: 62 }, { year: 2010, value: 71 }, { year: 2024, value: 77 },
    ],
  },

  // RESERVE CURRENCY — % global official FX reserves / 76 × 100
  reserve_currency: {
    dutch:   [
      { year: 1620, value: 26 }, { year: 1650, value: 46 }, { year: 1700, value: 39 },
      { year: 1750, value: 26 }, { year: 1800, value: 13 }, { year: 1870, value:  7 },
      { year: 1913, value:  5 }, { year: 2024, value:  4 },
    ],
    british: [
      { year: 1820, value: 47 }, { year: 1870, value: 79 }, { year: 1890, value: 86 },
      { year: 1913, value: 66 }, { year: 1938, value: 46 }, { year: 1945, value: 26 },
      { year: 1960, value: 20 }, { year: 1980, value:  4 }, { year: 2000, value:  7 }, { year: 2024, value:  7 },
    ],
    us:      [
      { year: 1918, value: 20 }, { year: 1925, value: 39 }, { year: 1945, value: 66 },
      { year: 1950, value: 79 }, { year: 1960, value: 86 }, { year: 1970, value: 100 },
      { year: 1980, value: 88 }, { year: 1990, value: 72 }, { year: 2000, value: 93 },
      { year: 2010, value: 82 }, { year: 2020, value: 78 }, { year: 2024, value: 76 },
    ],
    china:   [
      { year: 1960, value:  2 }, { year: 1978, value:  2 }, { year: 2000, value:  4 },
      { year: 2010, value:  6 }, { year: 2016, value:  5 }, { year: 2020, value:  3 }, { year: 2024, value:  4 },
    ],
  },

  // EDUCATION — literacy rate % (Barro-Lee / van Zanden / UNESCO)
  education: {
    dutch:   [
      { year: 1600, value: 36 }, { year: 1650, value: 52 }, { year: 1700, value: 66 },
      { year: 1750, value: 70 }, { year: 1820, value: 65 }, { year: 1870, value: 75 },
      { year: 1900, value: 90 }, { year: 1950, value: 99 }, { year: 2000, value: 99 }, { year: 2024, value: 99 },
    ],
    british: [
      { year: 1600, value: 24 }, { year: 1700, value: 38 }, { year: 1820, value: 54 },
      { year: 1870, value: 75 }, { year: 1900, value: 90 }, { year: 1950, value: 98 },
      { year: 2000, value: 99 }, { year: 2024, value: 99 },
    ],
    us:      [
      { year: 1800, value: 55 }, { year: 1850, value: 78 }, { year: 1900, value: 89 },
      { year: 1950, value: 97 }, { year: 2000, value: 99 }, { year: 2024, value: 99 },
    ],
    china:   [
      { year: 1500, value: 22 }, { year: 1700, value: 22 }, { year: 1820, value: 20 },
      { year: 1913, value: 14 }, { year: 1950, value: 22 }, { year: 1960, value: 35 },
      { year: 1978, value: 66 }, { year: 1990, value: 78 }, { year: 2000, value: 91 },
      { year: 2010, value: 95 }, { year: 2024, value: 97 },
    ],
  },

  // INNOVATION — patent share + qualitative index (US 2000 = 100)
  innovation: {
    dutch:   [
      { year: 1600, value: 20 }, { year: 1650, value: 36 }, { year: 1700, value: 40 },
      { year: 1750, value: 30 }, { year: 1820, value: 20 }, { year: 1870, value: 18 },
      { year: 1913, value: 16 }, { year: 1950, value: 14 }, { year: 2000, value: 14 }, { year: 2024, value: 13 },
    ],
    british: [
      { year: 1700, value: 26 }, { year: 1750, value: 38 }, { year: 1800, value: 52 },
      { year: 1850, value: 72 }, { year: 1900, value: 65 }, { year: 1913, value: 60 },
      { year: 1950, value: 50 }, { year: 1970, value: 42 }, { year: 2000, value: 38 }, { year: 2024, value: 36 },
    ],
    us:      [
      { year: 1850, value: 12 }, { year: 1900, value: 38 }, { year: 1913, value: 50 },
      { year: 1945, value: 72 }, { year: 1970, value: 90 }, { year: 1990, value: 96 },
      { year: 2000, value: 100 }, { year: 2010, value: 92 }, { year: 2024, value: 88 },
    ],
    china:   [
      { year: 1500, value: 18 }, { year: 1700, value: 10 }, { year: 1850, value:  6 },
      { year: 1950, value:  5 }, { year: 1978, value:  8 }, { year: 1990, value: 14 },
      { year: 2000, value: 22 }, { year: 2010, value: 48 }, { year: 2024, value: 78 },
    ],
  },

  // GOVERNANCE — Polity V (score+10)/20×100; pre-1800 estimated
  governance: {
    dutch:   [
      { year: 1580, value: 58 }, { year: 1620, value: 65 }, { year: 1650, value: 68 },
      { year: 1700, value: 70 }, { year: 1750, value: 68 }, { year: 1820, value: 73 },
      { year: 1870, value: 80 }, { year: 1913, value: 85 }, { year: 1950, value: 100 },
      { year: 2000, value: 100 }, { year: 2024, value: 100 },
    ],
    british: [
      { year: 1700, value: 65 }, { year: 1750, value: 70 }, { year: 1820, value: 75 },
      { year: 1870, value: 80 }, { year: 1913, value: 80 }, { year: 1950, value: 100 },
      { year: 2000, value: 100 }, { year: 2024, value: 100 },
    ],
    us:      [
      { year: 1800, value: 100 }, { year: 1870, value: 100 }, { year: 1913, value: 100 },
      { year: 1950, value: 100 }, { year: 2000, value: 100 }, { year: 2020, value:  90 },
      { year: 2024, value:  95 },
    ],
    china:   [
      { year: 1800, value: 18 }, { year: 1850, value: 18 }, { year: 1913, value: 45 },
      { year: 1950, value: 15 }, { year: 1978, value: 15 }, { year: 2000, value: 15 }, { year: 2024, value: 15 },
    ],
  },

  // WEALTH EQUALITY — 100 minus top-10% income share (WID.world / Piketty)
  wealth_equality: {
    dutch:   [
      { year: 1850, value: 45 }, { year: 1900, value: 45 }, { year: 1950, value: 60 },
      { year: 1980, value: 69 }, { year: 2000, value: 70 }, { year: 2020, value: 68 },
    ],
    british: [
      { year: 1820, value: 45 }, { year: 1870, value: 35 }, { year: 1900, value: 32 },
      { year: 1950, value: 58 }, { year: 1970, value: 66 }, { year: 2000, value: 60 }, { year: 2024, value: 60 },
    ],
    us:      [
      { year: 1820, value: 55 }, { year: 1870, value: 50 }, { year: 1929, value: 51 },
      { year: 1950, value: 66 }, { year: 1970, value: 67 }, { year: 1990, value: 56 },
      { year: 2000, value: 53 }, { year: 2024, value: 54 },
    ],
    china:   [
      { year: 1950, value: 70 }, { year: 1978, value: 72 }, { year: 1990, value: 65 },
      { year: 2000, value: 57 }, { year: 2010, value: 53 }, { year: 2024, value: 56 },
    ],
  },
}

// =============================================================================
// EMPIRE METADATA
// =============================================================================
export const currentPhaseIndicators: PhaseIndicator[] = [
  {
    label: "Debt & Money Printing",
    status: "critical",
    detail: "US federal debt $36T (2025). Fed balance sheet $7T vs $900B pre-2008. Classic late-cycle debt monetisation.",
  },
  {
    label: "Wealth Gap",
    status: "critical",
    detail: "US top-10 % income share: ~46 % (WID 2024) — matching 1929 levels. Historically precedes political upheaval.",
  },
  {
    label: "Political Conflict",
    status: "critical",
    detail: "Polity V temporarily downgraded US in 2021. Internal conflict index at multi-decade highs per COW data.",
  },
  {
    label: "Reserve Currency",
    status: "warning",
    detail: "USD share of global reserves: 58 % (IMF COFER Q3 2024), down from 76 % in 1970. Long structural decline continues.",
  },
  {
    label: "Great Power Competition",
    status: "warning",
    detail: "China CINC (~0.20) approaches US CINC (~0.14). China now #1 in world exports and patent applications (WIPO 2023).",
  },
  {
    label: "Technology & Innovation",
    status: "positive",
    detail: "US still leads in AI, semiconductors, and scientific publications. Largest advantage remaining from the post-WWII era.",
  },
]
