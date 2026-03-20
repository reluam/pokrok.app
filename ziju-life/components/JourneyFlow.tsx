"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { steps, type Step, type Practice, type Resource } from "@/data/manualData"

// ── Sdílený typ stavu průvodce ─────────────────
export type JourneyState = {
  active?: number
  wheelVals?: Record<string, number>
  wheelAnswers?: Record<string, string>
  finalValues?: string[]
  visionData?: VisionData
  oblastiData?: OblastiData
  actionData?: ActionData
}

// ── Konstanty ─────────────────────────────────
const COLOR_DONE   = "#B8CBBF"
const COLOR_ACTIVE = "#FF8C42"
const COLOR_FUTURE = "#DDD9D3"
const DOT_SIZE     = 13

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Cvičení: { bg: "#EEEDFE", text: "#3C3489", border: "#C5C3F8" },
  Šablona: { bg: "#E1F5EE", text: "#085041", border: "#9FD9C3" },
  Kurz:    { bg: "#FAEEDA", text: "#633806", border: "#E8C07A" },
  Článek:  { bg: "#E6F1FB", text: "#0C447C", border: "#A3C9EE" },
}

// ── Resource chip ─────────────────────────────
function ResourceChip({ resource }: { resource: Resource }) {
  const tc = TYPE_COLORS[resource.type] ?? { bg: "#eee", text: "#333", border: "#ccc" }
  const chip = (
    <span
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all hover:shadow-sm hover:scale-[1.02] cursor-pointer"
      style={{ background: tc.bg, color: tc.text, borderColor: tc.border }}
    >
      <span className="text-[11px] opacity-60 font-normal">{resource.type}</span>
      {resource.label}
      {!resource.free && <span className="text-xs opacity-50">🔒</span>}
    </span>
  )
  if (resource.href) return <Link href={resource.href}>{chip}</Link>
  return chip
}

