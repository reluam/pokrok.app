"use client"

import { useState, useEffect, useCallback } from "react"
import { useUserContext } from "@/hooks/useUserContext"
import { kompasFromApi, kompasToApi } from "@/lib/context-transforms"

// ── Konstanty ───────────────────────────────────────────────────────────────

const LS_KEY = "kompas-data"
const COLOR_ORANGE = "#FF8C42"
const COLOR_BLUE   = "#378ADD"

const WHEEL_AREAS = [
  { key: "kariera",  label: "Kariéra & práce",            short: "Kariéra"   },
  { key: "finance",  label: "Finance",                     short: "Finance"   },
  { key: "zdravi",   label: "Zdraví & tělo",               short: "Zdraví"    },
  { key: "rodina",   label: "Rodina & partnerský vztah",   short: "Rodina"    },
  { key: "pratele",  label: "Přátelství & sociální život", short: "Přátelé"   },
  { key: "rozvoj",   label: "Osobní rozvoj",               short: "Rozvoj"    },
  { key: "volny",    label: "Volný čas & záliby",          short: "Volný čas" },
  { key: "smysl",    label: "Duchovnost & smysl",          short: "Smysl"     },
]

const AREA_QUESTIONS = [
  "Co mě tíží? Co nefunguje? Co chci změnit?",
  "Co je momentálně dobré? Co chci zachovat?",
  "Jak tedy vypadá ideální stav?",
  "Co pro to udělám?",
]

const AREA_TIPS: Record<string, string> = {
  kariera:  "Jedna jasná priorita na začátku dne má větší dopad než deset splněných úkolů. Co je tvoje nejdůležitější věc na zítřek?",
  finance:  "Finanční stres se sniká vědomou kontrolou, ne vyhýbáním. 5 minut týdně na přehled výdajů dává pocit kontroly.",
  zdravi:   "Spánek, pohyb a hydratace ovlivňují každou jinou oblast. I malá změna — 10 minut procházky — má měřitelný efekt na mozek.",
  rodina:   "15 minut opravdového kontaktu bez telefonu má větší váhu než hodiny ve stejné místnosti. Přítomnost je rozhodnutí.",
  pratele:  "Vztahy se nevytváří spontánně — vyžadují záměr. Krátká zpráva nebo hovor s přítelem může být vědomou součástí týdne.",
  rozvoj:   "10 minut čtení denně = 60 hodin ročně. Malý rituál rozvoje buduje identitu člověka, který roste. Konzistence beats množství.",
  volny:    "Vědomý odpočinek — aktivity, které tě skutečně dobíjejí — snižuje burn-out a zvyšuje kreativitu. Není to ztráta času.",
  smysl:    "Smysl se nevynajde — vytváří se opakovanými vědomými rozhodnutími. Hodnoty ti mohou být filtrem při každé volbě.",
}

// ── Typy ────────────────────────────────────────────────────────────────────

export type KompasData = {
  currentVals:        Record<string, number>
  goalVals:           Record<string, number>
  reflectionAnswers:  Record<string, string>   // kept for backwards compat
  areaAnswers:        Record<string, string[]>
  focusArea?:         string                   // oblast vybraná uživatelem pro tento měsíc
  completedAt:        string
}

// ── Spider SVG ───────────────────────────────────────────────────────────────

