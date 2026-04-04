"use client"

import { useState, useCallback, useEffect } from "react"
import { useUserContext } from "@/hooks/useUserContext"
import { hodnotyFromApi, hodnotyToApi } from "@/lib/context-transforms"

// ── Konstanty ───────────────────────────────────────────────────────────────

const LS_KEY       = "hodnoty-data"
const COLOR_ACTIVE = "#FF8C42"
const MAX_VALUES   = 5

export const VALUE_DESCRIPTIONS: Record<string, string> = {
  "Altruismus": "Nezištná pomoc druhým, ochota dávat bez očekávání něčeho na oplátku.",
  "Autenticita": "Být sám sebou, jednat v souladu s tím, kdo doopravdy jsi.",
  "Činorodost": "Potřeba být aktivní, tvořit a posouvat věci kupředu.",
  "Dobrodružství": "Touha po nových zážitcích, objevování a vykročení z komfortní zóny.",
  "Flexibilita": "Schopnost přizpůsobit se změnám a přijímat nečekané situace.",
  "Harmonie": "Rovnováha ve vztazích, vnitřní klid a bezkonfliktní soužití.",
  "Humor": "Schopnost vidět svět s nadhledem a nadsázkou, smát se i sobě.",
  "Hravost": "Lehkost v přístupu k životu, radost z experimentování a zkoušení.",
  "Individualita": "Respekt k vlastní jedinečnosti, odvaha jít vlastní cestou.",
  "Integrita": "Soulad mezi tím, co říkáš, a tím, co děláš. Morální celistvost.",
  "Intuice": "Důvěra ve vnitřní hlas a pocity, rozhodování se i bez racionální analýzy.",
  "Jedinečnost": "Potřeba odlišit se, vyniknout a být originální.",
  "Jistota": "Potřeba stability, předvídatelnosti a bezpečného zázemí.",
  "Kariéra": "Profesní růst, rozvoj dovedností a naplnění z práce.",
  "Klid": "Vnitřní mír, ticho a prostor pro sebe bez ruchu a spěchu.",
  "Komunita": "Sounáležitost se skupinou lidí, pocit někam patřit.",
  "Kreativita": "Potřeba tvořit, vymýšlet nové věci a hledat originální řešení.",
  "Láska": "Hluboké propojení s druhými, schopnost milovat a být milován.",
  "Loajalita": "Věrnost lidem, hodnotám nebo principům, na které se lze spolehnout.",
  "Materiální zabezpečení": "Finanční stabilita a dostatek prostředků pro důstojný život.",
  "Mír": "Touha po pokojném světě bez násilí a konfliktů.",
  "Moudrost": "Hluboké porozumění životu, schopnost vidět za povrch věcí.",
  "Nadhled": "Odstup od každodenních problémů, širší pohled na situace.",
  "Nezávislost": "Svoboda rozhodovat se sám za sebe, bez závislosti na druhých.",
  "Odvaha": "Ochota čelit strachu, riskovat a jednat i v nejistotě.",
  "Otevřenost": "Ochota přijímat nové názory, perspektivy a zkušenosti.",
  "Peníze": "Finanční prostředky jako nástroj svobody a možností.",
  "Příroda": "Spojení s přírodou, respekt k životnímu prostředí.",
  "Poctivost": "Čestné jednání, dodržování pravidel a férový přístup.",
  "Pochopení": "Empatie a snaha porozumět druhým lidem a jejich pohledu.",
  "Pokora": "Vědomí vlastních limitů, respekt k tomu, co přesahuje.",
  "Postavení": "Společenský status, uznání a vliv ve svém okolí.",
  "Pravdivost": "Závazek k pravdě, odmítání lží a přetvářky.",
  "Přátelství": "Blízké vztahy založené na důvěře, sdílení a vzájemné podpoře.",
  "Radost": "Schopnost prožívat štěstí z maličkostí a těšit se z úspěchů druhých.",
  "Rodina": "Rodinné vazby, blízkost a péče o své nejbližší.",
  "Síla": "Vnitřní odolnost, fyzická nebo psychická zdatnost.",
  "Sláva": "Touha být známý, uznávaný a obdivovaný širokým okolím.",
  "Spiritualita": "Duchovní rozměr života, hledání smyslu přesahujícího hmotný svět.",
  "Spolehlivost": "Být člověk, na kterého se druzí mohou spolehnout.",
  "Spravedlnost": "Férovost, rovné zacházení a ochrana práv všech.",
  "Svědomí": "Vnitřní morální kompas, schopnost rozlišovat správné od špatného.",
  "Svoboda": "Možnost žít podle vlastních pravidel bez vnějších omezení.",
  "Štěstí": "Celková životní spokojenost a pocit naplnění.",
  "Tolerance": "Respekt k odlišnostem, přijímání různých názorů a životních stylů.",
  "Upřímnost": "Otevřená komunikace, říkat věci na rovinu bez přetvářky.",
  "Úspěch": "Dosahování cílů, pocit, že to, co děláš, má výsledky.",
  "Víra": "Důvěra v něco většího — Boha, osud, smysl věcí.",
  "Volný čas": "Prostor pro odpočinek, koníčky a činnosti mimo povinnosti.",
  "Vděčnost": "Schopnost ocenit, co máš, a být vděčný za to dobré v životě.",
  "Vyrovnanost": "Emoční stabilita, klid i v náročných situacích.",
  "Vzájemnost": "Rovnocenné vztahy, kde obě strany dávají i přijímají.",
  "Vzdělání": "Celoživotní učení, touha po vědění a osobním rozvoji.",
  "Zdraví": "Péče o tělo i mysl, fyzická kondice a duševní pohoda.",
  "Zvědavost": "Touha zjišťovat, jak věci fungují, a klást si otázky.",
}

