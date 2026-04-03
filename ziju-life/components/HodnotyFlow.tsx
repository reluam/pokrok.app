"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useUserContext } from "@/hooks/useUserContext"
import { hodnotyFromApi, hodnotyToApi } from "@/lib/context-transforms"

// ── Konstanty ───────────────────────────────────────────────────────────────

const LS_KEY       = "hodnoty-data"
const COLOR_ACTIVE = "#FF8C42"
const STRONG_PRIMARY = 5
const STRONG_MAX     = 7

const ALL_VALUES = [
  "Altruismus", "Autenticita", "Činorodost", "Dobrodružství", "Flexibilita",
  "Harmonie", "Humor", "Hravost", "Individualita", "Integrita",
  "Intuice", "Jedinečnost", "Jistota", "Kariéra", "Klid",
  "Komunita", "Kreativita", "Láska", "Loajalita", "Materiální zabezpečení",
  "Mír", "Moudrost", "Nadhled", "Nezávislost", "Odvaha",
  "Otevřenost", "Peníze", "Příroda", "Poctivost", "Pochopení",
  "Pokora", "Postavení", "Pravdivost", "Přátelství",
  "Radost", "Rodina", "Síla", "Sláva", "Spiritualita",
  "Spolehlivost", "Spravedlnost", "Svědomí", "Svoboda", "Štěstí",
  "Tolerance", "Upřímnost", "Úspěch", "Víra", "Volný čas",
  "Vděčnost", "Vyrovnanost", "Vzájemnost", "Vzdělání", "Zdraví",
  "Zvědavost",
]

// ── Typy ────────────────────────────────────────────────────────────────────

type Rating = "strong" | "somewhat" | "no"

export type HodnotyData = {
  finalValues:      string[]
  alignmentScores?: Record<string, number>  // 1–10: jak moc teď žiješ podle této hodnoty
  savedAt:          string
}

// ── Game component ───────────────────────────────────────────────────────────