function SpiderSVG({
  vals,
  goalVals,
  size = 260,
  interactiveVals,
  onChangeVals,
}: {
  vals:           Record<string, number>
  goalVals?:      Record<string, number>
  size?:          number
  interactiveVals?: "current" | "goal"
  onChangeVals?:  (v: Record<string, number>) => void
}) {
  const N      = WHEEL_AREAS.length
  const CENTER = size / 2
  const RADIUS = CENTER - 40

  const getPoint = (idx: number, v: number) => {
    const angle = (2 * Math.PI * idx) / N - Math.PI / 2
    const r     = (v / 10) * RADIUS
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) }
  }

  const makePoly = (vs: Record<string, number>) =>
    WHEEL_AREAS.map((a, i) => { const { x, y } = getPoint(i, vs[a.key] ?? 5); return `${x},${y}` }).join(" ")

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactiveVals || !onChangeVals) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const svgX  = ((e.clientX - rect.left)  / rect.width)  * size
    const svgY  = ((e.clientY - rect.top)   / rect.height) * size
    const dx    = svgX - CENTER
    const dy    = svgY - CENTER
    const dist  = Math.sqrt(dx * dx + dy * dy)
    if (dist < 8 || dist > RADIUS + 18) return
    const clickAngle = (Math.atan2(dy, dx) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI)
    let nearest = 0, minDiff = Infinity
    WHEEL_AREAS.forEach((_, i) => {
      const axisAngle = ((2 * Math.PI * i) / N + 2 * Math.PI) % (2 * Math.PI)
      let diff = Math.abs(axisAngle - clickAngle)
      if (diff > Math.PI) diff = 2 * Math.PI - diff
      if (diff < minDiff) { minDiff = diff; nearest = i }
    })
    const value   = Math.max(1, Math.min(10, Math.round((dist / RADIUS) * 10)))
    const baseVals = interactiveVals === "goal" ? (goalVals ?? {}) : vals
    onChangeVals({ ...baseVals, [WHEEL_AREAS[nearest].key]: value })
  }

  const activePoly    = interactiveVals === "goal" ? (goalVals ?? {}) : vals
  const refPoly       = interactiveVals === "goal" ? vals : undefined
  const activeColor   = interactiveVals === "goal" ? COLOR_BLUE : COLOR_ORANGE
  const activeFill    = interactiveVals === "goal" ? "rgba(55,138,221,0.15)" : "rgba(255,140,66,0.18)"

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      onClick={handleClick}
      style={{ cursor: interactiveVals ? "crosshair" : "default", userSelect: "none" }}
    >
      {[2, 4, 6, 8, 10].map(r => (
        <circle key={r} cx={CENTER} cy={CENTER} r={(r / 10) * RADIUS}
          fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
      ))}
      {[2, 4, 6, 8, 10].map(r => (
        <text key={r} x={CENTER + 3} y={CENTER - (r / 10) * RADIUS + 3}
          fontSize="8" fill="rgba(0,0,0,0.22)" fontFamily="system-ui">{r}</text>
      ))}
      {WHEEL_AREAS.map((a, i) => {
        const angle = (2 * Math.PI * i) / N - Math.PI / 2
        return <line key={a.key} x1={CENTER} y1={CENTER}
          x2={CENTER + RADIUS * Math.cos(angle)} y2={CENTER + RADIUS * Math.sin(angle)}
          stroke="rgba(0,0,0,0.09)" strokeWidth="1" />
      })}

      {/* Reference polygon (light, when editing goal) */}
      {refPoly && (
        <polygon points={makePoly(refPoly)}
          fill="rgba(255,140,66,0.10)" stroke="rgba(255,140,66,0.40)"
          strokeWidth="1" strokeLinejoin="round" />
      )}

      {/* Dashboard: show both */}
      {!interactiveVals && goalVals && (
        <>
          <polygon points={makePoly(vals)}
            fill="rgba(255,140,66,0.18)" stroke={COLOR_ORANGE}
            strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points={makePoly(goalVals)}
            fill="rgba(55,138,221,0.10)" stroke={COLOR_BLUE}
            strokeWidth="1.5" strokeDasharray="5,3" strokeLinejoin="round" />
          {WHEEL_AREAS.map((a, i) => {
            const cp = getPoint(i, vals[a.key] ?? 5)
            const gp = getPoint(i, goalVals[a.key] ?? 5)
            return (
              <g key={a.key}>
                <circle cx={cp.x} cy={cp.y} r="4" fill={COLOR_ORANGE} />
                <circle cx={gp.x} cy={gp.y} r="3" fill={COLOR_BLUE} />
              </g>
            )
          })}
        </>
      )}

      {/* Interactive polygon */}
      {interactiveVals && (
        <>
          <polygon points={makePoly(activePoly)}
            fill={activeFill} stroke={activeColor}
            strokeWidth="1.5" strokeLinejoin="round" />
          {WHEEL_AREAS.map((a, i) => {
            const { x, y } = getPoint(i, activePoly[a.key] ?? 5)
            return <circle key={a.key} cx={x} cy={y} r="4.5" fill={activeColor} />
          })}
        </>
      )}

      {WHEEL_AREAS.map((a, i) => {
        const angle = (2 * Math.PI * i) / N - Math.PI / 2
        const lx    = CENTER + (RADIUS + 24) * Math.cos(angle)
        const ly    = CENTER + (RADIUS + 24) * Math.sin(angle)
        return (
          <text key={a.key} x={lx} y={ly}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fontWeight="500" fontFamily="system-ui" fill="rgba(0,0,0,0.5)"
          >{a.short}</text>
        )
      })}
    </svg>
  )
}

