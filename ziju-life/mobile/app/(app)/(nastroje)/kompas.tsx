import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from "react-native-svg";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { getUserContext, saveUserContext } from "@/api/laborator";
import { colors } from "@/constants/theme";

// ── Constants ────────────────────────────────────────────────────────────────

const COLOR_ORANGE = "#FF8C42";
const COLOR_BLUE = "#378ADD";

const WHEEL_AREAS = [
  { key: "kariera", label: "Kariéra & práce", short: "Kariéra" },
  { key: "finance", label: "Finance", short: "Finance" },
  { key: "zdravi", label: "Zdraví & tělo", short: "Zdraví" },
  { key: "rodina", label: "Rodina & partnerský vztah", short: "Rodina" },
  { key: "pratele", label: "Přátelství & sociální život", short: "Přátelé" },
  { key: "rozvoj", label: "Osobní rozvoj", short: "Rozvoj" },
  { key: "volny", label: "Volný čas & záliby", short: "Volný čas" },
  { key: "smysl", label: "Duchovnost & smysl", short: "Smysl" },
];

const AREA_QUESTIONS = [
  "Co mě tíží? Co nefunguje? Co chci změnit?",
  "Co je momentálně dobré? Co chci zachovat?",
  "Jak tedy vypadá ideální stav?",
  "Co pro to udělám?",
];

const AREA_TIPS: Record<string, string> = {
  kariera: "Jedna jasná priorita na začátku dne má větší dopad než deset splněných úkolů.",
  finance: "Finanční stres se sniká vědomou kontrolou, ne vyhýbáním. 5 minut týdně na přehled výdajů dává pocit kontroly.",
  zdravi: "Spánek, pohyb a hydratace ovlivňují každou jinou oblast. I malá změna — 10 minut procházky — má měřitelný efekt.",
  rodina: "15 minut opravdového kontaktu bez telefonu má větší váhu než hodiny ve stejné místnosti.",
  pratele: "Vztahy se nevytváří spontánně — vyžadují záměr. Krátká zpráva nebo hovor s přítelem může být vědomou součástí týdne.",
  rozvoj: "10 minut čtení denně = 60 hodin ročně. Malý rituál rozvoje buduje identitu člověka, který roste.",
  volny: "Vědomý odpočinek — aktivity, které tě skutečně dobíjejí — snižuje burn-out a zvyšuje kreativitu.",
  smysl: "Smysl se nevynajde — vytváří se opakovanými vědomými rozhodnutími. Hodnoty ti mohou být filtrem při každé volbě.",
};

type KompasData = {
  currentVals: Record<string, number>;
  goalVals: Record<string, number>;
  areaAnswers: Record<string, string[]>;
  focusArea?: string;
  completedAt: string;
};

// ── Spider SVG ───────────────────────────────────────────────────────────────