// ── Progress path ─────────────────────────────
function JourneyPath({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const N = steps.length
  const half = DOT_SIZE / 2

  return (
    <div className="relative">
      <div
        className="absolute h-px pointer-events-none"
        style={{ top: half - 0.5, left: half, right: half, background: COLOR_FUTURE, opacity: 0.7 }}
      />
      {active > 0 && (
        <div
          className="absolute h-px pointer-events-none transition-all duration-300"
          style={{
            top: half - 0.5,
            left: half,
            width: `calc(${active / (N - 1)} * (100% - ${DOT_SIZE}px))`,
            background: COLOR_DONE,
          }}
        />
      )}
      <div className="flex justify-between">
        {steps.map((s, i) => {
          const isActive = i === active
          const isDone   = i < active
          const isFuture = i > active
          return (
            <button
              key={s.id}
              onClick={() => onSelect(i)}
              className="flex flex-col items-center gap-2 relative z-10"
              style={{ opacity: isFuture ? 0.5 : 1 }}
            >
              <div
                className="rounded-full transition-all duration-200"
                style={{
                  width:  isActive ? DOT_SIZE + 3 : DOT_SIZE,
                  height: isActive ? DOT_SIZE + 3 : DOT_SIZE,
                  marginTop: isActive ? -1.5 : 0,
                  background: isDone ? COLOR_DONE : isActive ? COLOR_ACTIVE : "#EAE5DE",
                  border: `1.5px solid ${isDone ? COLOR_DONE : isActive ? COLOR_ACTIVE : COLOR_FUTURE}`,
                  boxShadow: isActive ? `0 0 0 3px ${COLOR_ACTIVE}28` : undefined,
                }}
              />
              <span style={{
                fontSize: 12,
                lineHeight: 1.2,
                color: isActive ? COLOR_ACTIVE : isDone ? "#9E9993" : "#C5C0BA",
                fontWeight: isActive ? 600 : 400,
                whiteSpace: "nowrap",
              }}>
                {s.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Practice Modal ────────────────────────────
function PracticeModal({ practice, onClose }: { practice: Practice; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[88vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ animation: "modal-in 0.18s ease-out" }}
      >
        <div className="bg-[#F7F4EE] px-8 pt-10 pb-7 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm" style={{ background: "rgba(255,255,255,0.8)" }}>
            {practice.icon}
          </div>
          <h3 className="text-xl font-bold text-foreground leading-tight mb-2">{practice.title}</h3>
          {practice.duration && (
            <span className="inline-block px-3 py-1 rounded-full text-xs bg-black/5 text-foreground/50">{practice.duration}</span>
          )}
        </div>
        <div className="px-8 py-7 space-y-6">
          <p className="text-base text-foreground/65 leading-relaxed">{practice.description}</p>
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Jak na to</p>
            <ol className="space-y-4">
              {practice.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5 shadow-sm" style={{ background: COLOR_ACTIVE }}>
                    {i + 1}
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-lg text-foreground/40 hover:bg-black/10 hover:text-foreground/70 transition-all leading-none"
          aria-label="Zavřít"
        >×</button>
      </div>
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── Practice card ──────────────────────────────
function PracticeCard({ practice, onClick }: { practice: Practice; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-black/10 bg-white/80 hover:bg-white hover:border-black/20 hover:shadow-sm hover:-translate-y-px active:translate-y-0 transition-all text-left group"
    >
      <span className="text-xl flex-shrink-0">{practice.icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground/80 leading-tight group-hover:text-foreground transition-colors">{practice.title}</p>
        <p className="text-xs text-foreground/40 mt-0.5">{practice.teaser}</p>
      </div>
    </button>
  )
}

// ── Share modal ───────────────────────────────
function ShareValuesModal({ values, onClose }: { values: string[]; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const pageUrl = "https://ziju.life/audit-zivota"
  const shareText = `Moje životní hodnoty:\n${values.join(" · ")}\n\nZjisti jaké jsou tvoje: ${pageUrl}\n#mojehodnoty #seberozvoj #zijulife`
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[88vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ animation: "modal-in 0.18s ease-out" }}
      >
        <div className="bg-[#F7F4EE] px-8 pt-10 pb-7 text-center">
          <h3 className="text-xl font-bold text-foreground mb-1">Sdílet moje hodnoty</h3>
          <p className="text-sm text-foreground/50">Řekni světu, co je pro tebe důležité</p>
        </div>

        <div className="px-8 py-7 space-y-5">
          {/* Náhled textu */}
          <div className="rounded-xl bg-black/[0.03] border border-black/10 p-4">
            <pre className="text-sm text-foreground/65 whitespace-pre-wrap font-sans leading-relaxed">{shareText}</pre>
          </div>

          {/* Zkopírovat */}
          <button
            onClick={handleCopy}
            className="w-full px-4 py-3 rounded-xl border border-black/15 bg-white hover:bg-black/[0.03] text-sm font-medium text-foreground/60 hover:text-foreground transition-all flex items-center justify-center gap-2"
          >
            {copied ? "✓ Zkopírováno" : "Zkopírovat text"}
          </button>

          {/* Platformy */}
          <div className="grid grid-cols-3 gap-3">
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-black/10 hover:border-black/20 hover:bg-black/[0.03] transition-all text-center"
            >
              <span className="text-lg font-bold text-foreground/80" style={{ fontFamily: "serif" }}>𝕏</span>
              <span className="text-xs font-medium text-foreground/55">Twitter / X</span>
              <span className="text-[10px] text-accent font-medium">Sdílet přímo</span>
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-black/10 hover:border-black/20 hover:bg-black/[0.03] transition-all text-center"
            >
              <span className="text-lg font-bold text-[#0A66C2]">in</span>
              <span className="text-xs font-medium text-foreground/55">LinkedIn</span>
              <span className="text-[10px] text-foreground/35">Sdílet odkaz</span>
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-black/10 hover:border-black/20 hover:bg-black/[0.03] transition-all text-center"
            >
              <span className="text-lg font-bold text-[#1877F2]">f</span>
              <span className="text-xs font-medium text-foreground/55">Facebook</span>
              <span className="text-[10px] text-foreground/35">Sdílet odkaz</span>
            </a>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-lg text-foreground/40 hover:bg-black/10 hover:text-foreground/70 transition-all leading-none"
          aria-label="Zavřít"
        >×</button>
      </div>
    </div>
  )
}

// ── Values game ───────────────────────────────
type Rating = "strong" | "somewhat" | "no"
type ValuesPhase = "swipe" | "arrange" | "done"

// ── Vision ────────────────────────────────────
export type VisionAnnotation = { id: string; start: number; end: number; text: string; note: string }
export type VisionData = { q1: string; q2: string; q3: string; annotations: VisionAnnotation[] }

// ── Oblasti ───────────────────────────────────
const OBLASTI_QUESTIONS = [
  "Co v téhle oblasti opravdu funguje? Co chci zachovat?",
  "Co nefunguje nebo mě tíží? Co chci změnit?",
  "Co konkrétně chci místo toho? Jak by to vypadalo, kdyby to fungovalo?",
]
export type OblastiData = { idealVals: Record<string, number>; answers: Record<string, string[]> }
const isOblastiComplete = (d: OblastiData) =>
  Object.values(d.idealVals).reduce((a, b) => a + b, 0) === 64

// ── Action ────────────────────────────────────
export type ActionData = { week: string[]; month: string[]; year: string[] }
const EMPTY_ACTION: ActionData = { week: ["", "", ""], month: ["", "", "", ""], year: ["", "", "", "", ""] }
const isActionComplete = (d: ActionData) =>
  d.week.every(s => s.trim()) && d.month.every(s => s.trim()) && d.year.every(s => s.trim())
const STRONG_PRIMARY = 5
const STRONG_MAX = 7

function StepValuesGame({
  step,
  onFinalValues,
  initialFinalValues,
}: {
  step: Step
  onFinalValues?: (values: string[]) => void
  initialFinalValues?: string[]
}) {
  const [swipeIndex, setSwipeIndex]   = useState(() => initialFinalValues?.length ? (step.values?.length ?? 0) : 0)
  const [cols, setCols]               = useState<Record<Rating, string[]>>(() =>
    initialFinalValues?.length
      ? { strong: initialFinalValues, somewhat: [], no: [] }
      : { strong: [], somewhat: [], no: [] }
  )
  const [dragVal, setDragVal]         = useState<string | null>(null)
  const [dragOver, setDragOver]       = useState<Rating | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [final, setFinal]             = useState<string[]>(initialFinalValues ?? [])
  const [valueCopied, setValueCopied] = useState(false)
  const dragRef                       = useRef<string | null>(null)

  // Report initial values to parent on first mount if restored
  const onFinalValuesRef = useRef(onFinalValues)
  useEffect(() => { onFinalValuesRef.current = onFinalValues }, [onFinalValues])
  useEffect(() => {
    if (initialFinalValues?.length) {
      onFinalValuesRef.current?.(initialFinalValues)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reset = useCallback(() => {
    setSwipeIndex(0)
    setCols({ strong: [], somewhat: [], no: [] })
    setFinal([])
    setValueCopied(false)
    dragRef.current = null
  }, [])

  if (!step.values?.length) return null
  const values    = step.values
  const swipeDone = swipeIndex >= values.length
  const canConfirm = swipeDone && cols.strong.length >= STRONG_PRIMARY
  const totalRated = cols.strong.length + cols.somewhat.length + cols.no.length

  const rate = (r: Rating) => {
    const val = values[swipeIndex]
    setCols(prev => ({ ...prev, [r]: [...prev[r], val] }))
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

  // ── Výsledek ────────────────────────────────
  if (final.length > 0) {
    return (
      <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5 space-y-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Tvoje hodnoty</p>
        <div className="rounded-2xl bg-white border border-black/[0.08] shadow-sm px-6 py-6">
          <p className="text-base text-foreground/75 leading-relaxed">{final.join(" · ")}</p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(final.join(" · ")).then(() => { setValueCopied(true); setTimeout(() => setValueCopied(false), 2000) })}
          className="w-full px-4 py-2.5 text-sm rounded-xl border border-black/10 bg-white font-medium text-foreground/55 hover:bg-black/[0.03] hover:text-foreground transition-all"
        >
          {valueCopied ? "✓ Zkopírováno" : "Kopírovat"}
        </button>
        <button onClick={reset} className="w-full text-xs text-foreground/35 hover:text-foreground/55 transition-colors py-1">
          Začít znovu
        </button>
      </div>
    )
  }

  // ── Chip ────────────────────────────────────
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
          col === "strong" ? "border border-black/10 bg-white/50 text-foreground/35" :
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

  // ── Slot in strong column (position-aware drop target) ──
  const StrongSlot = ({ i }: { i: number }) => {
    const val = cols.strong[i]
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

  // ── Column wrapper ───────────────────────────
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
    <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5 space-y-4">

      {/* ── Swipe card ─────────────────────────── */}
      {!swipeDone && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Jaké hodnoty ti rezonují?</p>
            <span className="text-xs text-foreground/40">{swipeIndex + 1} / {values.length}</span>
          </div>
          <div className="h-1 rounded-full bg-black/[0.06]">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((swipeIndex + 1) / values.length) * 100}%`, background: COLOR_ACTIVE }} />
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

      {/* ── Sloupce — viditelné hned od první hodnocené hodnoty ── */}
      {totalRated > 0 && (
        <>
          {swipeDone && (
            <p className="text-sm text-foreground/55">
              Přetahuj hodnoty mezi sloupci i v rámci sloupce <strong>Naprosto souzním</strong> (změna pořadí). Prvních 5 míst jsou tvoje klíčové hodnoty.
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            {/* Naprosto souzním */}
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

            {/* Spíše souzním */}
            <ColWrap colKey="somewhat" label="Spíše souzním" accent="#D97706">
              <div className="space-y-1">
                {cols.somewhat.map((val, i) => <Chip key={val} val={val} col="somewhat" idx={i} />)}
              </div>
            </ColWrap>

            {/* Nesouzním */}
            <ColWrap colKey="no" label="Nesouzním / je mi to jedno" accent="rgba(0,0,0,0.3)">
              <div className="space-y-1">
                {cols.no.map((val, i) => <Chip key={val} val={val} col="no" idx={i} />)}
              </div>
            </ColWrap>
          </div>

          {swipeDone && (
            <div className="flex gap-3 pt-1">
              <button onClick={reset} className="px-4 py-2 text-sm rounded-xl border border-black/10 bg-white text-foreground/50 hover:bg-black/[0.03] transition-all">
                ← Znovu
              </button>
              <button
                onClick={() => { const f = cols.strong.slice(0, STRONG_MAX); setFinal(f); onFinalValues?.(f) }}
                disabled={!canConfirm}
                className="flex-1 px-4 py-2 text-sm rounded-xl text-white font-medium transition-all disabled:opacity-30"
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

// ── Box: Seznam hodnot ────────────────────────
function StepValuesBox({ step }: { step: Step }) {
  if (!step.values?.length) return null
  const text = step.values.join(" · ")
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35 mb-4">
        Seznam hodnot — vyber si ty svoje
      </p>
      <p className="text-sm text-foreground/55 leading-relaxed">
        {text}
      </p>
    </div>
  )
}

// ── Box: Vize ─────────────────────────────────
function StepVisionBox({
  step,
  onDataChange,
  initialData,
}: {
  step: Step
  onDataChange?: (data: VisionData) => void
  initialData?: VisionData
}) {
  if (step.id !== "vize") return null

  const [q1, setQ1] = useState(initialData?.q1 ?? "")
  const [q2, setQ2] = useState(initialData?.q2 ?? "")
  const [q3, setQ3] = useState(initialData?.q3 ?? "")
  const [annotations, setAnnotations] = useState<VisionAnnotation[]>(initialData?.annotations ?? [])
  const [mode, setMode] = useState<"edit" | "annotate">("edit")
  const [pending, setPending] = useState<{ x: number; y: number; start: number; end: number; text: string } | null>(null)
  const [pendingNote, setPendingNote] = useState("")
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null)
  const textDisplayRef = useRef<HTMLDivElement>(null)

  const cbRef = useRef(onDataChange)
  useEffect(() => { cbRef.current = onDataChange }, [onDataChange])
  useEffect(() => { cbRef.current?.({ q1, q2, q3, annotations }) }, [q1, q2, q3, annotations])

  // Focus pending note input when popup appears
  const pendingInputRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (pending) setTimeout(() => pendingInputRef.current?.focus(), 50)
  }, [pending])

  const getOffset = (container: HTMLElement, node: Node, offset: number): number => {
    let total = 0
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    let current: Node | null
    while ((current = walker.nextNode())) {
      if (current === node) return total + offset
      total += current.textContent?.length ?? 0
    }
    return total
  }

  const handleMouseUp = () => {
    if (mode !== "annotate" || !textDisplayRef.current) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    if (!textDisplayRef.current.contains(range.commonAncestorContainer)) return
    const start = getOffset(textDisplayRef.current, range.startContainer, range.startOffset)
    const end = getOffset(textDisplayRef.current, range.endContainer, range.endOffset)
    if (start >= end) return
    const rect = range.getBoundingClientRect()
    const containerRect = textDisplayRef.current.getBoundingClientRect()
    setPending({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.bottom - containerRect.top,
      start,
      end,
      text: sel.toString(),
    })
    setPendingNote("")
    sel.removeAllRanges()
  }

  const confirmAnnotation = () => {
    if (!pending) return
    setAnnotations(prev => {
      const filtered = prev.filter(a => a.end <= pending.start || a.start >= pending.end)
      return [...filtered, { id: Math.random().toString(36).slice(2), start: pending.start, end: pending.end, text: pending.text, note: pendingNote }]
    })
    setPending(null)
  }

  const renderAnnotated = () => {
    if (!q3) return <span className="text-foreground/30 italic">Přepni do editace a nejdříve napiš svou vizi…</span>
    const sorted = [...annotations].sort((a, b) => a.start - b.start)
    const out: React.ReactNode[] = []
    let cursor = 0
    sorted.forEach((ann, i) => {
      if (ann.start > cursor) out.push(<span key={`t${i}`}>{q3.slice(cursor, ann.start)}</span>)
      out.push(
        <span
          key={ann.id}
          onClick={() => setActiveAnnotation(prev => prev === ann.id ? null : ann.id)}
          className="border-b-2 border-orange-400 text-orange-800 cursor-pointer hover:bg-orange-50 rounded-sm transition-colors"
          title={ann.note || "Klikni pro zobrazení poznámky"}
        >
          {q3.slice(ann.start, ann.end)}
        </span>
      )
      cursor = ann.end
    })
    if (cursor < q3.length) out.push(<span key="end">{q3.slice(cursor)}</span>)
    return out
  }

  const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start)

  return (
    <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5 space-y-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Tvoje vize</p>

      {/* Pole 1 — 80. narozeniny */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground/60 block leading-snug">
          🎂 Co by o tobě řekli tvoji blízcí na tvých 80. narozeninách?
        </label>
        <p className="text-xs text-foreground/35">Ze cvičení „80. narozeniny" — partner/ka, přátelé, děti, kolegové. Co chceš, aby po tobě zbylo?</p>
        <textarea
          value={q1}
          onChange={e => setQ1(e.target.value)}
          placeholder="Co by řekl/a tvůj partner nebo nejbližší přítel/kyně? Co tvoje děti? Co kolegové nebo komunita?…"
          rows={4}
          className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2.5 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 focus:bg-white transition-all"
        />
      </div>

      {/* Pole 2 — Den v životě */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground/60 block leading-snug">
          🌅 Popiš svůj ideální den za 5 let — od rána do večera
        </label>
        <p className="text-xs text-foreground/35">Ze cvičení „Den v životě" — buď konkrétní, piš v přítomném čase</p>
        <textarea
          value={q2}
          onChange={e => setQ2(e.target.value)}
          placeholder="Kde se probouzíš? Co děláš profesně? Jak vypadají tvé vztahy, večer, tělo?…"
          rows={5}
          className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2.5 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 focus:bg-white transition-all"
        />
      </div>

      {/* Pole 3 — Vize + anotace */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/60 block leading-snug">
          ✍️ Tvoje vize — spoj ideál s reálným
        </label>
        <p className="text-xs text-foreground/35">
          Z obou odpovědí výše napiš svou vizi. Pak přepni do <strong className="text-foreground/50">Podtrhávání</strong> — vyber slova, která tě zasáhnou, a přidej k nim emoci nebo poznámku.
        </p>

        {/* Mode toggle */}
        <div className="flex rounded-xl overflow-hidden border border-black/[0.08] w-fit">
          <button
            onClick={() => { setMode("edit"); setPending(null) }}
            className="px-3.5 py-1.5 text-xs font-semibold transition-colors"
            style={mode === "edit" ? { background: COLOR_ACTIVE, color: "white" } : { background: "transparent", color: "rgba(0,0,0,0.4)" }}
          >
            ✏️ Editace
          </button>
          <button
            onClick={() => setMode("annotate")}
            className="px-3.5 py-1.5 text-xs font-semibold transition-colors"
            style={mode === "annotate" ? { background: COLOR_ACTIVE, color: "white" } : { background: "transparent", color: "rgba(0,0,0,0.4)" }}
          >
            🖊 Podtrhávání
          </button>
        </div>

        {mode === "edit" ? (
          <textarea
            value={q3}
            onChange={e => setQ3(e.target.value)}
            placeholder="Napiš svou vizi v přítomném čase — jako by se to dělo teď…"
            rows={6}
            className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2.5 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 focus:bg-white transition-all"
          />
        ) : (
          <div className="relative" onClick={e => { if (e.target === e.currentTarget) setPending(null) }}>
            <div
              ref={textDisplayRef}
              onMouseUp={handleMouseUp}
              className="w-full text-sm rounded-xl border-2 border-orange-200 bg-amber-50/30 px-3 py-2.5 text-foreground/70 min-h-[140px] leading-relaxed select-text cursor-text"
            >
              {renderAnnotated()}
            </div>
            {q3 && (
              <p className="text-[10px] text-foreground/30 mt-1 text-center">Označ myší text a přidej k němu poznámku</p>
            )}

            {/* Popup pro novou anotaci */}
            {pending && (
              <div
                className="absolute z-20 bg-white rounded-2xl shadow-xl border border-black/[0.08] p-3 w-64"
                style={{ left: Math.max(0, Math.min(pending.x - 128, 9999)), top: pending.y + 8 }}
                onClick={e => e.stopPropagation()}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-1.5">
                  „{pending.text.length > 24 ? pending.text.slice(0, 24) + "…" : pending.text}"
                </p>
                <textarea
                  ref={pendingInputRef}
                  value={pendingNote}
                  onChange={e => setPendingNote(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); confirmAnnotation() } if (e.key === "Escape") setPending(null) }}
                  placeholder="Co jsi cítil/a? Emoce, myšlenka…"
                  rows={2}
                  className="w-full text-xs rounded-lg border border-black/[0.08] bg-white/90 px-2.5 py-1.5 text-foreground/70 placeholder:text-foreground/30 resize-none focus:outline-none focus:border-black/20 transition-all"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setPending(null)} className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-black/10 text-foreground/40 hover:text-foreground/60 transition-colors">
                    Zrušit
                  </button>
                  <button onClick={confirmAnnotation} className="flex-1 px-2 py-1.5 text-xs rounded-lg text-white font-medium" style={{ background: COLOR_ACTIVE }}>
                    Podtrhnout →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Seznam anotací */}
        {sortedAnnotations.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/30">Podtržená slova & poznámky</p>
            {sortedAnnotations.map((ann, i) => (
              <div
                key={ann.id}
                className={`rounded-xl px-3 py-2.5 text-sm border transition-colors ${activeAnnotation === ann.id ? "bg-orange-50 border-orange-200" : "bg-white/60 border-black/[0.06]"}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-orange-400 flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p
                      onClick={() => setActiveAnnotation(prev => prev === ann.id ? null : ann.id)}
                      className="text-foreground/70 font-medium border-b-2 border-orange-300 inline cursor-pointer leading-relaxed"
                    >
                      {ann.text}
                    </p>
                    {activeAnnotation === ann.id ? (
                      <div className="mt-1.5 space-y-1">
                        <textarea
                          value={ann.note}
                          onChange={e => setAnnotations(prev => prev.map(a => a.id === ann.id ? { ...a, note: e.target.value } : a))}
                          placeholder="Poznámka nebo emoce…"
                          rows={2}
                          autoFocus
                          className="w-full text-xs rounded-lg border border-black/[0.08] bg-white px-2.5 py-1.5 text-foreground/65 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 transition-all"
                        />
                        <button onClick={() => setActiveAnnotation(null)} className="text-xs text-foreground/35 hover:text-foreground/55 transition-colors">
                          Hotovo ✓
                        </button>
                      </div>
                    ) : ann.note ? (
                      <p className="text-xs text-foreground/50 italic leading-snug">{ann.note}</p>
                    ) : (
                      <p className="text-xs text-foreground/30 italic cursor-pointer" onClick={() => setActiveAnnotation(ann.id)}>Klikni pro přidání poznámky</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setAnnotations(prev => prev.filter(a => a.id !== ann.id)); if (activeAnnotation === ann.id) setActiveAnnotation(null) }}
                    className="text-foreground/20 hover:text-foreground/50 text-xs flex-shrink-0 transition-colors mt-0.5 leading-none"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Wheel of life ─────────────────────────────
const WHEEL_AREAS = [
  { key: "kariera",  label: "Kariéra & práce",             short: "Kariéra"   },
  { key: "finance",  label: "Finance",                      short: "Finance"   },
  { key: "zdravi",   label: "Zdraví & tělo",                short: "Zdraví"    },
  { key: "rodina",   label: "Rodina & partnerský vztah",    short: "Rodina"    },
  { key: "pratele",  label: "Přátelství & sociální život",  short: "Přátelé"   },
  { key: "rozvoj",   label: "Osobní rozvoj",                short: "Rozvoj"    },
  { key: "volny",    label: "Volný čas & záliby",           short: "Volný čas" },
  { key: "smysl",    label: "Duchovnost & smysl",           short: "Smysl"     },
]

const WHEEL_QUESTIONS = [
  { id: "q1", label: "Co ti v životě opravdu funguje — v jakékoliv oblasti?" },
  { id: "q2", label: "Proč to funguje? Co jsi udělal/a pro to, aby to tak bylo?" },
  { id: "q3", label: "Jak přenést tuto logiku úspěchu do oblasti, kde se trápím?" },
  { id: "q4", label: "Co si uvědomuji, když se upřímně podívám na svůj život právě teď?" },
  { id: "q5", label: "A ještě jednou — co si uvědomuji? (Třetí odpověď bývá nejhlubší.)" },
]

function StepWheelBox({
  step,
  onDataChange,
  initialVals,
  initialAnswers,
}: {
  step: Step
  onDataChange?: (vals: Record<string, number>, answers: Record<string, string>) => void
  initialVals?: Record<string, number>
  initialAnswers?: Record<string, string>
}) {
  if (step.id !== "start") return null

  const N = WHEEL_AREAS.length
  const SIZE = 270
  const CENTER = SIZE / 2
  const RADIUS = CENTER - 38

  const [vals, setVals] = useState<Record<string, number>>(
    initialVals ?? Object.fromEntries(WHEEL_AREAS.map(a => [a.key, 5]))
  )
  const [answers, setAnswers] = useState<Record<string, string>>(
    initialAnswers ?? Object.fromEntries(WHEEL_QUESTIONS.map(q => [q.id, ""]))
  )

  // Lift data nahoru pro export
  const cbRef = useRef(onDataChange)
  useEffect(() => { cbRef.current = onDataChange }, [onDataChange])
  useEffect(() => { cbRef.current?.(vals, answers) }, [vals, answers])

  const getPoint = (idx: number, v: number) => {
    const angle = (2 * Math.PI * idx) / N - Math.PI / 2
    const r = (v / 10) * RADIUS
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) }
  }

  const polygon = WHEEL_AREAS.map((a, i) => {
    const { x, y } = getPoint(i, vals[a.key])
    return `${x},${y}`
  }).join(" ")

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * SIZE
    const svgY = ((e.clientY - rect.top) / rect.height) * SIZE
    const dx = svgX - CENTER
    const dy = svgY - CENTER
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 8 || dist > RADIUS + 18) return

    const clickAngle = (Math.atan2(dy, dx) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI)
    let nearest = 0
    let minDiff = Infinity
    WHEEL_AREAS.forEach((_, i) => {
      const axisAngle = ((2 * Math.PI * i) / N + 2 * Math.PI) % (2 * Math.PI)
      let diff = Math.abs(axisAngle - clickAngle)
      if (diff > Math.PI) diff = 2 * Math.PI - diff
      if (diff < minDiff) { minDiff = diff; nearest = i }
    })

    const value = Math.max(1, Math.min(10, Math.round((dist / RADIUS) * 10)))
    setVals(prev => ({ ...prev, [WHEEL_AREAS[nearest].key]: value }))
  }

  const avg = (Object.values(vals).reduce((a, b) => a + b, 0) / N).toFixed(1)

  return (
    <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Kolo života</p>
        <span className="text-xs text-foreground/40">průměr <strong className="text-foreground/60">{avg}</strong>/10</span>
      </div>

      {/* Radar SVG */}
      <div className="flex justify-center">
        <svg
          width={SIZE} height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          onClick={handleSvgClick}
          style={{ cursor: "crosshair", userSelect: "none" }}
        >
          {/* Pozadí — kruhy */}
          {[2, 4, 6, 8, 10].map(r => (
            <circle key={r} cx={CENTER} cy={CENTER} r={(r / 10) * RADIUS}
              fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
          ))}
          {/* Číslice na ose nahoru */}
          {[2, 4, 6, 8, 10].map(r => (
            <text key={r}
              x={CENTER + 3}
              y={CENTER - (r / 10) * RADIUS + 3}
              fontSize="8" fill="rgba(0,0,0,0.22)" fontFamily="system-ui"
            >{r}</text>
          ))}
          {/* Osy */}
          {WHEEL_AREAS.map((a, i) => {
            const angle = (2 * Math.PI * i) / N - Math.PI / 2
            return (
              <line key={a.key}
                x1={CENTER} y1={CENTER}
                x2={CENTER + RADIUS * Math.cos(angle)}
                y2={CENTER + RADIUS * Math.sin(angle)}
                stroke="rgba(0,0,0,0.09)" strokeWidth="1"
              />
            )
          })}
          {/* Vyplněný polygon */}
          <polygon
            points={polygon}
            fill="rgba(255,140,66,0.18)"
            stroke={COLOR_ACTIVE}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Tečky */}
          {WHEEL_AREAS.map((a, i) => {
            const { x, y } = getPoint(i, vals[a.key])
            return <circle key={a.key} cx={x} cy={y} r="4.5" fill={COLOR_ACTIVE} />
          })}
          {/* Popisky */}
          {WHEEL_AREAS.map((a, i) => {
            const angle = (2 * Math.PI * i) / N - Math.PI / 2
            const lx = CENTER + (RADIUS + 24) * Math.cos(angle)
            const ly = CENTER + (RADIUS + 24) * Math.sin(angle)
            return (
              <text key={a.key}
                x={lx} y={ly}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fontWeight="500" fontFamily="system-ui"
                fill="rgba(0,0,0,0.5)"
              >
                {a.short}
              </text>
            )
          })}
        </svg>
      </div>

      <p className="text-[11px] text-foreground/30 text-center -mt-2">
        Klikni do grafu nebo nastav hodnoty níže
      </p>

      {/* Segmentové hodnocení */}
      <div className="space-y-2.5 pt-1 border-t border-black/[0.05]">
        {WHEEL_AREAS.map(a => (
          <div key={a.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground/55">{a.label}</span>
              <span className="text-xs font-bold" style={{ color: COLOR_ACTIVE }}>{vals[a.key]}</span>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-black/[0.08]">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  onClick={() => setVals(prev => ({ ...prev, [a.key]: n }))}
                  className="flex-1 py-1.5 text-[10px] font-semibold transition-colors border-r border-black/[0.06] last:border-r-0"
                  style={{
                    background: n <= vals[a.key] ? COLOR_ACTIVE : "rgba(0,0,0,0.02)",
                    color: n <= vals[a.key] ? "white" : "rgba(0,0,0,0.25)",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reflexní otázky */}
      <div className="space-y-4 pt-2 border-t border-black/[0.05]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Reflexe</p>
        {WHEEL_QUESTIONS.map((q, i) => (
          <div key={q.id} className="space-y-1.5">
            <label className="text-sm text-foreground/60 leading-snug block">
              <span className="font-medium text-foreground/40 mr-1.5">{i + 1}.</span>
              {q.label}
            </label>
            <textarea
              value={answers[q.id]}
              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Napiš sem svoji odpověď…"
              rows={2}
              className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 focus:bg-white transition-all"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Box 2: Obsah kroku ────────────────────────
function StepContentBox({ step, stepIndex }: { step: Step; stepIndex: number }) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm overflow-hidden">
      <div className="px-6 py-5 flex items-baseline gap-3 border-b border-black/[0.06]">
        <span className="text-[11px] font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: COLOR_ACTIVE }}>
          {stepIndex + 1} / {steps.length}
        </span>
        <h2 className="text-lg font-bold text-foreground leading-tight">{step.title}</h2>
      </div>
      <div className="px-6 py-5 space-y-4">
        <p className="text-base text-foreground/65 leading-relaxed">{step.description}</p>
        {step.points && step.points.length > 0 && !step.values?.length && step.id !== "start" && (
          <ul className="space-y-1.5">
            {step.points.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/55">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px]" style={{ background: COLOR_ACTIVE, opacity: 0.5 }} />
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Box 3: Cvičení ────────────────────────────
function StepPracticesBox({ step }: { step: Step }) {
  const [selected, setSelected] = useState<Practice | null>(null)
  if (!step.practices?.length) return null

  return (
    <>
      <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35 mb-4">
          Doporučená cvičení
        </p>
        <div className="flex flex-wrap gap-2">
          {step.practices.map(p => (
            <PracticeCard key={p.id} practice={p} onClick={() => setSelected(p)} />
          ))}
        </div>
      </div>

      {selected && (
        <PracticeModal practice={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

// ── Box: Oblasti ──────────────────────────────
function StepOblastiBox({
  step,
  currentVals,
  onDataChange,
  initialData,
}: {
  step: Step
  currentVals: Record<string, number>
  onDataChange?: (data: OblastiData) => void
  initialData?: OblastiData
}) {
  if (step.id !== "oblasti") return null

  const [idealVals, setIdealVals] = useState<Record<string, number>>(
    () => initialData?.idealVals ?? Object.fromEntries(WHEEL_AREAS.map(a => [a.key, currentVals[a.key] ?? 5]))
  )
  const [answers, setAnswers] = useState<Record<string, string[]>>(
    () => initialData?.answers ?? Object.fromEntries(WHEEL_AREAS.map(a => [a.key, ["", "", ""]]))
  )

  const cbRef = useRef(onDataChange)
  useEffect(() => { cbRef.current = onDataChange }, [onDataChange])
  useEffect(() => { cbRef.current?.({ idealVals, answers }) }, [idealVals, answers])

  const N = WHEEL_AREAS.length
  const sum = Object.values(idealVals).reduce((a, b) => a + b, 0)
  const avg = (sum / N).toFixed(1)
  const complete = sum === 64

  const improvingAreas = WHEEL_AREAS.filter(a => idealVals[a.key] > (currentVals[a.key] ?? 5))

  // Combined wheel SVG
  const SIZE = 260
  const CENTER = SIZE / 2
  const RADIUS = CENTER - 40
  const getPoint = (idx: number, v: number) => {
    const angle = (2 * Math.PI * idx) / N - Math.PI / 2
    const r = (v / 10) * RADIUS
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) }
  }
  const currentPolygon = WHEEL_AREAS.map((a, i) => { const { x, y } = getPoint(i, currentVals[a.key] ?? 5); return `${x},${y}` }).join(" ")
  const idealPolygon   = WHEEL_AREAS.map((a, i) => { const { x, y } = getPoint(i, idealVals[a.key]);          return `${x},${y}` }).join(" ")

  return (
    <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5 space-y-5">

      {/* Vysvětlení */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35 mb-2">Ideální rozložení oblastí</p>
        <div className="rounded-2xl bg-blue-50/70 border border-blue-100 px-4 py-3 text-sm text-foreground/65 leading-relaxed space-y-2">
          <p>
            Dokonalý život — kde je vše na 10 — neexistuje. Každá oblast, které věnuješ víc, bere energii z ostatních.
            Tenhle krok ti pomůže <strong className="text-foreground/80">vědomě rozdělit priority</strong> — i díky hodnotám, které sis vybral/a v předchozím cvičení.
          </p>
          <p>
            Nastav, jak by tvůj <em>ideální</em> pavučák měl vypadat.{" "}
            <strong className="text-foreground/80">Průměr musí být přesně 8</strong> (celkem 64 bodů na 8 oblastí).
            Co dostane 9–10? Co pro to ustoupí?
          </p>
        </div>
      </div>

      {/* Kombinovaný pavučák */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-4 text-[11px] text-foreground/45">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-1.5 rounded-full" style={{ background: "rgba(255,140,66,0.65)" }} />
            Dnes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 border-t-2 border-dashed border-blue-400 w-4" />
            Ideál
          </span>
        </div>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {[2,4,6,8,10].map(r => (
            <circle key={r} cx={CENTER} cy={CENTER} r={(r/10)*RADIUS} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
          ))}
          {WHEEL_AREAS.map((a, i) => {
            const angle = (2*Math.PI*i)/N - Math.PI/2
            return <line key={a.key} x1={CENTER} y1={CENTER} x2={CENTER+RADIUS*Math.cos(angle)} y2={CENTER+RADIUS*Math.sin(angle)} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
          })}
          <polygon points={currentPolygon} fill="rgba(255,140,66,0.15)" stroke="rgba(255,140,66,0.65)" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points={idealPolygon}   fill="rgba(55,138,221,0.10)" stroke="rgba(55,138,221,0.75)" strokeWidth="1.5" strokeDasharray="5,3" strokeLinejoin="round" />
          {WHEEL_AREAS.map((a, i) => {
            const angle = (2*Math.PI*i)/N - Math.PI/2
            const lx = CENTER + (RADIUS+24)*Math.cos(angle)
            const ly = CENTER + (RADIUS+24)*Math.sin(angle)
            return <text key={a.key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fontWeight="500" fontFamily="system-ui" fill="rgba(0,0,0,0.45)">{a.short}</text>
          })}
        </svg>
      </div>

      {/* Progress součtu */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-foreground/50">Celkem bodů</p>
          <span className={`text-sm font-bold ${complete ? "text-green-600" : sum > 64 ? "text-red-500" : "text-foreground/60"}`}>
            {sum} / 64 <span className="text-[11px] font-normal opacity-60">(průměr {avg})</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-black/[0.06] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{
            width: `${Math.min(100, (sum / 64) * 100)}%`,
            background: complete ? "#1D9E75" : sum > 64 ? "#ef4444" : "#378ADD",
          }} />
        </div>
        {sum > 64 && <p className="text-xs text-red-500">Příliš mnoho — potřebuješ odebrat {sum - 64} {sum - 64 === 1 ? "bod" : "body"}</p>}
        {sum < 64 && <p className="text-xs text-foreground/40">Chybí {64 - sum} {(64-sum) === 1 ? "bod" : "body"} do cíle</p>}
      </div>

      {/* Ovládání hodnot */}
      <div className="space-y-2.5 pt-1 border-t border-black/[0.05]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Nastav ideální hodnoty</p>
        {WHEEL_AREAS.map(a => {
          const current = currentVals[a.key] ?? 5
          const ideal   = idealVals[a.key]
          const diff    = ideal - current
          return (
            <div key={a.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground/55">{a.label}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-foreground/30">dnes: {current}</span>
                  {diff !== 0 && (
                    <span className={`font-semibold text-[11px] ${diff > 0 ? "text-blue-500" : "text-red-400"}`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  )}
                  <span className="font-bold w-4 text-right" style={{ color: "#378ADD" }}>{ideal}</span>
                </div>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-black/[0.08]">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setIdealVals(prev => ({ ...prev, [a.key]: n }))}
                    className="flex-1 py-1.5 text-[10px] font-semibold transition-colors border-r border-black/[0.06] last:border-r-0"
                    style={{
                      background: n <= ideal ? "rgba(55,138,221,0.75)" : "rgba(0,0,0,0.02)",
                      color:      n <= ideal ? "white" : "rgba(0,0,0,0.25)",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reflexní otázky pro oblasti se zlepšením */}
      {improvingAreas.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-black/[0.05]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35 mb-1">Reflexe ke zlepšujícím se oblastem</p>
            <p className="text-xs text-foreground/40">Pro každou oblast, kde cílíš výš než dnes, zodpověz tři otázky.</p>
          </div>
          {improvingAreas.map(a => (
            <div key={a.key} className="rounded-2xl overflow-hidden border border-black/[0.08]">
              <div className="px-4 py-2.5 border-b border-black/[0.05]" style={{ background: "#E6F1FB" }}>
                <p className="text-sm font-bold text-[#0C447C]">{a.label}</p>
                <p className="text-[10px] text-[#0C447C]/60">dnes {currentVals[a.key] ?? 5} → ideál {idealVals[a.key]}</p>
              </div>
              <div className="bg-white/50 px-4 py-3 space-y-3">
                {OBLASTI_QUESTIONS.map((q, qi) => (
                  <div key={qi} className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground/55 block leading-snug">
                      <span className="text-foreground/30 mr-1">{qi + 1}.</span>{q}
                    </label>
                    <textarea
                      value={answers[a.key]?.[qi] ?? ""}
                      onChange={e => setAnswers(prev => ({
                        ...prev,
                        [a.key]: prev[a.key].map((s, i) => i === qi ? e.target.value : s),
                      }))}
                      placeholder="Napiš sem svoji odpověď…"
                      rows={2}
                      className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 focus:bg-white transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status */}
      {complete ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-green-50 border border-green-200/60">
          <span>✅</span>
          <p className="text-sm text-green-700 font-medium">Průměr přesně 8 — ideální rozložení nastaveno. Můžeš pokračovat.</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200/60">
          <span>🔒</span>
          <p className="text-sm text-amber-700">Nastav hodnoty tak, aby jejich součet byl přesně <strong>64</strong> (průměr 8). Zbývá: {sum > 64 ? `−${sum-64}` : `+${64-sum}`}</p>
        </div>
      )}
    </div>
  )
}

// ── Box: Akce ─────────────────────────────────
function StepActionBox({
  step,
  onDataChange,
  initialData,
}: {
  step: Step
  onDataChange?: (data: ActionData) => void
  initialData?: ActionData
}) {
  if (step.id !== "akce") return null

  const [data, setData] = useState<ActionData>(initialData ?? EMPTY_ACTION)

  const cbRef = useRef(onDataChange)
  useEffect(() => { cbRef.current = onDataChange }, [onDataChange])
  useEffect(() => { cbRef.current?.(data) }, [data])

  const update = (section: keyof ActionData, idx: number, val: string) => {
    setData(prev => ({ ...prev, [section]: prev[section].map((s, i) => i === idx ? val : s) }))
  }

  const complete = isActionComplete(data)
  const filled = [...data.week, ...data.month, ...data.year].filter(s => s.trim()).length
  const total = 3 + 4 + 5

  const sections: { key: keyof ActionData; label: string; sublabel: string; count: number; accent: string; lightBg: string; accentBorder: string }[] = [
    { key: "week",  label: "Tento týden",  sublabel: "3 konkrétní kroky, které uděláš do 7 dní", count: 3, accent: "#FF8C42", lightBg: "#FFF4ED", accentBorder: "#FFD4A8" },
    { key: "month", label: "Tento měsíc",  sublabel: "4 kroky na nejbližší 4 týdny",             count: 4, accent: "#378ADD", lightBg: "#E6F1FB", accentBorder: "#A8CFEF" },
    { key: "year",  label: "Tento rok",    sublabel: "5 milníků — co chceš stihnout do 12 měsíců", count: 5, accent: "#1D9E75", lightBg: "#E1F5EE", accentBorder: "#9FD9C3" },
  ]

  return (
    <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5 space-y-5">
      {/* Hlavička s progresem */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Tvůj akční plán</p>
        <div className="flex items-center gap-2">
          <div className="flex h-1.5 w-24 rounded-full bg-black/[0.07] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(filled / total) * 100}%`, background: complete ? "#1D9E75" : COLOR_ACTIVE }} />
          </div>
          <span className="text-[11px] font-semibold" style={{ color: complete ? "#1D9E75" : "rgba(0,0,0,0.35)" }}>
            {filled}/{total}
          </span>
        </div>
      </div>

      {sections.map(sec => (
        <div key={sec.key} className="rounded-2xl overflow-hidden border border-black/[0.06]">
          {/* Section header */}
          <div className="px-4 py-3 flex items-start justify-between" style={{ background: sec.lightBg, borderBottom: `1px solid ${sec.accentBorder}33` }}>
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: sec.accent }}>{sec.label}</p>
              <p className="text-[11px] text-foreground/45 mt-0.5">{sec.sublabel}</p>
            </div>
            <span className="text-[10px] font-semibold mt-0.5" style={{ color: sec.accent + "99" }}>
              {data[sec.key].filter(s => s.trim()).length}/{sec.count}
            </span>
          </div>

          {/* Inputs */}
          <div className="divide-y divide-black/[0.04] bg-white/50">
            {Array.from({ length: sec.count }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                {/* Číslo / checkmark */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors"
                  style={data[sec.key][i].trim()
                    ? { background: sec.accent, color: "white" }
                    : { background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.25)" }
                  }>
                  {data[sec.key][i].trim() ? "✓" : i + 1}
                </div>
                <input
                  type="text"
                  value={data[sec.key][i]}
                  onChange={e => update(sec.key, i, e.target.value)}
                  placeholder={
                    sec.key === "year"
                      ? `Milník ${i + 1} — co chceš do roka dosáhnout?`
                      : sec.key === "month"
                      ? `Krok ${i + 1} — co konkrétně uděláš tento měsíc?`
                      : `Krok ${i + 1} — co uděláš tento týden?`
                  }
                  className="flex-1 text-sm text-foreground/70 placeholder:text-foreground/25 bg-transparent border-none outline-none py-0.5"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Status */}
      {complete ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-green-50 border border-green-200/60">
          <span className="text-base">✅</span>
          <p className="text-sm text-green-700 font-medium">Skvělé! Tvůj akční plán je připravený. Můžeš pokračovat.</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200/60">
          <span className="text-base">🔒</span>
          <p className="text-sm text-amber-700">Vyplň všechny kroky a milníky, abys mohl/a pokračovat dál.</p>
        </div>
      )}
    </div>
  )
}

// ── Generátor HTML dokumentu ──────────────────
export function generateHtml(
  wheelVals: Record<string, number>,
  wheelAnswers: Record<string, string>,
  finalValues: string[],
  visionData: VisionData,
  oblastiData: OblastiData,
  actionData: ActionData
): string {
  const date = new Date().toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })

  // ── SVG helpers ──────────────────────────────
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const spiderSvg = (vals: Record<string, number>, color: string, dashed = false, size = 240) => {
    const C = size / 2, R = C - 38, N = WHEEL_AREAS.length
    const pt = (i: number, v: number) => {
      const a = (2 * Math.PI * i) / N - Math.PI / 2
      return [C + (v / 10) * R * Math.cos(a), C + (v / 10) * R * Math.sin(a)]
    }
    const circles = [2,4,6,8,10].map(r => `<circle cx="${C}" cy="${C}" r="${(r/10)*R}" fill="none" stroke="rgba(0,0,0,0.07)" stroke-width="0.5"/>`).join("")
    const axes = WHEEL_AREAS.map((_, i) => { const a = (2*Math.PI*i)/N-Math.PI/2; return `<line x1="${C}" y1="${C}" x2="${C+R*Math.cos(a)}" y2="${C+R*Math.sin(a)}" stroke="rgba(0,0,0,0.08)" stroke-width="0.5"/>` }).join("")
    const poly = WHEEL_AREAS.map((a, i) => { const [x,y] = pt(i, vals[a.key] ?? 5); return `${x},${y}` }).join(" ")
    const lbls = WHEEL_AREAS.map((a, i) => { const ang=(2*Math.PI*i)/N-Math.PI/2; const lx=C+(R+26)*Math.cos(ang); const ly=C+(R+26)*Math.sin(ang); return `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="9.5" fill="#666" font-family="system-ui">${a.short}</text>` }).join("")
    const dash = dashed ? ` stroke-dasharray="5,3"` : ""
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${circles}${axes}<polygon points="${poly}" fill="${color}22" stroke="${color}"${dash} stroke-width="1.5" stroke-linejoin="round"/>${lbls}</svg>`
  }

  // ── Kolo života ──────────────────────────────
  const wheelRows = WHEEL_AREAS.map(a => {
    const cur = wheelVals[a.key] ?? 5
    const ide = oblastiData.idealVals[a.key] ?? 5
    return `<div style="display:flex;align-items:center;gap:10px;margin:7px 0">
      <span style="width:170px;flex-shrink:0;font-size:13px;color:#555">${a.label}</span>
      <div style="flex:1;position:relative;height:10px;background:#f0ece5;border-radius:5px;overflow:hidden">
        <div style="width:${cur*10}%;height:100%;background:#FF8C42;border-radius:5px;opacity:0.8"></div>
        <div style="position:absolute;top:0;left:0;width:${ide*10}%;height:100%;border-right:2px solid #378ADD;border-radius:0 5px 5px 0"></div>
      </div>
      <span style="font-size:12px;color:#FF8C42;font-weight:700;width:14px;text-align:right">${cur}</span>
      <span style="font-size:12px;color:#378ADD;width:22px;text-align:right">→${ide}</span>
    </div>`
  }).join("")

  const spidersHtml = `<div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin:16px 0">
    <div style="text-align:center"><p style="font-size:11px;color:#aaa;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Dnes</p>${spiderSvg(wheelVals, "#FF8C42")}</div>
    <div style="text-align:center"><p style="font-size:11px;color:#aaa;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Ideál</p>${spiderSvg(oblastiData.idealVals, "#378ADD", true)}</div>
  </div>`

  const reflectionRows = WHEEL_QUESTIONS.map((q, i) => {
    const ans = wheelAnswers[q.id]?.trim()
    if (!ans) return ""
    return `<div style="margin:14px 0"><p style="font-weight:600;font-size:13px;color:#333;margin:0 0 5px">${i + 1}. ${esc(q.label)}</p><p style="font-size:13px;color:#555;white-space:pre-wrap;margin:0;padding:12px;background:#f9f6f1;border-radius:8px">${esc(ans)}</p></div>`
  }).join("")

  // ── Oblasti ──────────────────────────────────
  const improvingAreas = WHEEL_AREAS.filter(a => (oblastiData.idealVals[a.key] ?? 5) > (wheelVals[a.key] ?? 5))
  const oblastiRows = improvingAreas.map(a => {
    const qAnswers = oblastiData.answers[a.key] ?? ["", "", ""]
    const hasAny = qAnswers.some(s => s.trim())
    if (!hasAny) return ""
    return `<div style="margin:20px 0;border-left:3px solid #378ADD;padding-left:14px">
      <p style="font-weight:700;font-size:14px;color:#0C447C;margin:0 0 2px">${esc(a.label)}</p>
      <p style="font-size:11px;color:#aaa;margin:0 0 10px">dnes ${wheelVals[a.key] ?? 5} → ideál ${oblastiData.idealVals[a.key] ?? 5}</p>
      ${OBLASTI_QUESTIONS.map((q, qi) => qAnswers[qi]?.trim() ? `<p style="font-size:12px;font-weight:600;color:#666;margin:8px 0 3px">${qi + 1}. ${esc(q)}</p><p style="font-size:13px;color:#444;white-space:pre-wrap;margin:0;padding:10px;background:#f4f8fd;border-radius:6px">${esc(qAnswers[qi])}</p>` : "").join("")}
    </div>`
  }).join("")

  // ── Vize ─────────────────────────────────────
  const visionQ1 = visionData.q1.trim(), visionQ2 = visionData.q2.trim(), visionQ3 = visionData.q3.trim()
  const renderVisionText = (text: string, anns: VisionAnnotation[]) => {
    const sorted = [...anns].sort((a, b) => a.start - b.start)
    let out = "", cursor = 0
    sorted.forEach(ann => {
      if (ann.start > cursor) out += esc(text.slice(cursor, ann.start)).replace(/\n/g, "<br>")
      out += `<span style="border-bottom:2px solid #FF8C42;color:#c05000;font-weight:500">${esc(text.slice(ann.start, ann.end))}</span>`
      if (ann.note) out += ` <em style="font-size:11px;color:#FF8C42">[${esc(ann.note)}]</em>`
      cursor = ann.end
    })
    if (cursor < text.length) out += esc(text.slice(cursor)).replace(/\n/g, "<br>")
    return `<p style="font-size:13px;color:#444;margin:0;padding:13px;background:#f9f6f1;border-radius:8px;line-height:1.7">${out}</p>`
  }
  const visionSection = (visionQ1 || visionQ2 || visionQ3) ? `<h2>Vize</h2>
    ${visionQ1 ? `<p style="font-weight:600;font-size:12px;color:#999;margin:16px 0 5px;text-transform:uppercase;letter-spacing:.05em">🎂 80. narozeniny</p>${renderVisionText(visionQ1, [])}` : ""}
    ${visionQ2 ? `<p style="font-weight:600;font-size:12px;color:#999;margin:16px 0 5px;text-transform:uppercase;letter-spacing:.05em">🌅 Ideální den za 5 let</p>${renderVisionText(visionQ2, [])}` : ""}
    ${visionQ3 ? `<p style="font-weight:600;font-size:12px;color:#999;margin:16px 0 5px;text-transform:uppercase;letter-spacing:.05em">✍️ Moje vize</p>${renderVisionText(visionQ3, visionData.annotations)}` : ""}` : ""

  // ── Hodnoty ───────────────────────────────────
  const valuesBlock = finalValues.length
    ? `<div style="padding:14px 16px;background:#fff4ed;border-radius:10px;border:1px solid #ffd4b0"><p style="font-size:15px;font-weight:600;color:#FF8C42;margin:0;line-height:1.9">${esc(finalValues.join(" · "))}</p></div>`
    : `<p style="color:#bbb;font-style:italic;font-size:13px">Cvičení s hodnotami nebylo dokončeno.</p>`

  // ── Akční plán ────────────────────────────────
  const actionSection = `<h2>Akční plán</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:8px">
      <div style="border-radius:10px;overflow:hidden;border:1px solid #ffe0c8">
        <div style="background:#fff4ed;padding:10px 14px;border-bottom:1px solid #ffe0c8"><p style="font-size:12px;font-weight:700;color:#FF8C42;margin:0">Tento týden</p></div>
        <ol style="margin:0;padding:10px 14px 10px 26px;font-size:13px;color:#444;line-height:1.8">${actionData.week.filter(s=>s.trim()).map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
      </div>
      <div style="border-radius:10px;overflow:hidden;border:1px solid #bdd9f7">
        <div style="background:#e6f1fb;padding:10px 14px;border-bottom:1px solid #bdd9f7"><p style="font-size:12px;font-weight:700;color:#378ADD;margin:0">Tento měsíc</p></div>
        <ol style="margin:0;padding:10px 14px 10px 26px;font-size:13px;color:#444;line-height:1.8">${actionData.month.filter(s=>s.trim()).map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
      </div>
      <div style="border-radius:10px;overflow:hidden;border:1px solid #9fd9c3">
        <div style="background:#e1f5ee;padding:10px 14px;border-bottom:1px solid #9fd9c3"><p style="font-size:12px;font-weight:700;color:#1D9E75;margin:0">Tento rok — milníky</p></div>
        <ol style="margin:0;padding:10px 14px 10px 26px;font-size:13px;color:#444;line-height:1.8">${actionData.year.filter(s=>s.trim()).map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
      </div>
    </div>`

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Průvodce životem — ${date}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;max-width:760px;margin:0 auto;padding:40px 32px;color:#222;background:#fff}
    h1{font-size:28px;font-weight:800;margin:0 0 4px;color:#1a1a1a}
    .sub{color:#aaa;font-size:14px;margin:0 0 40px}
    h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#aaa;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #eee}
    footer{margin-top:48px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#ccc;text-align:center}
    .close-btn{position:fixed;top:20px;right:24px;width:36px;height:36px;border-radius:50%;background:#f3ede4;border:none;cursor:pointer;font-size:18px;color:#888;display:flex;align-items:center;justify-content:center;line-height:1;transition:background .15s}
    .close-btn:hover{background:#e8e0d4;color:#333}
    .back-btn{display:inline-block;margin-top:32px;padding:12px 28px;background:#FF8C42;color:#fff;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;transition:opacity .15s}
    .back-btn:hover{opacity:.85}
    @media print{body{padding:24px}.close-btn,.back-btn{display:none!important}}
  </style>
</head>
<body>
  <button class="close-btn" onclick="window.close()" title="Zavřít">✕</button>
  <h1>Průvodce životem</h1>
  <p class="sub">Vytvořeno ${date} na <a href="https://ziju.life" style="color:#FF8C42;text-decoration:none">ziju.life</a></p>
  <h2>Kolo života — dnes vs. ideál</h2>
  <p style="font-size:12px;color:#aaa;margin:-8px 0 12px">
    <span style="display:inline-block;width:12px;height:4px;background:#FF8C42;border-radius:2px;vertical-align:middle;margin-right:4px"></span>Dnes &nbsp;
    <span style="display:inline-block;width:12px;height:4px;background:#378ADD;border-radius:2px;vertical-align:middle;margin-right:4px"></span>Ideál
  </p>
  ${spidersHtml}
  ${wheelRows}
  ${reflectionRows ? `<h2>Reflexe kola života</h2>${reflectionRows}` : ""}
  ${oblastiRows ? `<h2>Oblasti — reflexe ke zlepšení</h2>${oblastiRows}` : ""}
  ${visionSection}
  <h2>Moje hodnoty</h2>
  ${valuesBlock}
  ${actionSection}
  <footer>
    Tento dokument je tvůj osobní průvodce. Vrať se k němu, aktualizuj ho a žij podle sebe.
    <div style="margin-top:20px">
      <a href="https://ziju.life/audit-zivota" class="back-btn">← Zpět na web</a>
    </div>
  </footer>
</body>
</html>`
}

// ── Modal při odchodu ─────────────────────────
function LeaveConfirmModal({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onStay() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onStay])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onStay}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-[28px] w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: "modal-in 0.18s ease-out" }}
      >
        {/* Hlavička */}
        <div className="bg-[#F7F4EE] px-8 pt-10 pb-7 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm">
            🚪
          </div>
          <h3 className="text-xl font-bold text-foreground leading-tight">Opravdu chceš odejít?</h3>
        </div>

        {/* Obsah */}
        <div className="px-8 py-7 space-y-5">
          <p className="text-sm text-foreground/60 leading-relaxed text-center">
            Po opuštění stránky přijdeš o všechna vyplněná data.
            Nejdřív si stáhni svůj dokument — najdeš ho na poslední zastávce průvodce.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onStay}
              className="flex-1 px-4 py-3 rounded-xl border border-black/10 bg-white text-sm font-semibold text-foreground/60 hover:bg-black/[0.03] hover:text-foreground transition-all"
            >
              Zůstat
            </button>
            <button
              onClick={onLeave}
              className="flex-1 px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-md hover:opacity-90"
              style={{ background: COLOR_ACTIVE }}
            >
              Odejít
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Export / finální krok ─────────────────────
function StepExportBox({
  step,
  wheelVals,
  wheelAnswers,
  finalValues,
  visionData,
  oblastiData,
  actionData,
  purchaseId,
}: {
  step: Step
  wheelVals: Record<string, number>
  wheelAnswers: Record<string, string>
  finalValues: string[]
  visionData: VisionData
  oblastiData: OblastiData
  actionData: ActionData
  purchaseId?: string
}) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [completing, setCompleting] = useState(false)

  if (step.id !== "export") return null

  const hasAnyContent =
    finalValues.length > 0 ||
    Object.values(wheelAnswers).some(a => a.trim() !== "") ||
    visionData.q1.trim() !== "" || visionData.q2.trim() !== "" || visionData.q3.trim() !== ""

  const openDocument = () => {
    const html = generateHtml(wheelVals, wheelAnswers, finalValues, visionData, oblastiData, actionData)
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(html)
      win.document.close()
      win.onload = () => win.print()
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await fetch("/api/user/journey-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId }),
      })
      openDocument()
      router.refresh()
    } catch {
      setCompleting(false)
    }
  }

  return (
    <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5 space-y-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Tvůj dokument</p>

      {!hasAnyContent ? (
        <div className="rounded-2xl bg-black/[0.02] border border-black/[0.06] px-6 py-8 text-center space-y-2">
          <p className="text-3xl">📄</p>
          <p className="text-sm text-foreground/50">
            Zatím jsi nic nevyplnil/a. Projdi předchozí zastávky a zapiš si své poznatky.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Náhled obsahu */}
          <div className="rounded-2xl bg-white border border-black/[0.08] px-5 py-4 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/30 mb-2">Kolo života</p>
              <div className="space-y-1.5">
                {WHEEL_AREAS.map(a => (
                  <div key={a.key} className="flex items-center gap-2">
                    <span className="text-xs text-foreground/50 w-28 flex-shrink-0">{a.short}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(wheelVals[a.key] ?? 5) * 10}%`, background: COLOR_ACTIVE }} />
                    </div>
                    <span className="text-xs font-bold w-4 text-right" style={{ color: COLOR_ACTIVE }}>{wheelVals[a.key] ?? 5}</span>
                  </div>
                ))}
              </div>
            </div>
            {finalValues.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/30 mb-1.5">Hodnoty</p>
                <p className="text-sm text-foreground/60">{finalValues.join(" · ")}</p>
              </div>
            )}
            {Object.values(wheelAnswers).some(a => a.trim()) && (
              <p className="text-xs text-foreground/35 italic">
                + {Object.values(wheelAnswers).filter(a => a.trim()).length} reflexních odpovědí
              </p>
            )}
          </div>

          {/* Dokončit */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={completing}
            className="w-full px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            style={{ background: COLOR_ACTIVE }}
          >
            {completing ? "Generuji dokument…" : "Dokončit a vygenerovat dokument →"}
          </button>
          <p className="text-xs text-foreground/30 text-center">
            Po dokončení se vygeneruje tvůj osobní dokument
          </p>
        </div>
      )}

      {/* Potvrzovací modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full px-7 py-7 space-y-5">
            <div className="text-center space-y-2">
              <p className="text-2xl">📄</p>
              <h3 className="text-lg font-bold text-foreground">Dokončit audit?</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Dokončením se tato cesta uzavře a vygeneruje se tvůj osobní dokument.
                Kdykoli si ho můžeš stáhnout ze svého účtu — a audit můžeš znovu projít kdykoliv chceš, zdarma.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 bg-white text-sm font-medium text-foreground/55 hover:bg-black/[0.03] transition-all"
              >
                Zpět
              </button>
              <button
                onClick={() => { setShowConfirm(false); handleComplete() }}
                className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-md"
                style={{ background: COLOR_ACTIVE }}
              >
                Dokončit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hlavní komponenta ─────────────────────────
export default function JourneyFlow({ initialData, purchaseId }: { initialData?: JourneyState | null; purchaseId?: string }) {
  const [active, setActive] = useState(initialData?.active ?? 0)
  const topRef = useRef<HTMLDivElement>(null)
  const goTo = (i: number) => {
    setActive(Math.max(0, Math.min(steps.length - 1, i)))
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0)
  }
  const step = steps[active]

  // Stav pro export
  const [wheelVals, setWheelVals] = useState<Record<string, number>>(
    initialData?.wheelVals ?? Object.fromEntries(WHEEL_AREAS.map(a => [a.key, 5]))
  )
  const [wheelAnswers, setWheelAnswers] = useState<Record<string, string>>(
    initialData?.wheelAnswers ?? Object.fromEntries(WHEEL_QUESTIONS.map(q => [q.id, ""]))
  )
  const [finalValues, setFinalValues] = useState<string[]>(initialData?.finalValues ?? [])
  const [visionData, setVisionData] = useState<VisionData>(initialData?.visionData ?? { q1: "", q2: "", q3: "", annotations: [] })
  const [actionData, setActionData] = useState<ActionData>(initialData?.actionData ?? EMPTY_ACTION)
  const [oblastiData, setOblastiData] = useState<OblastiData>(initialData?.oblastiData ?? {
    idealVals: Object.fromEntries(WHEEL_AREAS.map(a => [a.key, 5])),
    answers: Object.fromEntries(WHEEL_AREAS.map(a => [a.key, ["", "", ""]])),
  })

  // ── Autosave (debounced 2 s) ───────────────
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(false)
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (!purchaseId) return
    saveTimerRef.current = setTimeout(() => {
      fetch("/api/user/journey-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId, active, wheelVals, wheelAnswers, finalValues, visionData, oblastiData, actionData }),
      }).catch(() => { /* silent fail */ })
    }, 2000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, wheelVals, wheelAnswers, finalValues, visionData, oblastiData, actionData])

  const handleWheelChange = useCallback(
    (v: Record<string, number>, a: Record<string, string>) => {
      setWheelVals(v)
      setWheelAnswers(a)
    },
    []
  )


  return (
    <div className="w-full space-y-4">

      {/* Progress */}
      <div ref={topRef} className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5">
        <JourneyPath active={active} onSelect={goTo} />
      </div>

      {/* Obsah */}
      <StepContentBox step={step} stepIndex={active} />

      {/* Cvičení */}
      <StepPracticesBox step={step} />

      {/* Kolo života (jen pro první krok) */}
      <StepWheelBox step={step} onDataChange={handleWheelChange} initialVals={wheelVals} initialAnswers={wheelAnswers} />

      {/* Hra s hodnotami (jen pro step s values) */}
      <StepValuesGame step={step} onFinalValues={setFinalValues} initialFinalValues={finalValues} />

      {/* Seznam hodnot */}
      <StepValuesBox step={step} />

      {/* Oblasti — ideální pavučák + reflexe */}
      <StepOblastiBox step={step} currentVals={wheelVals} onDataChange={setOblastiData} initialData={oblastiData} />

      {/* Vize (jen pro krok vize) */}
      <StepVisionBox step={step} onDataChange={setVisionData} initialData={visionData} />

      {/* Akční plán (jen pro krok akce) */}
      <StepActionBox step={step} onDataChange={setActionData} initialData={actionData} />

      {/* Export / finální krok */}
      <StepExportBox
        step={step}
        wheelVals={wheelVals}
        wheelAnswers={wheelAnswers}
        finalValues={finalValues}
        visionData={visionData}
        oblastiData={oblastiData}
        actionData={actionData}
        purchaseId={purchaseId}
      />

      {/* Šipky */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          className="px-5 py-2.5 text-sm rounded-xl border border-white/60 bg-white/65 backdrop-blur text-foreground/55 disabled:opacity-25 hover:bg-white/80 hover:text-foreground transition-all"
        >
          ← Zpět
        </button>
        <span className="text-xs text-foreground/30">{active + 1} / {steps.length}</span>
        <button
          onClick={() => goTo(active + 1)}
          disabled={active === steps.length - 1 || (step.id === "akce" && !isActionComplete(actionData)) || (step.id === "oblasti" && !isOblastiComplete(oblastiData))}
          className="px-5 py-2.5 text-sm rounded-xl text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md"
          style={{ background: COLOR_ACTIVE }}
        >
          Dál →
        </button>
      </div>


    </div>
  )
}