// ── Segment bar ──────────────────────────────────────────────────────────────

function SegmentBar({
  area, value, color, label, subLabel, onChange,
}: {
  area:     string
  value:    number
  color:    string
  label:    string
  subLabel?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground/55">{label}</span>
        <div className="flex items-center gap-2">
          {subLabel && <span className="text-[11px] text-foreground/30">{subLabel}</span>}
          <span className="text-xs font-bold w-4 text-right" style={{ color }}>{value}</span>
        </div>
      </div>
      <div className="flex rounded-lg overflow-hidden border border-black/[0.08]">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className="flex-1 py-1.5 text-[10px] font-semibold transition-colors border-r border-black/[0.06] last:border-r-0"
            style={{
              background: n <= value ? color : "rgba(0,0,0,0.02)",
              color:      n <= value ? "white" : "rgba(0,0,0,0.25)",
            }}
          >{n}</button>
        ))}
      </div>
    </div>
  )
}

// ── Slide: Aktuální pavučák ──────────────────────────────────────────────────

function SlideCurrentSpider({
  vals, onChange,
}: {
  vals:     Record<string, number>
  onChange: (v: Record<string, number>) => void
}) {
  const avg = (Object.values(vals).reduce((a, b) => a + b, 0) / WHEEL_AREAS.length).toFixed(1)
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Kdo jsi dnes</p>
        <p className="text-sm text-foreground/55 mt-1 leading-relaxed">
          Upřímně ohodnoť každou oblast svého života. Kde jsi teď — ne kde bys chtěl být.
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-foreground/40">
        <span>Klikni do grafu nebo nastav hodnoty níže</span>
        <span>průměr <strong className="text-foreground/60">{avg}</strong>/10</span>
      </div>

      <div className="flex justify-center">
        <SpiderSVG
          vals={vals}
          size={260}
          interactiveVals="current"
          onChangeVals={onChange}
        />
      </div>

      <div className="space-y-2.5 pt-1 border-t border-black/[0.05]">
        {WHEEL_AREAS.map(a => (
          <SegmentBar
            key={a.key}
            area={a.key}
            value={vals[a.key] ?? 5}
            color={COLOR_ORANGE}
            label={a.label}
            onChange={v => onChange({ ...vals, [a.key]: v })}
          />
        ))}
      </div>
    </div>
  )
}

// ── Slide: Cílový pavučák ───────────────────────────────────────────────────