function ValuesGame({ onComplete }: { onComplete: (values: string[]) => void }) {
  // onComplete → moves to alignment phase
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [cols, setCols] = useState<Record<Rating, string[]>>({ strong: [], somewhat: [], no: [] })
  const [dragVal, setDragVal] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<Rating | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragRef = useRef<string | null>(null)

  const values   = ALL_VALUES
  const swipeDone = swipeIndex >= values.length
  const canConfirm = swipeDone && cols.strong.length >= STRONG_PRIMARY
  const totalRated = cols.strong.length + cols.somewhat.length + cols.no.length

  const rate = (r: Rating) => {
    setCols(prev => ({ ...prev, [r]: [...prev[r], values[swipeIndex]] }))
    setSwipeIndex(i => i + 1)
  }

  const cleanup = () => {
    dragRef.current = null
    setDragVal(null)
    setDragOver(null)
    setDragOverIdx(null)
  }

  const moveToCol = (val: string, to: Rating, toIdx?: number) => {
    setCols(prev => {
      const from = (["strong", "somewhat", "no"] as Rating[]).find(c => prev[c].includes(val))
      if (!from) return prev
      const fromArr = prev[from].filter(v => v !== val)
      if (from === to) {
        const idx = Math.min(toIdx ?? fromArr.length, fromArr.length)
        const arr = [...fromArr]
        arr.splice(idx, 0, val)
        return { ...prev, [from]: arr }
      }
      const toArr = toIdx !== undefined
        ? [...prev[to].slice(0, toIdx), val, ...prev[to].slice(toIdx)]
        : [...prev[to], val]
      return { ...prev, [from]: fromArr, [to]: toArr }
    })
  }

  const handleConfirm = () => {
    const final = cols.strong.slice(0, STRONG_MAX)
    onComplete(final)
  }

  // ── Chip ──────────────────────────────────────
  const Chip = ({ val, col, idx }: { val: string; col: Rating; idx: number }) => {
    const isPrimary   = col === "strong" && idx < STRONG_PRIMARY
    const isSecondary = col === "strong" && idx >= STRONG_PRIMARY && idx < STRONG_MAX
    return (
      <div
        draggable
        onDragStart={e => { dragRef.current = val; e.dataTransfer.effectAllowed = "move"; requestAnimationFrame(() => setDragVal(val)) }}
        onDragEnd={cleanup}
        className={[
          "px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-grab active:cursor-grabbing select-none flex items-center gap-1.5 transition-opacity",
          dragVal === val ? "opacity-20" :
          isPrimary   ? "border-2 border-[#FF8C42] bg-orange-50 text-orange-900 shadow-sm" :
          isSecondary ? "border-2 border-orange-200 bg-orange-50/50 text-orange-800" :
          col === "strong"   ? "border border-black/10 bg-white/50 text-foreground/35" :
          col === "somewhat" ? "border border-amber-200 bg-amber-50/60 text-amber-800" :
          "border border-black/[0.07] bg-white/50 text-foreground/40",
        ].join(" ")}
      >
        {col === "strong" && (
          <span className={`text-[9px] font-bold flex-shrink-0 ${isPrimary ? "text-orange-400" : isSecondary ? "text-orange-300" : "text-foreground/20"}`}>
            {idx + 1}
          </span>
        )}
        <span className="leading-tight">{val}</span>
      </div>
    )
  }

  // ── StrongSlot ────────────────────────────────
  const StrongSlot = ({ i }: { i: number }) => {
    const val      = cols.strong[i]
    const isTarget = dragOver === "strong" && dragOverIdx === i
    return (
      <div
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver("strong"); setDragOverIdx(i) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setDragOver(null); setDragOverIdx(null) } }}
        onDrop={e => { e.stopPropagation(); if (dragRef.current) moveToCol(dragRef.current, "strong", i); cleanup() }}
        className={`rounded-xl transition-all ${isTarget ? "ring-2 ring-[#FF8C42]/50 ring-offset-1" : ""}`}
      >
        {val ? (
          <Chip val={val} col="strong" idx={i} />
        ) : (
          <div className={`h-7 rounded-xl flex items-center justify-center border-2 border-dashed transition-colors ${
            isTarget ? "border-[#FF8C42] bg-orange-50/40" :
            i < STRONG_PRIMARY ? "border-orange-200 bg-orange-50/20" : "border-orange-100 bg-orange-50/10"
          }`}>
            <span className={`text-[9px] font-bold ${i < STRONG_PRIMARY ? "text-orange-300" : "text-orange-200"}`}>{i + 1}</span>
          </div>
        )}
      </div>
    )
  }

  // ── ColWrap ───────────────────────────────────
  const ColWrap = ({ colKey, label, accent, children }: { colKey: Rating; label: string; accent: string; children: React.ReactNode }) => {
    const isOver = dragOver === colKey && dragOverIdx === null
    return (
      <div
        className="rounded-2xl p-2.5 min-h-[100px] border-2 transition-colors"
        style={isOver ? { borderColor: accent + "55", background: accent + "08" } : { borderColor: "rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.01)" }}
        onDragOver={e => { e.preventDefault(); setDragOver(colKey); setDragOverIdx(null) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setDragOver(null); setDragOverIdx(null) } }}
        onDrop={e => { if (e.defaultPrevented) return; if (dragRef.current) moveToCol(dragRef.current, colKey); cleanup() }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider leading-tight" style={{ color: accent }}>{label}</p>
          <span className="text-[10px] text-foreground/30">{cols[colKey].length}</span>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Swipe card */}
      {!swipeDone && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Jaké hodnoty ti rezonují?</p>
            <span className="text-xs text-foreground/40">{swipeIndex + 1} / {values.length}</span>
          </div>
          <div className="h-1 rounded-full bg-black/[0.06]">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${((swipeIndex + 1) / values.length) * 100}%`, background: COLOR_ACTIVE }} />
          </div>
          <div className="rounded-2xl bg-white border border-black/[0.08] shadow-sm px-6 py-8 text-center">
            <p className="text-2xl font-bold text-foreground">{values[swipeIndex]}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => rate("no")} className="px-3 py-3 rounded-xl border-2 border-black/10 bg-white/80 text-foreground/50 font-medium text-xs hover:border-black/20 hover:bg-black/[0.03] transition-all leading-snug">
              Nesouzním /<br />je mi to jedno
            </button>
            <button onClick={() => rate("somewhat")} className="px-3 py-3 rounded-xl border-2 border-amber-200 bg-amber-50/80 text-amber-700 font-medium text-xs hover:border-amber-300 hover:bg-amber-100 transition-all leading-snug">
              Spíše souzním
            </button>
            <button onClick={() => rate("strong")} className="px-3 py-3 rounded-xl border-2 border-green-200 bg-green-50/80 text-green-700 font-medium text-xs hover:border-green-300 hover:bg-green-100 transition-all leading-snug">
              Naprosto souzním
            </button>
          </div>
        </>
      )}

      {/* Arrange columns */}
      {totalRated > 0 && (
        <>
          {swipeDone && (
            <p className="text-sm text-foreground/55">
              Přetahuj hodnoty mezi sloupci i v rámci sloupce <strong>Naprosto souzním</strong> (změna pořadí).
              Prvních 5 míst jsou tvoje klíčové hodnoty.
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            <ColWrap colKey="strong" label="Naprosto souzním" accent={COLOR_ACTIVE}>
              <div className="space-y-1">
                {Array.from({ length: STRONG_MAX }).map((_, i) => <StrongSlot key={i} i={i} />)}
                {cols.strong.slice(STRONG_MAX).map((val, j) => (
                  <div
                    key={val}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver("strong"); setDragOverIdx(STRONG_MAX + j) }}
                    onDrop={e => { e.stopPropagation(); if (dragRef.current) moveToCol(dragRef.current, "strong", STRONG_MAX + j); cleanup() }}
                  >
                    <Chip val={val} col="strong" idx={STRONG_MAX + j} />
                  </div>
                ))}
              </div>
            </ColWrap>

            <ColWrap colKey="somewhat" label="Spíše souzním" accent="#D97706">
              <div className="space-y-1">
                {cols.somewhat.map((val, i) => <Chip key={val} val={val} col="somewhat" idx={i} />)}
              </div>
            </ColWrap>

            <ColWrap colKey="no" label="Nesouzním / je mi to jedno" accent="rgba(0,0,0,0.3)">
              <div className="space-y-1">
                {cols.no.map((val, i) => <Chip key={val} val={val} col="no" idx={i} />)}
              </div>
            </ColWrap>
          </div>

          {swipeDone && (
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setSwipeIndex(0); setCols({ strong: [], somewhat: [], no: [] }) }}
                className="px-4 py-2 text-sm rounded-xl border border-black/10 bg-white text-foreground/50 hover:bg-black/[0.03] transition-all"
              >
                ← Znovu
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="flex-1 px-4 py-2 text-sm rounded-xl text-white font-medium transition-all disabled:opacity-30 hover:shadow-md"
                style={{ background: COLOR_ACTIVE }}
              >
                Tohle jsou moje hodnoty →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Alignment step ───────────────────────────────────────────────────────────

function ValuesAlignment({
  values,
  onComplete,
}: {
  values: string[]
  onComplete: (scores: Record<string, number>) => void
}) {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(values.map(v => [v, 5]))
  )

  const set = (v: string, n: number) => setScores(prev => ({ ...prev, [v]: n }))

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35 mb-1">Žiješ podle svých hodnot?</p>
        <p className="text-sm text-foreground/55 leading-relaxed">
          Ohodnoť, jak moc teď opravdu žiješ podle každé ze svých hodnot. Ne jak bys chtěl/a — jak to skutečně je.
        </p>
      </div>

      <div className="space-y-4">
        {values.map((v, i) => (
          <div key={v} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold ${i < 5 ? "text-orange-400" : "text-orange-300"}`}>{i + 1}</span>
                <span className="text-sm font-semibold text-foreground">{v}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: COLOR_ACTIVE }}>{scores[v]}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 10 }).map((_, n) => {
                const val = n + 1
                const active = val <= scores[v]
                return (
                  <button
                    key={val}
                    onClick={() => set(v, val)}
                    className="flex-1 h-5 rounded-sm transition-all"
                    style={{ background: active ? COLOR_ACTIVE : "rgba(0,0,0,0.06)" }}
                  />
                )
              })}
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-foreground/30">vůbec ne</span>
              <span className="text-[10px] text-foreground/30">naprosto ano</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onComplete(scores)}
        className="w-full py-3 rounded-full text-white font-bold text-sm transition-colors"
        style={{ background: COLOR_ACTIVE }}
      >
        Uložit →
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
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Hodnoty</p>
          <p className="text-sm text-foreground/50 mt-0.5">
            Prvních 5 jsou tvoje klíčové hodnoty — zbytek jsou podpůrné.
          </p>
        </div>
        {confirmReset ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-foreground/50">Opravdu?</span>
            <button onClick={() => { setConfirmReset(false); onReset() }}
              className="text-xs text-red-500 font-semibold hover:text-red-600 transition-colors">Ano</button>
            <button onClick={() => setConfirmReset(false)}
              className="text-xs text-foreground/35 hover:text-foreground/55 transition-colors">Zrušit</button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)}
            className="text-sm text-foreground/35 hover:text-foreground/55 transition-colors flex-shrink-0">
            Projít znovu
          </button>
        )}
      </div>

      {/* Values chips with alignment score */}
      <div className="rounded-2xl bg-white border border-black/[0.08] shadow-sm px-5 py-5">
        <div className="space-y-2">
          {data.finalValues.map((val, i) => {
            const score = data.alignmentScores?.[val]
            const isPrimary = i < STRONG_PRIMARY
            return (
              <div key={val} className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium flex-1 ${
                    isPrimary
                      ? "border-2 border-[#FF8C42] bg-orange-50 text-orange-900 shadow-sm"
                      : "border-2 border-orange-200 bg-orange-50/50 text-orange-800"
                  }`}
                >
                  <span className={`text-[10px] font-bold ${isPrimary ? "text-orange-400" : "text-orange-300"}`}>
                    {i + 1}
                  </span>
                  {val}
                </span>
                {score !== undefined && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, n) => (
                        <div
                          key={n}
                          className="w-2 h-2 rounded-sm"
                          style={{ background: n < score ? COLOR_ACTIVE : "rgba(0,0,0,0.08)" }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-foreground/40">{score}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="w-full px-4 py-2.5 text-sm rounded-xl border border-black/10 bg-white font-medium text-foreground/50 hover:bg-black/[0.03] hover:text-foreground transition-all"
      >
        {copied ? "✓ Zkopírováno" : "Kopírovat hodnoty"}
      </button>

      {/* Context description */}
      <div className="rounded-2xl bg-black/[0.02] border border-black/[0.05] px-4 py-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/30">Jak s hodnotami pracovat</p>
        <p className="text-sm text-foreground/55 leading-relaxed">
          Hodnoty jsou tvůj vnitřní kompas — ne pravidla, ale kritéria rozhodování. Když se ocitneš na
          rozcestí, zeptej se: <em>„Která z těchto cest je v souladu s mými hodnotami?"</em>
        </p>
        <p className="text-sm text-foreground/55 leading-relaxed">
          Zkus si jednou týdně říct, zda jsi minulý týden žil v souladu se svými top 5 hodnotami.
          Mezera mezi tím, co říkáš, že je důležité, a tím, jak skutečně žiješ, je nejčastějším zdrojem nespokojenosti.
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

  const [phase, setPhase] = useState<"loading" | "flow" | "alignment" | "done">("loading")
  const [pendingValues, setPendingValues] = useState<string[]>([])

  // Sync phase with context loading state
  useEffect(() => {
    if (ctx.loading) return
    if (ctx.data) {
      setPhase("done")
    } else if (phase === "loading") {
      setPhase("flow")
    }
  }, [ctx.loading, ctx.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const hodnotyData = ctx.data

  const handleGameComplete = useCallback((values: string[]) => {
    setPendingValues(values)
    setPhase("alignment")
  }, [])

  const handleAlignmentComplete = useCallback((scores: Record<string, number>) => {
    const data: HodnotyData = {
      finalValues: pendingValues,
      alignmentScores: scores,
      savedAt: new Date().toISOString(),
    }
    ctx.save(data)
    setPhase("done")
    onSaved?.()
  }, [pendingValues, onSaved, ctx])

  const handleReset = useCallback(() => {
    ctx.clear()
    setPendingValues([])
    setPhase("flow")
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
        : phase === "alignment"
          ? <ValuesAlignment values={pendingValues} onComplete={handleAlignmentComplete} />
          : <ValuesGame onComplete={handleGameComplete} />
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

      // ── Header ──
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

      const top5 = data.finalValues.slice(0, STRONG_PRIMARY);
      const rest = data.finalValues.slice(STRONG_PRIMARY);

      // ── Top 5 section ──
      doc.setFont("Roboto", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 140, 66);
      doc.text("KLÍČOVÉ HODNOTY", margin, y);
      y += 5;

      // Two-column grid for top 5
      const colW = (col - 4) / 2;
      top5.forEach((v, i) => {
        const col2 = i % 2;
        const x = margin + col2 * (colW + 4);
        const score = data.alignmentScores?.[v];

        doc.setFillColor(255, 247, 240);
        doc.setDrawColor(255, 140, 66);
        doc.roundedRect(x, y, colW, score !== undefined ? 16 : 12, 3, 3, "FD");

        doc.setFont("Roboto", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.text(v, x + 5, y + 6);

        if (score !== undefined) {
          // Tiny bar
          const barW = colW - 10;
          doc.setFillColor(230, 220, 210);
          doc.roundedRect(x + 5, y + 9, barW, 2.5, 1, 1, "F");
          doc.setFillColor(255, 140, 66);
          doc.roundedRect(x + 5, y + 9, barW * (score / 10), 2.5, 1, 1, "F");
          doc.setFont("Roboto", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(180, 120, 60);
          doc.text(`${score}/10`, x + colW - 5, y + 11, { align: "right" });
        }

        if (col2 === 1 || i === top5.length - 1) y += (score !== undefined ? 20 : 16);
      });

      y += 6;

      // ── Rest of values ──
      if (rest.length > 0) {
        doc.setFont("Roboto", "bold");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text("DALŠÍ DŮLEŽITÉ HODNOTY", margin, y);
        y += 5;

        const tagW = (col - 4) / 3;
        rest.forEach((v, i) => {
          const col3 = i % 3;
          const x = margin + col3 * (tagW + 2);
          const score = data.alignmentScores?.[v];

          doc.setFillColor(250, 250, 248);
          doc.setDrawColor(210, 210, 205);
          doc.roundedRect(x, y, tagW, score !== undefined ? 14 : 10, 2, 2, "FD");

          doc.setFont("Roboto", "normal");
          doc.setFontSize(8);
          doc.setTextColor(80, 80, 80);
          const label = v.length > 14 ? v.slice(0, 14) + "…" : v;
          doc.text(label, x + 4, y + 5);

          if (score !== undefined) {
            const barW = tagW - 8;
            doc.setFillColor(220, 215, 210);
            doc.roundedRect(x + 4, y + 8, barW, 2, 1, 1, "F");
            doc.setFillColor(180, 160, 140);
            doc.roundedRect(x + 4, y + 8, barW * (score / 10), 2, 1, 1, "F");
          }

          if (col3 === 2 || i === rest.length - 1) y += (score !== undefined ? 18 : 14);
        });
      }

      y += 8;

      // ── Footer ──
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
      className={className ?? "inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-foreground/15 bg-white/70 text-sm font-semibold text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 transition-colors disabled:opacity-50"}
    >
      {generating ? "Generuji…" : "Vytisknout"}
    </button>
  );
}
