import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from "react-native-svg";
import { useRouter } from "expo-router";
import { getCheckins, submitCheckin, getUserContext } from "@/api/laborator";
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

type CheckinEntry = {
  score: number | null;
  week_start_date: string;
  value_scores: Record<string, number> | null;
  area_scores: Record<string, number> | null;
};

type Step = "values" | "areas" | "done";

// ── ScoreBar ──────────────────────────────────────────────────────────────────

function ScoreBar({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={s.scoreRow}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          style={[s.scoreBtn, n <= value && s.scoreBtnFill]}
        >
          <Text style={[s.scoreBtnText, n <= value && s.scoreBtnTextFill]}>{n}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── SpiderChart (touch-interactive) ──────────────────────────────────────────

function InteractiveSpider({
  vals,
  prevVals,
  onChange,
  size = 260,
}: {
  vals: Record<string, number>;
  prevVals?: Record<string, number>;
  onChange: (key: string, score: number) => void;
  size?: number;
}) {
  const C = size / 2;
  const R = C - 48;
  const N = WHEEL_AREAS.length;

  const pt = (i: number, v: number): [number, number] => {
    const a = (2 * Math.PI * i) / N - Math.PI / 2;
    const r = (v / 10) * R;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  const handlePress = (areaKey: string, direction: "up" | "down") => {
    const current = vals[areaKey] ?? 5;
    const next = direction === "up" ? Math.min(10, current + 1) : Math.max(1, current - 1);
    onChange(areaKey, next);
  };

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

        {/* Previous week (dashed) */}
        {prevVals && (
          <Polygon
            points={WHEEL_AREAS.map((a, i) => pt(i, prevVals[a.key] ?? 5).join(",")).join(" ")}
            fill="rgba(0,0,0,0.04)"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="1"
            strokeDasharray="3,2"
          />
        )}

        {/* Current polygon */}
        <Polygon
          points={WHEEL_AREAS.map((a, i) => pt(i, vals[a.key] ?? 5).join(",")).join(" ")}
          fill="rgba(255,140,66,0.13)"
          stroke="#FF8C42"
          strokeWidth="1.5"
        />

        {/* Labels + dots + score */}
        {WHEEL_AREAS.map((a, i) => {
          const [x, y] = pt(i, vals[a.key] ?? 5);
          const ang = (2 * Math.PI * i) / N - Math.PI / 2;
          const lx = C + (R + 32) * Math.cos(ang);
          const ly = C + (R + 32) * Math.sin(ang);
          const score = vals[a.key] ?? 5;
          return (
            <G key={a.key}>
              <SvgText
                x={lx} y={ly}
                textAnchor="middle"
                alignmentBaseline="central"
                fontSize="9"
                fill="#888"
                fontFamily="System"
              >
                {a.short}
              </SvgText>
              <Circle cx={x} cy={y} r="4" fill="#FF8C42" />
              <SvgText
                x={x} y={y - 9}
                textAnchor="middle"
                alignmentBaseline="central"
                fontSize="9"
                fontWeight="700"
                fill="#FF8C42"
                fontFamily="System"
              >
                {String(score)}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* +/- buttons per area */}
      <View style={s.areaButtons}>
        {WHEEL_AREAS.map((a) => (
          <View key={a.key} style={s.areaRow}>
            <Text style={s.areaLabel}>{a.short}</Text>
            <View style={s.pmRow}>
              <TouchableOpacity style={s.pmBtn} onPress={() => handlePress(a.key, "down")}>
                <Text style={s.pmText}>−</Text>
              </TouchableOpacity>
              <Text style={s.pmVal}>{vals[a.key] ?? 5}</Text>
              <TouchableOpacity style={s.pmBtn} onPress={() => handlePress(a.key, "up")}>
                <Text style={s.pmText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function CheckinScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("values");
  const [saving, setSaving] = useState(false);

  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
  const [reflectionDone, setReflectionDone] = useState(false);
  const [values, setValues] = useState<string[]>([]);
  const [valueScores, setValueScores] = useState<Record<string, number>>({});
  const [areaScores, setAreaScores] = useState<Record<string, number>>(
    () => Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5]))
  );

  const prevCheckin = checkins.length >= 2 ? checkins[checkins.length - 2] : null;

  const load = useCallback(async () => {
    try {
      const [checkinData, ctxData] = await Promise.all([getCheckins(), getUserContext()]);
      setCheckins(checkinData.checkins ?? []);
      setReflectionDone(checkinData.reflectionDone ?? false);

      // Extract user values from context
      const ctx = ctxData.context || {};
      const valuesCtx = ctx.values as Array<{ name: string; alignment?: number }> | undefined;
      if (valuesCtx && Array.isArray(valuesCtx)) {
        const names = valuesCtx.map((v) => v.name);
        setValues(names);
        setValueScores(Object.fromEntries(names.map((n) => [n, 5])));
      }
    } catch (err) {
      console.error("Checkin load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Skip values step if no values
  useEffect(() => {
    if (!loading && values.length === 0 && step === "values") {
      setStep("areas");
    }
  }, [loading, values, step]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await submitCheckin(areaScores, values.length > 0 ? valueScores : undefined);
      setReflectionDone(true);
      setStep("done");
    } catch (err) {
      console.error("Submit error:", err);
    }
    setSaving(false);
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

  if (reflectionDone && step !== "done") {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Tento týden vyplněno
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
            Další reflexe se zobrazí v neděli.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "done") {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Reflexe uložena!
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 24 }}>
            Další reflexe se zobrazí v neděli.
          </Text>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => router.back()}
          >
            <Text style={s.primaryBtnText}>← Zpět na přehled</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        {step === "values" && values.length > 0 && (
          <View>
            <Text style={s.title}>Hodnoty — jak jsi je žil/a tento týden?</Text>
            <Text style={s.subtitle}>Ohodnoť každou hodnotu 1–10.</Text>

            {values.map((v) => (
              <View key={v} style={s.valueItem}>
                <View style={s.valueHeader}>
                  <Text style={s.valueName}>{v}</Text>
                  <Text style={s.valueScore}>{valueScores[v] ?? 5}</Text>
                </View>
                <ScoreBar
                  value={valueScores[v] ?? 5}
                  onChange={(n) => setValueScores((p) => ({ ...p, [v]: n }))}
                />
              </View>
            ))}

            <TouchableOpacity style={s.primaryBtn} onPress={() => setStep("areas")}>
              <Text style={s.primaryBtnText}>Dál — oblasti →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "areas" && (
          <View>
            <Text style={s.title}>Oblasti — jak se ti dařilo tento týden?</Text>
            <Text style={s.subtitle}>Nastav skóre 1–10 pro každou oblast.</Text>

            <InteractiveSpider
              vals={areaScores}
              prevVals={prevCheckin?.area_scores ?? undefined}
              onChange={(key, score) => setAreaScores((p) => ({ ...p, [key]: score }))}
            />

            <View style={s.btnRow}>
              {values.length > 0 && (
                <TouchableOpacity style={s.secondaryBtn} onPress={() => setStep("values")}>
                  <Text style={s.secondaryBtnText}>← Zpět</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.primaryBtn, { flex: 1 }, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={s.primaryBtnText}>{saving ? "Ukládám…" : "Uložit reflexi ✓"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },

  title: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.muted, marginBottom: 20 },

  // Values
  valueItem: { marginBottom: 16 },
  valueHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  valueName: { fontSize: 14, fontWeight: "600", color: "rgba(0,0,0,0.65)" },
  valueScore: { fontSize: 13, fontWeight: "700", color: colors.accent },

  // Score bar
  scoreRow: { flexDirection: "row", gap: 3 },
  scoreBtn: {
    flex: 1, height: 32, borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.04)",
    justifyContent: "center", alignItems: "center",
  },
  scoreBtnFill: { backgroundColor: colors.accent },
  scoreBtnText: { fontSize: 11, fontWeight: "700", color: "rgba(0,0,0,0.3)" },
  scoreBtnTextFill: { color: "#fff" },

  // Area +/- controls
  areaButtons: { marginTop: 12, gap: 6 },
  areaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  areaLabel: { fontSize: 13, fontWeight: "600", color: "rgba(0,0,0,0.6)", width: 80 },
  pmRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pmBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.06)",
    justifyContent: "center", alignItems: "center",
  },
  pmText: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  pmVal: { fontSize: 15, fontWeight: "700", color: colors.accent, width: 20, textAlign: "center" },

  // Buttons
  btnRow: { flexDirection: "row", gap: 10, marginTop: 24 },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14, borderRadius: 999,
    alignItems: "center", marginTop: 20,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    flex: 1, borderWidth: 1, borderColor: "rgba(0,0,0,0.12)",
    paddingVertical: 14, borderRadius: 999,
    alignItems: "center", marginTop: 20,
  },
  secondaryBtnText: { color: "rgba(0,0,0,0.5)", fontWeight: "600", fontSize: 15 },
});
