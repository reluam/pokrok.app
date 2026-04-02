import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Check, X, ChevronDown, ChevronUp } from "lucide-react-native";
import { saveUserContext, getUserContext } from "@/api/manual";
import { colors } from "@/constants/theme";
import {
  categories,
  featuredBuild,
  ritualsById,
  SLOT_MAX,
  SLOT_LABELS,
  type Ritual,
  type Slot,
} from "@/data/adhdRituals";
import { useEffect } from "react";

// ── Custom ritual helpers ────────────────────────────────────────────────────

const CUSTOM_PREFIX = "custom::";
const isCustom = (id: string) => id.startsWith(CUSTOM_PREFIX);
const customName = (id: string) => id.slice(CUSTOM_PREFIX.length).split("::")[0];
const customDurationMin = (id: string) => {
  const parts = id.split("::");
  return parts.length >= 3 ? parseInt(parts[2]) || 0 : 0;
};
const makeCustomId = (name: string, duration: number) =>
  `${CUSTOM_PREFIX}${name.trim()}::${duration}`;

function getRitual(
  id: string,
  overrides?: Record<string, number>
): { name: string; duration_min: number } {
  if (isCustom(id)) return { name: customName(id), duration_min: customDurationMin(id) };
  const r = ritualsById[id];
  const base = r?.duration_min ?? 0;
  return { name: r?.name ?? id, duration_min: overrides?.[id] ?? base };
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Answers {
  wakeTime: string;
  screenFree: string;
  mainProblem: string;
  exercise: string;
  goal: string;
}

interface RitualSelection {
  morning: string[];
  daily: string[];
  evening: string[];
  durationOverrides?: Record<string, number>;
}

// ── Step progress dots ───────────────────────────────────────────────────────

function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <View style={s.stepRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            s.stepDot,
            i + 1 === step
              ? s.stepDotActive
              : i + 1 < step
              ? s.stepDotDone
              : s.stepDotPending,
          ]}
        />
      ))}
    </View>
  );
}

// ── Step 1: Onboarding ───────────────────────────────────────────────────────

const questions: Array<{ key: keyof Answers; question: string; options: string[] }> = [
  {
    key: "wakeTime",
    question: "V kolik obvykle vstáváš?",
    options: ["Před 6:00", "6:00–8:00", "8:00–10:00", "Po 10:00"],
  },
  {
    key: "screenFree",
    question: "Máš ráno čas bez obrazovky?",
    options: ["Ano, aspoň 30 min", "Ano, ale jen chvíli", "Ne, hned koukám na telefon"],
  },
  {
    key: "mainProblem",
    question: "Co ti dělá největší problém?",
    options: ["Soustředění", "Energie přes den", "Spánek", "Organizace a plánování"],
  },
  {
    key: "exercise",
    question: "Jak jsi na tom s pohybem?",
    options: ["Cvičím pravidelně", "Občas", "Skoro vůbec"],
  },
  {
    key: "goal",
    question: "Co tě sem přivedlo?",
    options: ["Chci systém na ráno", "Chci vyřešit celý den", "Chci hlavně spánek a energii"],
  },
];

function Step1Onboarding({
  answers,
  setAnswers,
  onDone,
}: {
  answers: Answers;
  setAnswers: (a: Answers) => void;
  onDone: () => void;
}) {
  const [qIndex, setQIndex] = useState(0);
  const q = questions[qIndex];

  function pick(option: string) {
    const updated = { ...answers, [q.key]: option };
    setAnswers(updated);
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      onDone();
    }
  }

  return (
    <View>
      <Text style={s.stepCounter}>
        Otázka {qIndex + 1} z {questions.length}
      </Text>
      <Text style={s.stepTitle}>{q.question}</Text>
      <View style={{ gap: 10, marginTop: 24 }}>
        {q.options.map((opt) => (
          <TouchableOpacity key={opt} style={s.optionCard} onPress={() => pick(opt)} activeOpacity={0.7}>
            <Text style={s.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Step 2: Configurator ─────────────────────────────────────────────────────

const SLOT_ORDER: Slot[] = ["morning", "daily", "evening"];
const SLOT_META: Record<Slot, { emoji: string; heading: string; sub: string }> = {
  morning: { emoji: "🌅", heading: "Ranní rituály", sub: "Jak začneš den — než přijdou povinnosti." },
  daily: { emoji: "☀️", heading: "Denní rituály", sub: "Kotvy a návyky v průběhu dne." },
  evening: { emoji: "🌙", heading: "Večerní rituály", sub: "Jak den zakončíš a připravíš se na spánek." },
};

function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <View style={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: i <= level ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.1)",
          }}
        />
      ))}
    </View>
  );
}

