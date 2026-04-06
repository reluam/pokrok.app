import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from "react-native-svg";
import { getUserContext } from "@/api/manual";
import { colors } from "@/constants/theme";

const WHEEL_AREAS = [
  { key: "kariera", short: "Kariéra" },
  { key: "finance", short: "Finance" },
  { key: "zdravi", short: "Zdraví" },
  { key: "rodina", short: "Rodina" },
  { key: "pratele", short: "Přátelé" },
  { key: "rozvoj", short: "Rozvoj" },
  { key: "volny", short: "Volný čas" },
  { key: "smysl", short: "Smysl" },
];

// ── Types ────────────────────────────────────────────────────────────────────

interface KompasData {
  current?: Record<string, number>;
  goals?: Record<string, number>;
  focusArea?: string;
}

interface ValueItem {
  name: string;
  alignment?: number;
}

interface PrinciplesData {
  principles: { text: string; origin: string }[];
}

interface VisionData {
  idealDay?: string;
}

interface PhilosophyData {
  statement?: string;
  principles?: string[];
}

// ── Spider Chart (read-only) ────────────────────────────────────────────────

function SpiderChart({
  current,
  goals,
  size = 240,
}: {
  current: Record<string, number>;
  goals?: Record<string, number>;
  size?: number;
}) {
  const C = size / 2;
  const R = C - 36;
  const N = WHEEL_AREAS.length;

  const pt = (i: number, v: number): [number, number] => {
    const a = (2 * Math.PI * i) / N - Math.PI / 2;
    const r = (v / 10) * R;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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

        {/* Goals (dashed) */}
        {goals && (
          <Polygon
            points={WHEEL_AREAS.map((a, i) => pt(i, goals[a.key] ?? 5).join(",")).join(" ")}
            fill="rgba(55,138,221,0.06)"
            stroke="#378ADD"
            strokeWidth="1"
            strokeDasharray="4,3"
          />
        )}

        {/* Current */}
        <Polygon
          points={WHEEL_AREAS.map((a, i) => pt(i, current[a.key] ?? 5).join(",")).join(" ")}
          fill="rgba(255,140,66,0.13)"
          stroke="#FF8C42"
          strokeWidth="1.5"
        />

        {/* Labels + dots */}
        {WHEEL_AREAS.map((a, i) => {
          const [x, y] = pt(i, current[a.key] ?? 5);
          const ang = (2 * Math.PI * i) / N - Math.PI / 2;
          const lx = C + (R + 28) * Math.cos(ang);
          const ly = C + (R + 28) * Math.sin(ang);
          return (
            <G key={a.key}>
              <SvgText x={lx} y={ly} textAnchor="middle" alignmentBaseline="central" fontSize="8" fill="#888" fontFamily="System">
                {a.short}
              </SvgText>
              <Circle cx={x} cy={y} r="3" fill="#FF8C42" />
              <SvgText x={x} y={y - 8} textAnchor="middle" alignmentBaseline="central" fontSize="8" fontWeight="700" fill="#FF8C42" fontFamily="System">
                {String(current[a.key] ?? 5)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// ── Section Card ────────────────────────────────────────────────────────────

function SectionCard({ title, emoji, children, empty }: {
  title: string;
  emoji: string;
  children?: React.ReactNode;
  empty?: string;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardEmoji}>{emoji}</Text>
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      {children || (
        <Text style={s.emptyText}>{empty || "Zatím nevyplněno. Vyplň na webu."}</Text>
      )}
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────

export default function ManualOverview() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [kompas, setKompas] = useState<KompasData | null>(null);
  const [values, setValues] = useState<ValueItem[]>([]);
  const [principles, setPrinciples] = useState<PrinciplesData | null>(null);
  const [vision, setVision] = useState<VisionData | null>(null);
  const [philosophy, setPhilosophy] = useState<PhilosophyData | null>(null);

  const load = useCallback(async () => {
    try {
      const { context } = await getUserContext();
      const ctx = context || {};

      setKompas((ctx.compass as KompasData) ?? null);
      setValues(Array.isArray(ctx.values) ? (ctx.values as ValueItem[]) : []);
      setPrinciples((ctx.principles as PrinciplesData) ?? null);
      setVision((ctx.vision as VisionData) ?? null);
      setPhilosophy((ctx.philosophy as PhilosophyData) ?? null);
    } catch (err) {
      console.error("Manual load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>Načítám...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasKompas = kompas?.current && Object.keys(kompas.current).length > 0;
  const hasValues = values.length > 0;
  const hasPrinciples = principles?.principles && principles.principles.length > 0;
  const hasVision = vision?.idealDay && vision.idealDay.trim().length > 0;
  const hasPhilosophy = philosophy?.statement && philosophy.statement.trim().length > 0;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <Text style={s.pageTitle}>Manuál</Text>
        <Text style={s.pageSubtitle}>Tvé výsledky a životní směřování</Text>

        {/* Kolo života */}
        <SectionCard title="Kolo života" emoji="🎯" empty="Vyplň Kompas na webu, aby se tu zobrazily výsledky.">
          {hasKompas && (
            <View>
              <SpiderChart current={kompas!.current!} goals={kompas?.goals} />
              {kompas?.focusArea && (
                <View style={s.focusArea}>
                  <Text style={s.focusLabel}>Zaměření:</Text>
                  <Text style={s.focusValue}>
                    {WHEEL_AREAS.find(a => a.key === kompas.focusArea)?.short ?? kompas.focusArea}
                  </Text>
                </View>
              )}
            </View>
          )}
        </SectionCard>

        {/* Hodnoty */}
        <SectionCard title="Moje hodnoty" emoji="💎" empty="Vyplň hodnoty na webu.">
          {hasValues && (
            <View style={s.valuesList}>
              {values.map((v, i) => (
                <View key={i} style={s.valueRow}>
                  <View style={s.valueRank}>
                    <Text style={s.valueRankText}>{i + 1}</Text>
                  </View>
                  <Text style={s.valueName}>{v.name}</Text>
                  {v.alignment != null && (
                    <View style={s.alignmentBadge}>
                      <Text style={s.alignmentText}>{v.alignment}/10</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </SectionCard>

        {/* Principy */}
        <SectionCard title="Principy" emoji="⚖️" empty="Principy zatím nemáš. Vyplň je na webu.">
          {hasPrinciples && (
            <View style={s.principlesList}>
              {principles!.principles.map((p, i) => (
                <View key={i} style={s.principleRow}>
                  <Text style={s.principleText}>{p.text}</Text>
                  {p.origin ? (
                    <Text style={s.principleOrigin}>{p.origin}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </SectionCard>

        {/* Vize */}
        <SectionCard title="Den za 5 let" emoji="🔭" empty="Napiš svou vizi na webu.">
          {hasVision && (
            <Text style={s.longText}>{vision!.idealDay}</Text>
          )}
        </SectionCard>

        {/* Životní filozofie */}
        <SectionCard title="Životní filozofie" emoji="🌱" empty="Definuj svou filozofii na webu.">
          {hasPhilosophy && (
            <View>
              <Text style={s.longText}>{philosophy!.statement}</Text>
              {philosophy!.principles && philosophy!.principles.length > 0 && (
                <View style={s.philPrinciples}>
                  {philosophy!.principles.filter(p => p.trim()).map((p, i) => (
                    <View key={i} style={s.philPrincipleRow}>
                      <Text style={s.philPrincipleDot}>•</Text>
                      <Text style={s.philPrincipleText}>{p}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },

  pageTitle: { fontSize: 22, fontWeight: "800", color: colors.foreground },
  pageSubtitle: { fontSize: 13, color: colors.muted, marginBottom: 20 },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  cardEmoji: { fontSize: 18 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  emptyText: { fontSize: 13, color: colors.muted, fontStyle: "italic" },

  // Kompas
  focusArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  focusLabel: { fontSize: 12, color: colors.muted },
  focusValue: { fontSize: 13, fontWeight: "700", color: colors.accent },

  // Values
  valuesList: { gap: 8 },
  valueRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  valueRank: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(255,140,66,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  valueRankText: { fontSize: 11, fontWeight: "700", color: colors.accent },
  valueName: { fontSize: 14, fontWeight: "600", color: colors.foreground, flex: 1 },
  alignmentBadge: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  alignmentText: { fontSize: 11, fontWeight: "600", color: colors.muted },

  // Principles
  principlesList: { gap: 10 },
  principleRow: { gap: 2 },
  principleText: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  principleOrigin: { fontSize: 12, color: colors.muted, fontStyle: "italic" },

  // Long text (vision, philosophy)
  longText: { fontSize: 14, color: colors.foreground, lineHeight: 21 },

  // Philosophy principles
  philPrinciples: { marginTop: 10, gap: 4 },
  philPrincipleRow: { flexDirection: "row", gap: 6 },
  philPrincipleDot: { fontSize: 14, color: colors.muted },
  philPrincipleText: { fontSize: 13, color: colors.foreground, flex: 1 },
});
