"use client"

import { useState, useRef, useCallback, useEffect } from "react"

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
  "Pokora", "Postavení", "Poznání", "Pravdivost", "Přátelství",
  "Radost", "Rodina", "Síla", "Sláva", "Spiritualita",
  "Spolehlivost", "Spravedlnost", "Svědomí", "Svoboda", "Štěstí",
  "Tolerance", "Upřímnost", "Úspěch", "Víra", "Volný čas",
  "Vděčnost", "Vyrovnanost", "Vzájemnost", "Vzdělání", "Zdraví",
  "Zvědavost",
]

// ── Typy ────────────────────────────────────────────────────────────────────

type Rating = "strong" | "somewhat" | "no"

export type HodnotyData = {
  finalValues: string[]
  savedAt:     string
}

// ── Game component ───────────────────────────────────────────────────────────

function ValuesGame({ onComplete }: { onComplete: (values: string[]) => void }) {
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
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Moje hodnoty</p>
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

      {/* Values chips */}
      <div className="rounded-2xl bg-white border border-black/[0.08] shadow-sm px-5 py-5">
        <div className="flex flex-wrap gap-2">
          {data.finalValues.map((val, i) => (
            <span
              key={val}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${
                i < STRONG_PRIMARY
                  ? "border-2 border-[#FF8C42] bg-orange-50 text-orange-900 shadow-sm"
                  : "border-2 border-orange-200 bg-orange-50/50 text-orange-800"
              }`}
            >
              <span className={`text-[10px] font-bold ${i < STRONG_PRIMARY ? "text-orange-400" : "text-orange-300"}`}>
                {i + 1}
              </span>
              {val}
            </span>
          ))}
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

export default function HodnotyFlow() {
  const [hodnotyData, setHodnotyData] = useState<HodnotyData | null>(null)
  const [phase, setPhase]             = useState<"loading" | "flow" | "done">("loading")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        setHodnotyData(JSON.parse(saved) as HodnotyData)
        setPhase("done")
      } else {
        setPhase("flow")
      }
    } catch {
      setPhase("flow")
    }
  }, [])

  const handleComplete = useCallback((values: string[]) => {
    const data: HodnotyData = { finalValues: values, savedAt: new Date().toISOString() }
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
    setHodnotyData(data)
    setPhase("done")
  }, [])

  const handleReset = useCallback(() => {
    try { localStorage.removeItem(LS_KEY) } catch {}
    setHodnotyData(null)
    setPhase("flow")
  }, [])

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
        : <ValuesGame onComplete={handleComplete} />
      }
    </div>
  )
}
