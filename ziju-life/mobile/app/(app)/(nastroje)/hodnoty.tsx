import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ArrowUp, ArrowDown, X } from "lucide-react-native";
import { getUserContext, saveUserContext } from "@/api/dilna";
import { colors } from "@/constants/theme";

// ── Constants ────────────────────────────────────────────────────────────────

const COLOR_ACTIVE = "#FF8C42";
const STRONG_PRIMARY = 5;
const STRONG_MAX = 7;

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
];

type Rating = "strong" | "somewhat" | "no";

type HodnotyData = {
  finalValues: string[];
  alignmentScores?: Record<string, number>;
  savedAt: string;
};

// ── Swipe Game (button-based for mobile) ─────────────────────────────────────

function ValuesGame({ onComplete }: { onComplete: (values: string[]) => void }) {
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [cols, setCols] = useState<Record<Rating, string[]>>({
    strong: [],
    somewhat: [],
    no: [],
  });
  const [showArrange, setShowArrange] = useState(false);

  const values = ALL_VALUES;
  const swipeDone = swipeIndex >= values.length;
  const canConfirm = swipeDone && cols.strong.length >= STRONG_PRIMARY;

  const rate = (r: Rating) => {
    setCols((prev) => ({ ...prev, [r]: [...prev[r], values[swipeIndex]] }));
    setSwipeIndex((i) => i + 1);
  };

  const moveInCol = (val: string, col: Rating, direction: "up" | "down") => {
    setCols((prev) => {
      const arr = [...prev[col]];
      const idx = arr.indexOf(val);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= arr.length) return prev;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...prev, [col]: arr };
    });
  };

  const moveToCol = (val: string, from: Rating, to: Rating) => {
    setCols((prev) => ({
      ...prev,
      [from]: prev[from].filter((v) => v !== val),
      [to]: [...prev[to], val],
    }));
  };

  const handleConfirm = () => {
    onComplete(cols.strong.slice(0, STRONG_MAX));
  };

  // Swipe phase
  if (!swipeDone) {
    return (
      <View>
        <View style={s.swipeHeader}>
          <Text style={s.swipeLabel}>JAKÉ HODNOTY TI REZONUJÍ?</Text>
          <Text style={s.swipeCount}>
            {swipeIndex + 1} / {values.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={s.progressBg}>
          <View
            style={[
              s.progressFill,
              { width: `${((swipeIndex + 1) / values.length) * 100}%` },
            ]}
          />
        </View>

        {/* Current value card */}
        <View style={s.valueCard}>
          <Text style={s.valueCardText}>{values[swipeIndex]}</Text>
        </View>

        {/* Rating buttons */}
        <View style={s.ratingRow}>
          <TouchableOpacity style={s.rateNo} onPress={() => rate("no")} activeOpacity={0.7}>
            <Text style={s.rateNoText}>Nesouzním</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.rateSomewhat} onPress={() => rate("somewhat")} activeOpacity={0.7}>
            <Text style={s.rateSomewhatText}>Spíše{"\n"}souzním</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.rateStrong} onPress={() => rate("strong")} activeOpacity={0.7}>
            <Text style={s.rateStrongText}>Naprosto{"\n"}souzním</Text>
          </TouchableOpacity>
        </View>

        {/* Show bottom stats */}
        <View style={s.statsRow}>
          <Text style={s.statText}>💪 {cols.strong.length}</Text>
          <Text style={s.statText}>👍 {cols.somewhat.length}</Text>
          <Text style={s.statText}>👎 {cols.no.length}</Text>
        </View>
      </View>
    );
  }

  // Arrange phase
  return (
    <View>
      <Text style={s.arrangeDesc}>
        Seřaď hodnoty ve sloupci <Text style={{ fontWeight: "700" }}>Naprosto souzním</Text>. Prvních{" "}
        {STRONG_PRIMARY} míst jsou tvoje klíčové hodnoty. Můžeš přesouvat hodnoty mezi sloupci.
      </Text>

      {/* Strong column */}
      <View style={s.colSection}>
        <View style={s.colHeader}>
          <Text style={[s.colLabel, { color: COLOR_ACTIVE }]}>NAPROSTO SOUZNÍM</Text>
          <Text style={s.colCount}>{cols.strong.length}</Text>
        </View>
        <View style={{ gap: 4 }}>
          {cols.strong.slice(0, STRONG_MAX).map((val, i) => (
            <View
              key={val}
              style={[
                s.chip,
                i < STRONG_PRIMARY ? s.chipPrimary : s.chipSecondary,
              ]}
            >
              <Text style={s.chipIdx}>{i + 1}</Text>
              <Text style={s.chipText}>{val}</Text>
              <View style={s.chipActions}>
                {i > 0 && (
                  <TouchableOpacity onPress={() => moveInCol(val, "strong", "up")} hitSlop={6}>
                    <ArrowUp size={14} color={COLOR_ACTIVE} />
                  </TouchableOpacity>
                )}
                {i < Math.min(cols.strong.length, STRONG_MAX) - 1 && (
                  <TouchableOpacity onPress={() => moveInCol(val, "strong", "down")} hitSlop={6}>
                    <ArrowDown size={14} color={COLOR_ACTIVE} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => moveToCol(val, "strong", "somewhat")} hitSlop={6}>
                  <X size={14} color="rgba(0,0,0,0.3)" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, STRONG_MAX - cols.strong.length) }).map((_, i) => (
            <View key={`empty-${i}`} style={s.chipEmpty}>
              <Text style={s.chipEmptyIdx}>{cols.strong.length + i + 1}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Somewhat column */}
      <View style={s.colSection}>
        <View style={s.colHeader}>
          <Text style={[s.colLabel, { color: "#D97706" }]}>SPÍŠE SOUZNÍM</Text>
          <Text style={s.colCount}>{cols.somewhat.length}</Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
          {cols.somewhat.map((val) => (
            <TouchableOpacity
              key={val}
              style={s.chipSmall}
              onPress={() => moveToCol(val, "somewhat", "strong")}
              activeOpacity={0.7}
            >
              <Text style={s.chipSmallText}>{val}</Text>
              <Text style={s.chipSmallAdd}>+</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* No column */}
      <View style={s.colSection}>
        <View style={s.colHeader}>
          <Text style={[s.colLabel, { color: "rgba(0,0,0,0.35)" }]}>NESOUZNÍM</Text>
          <Text style={s.colCount}>{cols.no.length}</Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
          {cols.no.map((val) => (
            <TouchableOpacity
              key={val}
              style={s.chipSmallNo}
              onPress={() => moveToCol(val, "no", "strong")}
              activeOpacity={0.7}
            >
              <Text style={s.chipSmallNoText}>{val}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Buttons */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <TouchableOpacity
          onPress={() => {
            setSwipeIndex(0);
            setCols({ strong: [], somewhat: [], no: [] });
          }}
          style={s.btnSecondary}
        >
          <Text style={s.btnSecondaryText}>← Znovu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!canConfirm}
          style={[s.btnPrimary, !canConfirm && { opacity: 0.35 }]}
          activeOpacity={0.8}
        >
          <Text style={s.btnPrimaryText}>Tohle jsou moje hodnoty →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Alignment Step ───────────────────────────────────────────────────────────

function ValuesAlignment({
  values,
  onComplete,
}: {
  values: string[];
  onComplete: (scores: Record<string, number>) => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(values.map((v) => [v, 5]))
  );

  return (
    <View>
      <Text style={s.slideLabel}>ŽIJEŠ PODLE SVÝCH HODNOT?</Text>
      <Text style={s.slideDesc}>
        Ohodnoť, jak moc teď opravdu žiješ podle každé ze svých hodnot. Ne jak bys chtěl/a — jak to
        skutečně je.
      </Text>

      <View style={{ gap: 18, marginTop: 20 }}>
        {values.map((v, i) => (
          <View key={v}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[s.chipIdx, { color: i < 5 ? COLOR_ACTIVE : "rgba(255,140,66,0.6)" }]}>
                  {i + 1}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>{v}</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: COLOR_ACTIVE }}>{scores[v]}</Text>
            </View>
            <View style={s.alignBarRow}>
              {Array.from({ length: 10 }).map((_, n) => {
                const val = n + 1;
                const active = val <= scores[v];
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setScores((prev) => ({ ...prev, [v]: val }))}
                    style={[
                      s.alignBarBtn,
                      { backgroundColor: active ? COLOR_ACTIVE : "rgba(0,0,0,0.06)" },
                    ]}
                  />
                );
              })}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
              <Text style={s.alignLabel}>vůbec ne</Text>
              <Text style={s.alignLabel}>naprosto ano</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => onComplete(scores)}
        style={[s.btnPrimary, { marginTop: 20 }]}
        activeOpacity={0.8}
      >
        <Text style={s.btnPrimaryText}>Uložit →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Result View ──────────────────────────────────────────────────────────────

function ValuesResult({
  data,
  onReset,
}: {
  data: HodnotyData;
  onReset: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <View>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={s.slideLabel}>HODNOTY</Text>
          <Text style={[s.slideDesc, { marginTop: 4 }]}>
            Prvních 5 jsou tvoje klíčové hodnoty — zbytek jsou podpůrné.
          </Text>
        </View>
        {confirmReset ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>Opravdu?</Text>
            <TouchableOpacity onPress={() => { setConfirmReset(false); onReset(); }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.danger }}>Ano</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setConfirmReset(false)}>
              <Text style={{ fontSize: 12, color: colors.muted }}>Zrušit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setConfirmReset(true)}>
            <Text style={{ fontSize: 13, color: colors.muted }}>Projít znovu</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Values list */}
      <View style={[s.card, { marginTop: 16 }]}>
        <View style={{ gap: 8 }}>
          {data.finalValues.map((val, i) => {
            const score = data.alignmentScores?.[val];
            const isPrimary = i < STRONG_PRIMARY;
            return (
              <View key={val} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={[
                    s.resultChip,
                    isPrimary ? s.resultChipPrimary : s.resultChipSecondary,
                  ]}
                >
                  <Text
                    style={[s.chipIdx, { color: isPrimary ? COLOR_ACTIVE : "rgba(255,140,66,0.6)" }]}
                  >
                    {i + 1}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }}>
                    {val}
                  </Text>
                </View>
                {score !== undefined && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View style={{ flexDirection: "row", gap: 2 }}>
                      {Array.from({ length: 10 }).map((_, n) => (
                        <View
                          key={n}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 2,
                            backgroundColor: n < score ? COLOR_ACTIVE : "rgba(0,0,0,0.08)",
                          }}
                        />
                      ))}
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(0,0,0,0.4)" }}>
                      {score}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* How to work with values */}
      <View style={s.tipBox}>
        <Text style={[s.slideLabel, { marginBottom: 6 }]}>JAK S HODNOTAMI PRACOVAT</Text>
        <Text style={s.tipText}>
          Hodnoty jsou tvůj vnitřní kompas — ne pravidla, ale kritéria rozhodování. Když se ocitneš na
          rozcestí, zeptej se: „Která z těchto cest je v souladu s mými hodnotami?"
        </Text>
        <Text style={[s.tipText, { marginTop: 8 }]}>
          Zkus si jednou týdně říct, zda jsi minulý týden žil v souladu se svými top 5 hodnotami.
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function HodnotyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<"flow" | "alignment" | "done">("flow");
  const [hodnotyData, setHodnotyData] = useState<HodnotyData | null>(null);
  const [pendingValues, setPendingValues] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getUserContext();
        const ctx = res.context || {};
        if (ctx.values) {
          // Convert from API format [{name, alignment}] to HodnotyData
          const valuesArr = ctx.values as Array<{ name: string; alignment?: number }>;
          const data: HodnotyData = {
            finalValues: valuesArr.map((v) => v.name),
            alignmentScores: Object.fromEntries(
              valuesArr.filter((v) => v.alignment != null).map((v) => [v.name, v.alignment!])
            ),
            savedAt: new Date().toISOString(),
          };
          setHodnotyData(data);
          setPhase("done");
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleGameComplete = useCallback((values: string[]) => {
    setPendingValues(values);
    setPhase("alignment");
  }, []);

  const handleAlignmentComplete = useCallback(
    async (scores: Record<string, number>) => {
      const data: HodnotyData = {
        finalValues: pendingValues,
        alignmentScores: scores,
        savedAt: new Date().toISOString(),
      };
      setSaving(true);
      try {
        // Save in API format: [{name, alignment}]
        const apiData = pendingValues.map((name) => ({
          name,
          alignment: scores[name] ?? 5,
        }));
        await saveUserContext("values", apiData);
        setHodnotyData(data);
        setPhase("done");
      } catch {
        Alert.alert("Chyba", "Nepodařilo se uložit. Zkus to znovu.");
      }
      setSaving(false);
    },
    [pendingValues]
  );

  const handleReset = useCallback(() => {
    setHodnotyData(null);
    setPendingValues([]);
    setPhase("flow");
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Moje hodnoty</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading || saving ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
          {saving && <Text style={{ color: colors.muted, marginTop: 8 }}>Ukládám...</Text>}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={s.card}>
            {phase === "done" && hodnotyData ? (
              <ValuesResult data={hodnotyData} onReset={handleReset} />
            ) : phase === "alignment" ? (
              <ValuesAlignment values={pendingValues} onComplete={handleAlignmentComplete} />
            ) : (
              <ValuesGame onComplete={handleGameComplete} />
            )}
          </View>
        </ScrollView>
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

  // Swipe phase
  swipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  swipeLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(0,0,0,0.35)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  swipeCount: { fontSize: 12, color: "rgba(0,0,0,0.4)" },

  progressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
    marginBottom: 20,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: COLOR_ACTIVE,
  },

  valueCard: {
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  valueCardText: { fontSize: 26, fontWeight: "700", color: colors.foreground },

  ratingRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  rateNo: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
  },
  rateNoText: { fontSize: 12, fontWeight: "600", color: "rgba(0,0,0,0.5)" },
  rateSomewhat: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFE082",
    backgroundColor: "rgba(255,248,225,0.8)",
    alignItems: "center",
  },
  rateSomewhatText: { fontSize: 12, fontWeight: "600", color: "#D97706", textAlign: "center" },
  rateStrong: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#A5D6A7",
    backgroundColor: "rgba(232,245,233,0.8)",
    alignItems: "center",
  },
  rateStrongText: { fontSize: 12, fontWeight: "600", color: "#2E7D32", textAlign: "center" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  statText: { fontSize: 13, color: colors.muted },

  // Arrange phase
  arrangeDesc: {
    fontSize: 14,
    color: "rgba(0,0,0,0.55)",
    lineHeight: 20,
    marginBottom: 16,
  },

  colSection: { marginBottom: 16 },
  colHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  colLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  colCount: { fontSize: 10, color: "rgba(0,0,0,0.3)" },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  chipPrimary: {
    borderWidth: 2,
    borderColor: COLOR_ACTIVE,
    backgroundColor: "rgba(255,243,232,1)",
  },
  chipSecondary: {
    borderWidth: 2,
    borderColor: "rgba(255,140,66,0.3)",
    backgroundColor: "rgba(255,243,232,0.5)",
  },
  chipIdx: { fontSize: 10, fontWeight: "700", color: COLOR_ACTIVE },
  chipText: { flex: 1, fontSize: 13, fontWeight: "500", color: colors.foreground },
  chipActions: { flexDirection: "row", gap: 10, alignItems: "center" },

  chipEmpty: {
    height: 36,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(255,140,66,0.2)",
    backgroundColor: "rgba(255,243,232,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  chipEmptyIdx: { fontSize: 10, fontWeight: "700", color: "rgba(255,140,66,0.3)" },

  chipSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFE082",
    backgroundColor: "rgba(255,248,225,0.6)",
  },
  chipSmallText: { fontSize: 12, fontWeight: "500", color: "#D97706" },
  chipSmallAdd: { fontSize: 14, fontWeight: "600", color: "#D97706" },

  chipSmallNo: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  chipSmallNoText: { fontSize: 12, fontWeight: "500", color: "rgba(0,0,0,0.35)" },

  // Alignment
  alignBarRow: {
    flexDirection: "row",
    gap: 3,
  },
  alignBarBtn: {
    flex: 1,
    height: 20,
    borderRadius: 3,
  },
  alignLabel: { fontSize: 10, color: "rgba(0,0,0,0.3)" },

  // Result
  resultChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resultChipPrimary: {
    borderWidth: 2,
    borderColor: COLOR_ACTIVE,
    backgroundColor: "rgba(255,243,232,1)",
  },
  resultChipSecondary: {
    borderWidth: 2,
    borderColor: "rgba(255,140,66,0.3)",
    backgroundColor: "rgba(255,243,232,0.5)",
  },

  tipBox: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tipText: { fontSize: 13, color: "rgba(0,0,0,0.55)", lineHeight: 19 },

  // Buttons
  btnPrimary: {
    flex: 1,
    backgroundColor: COLOR_ACTIVE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnSecondary: {
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  btnSecondaryText: { color: colors.muted, fontSize: 15, fontWeight: "600" },
});
