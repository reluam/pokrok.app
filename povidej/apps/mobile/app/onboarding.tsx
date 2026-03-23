import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AGE_GROUPS,
  LIFE_AREAS,
  USER_PROFILE_KEY,
  type AgeGroup,
  type Gender,
  type UserProfile,
} from "@repo/types";
import { supabase } from "../lib/supabase";
import { colors, radius, spacing } from "../lib/theme";

type Step =
  | { type: "name" }
  | { type: "age-gender" }
  | { type: "life-area"; index: number }
  | { type: "happiest-moment" }
  | { type: "friends-say" }
  | { type: "parents-say" };

const TOTAL = 2 + LIFE_AREAS.length + 3;

function getStep(i: number): Step {
  if (i === 0) return { type: "name" };
  if (i === 1) return { type: "age-gender" };
  if (i < 2 + LIFE_AREAS.length) return { type: "life-area", index: i - 2 };
  if (i === 2 + LIFE_AREAS.length) return { type: "happiest-moment" };
  if (i === 3 + LIFE_AREAS.length) return { type: "friends-say" };
  return { type: "parents-say" };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState<AgeGroup | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [lifeScores, setLifeScores] = useState(LIFE_AREAS.map(() => 5));
  const [happiestMoment, setHappiestMoment] = useState("");
  const [friendsSay, setFriendsSay] = useState("");
  const [parentsSay, setParentsSay] = useState("");

  const step = getStep(stepIndex);
  const progress = (stepIndex + 1) / TOTAL;

  function canAdvance(): boolean {
    if (step.type === "name") return name.trim().length > 0;
    if (step.type === "age-gender") return age !== "" && gender !== "";
    if (step.type === "life-area") return true;
    if (step.type === "happiest-moment") return happiestMoment.trim().length > 0;
    if (step.type === "friends-say") return friendsSay.trim().length > 0;
    if (step.type === "parents-say") return parentsSay.trim().length > 0;
    return false;
  }

  async function saveAndFinish() {
    const profile: UserProfile = {
      name: name.trim(),
      age: age as AgeGroup,
      gender: gender as Gender,
      lifeAreas: LIFE_AREAS.map((area, i) => ({ ...area, score: lifeScores[i] ?? 5 })),
      happiestMoment: happiestMoment.trim(),
      whatFriendsSay: friendsSay.trim(),
      whatParentsSay: parentsSay.trim(),
      completedAt: Date.now(),
    };

    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        life_areas: profile.lifeAreas as unknown as object[],
        happiest_moment: profile.happiestMoment,
        what_friends_say: profile.whatFriendsSay,
        what_parents_say: profile.whatParentsSay,
        onboarding_completed: true,
      });
    }

    router.replace("/");
  }

  function advance() {
    if (!canAdvance()) return;
    if (stepIndex < TOTAL - 1) setStepIndex((s) => s + 1);
    else saveAndFinish();
  }

  const firstName = name.split(" ")[0];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Jméno */}
        {step.type === "name" && (
          <View style={styles.step}>
            <Text style={styles.label}>Vítej! Jak se jmenuješ?</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tvoje jméno"
              placeholderTextColor={colors.muted}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={advance}
            />
          </View>
        )}

        {/* Věk + pohlaví */}
        {step.type === "age-gender" && (
          <View style={styles.step}>
            <Text style={styles.label}>
              Příjemné setkání, {firstName}! Do které věkové skupiny patříš?
            </Text>
            <View style={styles.chipRow}>
              {AGE_GROUPS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, age === g && styles.chipActive]}
                  onPress={() => setAge(g)}
                >
                  <Text style={[styles.chipText, age === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: spacing.lg }]}>A pohlaví?</Text>
            <View style={styles.chipRow}>
              {([{ value: "male", label: "Muž" }, { value: "female", label: "Žena" }, { value: "other", label: "Jiné" }] as const).map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, styles.chipFlex, gender === opt.value && styles.chipActive]}
                  onPress={() => setGender(opt.value)}
                >
                  <Text style={[styles.chipText, gender === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Životní oblasti */}
        {step.type === "life-area" && (
          <View style={styles.step}>
            <Text style={styles.sublabel}>Spokojenost v životních oblastech</Text>
            <Text style={styles.label}>{LIFE_AREAS[step.index]?.label}</Text>
            <Text style={styles.hint}>1 = vůbec ne · 10 = skvěle</Text>

            <View style={styles.scoreRow}>
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.scoreBtn, lifeScores[step.index] === n && styles.scoreBtnActive]}
                  onPress={() => {
                    const next = [...lifeScores];
                    next[step.index] = n;
                    setLifeScores(next);
                  }}
                >
                  <Text style={[styles.scoreBtnText, lifeScores[step.index] === n && styles.scoreBtnTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Šťastný moment */}
        {step.type === "happiest-moment" && (
          <View style={styles.step}>
            <Text style={styles.label}>Jaký byl tvůj nejšťastnější moment v poslední době?</Text>
            <TextInput
              style={styles.textarea}
              value={happiestMoment}
              onChangeText={setHappiestMoment}
              placeholder="Popiš ho..."
              placeholderTextColor={colors.muted}
              multiline
              autoFocus
            />
          </View>
        )}

        {/* Co říkají přátelé */}
        {step.type === "friends-say" && (
          <View style={styles.step}>
            <Text style={styles.label}>Co by o tobě řekli tvoji přátelé?</Text>
            <TextInput
              style={styles.textarea}
              value={friendsSay}
              onChangeText={setFriendsSay}
              placeholder="Jak tě vidí ostatní..."
              placeholderTextColor={colors.muted}
              multiline
              autoFocus
            />
          </View>
        )}

        {/* Co říkají rodiče */}
        {step.type === "parents-say" && (
          <View style={styles.step}>
            <Text style={styles.label}>A co by o tobě řekli rodiče?</Text>
            <TextInput
              style={styles.textarea}
              value={parentsSay}
              onChangeText={setParentsSay}
              placeholder="Jak tě vidí rodiče..."
              placeholderTextColor={colors.muted}
              multiline
              autoFocus
            />
          </View>
        )}

        {/* Akce */}
        <View style={styles.actions}>
          {stepIndex > 0 && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStepIndex((s) => s - 1)}
            >
              <Text style={styles.backBtnText}>← Zpět</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, !canAdvance() && styles.nextBtnDisabled]}
            onPress={advance}
            disabled={!canAdvance()}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>
              {stepIndex === TOTAL - 1 ? "Hotovo →" : "Pokračovat →"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  progressBar: { height: 5, backgroundColor: colors.border },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  content: { padding: spacing.lg, paddingBottom: 60, flexGrow: 1, justifyContent: "center" },
  step: { gap: spacing.md, marginBottom: spacing.xl },
  sublabel: {
    fontSize: 11, fontWeight: "700", color: colors.primary,
    textTransform: "uppercase", letterSpacing: 1.2,
  },
  label: { fontSize: 24, fontWeight: "700", color: colors.foreground, lineHeight: 32 },
  hint: { fontSize: 13, color: colors.muted },
  input: {
    borderBottomWidth: 2.5, borderColor: colors.border,
    paddingVertical: 12, fontSize: 22,
    color: colors.foreground,
  },
  textarea: {
    borderWidth: 2, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, fontSize: 16, color: colors.foreground,
    minHeight: 120, textAlignVertical: "top", lineHeight: 24,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: radius.full, borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipFlex: { flex: 1, alignItems: "center" },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: "500", color: colors.muted },
  chipTextActive: { color: "#fff" },
  scoreRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  scoreBtn: {
    width: 52, height: 52, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.card, alignItems: "center", justifyContent: "center",
  },
  scoreBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  scoreBtnText: { fontSize: 16, fontWeight: "600", color: colors.muted },
  scoreBtnTextActive: { color: "#fff" },
  actions: { flexDirection: "row", gap: 12, marginTop: spacing.md },
  backBtn: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: radius.md, borderWidth: 2, borderColor: colors.border,
  },
  backBtnText: { fontSize: 15, color: colors.muted },
  nextBtn: {
    flex: 1, backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 15, alignItems: "center",
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  nextBtnDisabled: { opacity: 0.25, shadowOpacity: 0, elevation: 0 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