const ALL_VALUES = Object.keys(VALUE_DESCRIPTIONS)

// ── Typy ────────────────────────────────────────────────────────────────────

export type HodnotyData = {
  finalValues:      string[]
  alignmentScores?: Record<string, number>
  savedAt:          string
}

// ── Values picker ───────────────────────────────────────────────────────────

function ValuesPicker({ onComplete, initialValues }: { onComplete: (values: string[]) => void; initialValues?: string[] }) {
  const [selected, setSelected] = useState<string[]>(initialValues ?? [])
  const [search, setSearch] = useState("")
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const query = search.toLowerCase().trim()
  const filtered = query
    ? ALL_VALUES.filter(v => v.toLowerCase().includes(query) || VALUE_DESCRIPTIONS[v].toLowerCase().includes(query))
    : ALL_VALUES
  const available = filtered.filter(v => !selected.includes(v))

  const addValue = (v: string) => {
    if (selected.length >= MAX_VALUES) return
    setSelected(prev => [...prev, v])
    setHighlighted(v)
    setSearch("")
  }

  const removeValue = (v: string) => {
    setSelected(prev => prev.filter(x => x !== v))
    if (highlighted === v) setHighlighted(null)
  }

  const moveValue = (from: number, to: number) => {
    setSelected(prev => {
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-lg font-semibold uppercase tracking-wider text-foreground/35 mb-1">
          Vyber si {MAX_VALUES} hodnot, které jsou pro tebe nejdůležitější
        </p>
        <p className="text-base text-foreground/55 leading-relaxed">
          Hodnoty jsou tvůj vnitřní kompas. Pomáhají ti dělat rozhodnutí, která jsou v souladu s tím, kdo chceš být.
          Vyber maximum {MAX_VALUES} — méně je víc.
        </p>
      </div>

      {/* Selected values with drag reorder */}
      {selected.length > 0 && (
        <div className="space-y-2">
          <p className="text-base font-semibold text-foreground/40 uppercase tracking-wider">
            Moje hodnoty ({selected.length}/{MAX_VALUES})
          </p>
          <div className="space-y-1">
            {selected.map((v, i) => (
              <div
                key={v}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i) }}
                onDrop={() => { if (dragIdx !== null) moveValue(dragIdx, i); setDragIdx(null); setDragOverIdx(null) }}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                onClick={() => setHighlighted(v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-grab active:cursor-grabbing transition-all ${
                  dragOverIdx === i ? "ring-2 ring-accent/40 ring-offset-1" : ""
                } ${highlighted === v
                  ? "border-2 border-[#FF8C42] bg-orange-50 text-orange-900 shadow-sm"
                  : "border-2 border-orange-200 bg-orange-50/50 text-orange-800"
                }`}
              >
                <span className="text-foreground/20 text-base">⠿</span>
                <span className="text-base font-bold text-orange-400 w-5">{i + 1}.</span>
                <span className="text-base font-medium flex-1">{v}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeValue(v) }}
                  className="text-lg text-foreground/25 hover:text-red-400 transition-colors px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description of highlighted value */}
      {highlighted && (
        <div className="px-4 py-3 rounded-2xl bg-accent/[0.04] border border-accent/10">
          <p className="text-lg font-bold text-accent">{highlighted}</p>
          <p className="text-base text-foreground/55 mt-1 leading-relaxed">{VALUE_DESCRIPTIONS[highlighted]}</p>
        </div>
      )}

      {/* Search */}
      {selected.length < MAX_VALUES && (
        <div className="space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat hodnotu…"
            className="w-full px-4 py-2.5 border border-black/10 rounded-xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />

          {/* Values list */}
          <div className="max-h-[300px] overflow-y-auto overscroll-contain space-y-0.5 rounded-xl border border-black/[0.06] bg-white/50 p-1">
            {available.length === 0 && (
              <p className="text-base text-foreground/30 text-center py-4">Žádné výsledky</p>
            )}
            {available.map(v => (
              <button
                key={v}
                onClick={() => addValue(v)}
                onMouseEnter={() => setHighlighted(v)}
                className={`w-full text-left px-3 py-2 rounded-lg text-base transition-colors ${
                  highlighted === v
                    ? "bg-accent/10 text-accent"
                    : "text-foreground/60 hover:bg-accent/5 hover:text-accent"
                }`}
              >
                <span className="font-medium">{v}</span>
                <span className="text-foreground/30 ml-2">— {VALUE_DESCRIPTIONS[v].slice(0, 60)}{VALUE_DESCRIPTIONS[v].length > 60 ? "…" : ""}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm */}
      <button
        onClick={() => onComplete(selected)}
        disabled={selected.length === 0}
        className="w-full py-3 rounded-full text-white font-bold text-base transition-colors disabled:opacity-30 hover:shadow-md"
        style={{ background: COLOR_ACTIVE }}
      >
        {selected.length === MAX_VALUES
          ? "Tohle jsou moje hodnoty →"
          : selected.length > 0
            ? `Potvrdit ${selected.length} hodnot →`
            : "Vyber alespoň jednu hodnotu"
        }
      </button>
    </div>
  )
}

// ── Result view ──────────────────────────────────────────────────────────────

function ValuesResult({ data, onReset }: { data: HodnotyData; onReset: () => void }) {
  const [copied, setCopied]         = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(data.finalValues.join(" · ")).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-5">
      {/* Header + reset */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-semibold uppercase tracking-wider text-foreground/35">Moje hodnoty</p>
        </div>
        {confirmReset ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-lg text-foreground/50">Opravdu?</span>
            <button onClick={() => { setConfirmReset(false); onReset() }}
              className="text-lg text-red-500 font-semibold hover:text-red-600 transition-colors">Ano</button>
            <button onClick={() => setConfirmReset(false)}
              className="text-lg text-foreground/35 hover:text-foreground/55 transition-colors">Zrušit</button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)}
            className="text-base text-foreground/35 hover:text-foreground/55 transition-colors flex-shrink-0">
            Změnit hodnoty
          </button>
        )}
      </div>

      {/* Values */}
      <div className="rounded-2xl bg-white border border-black/[0.08] shadow-sm px-5 py-5">
        <div className="space-y-3">
          {data.finalValues.map((val, i) => (
            <div key={val} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-orange-400 w-5">{i + 1}.</span>
                <span className="text-base font-semibold text-foreground">{val}</span>
              </div>
              <p className="text-base text-foreground/45 pl-7 leading-relaxed">{VALUE_DESCRIPTIONS[val]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="w-full px-4 py-2.5 text-base rounded-xl border border-black/10 bg-white font-medium text-foreground/50 hover:bg-black/[0.03] hover:text-foreground transition-all"
      >
        {copied ? "✓ Zkopírováno" : "Kopírovat hodnoty"}
      </button>

      {/* How to use */}
      <div className="rounded-2xl bg-black/[0.02] border border-black/[0.05] px-4 py-3 space-y-2">
        <p className="text-lg font-semibold uppercase tracking-wider text-foreground/30">Jak s hodnotami pracovat</p>
        <p className="text-base text-foreground/55 leading-relaxed">
          Hodnoty jsou tvůj vnitřní kompas — ne pravidla, ale kritéria rozhodování. Když se ocitneš na
          rozcestí, zeptej se: <em>Která z těchto cest je v souladu s mými hodnotami?</em>
        </p>
      </div>
    </div>
  )
}

// ── Hlavní komponenta ────────────────────────────────────────────────────────

export default function HodnotyFlow({ onSaved }: { onSaved?: () => void } = {}) {
  const fromLs = useCallback((raw: string) => {
    try { return JSON.parse(raw) as HodnotyData } catch { return null }
  }, [])

  const ctx = useUserContext<HodnotyData>({
    contextType: "values",
    lsKey: LS_KEY,
    fromApi: hodnotyFromApi,
    toApi: hodnotyToApi,
    fromLs,
  })

  const [phase, setPhase] = useState<"loading" | "pick" | "done">("loading")

  useEffect(() => {
    if (ctx.loading) return
    if (ctx.data) {
      setPhase("done")
    } else if (phase === "loading") {
      setPhase("pick")
    }
  }, [ctx.loading, ctx.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const hodnotyData = ctx.data

  const handleComplete = useCallback((values: string[]) => {
    const data: HodnotyData = {
      finalValues: values,
      savedAt: new Date().toISOString(),
    }
    ctx.save(data)
    setPhase("done")
    onSaved?.()
  }, [onSaved, ctx])

  const handleReset = useCallback(() => {
    ctx.clear()
    setPhase("pick")
  }, [ctx])

  if (phase === "loading") {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5">
      {phase === "done" && hodnotyData
        ? <ValuesResult data={hodnotyData} onReset={handleReset} />
        : <ValuesPicker onComplete={handleComplete} initialValues={hodnotyData?.finalValues} />
      }
    </div>
  )
}

// ── PrintHodnotyButton ────────────────────────────────────────────────────────

export function PrintHodnotyButton({
  data,
  className,
}: {
  data: HodnotyData;
  className?: string;
}) {
  const [generating, setGenerating] = useState(false);

  const handleClick = useCallback(async () => {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");

      async function toBase64(url: string): Promise<string> {
        const buf = await fetch(url).then((r) => r.arrayBuffer());
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }
      const [fontRegular, fontBold] = await Promise.all([
        toBase64("/fonts/Roboto-Regular.ttf"),
        toBase64("/fonts/Roboto-Bold.ttf"),
      ]);

      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      doc.addFileToVFS("Roboto-Regular.ttf", fontRegular);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFileToVFS("Roboto-Bold.ttf", fontBold);
      doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

      const pageW = 210;
      const margin = 16;
      const col = pageW - margin * 2;
      let y = margin;

      doc.setFillColor(23, 23, 23);
      doc.roundedRect(margin, y, col, 22, 4, 4, "F");
      doc.setFont("Roboto", "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text("Moje hodnoty", margin + 8, y + 9);
      doc.setFont("Roboto", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(180, 170, 160);
      const savedDate = data.savedAt ? new Date(data.savedAt).toLocaleDateString("cs-CZ") : "";
      doc.text(`žiju.life · ${savedDate}`, margin + 8, y + 16);
      y += 30;

      const colW = (col - 4) / 2;
      data.finalValues.forEach((v, i) => {
        const col2 = i % 2;
        const x = margin + col2 * (colW + 4);

        doc.setFillColor(255, 247, 240);
        doc.setDrawColor(255, 140, 66);
        doc.roundedRect(x, y, colW, 12, 3, 3, "FD");
        doc.setFont("Roboto", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.text(v, x + 5, y + 6);

        if (col2 === 1 || i === data.finalValues.length - 1) y += 16;
      });

      y += 8;
      doc.setDrawColor(220, 215, 210);
      doc.line(margin, y, pageW - margin, y);
      y += 5;
      doc.setFont("Roboto", "normal");
      doc.setFontSize(7);
      doc.setTextColor(170, 165, 155);
      doc.text("Víš, co je pro tebe důležité. Teď žij podle toho.", margin, y);
      doc.text("žiju.life/manual", pageW - margin, y, { align: "right" });

      doc.save("hodnoty.pdf");
    } finally {
      setGenerating(false);
    }
  }, [data]);

  return (
    <button
      onClick={handleClick}
      disabled={generating}
      className={className ?? "inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-foreground/15 bg-white/70 text-base font-semibold text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 transition-colors disabled:opacity-50"}
    >
      {generating ? "Generuji…" : "Vytisknout"}
    </button>
  );
}