function SpiderChart({
  vals,
  goalVals,
  size = 260,
  showGoal = false,
}: {
  vals: Record<string, number>;
  goalVals?: Record<string, number>;
  size?: number;
  showGoal?: boolean;
}) {
  const C = size / 2;
  const R = C - 48;
  const N = WHEEL_AREAS.length;

  const pt = (i: number, v: number): [number, number] => {
    const a = (2 * Math.PI * i) / N - Math.PI / 2;
    const r = (v / 10) * R;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  const makePoly = (vs: Record<string, number>) =>
    WHEEL_AREAS.map((a, i) => pt(i, vs[a.key] ?? 5).join(",")).join(" ");

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {[2, 4, 6, 8, 10].map((v) => (
          <Polygon
            key={v}
            points={WHEEL_AREAS.map((_, i) => pt(i, v).join(",")).join(" ")}
            fill="none"
            stroke="rgba(0,0,0,0.07)"
            strokeWidth="0.5"
          />
        ))}
        {WHEEL_AREAS.map((_, i) => {
          const [x, y] = pt(i, 10);
          return <Line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />;
        })}

        {/* Current polygon */}
        <Polygon
          points={makePoly(vals)}
          fill="rgba(255,140,66,0.15)"
          stroke={COLOR_ORANGE}
          strokeWidth="1.5"
        />

        {/* Goal polygon */}
        {showGoal && goalVals && (
          <Polygon
            points={makePoly(goalVals)}
            fill="rgba(55,138,221,0.10)"
            stroke={COLOR_BLUE}
            strokeWidth="1.5"
            strokeDasharray="5,3"
          />
        )}

        {/* Dots + labels */}
        {WHEEL_AREAS.map((a, i) => {
          const [x, y] = pt(i, vals[a.key] ?? 5);
          const ang = (2 * Math.PI * i) / N - Math.PI / 2;
          const lx = C + (R + 32) * Math.cos(ang);
          const ly = C + (R + 32) * Math.sin(ang);
          return (
            <G key={a.key}>
              <SvgText
                x={lx} y={ly}
                textAnchor="middle" alignmentBaseline="central"
                fontSize="9" fill="#888" fontFamily="System"
              >
                {a.short}
              </SvgText>
              <Circle cx={x} cy={y} r="4" fill={COLOR_ORANGE} />
              {showGoal && goalVals && (
                <Circle
                  cx={pt(i, goalVals[a.key] ?? 5)[0]}
                  cy={pt(i, goalVals[a.key] ?? 5)[1]}
                  r="3" fill={COLOR_BLUE}
                />
              )}
              <SvgText
                x={x} y={y - 9}
                textAnchor="middle" alignmentBaseline="central"
                fontSize="9" fontWeight="700" fill={COLOR_ORANGE} fontFamily="System"
              >
                {String(vals[a.key] ?? 5)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// ── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({
  label,
  value,
  color,
  subLabel,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  subLabel?: string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={s.scoreBarWrap}>
      <View style={s.scoreBarHeader}>
        <Text style={s.scoreBarLabel}>{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {subLabel ? <Text style={s.scoreBarSub}>{subLabel}</Text> : null}
          <Text style={[s.scoreBarVal, { color }]}>{value}</Text>
        </View>
      </View>
      <View style={s.scoreBarRow}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={[
              s.scoreBarBtn,
              { backgroundColor: n <= value ? color : "rgba(0,0,0,0.04)" },
            ]}
          >
            <Text style={[s.scoreBarBtnText, { color: n <= value ? "#fff" : "rgba(0,0,0,0.25)" }]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Slides ───────────────────────────────────────────────────────────────────

function SlideCurrentSpider({
  vals,
  onChange,
}: {
  vals: Record<string, number>;
  onChange: (v: Record<string, number>) => void;
}) {
  const avg = (Object.values(vals).reduce((a, b) => a + b, 0) / WHEEL_AREAS.length).toFixed(1);
  return (
    <View>
      <Text style={s.slideLabel}>KDO JSI DNES</Text>
      <Text style={s.slideDesc}>
        Upřímně ohodnoť každou oblast svého života. Kde jsi teď — ne kde bys chtěl být.
      </Text>
      <View style={s.avgRow}>
        <Text style={s.avgText}>Nastav hodnoty níže</Text>
        <Text style={s.avgText}>
          průměr <Text style={{ fontWeight: "700", color: colors.foreground }}>{avg}</Text>/10
        </Text>
      </View>
      <SpiderChart vals={vals} size={260} />
      <View style={{ gap: 10, marginTop: 12 }}>
        {WHEEL_AREAS.map((a) => (
          <ScoreBar
            key={a.key}
            label={a.label}
            value={vals[a.key] ?? 5}
            color={COLOR_ORANGE}
            onChange={(v) => onChange({ ...vals, [a.key]: v })}
          />
        ))}
      </View>
    </View>
  );
}

function SlideGoalSpider({
  currentVals,
  goalVals,
  onChange,
}: {
  currentVals: Record<string, number>;
  goalVals: Record<string, number>;
  onChange: (v: Record<string, number>) => void;
}) {
  const avg = Object.values(goalVals).reduce((a, b) => a + b, 0) / WHEEL_AREAS.length;
  return (
    <View>
      <Text style={s.slideLabel}>KDE CHCEŠ BÝT</Text>
      <Text style={s.slideDesc}>
        Nastav si priority. Cílem není mít vše na 10 — je v pořádku mít někde 10 a jinde 6.
      </Text>
      <View style={s.legendRow}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: COLOR_ORANGE }]} />
          <Text style={s.legendText}>Dnes</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: COLOR_BLUE }]} />
          <Text style={s.legendText}>Cíl</Text>
        </View>
      </View>
      <SpiderChart vals={currentVals} goalVals={goalVals} size={260} showGoal />
      <View style={{ gap: 10, marginTop: 12 }}>
        {WHEEL_AREAS.map((a) => {
          const cur = currentVals[a.key] ?? 5;
          const goal = goalVals[a.key] ?? 5;
          const diff = goal - cur;
          return (
            <ScoreBar
              key={a.key}
              label={a.label}
              value={goal}
              color={COLOR_BLUE}
              subLabel={diff !== 0 ? `dnes: ${cur} (${diff > 0 ? "+" : ""}${diff})` : `dnes: ${cur}`}
              onChange={(v) => onChange({ ...goalVals, [a.key]: v })}
            />
          );
        })}
      </View>
      {avg > 8 && (
        <View style={s.warningBox}>
          <Text style={s.warningText}>
            <Text style={{ fontWeight: "700" }}>Průměr cílů je {avg.toFixed(1)}.</Text> Každá oblast, které věnuješ
            víc energie, bere energii ostatním. Zkus si vybrat, co je opravdu důležité.
          </Text>
        </View>
      )}
    </View>
  );
}

function SlideFocusArea({
  currentVals,
  goalVals,
  focusArea,
  onChange,
}: {
  currentVals: Record<string, number>;
  goalVals: Record<string, number>;
  focusArea: string;
  onChange: (key: string) => void;
}) {
  const sorted = [...WHEEL_AREAS].sort((a, b) => {
    const da = (goalVals[b.key] ?? 5) - (currentVals[b.key] ?? 5);
    const db = (goalVals[a.key] ?? 5) - (currentVals[a.key] ?? 5);
    return da - db;
  });

  return (
    <View>
      <Text style={s.slideLabel}>VYBER SVŮJ DÍLEK MOZAIKY</Text>
      <Text style={s.slideDesc}>
        Nemůžeš složit celou mozaiku najednou. Vyber jednu oblast, na které budeš pracovat tento měsíc.
      </Text>
      <View style={{ gap: 8, marginTop: 16 }}>
        {sorted.map((a) => {
          const cur = currentVals[a.key] ?? 5;
          const goal = goalVals[a.key] ?? 5;
          const diff = goal - cur;
          const selected = focusArea === a.key;
          return (
            <TouchableOpacity
              key={a.key}
              onPress={() => onChange(a.key)}
              style={[
                s.focusItem,
                selected && { borderColor: COLOR_ORANGE, backgroundColor: "rgba(255,140,66,0.06)" },
              ]}
              activeOpacity={0.7}
            >
              <View style={[s.focusRadio, selected && { borderColor: COLOR_ORANGE, backgroundColor: COLOR_ORANGE }]}>
                {selected && <View style={s.focusRadioInner} />}
              </View>
              <Text style={s.focusLabel}>{a.label}</Text>
              <Text style={s.focusScore}>
                {cur}
                {diff !== 0 && (
                  <Text style={{ color: diff > 0 ? COLOR_BLUE : "rgba(0,0,0,0.3)" }}> → {goal}</Text>
                )}
              </Text>
              {diff > 0 && (
                <View style={s.focusBadge}>
                  <Text style={s.focusBadgeText}>+{diff}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function SlideArea({
  area,
  current,
  goal,
  answers,
  onChange,
}: {
  area: (typeof WHEEL_AREAS)[number];
  current: number;
  goal: number;
  answers: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <View>
      <Text style={s.slideLabel}>OBLAST</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12, marginTop: 4 }}>
        <Text style={s.areaTitle}>{area.label}</Text>
        <Text style={s.areaScoreText}>
          {current} <Text style={{ color: COLOR_BLUE }}>→ {goal}</Text>
        </Text>
      </View>
      <View style={{ gap: 16, marginTop: 16 }}>
        {AREA_QUESTIONS.map((q, i) => (
          <View key={i}>
            <Text style={s.questionLabel}>
              <Text style={{ color: colors.muted }}>{i + 1}. </Text>
              {q}
            </Text>
            <TextInput
              value={answers[i] ?? ""}
              onChangeText={(text) => {
                const next = [...answers];
                next[i] = text;
                onChange(next);
              }}
              placeholder="Napiš sem svoji odpověď…"
              placeholderTextColor="rgba(0,0,0,0.2)"
              multiline
              style={s.questionInput}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

function KompasDashboard({
  data,
  onReset,
}: {
  data: KompasData;
  onReset: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [areaIndex, setAreaIndex] = useState(0);

  const currentVals = data.currentVals ?? {};
  const goalVals = data.goalVals ?? {};

  const sortedAreas = [...WHEEL_AREAS].sort((a, b) => {
    const sa = 2 * (goalVals[a.key] ?? 5) - (currentVals[a.key] ?? 5);
    const sb = 2 * (goalVals[b.key] ?? 5) - (currentVals[b.key] ?? 5);
    return sb - sa;
  });

  const area = sortedAreas[areaIndex];
  const current = currentVals[area?.key ?? "kariera"] ?? 5;
  const goal = goalVals[area?.key ?? "kariera"] ?? 5;
  const diff = goal - current;
  const areaHasAnswers = (data.areaAnswers[area?.key ?? ""] ?? []).some((a) => a.trim());

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Reset */}
      <View style={{ alignItems: "flex-end", marginBottom: 8 }}>
        {confirmReset ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 13, color: colors.muted }}>Opravdu začít znovu?</Text>
            <TouchableOpacity onPress={() => { setConfirmReset(false); onReset(); }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.danger }}>Ano</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setConfirmReset(false)}>
              <Text style={{ fontSize: 13, color: colors.muted }}>Zrušit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setConfirmReset(true)}>
            <Text style={{ fontSize: 13, color: colors.muted }}>Projít znovu</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Spider */}
      <View style={s.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={s.slideLabel}>KOMPAS</Text>
          <View style={s.legendRow}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: COLOR_ORANGE }]} />
              <Text style={s.legendText}>Dnes</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: COLOR_BLUE }]} />
              <Text style={s.legendText}>Cíl</Text>
            </View>
          </View>
        </View>
        <SpiderChart vals={currentVals} goalVals={goalVals} size={260} showGoal />
        {/* Area bars */}
        <View style={{ gap: 6, marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)", paddingTop: 12 }}>
          {WHEEL_AREAS.map((a) => {
            const cur = currentVals[a.key] ?? 5;
            const gl = goalVals[a.key] ?? 5;
            const d = gl - cur;
            return (
              <View key={a.key} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ width: 60, fontSize: 12, color: colors.muted }} numberOfLines={1}>
                  {a.short}
                </Text>
                <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.05)", overflow: "hidden" }}>
                  <View
                    style={{
                      position: "absolute",
                      height: "100%",
                      borderRadius: 4,
                      width: `${cur * 10}%`,
                      backgroundColor: COLOR_ORANGE,
                      opacity: 0.75,
                    }}
                  />
                  {gl > cur && (
                    <View
                      style={{
                        position: "absolute",
                        height: "100%",
                        borderRadius: 4,
                        left: `${cur * 10}%`,
                        width: `${(gl - cur) * 10}%`,
                        backgroundColor: COLOR_BLUE,
                        opacity: 0.5,
                      }}
                    />
                  )}
                </View>
                <Text style={{ fontWeight: "700", fontSize: 12, color: COLOR_ORANGE, width: 16, textAlign: "right" }}>
                  {cur}
                </Text>
                {d !== 0 ? (
                  <Text style={{ fontSize: 10, fontWeight: "600", width: 28, color: d > 0 ? COLOR_BLUE : "rgba(0,0,0,0.3)" }}>
                    → {gl}
                  </Text>
                ) : (
                  <View style={{ width: 28 }} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Area insights */}
      <View style={[s.card, { marginTop: 12 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={s.slideLabel}>OBLASTI</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setAreaIndex((i) => Math.max(0, i - 1))}
              disabled={areaIndex === 0}
              style={[s.navDot, areaIndex === 0 && { opacity: 0.3 }]}
            >
              <Text style={s.navDotText}>←</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              {areaIndex + 1} / {sortedAreas.length}
            </Text>
            <TouchableOpacity
              onPress={() => setAreaIndex((i) => Math.min(sortedAreas.length - 1, i + 1))}
              disabled={areaIndex === sortedAreas.length - 1}
              style={[s.navDot, areaIndex === sortedAreas.length - 1 && { opacity: 0.3 }]}
            >
              <Text style={s.navDotText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {area && (
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{area.label}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: COLOR_ORANGE }}>{current}</Text>
                {diff !== 0 && (
                  <>
                    <Text style={{ fontSize: 12, color: colors.muted }}>→</Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: diff > 0 ? COLOR_BLUE : "rgba(0,0,0,0.4)" }}>
                      {goal}
                    </Text>
                  </>
                )}
              </View>
            </View>
            {areaHasAnswers ? (
              <View style={{ gap: 10, marginTop: 12 }}>
                {AREA_QUESTIONS.map((q, i) => {
                  const ans = data.areaAnswers[area.key]?.[i]?.trim();
                  if (!ans) return null;
                  return (
                    <View key={i}>
                      <Text style={{ fontSize: 10, fontWeight: "600", color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {q}
                      </Text>
                      <Text style={{ fontSize: 14, color: "rgba(0,0,0,0.6)", lineHeight: 20, marginTop: 2 }}>{ans}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ fontSize: 14, color: "rgba(0,0,0,0.55)", lineHeight: 20, marginTop: 8 }}>
                {AREA_TIPS[area.key]}
              </Text>
            )}

            {/* Dot navigation */}
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 14 }}>
              {sortedAreas.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setAreaIndex(i)}
                  style={{
                    width: i === areaIndex ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === areaIndex ? COLOR_ORANGE : "rgba(0,0,0,0.12)",
                  }}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── Flow Slides ──────────────────────────────────────────────────────────────

function KompasFlowSlides({
  onComplete,
}: {
  onComplete: (data: KompasData) => void;
}) {
  const TOTAL_SLIDES = 4;
  const [slide, setSlide] = useState(0);

  const [currentVals, setCurrentVals] = useState<Record<string, number>>(
    Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5]))
  );
  const [goalVals, setGoalVals] = useState<Record<string, number>>(
    Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 7]))
  );
  const [areaAnswers, setAreaAnswers] = useState<Record<string, string[]>>(
    Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, ["", "", "", ""]]))
  );

  const defaultFocus = WHEEL_AREAS.reduce((best, a) => {
    const d = (goalVals[a.key] ?? 5) - (currentVals[a.key] ?? 5);
    const bd = (goalVals[best.key] ?? 5) - (currentVals[best.key] ?? 5);
    return d > bd ? a : best;
  }, WHEEL_AREAS[0]);
  const [focusArea, setFocusArea] = useState(defaultFocus.key);

  const isLastSlide = slide === TOTAL_SLIDES - 1;
  const focusAreaObj = WHEEL_AREAS.find((a) => a.key === focusArea) ?? WHEEL_AREAS[0];

  const LABELS = ["Kdo jsi dnes", "Kde chceš být", "Vyber si dílek", focusAreaObj.short];

  const handleNext = () => {
    if (isLastSlide) {
      onComplete({
        currentVals,
        goalVals,
        areaAnswers,
        focusArea,
        completedAt: new Date().toISOString(),
      });
      return;
    }
    setSlide((s) => s + 1);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Progress bar */}
        <View style={s.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>{LABELS[slide]}</Text>
            <Text style={{ fontSize: 12, color: "rgba(0,0,0,0.3)" }}>
              {slide + 1} / {TOTAL_SLIDES}
            </Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${((slide + 1) / TOTAL_SLIDES) * 100}%` }]} />
          </View>
        </View>

        {/* Slide content */}
        <View style={[s.card, { marginTop: 12 }]}>
          {slide === 0 && <SlideCurrentSpider vals={currentVals} onChange={setCurrentVals} />}
          {slide === 1 && (
            <SlideGoalSpider currentVals={currentVals} goalVals={goalVals} onChange={setGoalVals} />
          )}
          {slide === 2 && (
            <SlideFocusArea
              currentVals={currentVals}
              goalVals={goalVals}
              focusArea={focusArea}
              onChange={setFocusArea}
            />
          )}
          {slide === 3 && (
            <SlideArea
              area={focusAreaObj}
              current={currentVals[focusAreaObj.key] ?? 5}
              goal={goalVals[focusAreaObj.key] ?? 5}
              answers={areaAnswers[focusAreaObj.key] ?? ["", "", "", ""]}
              onChange={(v) => setAreaAnswers((prev) => ({ ...prev, [focusAreaObj.key]: v }))}
            />
          )}
        </View>

        {/* Navigation */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <TouchableOpacity
            onPress={() => setSlide((s) => Math.max(0, s - 1))}
            disabled={slide === 0}
            style={[s.btnSecondary, slide === 0 && { opacity: 0.3 }]}
          >
            <Text style={s.btnSecondaryText}>← Zpět</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={s.btnPrimary} activeOpacity={0.8}>
            <Text style={s.btnPrimaryText}>{isLastSlide ? "Dokončit ✓" : "Dál →"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function KompasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<"flow" | "done">("flow");
  const [kompasData, setKompasData] = useState<KompasData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getUserContext();
        const ctx = res.context || {};
        if (ctx.compass) {
          const raw = ctx.compass as Record<string, unknown>;
          const defaults = Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5]));
          const normalized: KompasData = {
            currentVals: (raw.currentVals as Record<string, number>) ?? defaults,
            goalVals: (raw.goalVals as Record<string, number>) ?? { ...defaults },
            areaAnswers: (raw.areaAnswers as Record<string, string[]>) ??
              Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, ["", "", "", ""]])),
            focusArea: (raw.focusArea as string) ?? undefined,
            completedAt: (raw.completedAt as string) ?? new Date().toISOString(),
          };
          setKompasData(normalized);
          setPhase("done");
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleComplete = useCallback(async (data: KompasData) => {
    setSaving(true);
    try {
      await saveUserContext("compass", data);
      setKompasData(data);
      setPhase("done");
    } catch (err) {
      Alert.alert("Chyba", "Nepodařilo se uložit data. Zkus to znovu.");
    }
    setSaving(false);
  }, []);

  const handleReset = useCallback(async () => {
    setKompasData(null);
    setPhase("flow");
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Kompas</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : saving ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
          <Text style={{ color: colors.muted, marginTop: 8 }}>Ukládám...</Text>
        </View>
      ) : phase === "done" && kompasData ? (
        <KompasDashboard data={kompasData} onReset={handleReset} />
      ) : (
        <KompasFlowSlides onComplete={handleComplete} />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },

  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  slideLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(0,0,0,0.35)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  slideDesc: {
    fontSize: 14,
    color: "rgba(0,0,0,0.55)",
    lineHeight: 20,
    marginTop: 6,
  },
  avgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  avgText: { fontSize: 12, color: colors.muted },

  legendRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 12, height: 4, borderRadius: 2 },
  legendText: { fontSize: 11, color: colors.muted },

  scoreBarWrap: { gap: 4 },
  scoreBarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreBarLabel: { fontSize: 12, fontWeight: "500", color: "rgba(0,0,0,0.55)", flex: 1 },
  scoreBarSub: { fontSize: 10, color: "rgba(0,0,0,0.3)" },
  scoreBarVal: { fontSize: 12, fontWeight: "700", width: 16, textAlign: "right" },
  scoreBarRow: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  scoreBarBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.06)",
  },
  scoreBarBtnText: { fontSize: 10, fontWeight: "600" },

  warningBox: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFE082",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  warningText: { fontSize: 13, color: "#795548", lineHeight: 19 },

  focusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.07)",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  focusRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  focusRadioInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  focusLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.foreground },
  focusScore: { fontSize: 12, color: colors.muted },
  focusBadge: {
    backgroundColor: "rgba(55,138,221,0.1)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  focusBadgeText: { fontSize: 10, fontWeight: "700", color: COLOR_BLUE },

  areaTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  areaScoreText: { fontSize: 14, color: colors.muted },
  questionLabel: { fontSize: 13, fontWeight: "500", color: "rgba(0,0,0,0.6)", lineHeight: 18 },
  questionInput: {
    fontSize: 14,
    color: "rgba(0,0,0,0.7)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    marginTop: 6,
    minHeight: 60,
    textAlignVertical: "top",
  },

  progressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: COLOR_ORANGE,
  },

  btnPrimary: {
    flex: 1,
    backgroundColor: COLOR_ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnSecondary: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  btnSecondaryText: { color: colors.muted, fontSize: 15, fontWeight: "600" },

  navDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  navDotText: { fontSize: 14, color: colors.muted },
});