function SlideGoalSpider({
  currentVals, goalVals, onChange,
}: {
  currentVals: Record<string, number>
  goalVals:    Record<string, number>
  onChange:    (v: Record<string, number>) => void
}) {
  const avg = Object.values(goalVals).reduce((a, b) => a + b, 0) / WHEEL_AREAS.length

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Kde chceš být</p>
        <p className="text-sm text-foreground/55 mt-1 leading-relaxed">
          Nastav si priority. Cílem není mít vše na 10 — je v pořádku mít někde 10 a jinde 6.
          Šedý obrys ukazuje, kde jsi teď.
        </p>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-foreground/45">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded-full opacity-40" style={{ background: COLOR_ORANGE }} />
          Dnes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded-full" style={{ background: COLOR_BLUE }} />
          Cíl
        </span>
      </div>

      <div className="flex justify-center">
        <SpiderSVG
          vals={currentVals}
          goalVals={goalVals}
          size={260}
          interactiveVals="goal"
          onChangeVals={onChange}
        />
      </div>

      <div className="space-y-2.5 pt-1 border-t border-black/[0.05]">
        {WHEEL_AREAS.map(a => {
          const current = currentVals[a.key] ?? 5
          const goal    = goalVals[a.key] ?? 5
          const diff    = goal - current
          return (
            <SegmentBar
              key={a.key}
              area={a.key}
              value={goal}
              color={COLOR_BLUE}
              label={a.label}
              subLabel={diff !== 0 ? `dnes: ${current} (${diff > 0 ? "+" : ""}${diff})` : `dnes: ${current}`}
              onChange={v => onChange({ ...goalVals, [a.key]: v })}
            />
          )
        })}
      </div>

      {avg > 8 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-3">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Průměr cílů je {avg.toFixed(1)}.</strong> Každá oblast, které věnuješ víc energie, bere energii ostatním.
            Zkus si vybrat, co je opravdu důležité — a přijmout, že některé věci mohou zůstat na 6 nebo 7. To není selhání, to je rozhodnutí.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Slide: Oblast ───────────────────────────────────────────────────────────

function SlideArea({
  area, current, goal, answers, onChange,
}: {
  area:     typeof WHEEL_AREAS[number]
  current:  number
  goal:     number
  answers:  string[]
  onChange: (v: string[]) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Oblast</p>
        <div className="flex items-baseline gap-3 mt-1">
          <h3 className="text-lg font-bold text-foreground">{area.label}</h3>
          <span className="text-sm text-foreground/40">
            {current} <span style={{ color: COLOR_BLUE }}>→ {goal}</span>
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {AREA_QUESTIONS.map((q, i) => (
          <div key={i} className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/65 block leading-snug">
              <span className="text-foreground/30 mr-1.5">{i + 1}.</span>{q}
            </label>
            <textarea
              value={answers[i] ?? ""}
              onChange={e => {
                const next = [...answers]
                next[i] = e.target.value
                onChange(next)
              }}
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

// ── Slide: Výběr fokus oblasti ───────────────────────────────────────────────

function SlideFocusArea({
  currentVals, goalVals, focusArea, onChange,
}: {
  currentVals: Record<string, number>
  goalVals:    Record<string, number>
  focusArea:   string
  onChange:    (key: string) => void
}) {
  const sorted = [...WHEEL_AREAS].sort((a, b) => {
    const da = (goalVals[b.key] ?? 5) - (currentVals[b.key] ?? 5)
    const db = (goalVals[a.key] ?? 5) - (currentVals[a.key] ?? 5)
    return da - db
  })

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Vyber svůj dílek mozaiky</p>
        <p className="text-sm text-foreground/55 mt-1 leading-relaxed">
          Nemůžeš složit celou mozaiku najednou. Vyber jednu oblast, na které budeš pracovat tento měsíc.
        </p>
      </div>
      <div className="space-y-2">
        {sorted.map(a => {
          const cur  = currentVals[a.key] ?? 5
          const goal = goalVals[a.key] ?? 5
          const diff = goal - cur
          const isSelected = focusArea === a.key
          return (
            <button
              key={a.key}
              onClick={() => onChange(a.key)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all"
              style={isSelected
                ? { borderColor: COLOR_ORANGE, background: "rgba(255,140,66,0.06)" }
                : { borderColor: "rgba(0,0,0,0.07)", background: "rgba(255,255,255,0.5)" }
              }
            >
              <span className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                style={isSelected
                  ? { borderColor: COLOR_ORANGE, background: COLOR_ORANGE }
                  : { borderColor: "rgba(0,0,0,0.2)" }
                }
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <span className="flex-1 text-sm font-semibold text-foreground">{a.label}</span>
              <span className="text-xs text-foreground/40 flex-shrink-0">
                {cur}
                {diff !== 0 && (
                  <span style={{ color: diff > 0 ? COLOR_BLUE : "rgba(0,0,0,0.3)" }}>
                    {" "}→ {goal}
                  </span>
                )}
              </span>
              {diff > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(55,138,221,0.1)", color: COLOR_BLUE }}
                >
                  +{diff}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Flow slides ──────────────────────────────────────────────────────────────

function KompasFlowSlides({ onComplete }: { onComplete: (data: KompasData) => void }) {
  // Slides: 0=current spider, 1=goal spider, 2=focus area selection, 3=area questions
  const TOTAL_SLIDES = 4

  const [slide, setSlide] = useState(0)
  const [currentVals, setCurrentVals] = useState<Record<string, number>>(
    Object.fromEntries(WHEEL_AREAS.map(a => [a.key, 5]))
  )
  const [goalVals, setGoalVals] = useState<Record<string, number>>(
    Object.fromEntries(WHEEL_AREAS.map(a => [a.key, 7]))
  )
  const [areaAnswers, setAreaAnswers] = useState<Record<string, string[]>>(
    Object.fromEntries(WHEEL_AREAS.map(a => [a.key, ["", "", "", ""]]))
  )
  // Default focus = area with biggest positive gap
  const defaultFocus = WHEEL_AREAS.reduce((best, a) => {
    const d = (goalVals[a.key] ?? 5) - (currentVals[a.key] ?? 5)
    const bd = (goalVals[best.key] ?? 5) - (currentVals[best.key] ?? 5)
    return d > bd ? a : best
  }, WHEEL_AREAS[0])
  const [focusArea, setFocusArea] = useState(defaultFocus.key)

  const isLastSlide = slide === TOTAL_SLIDES - 1
  const focusAreaObj = WHEEL_AREAS.find(a => a.key === focusArea) ?? WHEEL_AREAS[0]

  // Hodnoty context from localStorage
  const [hodnotyValues, setHodnotyValues] = useState<string[]>([])
  useEffect(() => {
    try {
      const h = localStorage.getItem("hodnoty-data")
      if (h) setHodnotyValues(JSON.parse(h)?.finalValues ?? [])
    } catch {}
  }, [])

  const handleNext = () => {
    if (isLastSlide) {
      onComplete({ currentVals, goalVals, reflectionAnswers: {}, areaAnswers, focusArea, completedAt: new Date().toISOString() })
      return
    }
    setSlide(s => s + 1)
  }
  const handleBack = () => setSlide(s => Math.max(0, s - 1))

  const LABELS = ["Kdo jsi dnes", "Kde chceš být", "Vyber si dílek", focusAreaObj.short]

  const renderSlide = () => {
    if (slide === 0) {
      return (
        <div className="space-y-4">
          {hodnotyValues.length > 0 && (
            <div className="rounded-xl bg-orange-50/60 border border-orange-100 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-1.5">Tvoje hodnoty</p>
              <div className="flex flex-wrap gap-1.5">
                {hodnotyValues.slice(0, 7).map((v, i) => (
                  <span key={v} className={`text-xs px-2 py-0.5 rounded-lg font-medium ${i < 5 ? "bg-orange-100 text-orange-800" : "bg-orange-50 text-orange-600"}`}>
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
          <SlideCurrentSpider vals={currentVals} onChange={setCurrentVals} />
        </div>
      )
    }
    if (slide === 1) {
      return <SlideGoalSpider currentVals={currentVals} goalVals={goalVals} onChange={setGoalVals} />
    }
    if (slide === 2) {
      return (
        <SlideFocusArea
          currentVals={currentVals}
          goalVals={goalVals}
          focusArea={focusArea}
          onChange={setFocusArea}
        />
      )
    }
    return (
      <SlideArea
        area={focusAreaObj}
        current={currentVals[focusAreaObj.key] ?? 5}
        goal={goalVals[focusAreaObj.key] ?? 5}
        answers={areaAnswers[focusAreaObj.key] ?? ["", "", "", ""]}
        onChange={(v: string[]) => setAreaAnswers(prev => ({ ...prev, [focusAreaObj.key]: v }))}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-foreground/40">{LABELS[slide]}</span>
          <span className="text-xs text-foreground/30">{slide + 1} / {TOTAL_SLIDES}</span>
        </div>
        <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${((slide + 1) / TOTAL_SLIDES) * 100}%`, background: COLOR_ORANGE }}
          />
        </div>
      </div>

      {/* Slide content */}
      <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5">
        {renderSlide()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={slide === 0}
          className="px-5 py-2.5 text-sm rounded-xl border border-white/60 bg-white/65 backdrop-blur text-foreground/55 disabled:opacity-25 hover:bg-white/80 hover:text-foreground transition-all"
        >
          ← Zpět
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2.5 text-sm rounded-xl text-white font-medium transition-all hover:shadow-md"
          style={{ background: COLOR_ORANGE }}
        >
          {isLastSlide ? "Dokončit ✓" : "Dál →"}
        </button>
      </div>
    </div>
  )
}

// ── Dashboard view ───────────────────────────────────────────────────────────

function KompasDashboard({ data, onReset }: { data: KompasData; onReset: () => void }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const [areaIndex, setAreaIndex]       = useState(0)

  // Sort areas by priority: score = goal + (goal - current) = 2*goal - current
  const sortedAreas = [...WHEEL_AREAS].sort((a, b) => {
    const sa = 2 * (data.goalVals[a.key] ?? 5) - (data.currentVals[a.key] ?? 5)
    const sb = 2 * (data.goalVals[b.key] ?? 5) - (data.currentVals[b.key] ?? 5)
    return sb - sa
  })

  const clamp = (i: number) => Math.max(0, Math.min(sortedAreas.length - 1, i))
  const area  = sortedAreas[areaIndex]

  const current = data.currentVals[area?.key ?? "kariera"] ?? 5
  const goal    = data.goalVals[area?.key ?? "kariera"] ?? 5
  const diff    = goal - current

  const areaHasAnswers = (data.areaAnswers[area?.key ?? ""] ?? []).some(a => a.trim())

  return (
    <div className="space-y-6">

      {/* Reset header */}
      <div className="flex justify-end">
        {confirmReset ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/60">Opravdu začít znovu?</span>
            <button
              onClick={() => { setConfirmReset(false); onReset() }}
              className="text-sm text-red-500 font-semibold hover:text-red-600 transition-colors"
            >
              Ano
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              Zrušit
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            Projít znovu
          </button>
        )}
      </div>

      {/* Combined spider */}
      <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Kompas</p>
          <div className="flex items-center gap-4 text-[11px] text-foreground/45">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-1 rounded-full" style={{ background: COLOR_ORANGE }} />
              Dnes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: COLOR_BLUE, width: 14 }} />
              Cíl
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <SpiderSVG
            vals={data.currentVals}
            goalVals={data.goalVals}
            size={260}
          />
        </div>

        {/* Area bars */}
        <div className="space-y-2 pt-1 border-t border-black/[0.05]">
          {WHEEL_AREAS.map(a => {
            const cur = data.currentVals[a.key] ?? 5
            const gl  = data.goalVals[a.key]    ?? 5
            const d   = gl - cur
            return (
              <div key={a.key} className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-foreground/50 flex-shrink-0">{a.short}</span>
                  <div className="flex-1 h-2 rounded-full bg-black/[0.05] relative overflow-hidden">
                    <div className="absolute h-full rounded-full"
                      style={{ width: `${cur * 10}%`, background: COLOR_ORANGE, opacity: 0.75 }} />
                    {gl > cur && (
                      <div className="absolute h-full rounded-full"
                        style={{ left: `${cur * 10}%`, width: `${(gl - cur) * 10}%`, background: COLOR_BLUE, opacity: 0.5 }} />
                    )}
                  </div>
                  <span className="font-bold w-3 text-right" style={{ color: COLOR_ORANGE }}>{cur}</span>
                  {d !== 0 ? (
                    <span className="text-[10px] w-8 font-semibold" style={{ color: d > 0 ? COLOR_BLUE : "rgba(0,0,0,0.3)" }}>
                      {d > 0 ? `→ ${gl}` : `↓ ${gl}`}
                    </span>
                  ) : (
                    <span className="w-8" />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Co pro to udělám — improving areas with answers */}
        {(() => {
          const items = WHEEL_AREAS.filter(a => {
            const d   = (data.goalVals[a.key] ?? 5) - (data.currentVals[a.key] ?? 5)
            const ans = data.areaAnswers[a.key]?.[3]?.trim()
            return d > 0 && ans
          })
          if (items.length === 0) return null
          return (
            <div className="space-y-2 pt-2 border-t border-black/[0.05]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Co pro to udělám</p>
              {items.map(a => (
                <div key={a.key} className="flex gap-2.5">
                  <span className="text-xs font-semibold text-foreground/40 w-20 flex-shrink-0 pt-0.5">{a.short}</span>
                  <p className="text-sm text-foreground/65 leading-relaxed">{data.areaAnswers[a.key][3]}</p>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* Area insights */}
      <div className="rounded-[24px] border border-white/60 bg-white/65 backdrop-blur-sm shadow-sm px-6 py-5 space-y-4">
        {/* Header + navigation */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35">Oblasti</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAreaIndex(i => clamp(i - 1))}
              disabled={areaIndex === 0}
              className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-foreground/50 hover:bg-black/10 disabled:opacity-25 transition-all text-sm leading-none"
            >←</button>
            <span className="text-xs text-foreground/35">{areaIndex + 1} / {sortedAreas.length}</span>
            <button
              onClick={() => setAreaIndex(i => clamp(i + 1))}
              disabled={areaIndex === sortedAreas.length - 1}
              className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-foreground/50 hover:bg-black/10 disabled:opacity-25 transition-all text-sm leading-none"
            >→</button>
          </div>
        </div>

        {/* Area card */}
        {area && (
          <div className="space-y-3">
            {/* Area title + values */}
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-bold text-foreground">{area.label}</h3>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-bold" style={{ color: COLOR_ORANGE }}>{current}</span>
                {diff !== 0 && (
                  <>
                    <span className="text-foreground/30">→</span>
                    <span className="font-bold" style={{ color: diff > 0 ? COLOR_BLUE : "rgba(0,0,0,0.4)" }}>{goal}</span>
                    <span className="text-xs font-medium ml-0.5" style={{ color: diff > 0 ? COLOR_BLUE : "rgba(0,0,0,0.3)" }}>
                      ({diff > 0 ? "+" : ""}{diff})
                    </span>
                  </>
                )}
                {diff === 0 && <span className="text-foreground/30">= {current}</span>}
              </div>
            </div>

            {/* Answers or tip */}
            {areaHasAnswers ? (
              <div className="space-y-3">
                {AREA_QUESTIONS.map((q, i) => {
                  const ans = data.areaAnswers[area.key]?.[i]?.trim()
                  if (!ans) return null
                  return (
                    <div key={i} className="space-y-0.5">
                      <p className="text-[11px] font-semibold text-foreground/35 uppercase tracking-wide">{q}</p>
                      <p className="text-sm text-foreground/65 leading-relaxed">{ans}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-foreground/55 leading-relaxed">
                {AREA_TIPS[area.key]}
              </p>
            )}

            {/* Dot navigation */}
            <div className="flex justify-center gap-1.5 pt-1">
              {sortedAreas.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setAreaIndex(i)}
                  className="rounded-full transition-all"
                  style={{
                    width:      i === areaIndex ? 18 : 6,
                    height:     6,
                    background: i === areaIndex ? COLOR_ORANGE : "rgba(0,0,0,0.12)",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Hlavní komponenta ────────────────────────────────────────────────────────

export default function KompasFlow({ onSaved }: { onSaved?: () => void } = {}) {
  const fromLs = useCallback((raw: string) => {
    try { return JSON.parse(raw) as KompasData } catch { return null }
  }, [])

  const ctx = useUserContext<KompasData>({
    contextType: "compass",
    lsKey: LS_KEY,
    fromApi: kompasFromApi,
    toApi: kompasToApi,
    fromLs,
  })

  const [phase, setPhase] = useState<"loading" | "flow" | "done">("loading")

  useEffect(() => {
    if (ctx.loading) return
    if (ctx.data) {
      setPhase("done")
    } else if (phase === "loading") {
      setPhase("flow")
    }
  }, [ctx.loading, ctx.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const kompasData = ctx.data

  const handleComplete = useCallback((data: KompasData) => {
    ctx.save(data)
    setPhase("done")
    onSaved?.()
  }, [onSaved, ctx])

  const handleReset = useCallback(() => {
    ctx.clear()
    setPhase("flow")
  }, [ctx])

  if (phase === "loading") {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (phase === "done" && kompasData) {
    return <KompasDashboard data={kompasData} onReset={handleReset} />
  }

  return <KompasFlowSlides onComplete={handleComplete} />
}