function Step3Configurator({
  selection,
  setSelection,
  onNext,
  onBack,
}: {
  selection: RitualSelection;
  setSelection: (s: RitualSelection) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [slotIndex, setSlotIndex] = useState(0);
  const [expandedWhy, setExpandedWhy] = useState<string | null>(null);
  const [warning, setWarning] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [customDuration, setCustomDuration] = useState(5);

  const slot = SLOT_ORDER[slotIndex];
  const meta = SLOT_META[slot];
  const isLast = slotIndex === SLOT_ORDER.length - 1;

  const availableRituals = categories.flatMap((c) =>
    c.rituals.filter((r) => r.slots.includes(slot))
  );

  const customIds = selection[slot].filter(isCustom);

  function addCustomRitual() {
    const name = customInput.trim();
    if (!name) return;
    const id = makeCustomId(name, customDuration);
    const current = selection[slot];
    if (current.includes(id)) {
      setCustomInput("");
      return;
    }
    if (current.length >= SLOT_MAX[slot]) {
      setWarning(`Pro ADHD mozek je míň víc. Vyber max ${SLOT_MAX[slot]} rituály.`);
      return;
    }
    setWarning("");
    setSelection({ ...selection, [slot]: [...current, id] });
    setCustomInput("");
    setCustomDuration(5);
  }

  function togglePredefined(ritual: Ritual) {
    const current = selection[slot];
    if (current.includes(ritual.id)) {
      setSelection({ ...selection, [slot]: current.filter((id) => id !== ritual.id) });
      setWarning("");
    } else {
      if (current.length >= SLOT_MAX[slot]) {
        setWarning(`Pro ADHD mozek je míň víc. Vyber max ${SLOT_MAX[slot]} rituály.`);
        return;
      }
      setWarning("");
      setSelection({ ...selection, [slot]: [...current, ritual.id] });
    }
  }

  function goNext() {
    setWarning("");
    setExpandedWhy(null);
    setCustomInput("");
    if (isLast) {
      onNext();
    } else {
      setSlotIndex((i) => i + 1);
    }
  }

  function goBack() {
    setWarning("");
    setExpandedWhy(null);
    setCustomInput("");
    if (slotIndex === 0) {
      onBack();
    } else {
      setSlotIndex((i) => i - 1);
    }
  }

  const totalSelected = selection.morning.length + selection.daily.length + selection.evening.length;

  return (
    <View>
      {/* Slot progress */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={s.stepCounter}>
          {slotIndex + 1} / {SLOT_ORDER.length}
        </Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {SLOT_ORDER.map((_, i) => (
            <View
              key={i}
              style={{
                height: 5,
                width: 20,
                borderRadius: 3,
                backgroundColor:
                  i < slotIndex ? "rgba(255,140,66,0.4)" : i === slotIndex ? colors.accent : "rgba(0,0,0,0.1)",
              }}
            />
          ))}
        </View>
      </View>

      <Text style={s.stepTitle}>
        {meta.emoji} {meta.heading}
      </Text>
      <Text style={s.stepDesc}>{meta.sub}</Text>
      <Text style={[s.stepCounter, { marginTop: 4, marginBottom: 16 }]}>
        Vybráno: {selection[slot].length} / {SLOT_MAX[slot]} (méně je více)
      </Text>

      {/* Custom ritual input */}
      <View style={s.customRow}>
        <TextInput
          value={customInput}
          onChangeText={setCustomInput}
          onSubmitEditing={addCustomRitual}
          placeholder="Napsat vlastní rituál…"
          placeholderTextColor="rgba(0,0,0,0.3)"
          style={s.customInput}
          returnKeyType="done"
        />
        <View style={s.customDurWrap}>
          <TextInput
            value={String(customDuration)}
            onChangeText={(t) => setCustomDuration(Math.max(1, parseInt(t) || 1))}
            keyboardType="number-pad"
            style={s.customDurInput}
          />
          <Text style={s.customDurLabel}>min</Text>
        </View>
        <TouchableOpacity
          onPress={addCustomRitual}
          disabled={!customInput.trim()}
          style={[s.customAddBtn, !customInput.trim() && { opacity: 0.3 }]}
        >
          <Check size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Custom rituals list */}
      {customIds.length > 0 && (
        <View style={{ gap: 6, marginTop: 10 }}>
          {customIds.map((id) => (
            <View key={id} style={s.customChip}>
              <View style={s.customChipCheck}>
                <Check size={12} color="#fff" />
              </View>
              <Text style={s.customChipText}>{customName(id)}</Text>
              {customDurationMin(id) > 0 && (
                <Text style={s.customChipDur}>{customDurationMin(id)} min</Text>
              )}
              <TouchableOpacity
                onPress={() =>
                  setSelection({ ...selection, [slot]: selection[slot].filter((x) => x !== id) })
                }
              >
                <X size={14} color="rgba(0,0,0,0.3)" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {warning ? (
        <View style={s.warningBox}>
          <Text style={s.warningText}>{warning}</Text>
        </View>
      ) : null}

      {/* Predefined rituals */}
      <Text style={[s.stepCounter, { marginTop: 20, marginBottom: 10 }]}>NEBO VYBER Z NABÍDKY</Text>
      <View style={{ gap: 8 }}>
        {availableRituals.map((ritual) => {
          const checked = selection[slot].includes(ritual.id);
          const isExpanded = expandedWhy === ritual.id;
          return (
            <View key={ritual.id} style={[s.ritualCard, checked && s.ritualCardChecked]}>
              <View style={s.ritualMain}>
                <TouchableOpacity
                  onPress={() => togglePredefined(ritual)}
                  style={[s.ritualCheck, checked && s.ritualCheckActive]}
                >
                  {checked && <Check size={12} color="#fff" />}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text style={s.ritualName}>{ritual.name}</Text>
                    {ritual.duration_min > 0 && (
                      <Text style={s.ritualDur}>{ritual.duration_min} min</Text>
                    )}
                    <DifficultyDots level={ritual.difficulty} />
                  </View>
                  {isExpanded && (
                    <View style={{ marginTop: 8, gap: 4 }}>
                      <Text style={s.ritualWhy}>{ritual.why}</Text>
                      <Text style={s.ritualTip}>💡 {ritual.tip}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setExpandedWhy(isExpanded ? null : ritual.id)}
                  hitSlop={8}
                >
                  <Text style={s.whyBtn}>{isExpanded ? "Méně" : "Proč?"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Featured build (only on first slot) */}
      {slotIndex === 0 && (
        <View style={s.featuredCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.featuredTitle}>⭐ {featuredBuild.name}</Text>
            <Text style={s.featuredDesc}>{featuredBuild.description}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
              <Text style={s.featuredStat}>🌅 {featuredBuild.morning.length} ráno</Text>
              <Text style={s.featuredStat}>☀️ {featuredBuild.daily.length} den</Text>
              <Text style={s.featuredStat}>🌙 {featuredBuild.evening.length} večer</Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.featuredBtn}
            onPress={() => {
              setSelection({
                morning: [...featuredBuild.morning],
                daily: [...featuredBuild.daily],
                evening: [...featuredBuild.evening],
                durationOverrides: {},
              });
              setWarning("");
              onNext();
            }}
          >
            <Text style={s.featuredBtnText}>Použít vše</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
        <TouchableOpacity onPress={goBack} style={s.btnSecondary}>
          <Text style={s.btnSecondaryText}>← Zpět</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goNext}
          disabled={isLast && totalSelected === 0}
          style={[s.btnPrimary, isLast && totalSelected === 0 && { opacity: 0.4 }]}
          activeOpacity={0.8}
        >
          <Text style={s.btnPrimaryText}>{isLast ? "Zobrazit preview →" : "Další →"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Step 4: Preview ──────────────────────────────────────────────────────────

function PreviewCard({ slot, ids, overrides }: { slot: Slot; ids: string[]; overrides?: Record<string, number> }) {
  const rituals = ids.map((id) => ({ id, ...getRitual(id, overrides) }));
  const totalMin = rituals.reduce((sum, r) => sum + r.duration_min, 0);

  if (ids.length === 0) {
    return (
      <View style={[s.previewCard, { opacity: 0.4 }]}>
        <Text style={s.previewEmpty}>{SLOT_LABELS[slot]} — žádné rituály</Text>
      </View>
    );
  }

  return (
    <View style={s.previewCard}>
      <View style={s.previewHeader}>
        <Text style={s.previewSlotLabel}>{SLOT_LABELS[slot]}</Text>
        <Text style={s.previewTotal}>{totalMin} min celkem</Text>
      </View>
      <View style={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
        {rituals.map((r) => (
          <View key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={s.previewCheckbox} />
            <Text style={s.previewRitualName}>{r.name}</Text>
            {r.duration_min > 0 && (
              <Text style={s.previewRitualDur}>{r.duration_min} min</Text>
            )}
          </View>
        ))}
      </View>
      <View style={s.previewFooter}>
        <Text style={s.previewFooterText}>
          Dnes nemusí být dokonalý den. Stačí, že je lepší než včera.
        </Text>
      </View>
    </View>
  );
}

function Step4Preview({
  selection,
  onEdit,
  onNext,
}: {
  selection: RitualSelection;
  onEdit: () => void;
  onNext: () => void;
}) {
  return (
    <View>
      <Text style={s.stepTitle}>Tvůj systém</Text>
      <Text style={s.stepDesc}>
        Takhle budou vypadat tvoje denní rituály. Pokud chceš něco změnit — vrať se zpět.
      </Text>
      <View style={{ gap: 12, marginTop: 20 }}>
        {(["morning", "daily", "evening"] as Slot[]).map((slot) => (
          <PreviewCard key={slot} slot={slot} ids={selection[slot]} overrides={selection.durationOverrides} />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
        <TouchableOpacity onPress={onEdit} style={s.btnSecondary}>
          <Text style={s.btnSecondaryText}>← Upravit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={s.btnPrimary} activeOpacity={0.8}>
          <Text style={s.btnPrimaryText}>Uložit →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Step 5: Done ─────────────────────────────────────────────────────────────

function Step5Done({ onComplete }: { onComplete: () => void }) {
  return (
    <View>
      <Text style={s.stepTitle}>Hotovo 🎉</Text>
      <Text style={s.stepDesc}>
        Systém je uložený. Tvoje rituály se budou zobrazovat na hlavní stránce, kde je můžeš každý den odškrtávat.
      </Text>
      <TouchableOpacity onPress={onComplete} style={[s.btnPrimary, { marginTop: 24 }]} activeOpacity={0.8}>
        <Text style={s.btnPrimaryText}>Přejít do Manuálu</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function NastavDenScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    wakeTime: "",
    screenFree: "",
    mainProblem: "",
    exercise: "",
    goal: "",
  });
  const [selection, setSelection] = useState<RitualSelection>({
    morning: [],
    daily: [],
    evening: [],
    durationOverrides: {},
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getUserContext();
        const ctx = res.context || {};
        if (ctx.rituals) {
          const existing = ctx.rituals as RitualSelection;
          setSelection({
            morning: existing.morning || [],
            daily: existing.daily || [],
            evening: existing.evening || [],
            durationOverrides: existing.durationOverrides || {},
          });
          setHasExisting(true);
          setStep(2); // Go directly to configurator for editing
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveUserContext("rituals", selection);
      setStep(4);
    } catch {
      Alert.alert("Chyba", "Nepodařilo se uložit. Zkus to znovu.");
    }
    setSaving(false);
  }, [selection]);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nastav si den</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading || saving ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
          {saving && <Text style={{ color: colors.muted, marginTop: 8 }}>Ukládám...</Text>}
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <StepProgress step={step} total={4} />
            <View style={s.card}>
              {step === 1 && (
                <Step1Onboarding
                  answers={answers}
                  setAnswers={setAnswers}
                  onDone={() => setStep(2)}
                />
              )}
              {step === 2 && (
                <Step3Configurator
                  selection={selection}
                  setSelection={setSelection}
                  onNext={() => setStep(3)}
                  onBack={() => (hasExisting ? router.back() : setStep(1))}
                />
              )}
              {step === 3 && (
                <Step4Preview
                  selection={selection}
                  onEdit={() => setStep(2)}
                  onNext={handleSave}
                />
              )}
              {step === 4 && <Step5Done onComplete={() => router.back()} />}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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

  // Step progress
  stepRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  stepDot: { borderRadius: 5 },
  stepDotActive: { width: 24, height: 8, backgroundColor: colors.accent },
  stepDotDone: { width: 8, height: 8, backgroundColor: "rgba(255,140,66,0.4)" },
  stepDotPending: { width: 8, height: 8, backgroundColor: "rgba(0,0,0,0.1)" },

  // Step content
  stepCounter: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(0,0,0,0.35)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  stepTitle: { fontSize: 24, fontWeight: "800", color: colors.foreground, marginTop: 8 },
  stepDesc: {
    fontSize: 14,
    color: "rgba(0,0,0,0.55)",
    lineHeight: 20,
    marginTop: 6,
  },

  // Options
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionText: { fontSize: 15, fontWeight: "600", color: colors.foreground },

  // Custom ritual input
  customRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  customInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontSize: 14,
    color: colors.foreground,
  },
  customDurWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  customDurInput: {
    width: 30,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: colors.foreground,
  },
  customDurLabel: { fontSize: 11, color: colors.muted },
  customAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },

  // Custom chips
  customChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,140,66,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,140,66,0.2)",
  },
  customChipCheck: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  customChipText: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.foreground },
  customChipDur: { fontSize: 12, color: colors.muted },

  // Rituals
  ritualCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  ritualCardChecked: {
    borderColor: "rgba(255,140,66,0.3)",
  },
  ritualMain: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ritualCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.18)",
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  ritualCheckActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  ritualName: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  ritualDur: { fontSize: 12, color: colors.muted },
  ritualWhy: { fontSize: 12, color: "rgba(0,0,0,0.6)", lineHeight: 17 },
  ritualTip: { fontSize: 12, color: "rgba(255,140,66,0.8)", lineHeight: 17 },
  whyBtn: { fontSize: 12, color: colors.muted },

  // Featured build
  featuredCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    marginTop: 20,
  },
  featuredTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  featuredDesc: { fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 16 },
  featuredStat: { fontSize: 12, color: colors.muted },
  featuredBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.foreground,
    borderRadius: 20,
  },
  featuredBtnText: { fontSize: 12, color: "#fff", fontWeight: "600" },

  // Preview
  previewCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  previewHeader: {
    backgroundColor: colors.foreground,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  previewSlotLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  previewTotal: { color: "#fff", fontWeight: "600", fontSize: 14, marginTop: 2 },
  previewEmpty: { fontSize: 14, fontWeight: "600", color: colors.muted, padding: 16 },
  previewCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
  },
  previewRitualName: { flex: 1, fontSize: 14, color: "rgba(0,0,0,0.7)" },
  previewRitualDur: { fontSize: 12, color: colors.muted },
  previewFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  previewFooterText: { fontSize: 12, color: "rgba(0,0,0,0.3)", fontStyle: "italic" },

  // Warning
  warningBox: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFE082",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
  },
  warningText: { fontSize: 13, color: "#795548", lineHeight: 19 },

  // Buttons
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.accent,
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
});
