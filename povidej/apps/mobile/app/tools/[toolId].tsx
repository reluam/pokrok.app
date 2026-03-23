import { useState, useEffect } from "react";
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
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOOLS, TOOL_KEYS } from "@repo/types";
import type { ToolId } from "@repo/types";
import { colors, radius, spacing } from "../../lib/theme";

export default function ToolScreen() {
  const { toolId } = useLocalSearchParams<{ toolId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const tool = TOOLS.find((t) => t.id === toolId);

  const [saved, setSaved] = useState(false);

  // Decision fields
  const [decision, setDecision] = useState("");
  const [options, setOptions] = useState("");
  const [blockers, setBlockers] = useState("");
  const [deadline, setDeadline] = useState("");

  // Creative fields
  const [project, setProject] = useState("");
  const [blockDuration, setBlockDuration] = useState("");
  const [blockDescription, setBlockDescription] = useState("");
  const [whatHelped, setWhatHelped] = useState("");

  // Motivation fields
  const [area, setArea] = useState("");
  const [since, setSince] = useState("");
  const [previousMotivation, setPreviousMotivation] = useState("");
  const [currentFeeling, setCurrentFeeling] = useState("");

  useEffect(() => {
    if (!tool) return;
    navigation.setOptions({ title: tool.title });

    AsyncStorage.getItem(TOOL_KEYS[tool.id as ToolId]).then((raw) => {
      if (!raw) return;
      try {
        const d = JSON.parse(raw);
        if (tool.id === "decision-paralysis") {
          setDecision(d.decision ?? "");
          setOptions(d.options ?? "");
          setBlockers(d.blockers ?? "");
          setDeadline(d.deadline ?? "");
        } else if (tool.id === "creative-block") {
          setProject(d.project ?? "");
          setBlockDuration(d.blockDuration ?? "");
          setBlockDescription(d.blockDescription ?? "");
          setWhatHelped(d.whatHelped ?? "");
        } else if (tool.id === "motivation") {
          setArea(d.area ?? "");
          setSince(d.since ?? "");
          setPreviousMotivation(d.previousMotivation ?? "");
          setCurrentFeeling(d.currentFeeling ?? "");
        }
      } catch {}
    });
  }, [tool]);

  if (!tool) return null;

  async function handleSave() {
    const key = TOOL_KEYS[tool!.id as ToolId];
    let data: object;
    if (tool!.id === "decision-paralysis") {
      data = { decision, options, blockers, deadline, savedAt: Date.now() };
    } else if (tool!.id === "creative-block") {
      data = { project, blockDuration, blockDescription, whatHelped, savedAt: Date.now() };
    } else {
      data = { area, since, previousMotivation, currentFeeling, savedAt: Date.now() };
    }
    await AsyncStorage.setItem(key, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleOpenChat() {
    await handleSave();
    router.push("/(tabs)/");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.desc}>{tool.description}</Text>

        {tool.id === "decision-paralysis" && (
          <>
            <Field label="Před jakým rozhodnutím stojíš?" value={decision} onChange={setDecision} placeholder="Popište situaci..." multiline />
            <Field label="Jaké jsou možnosti?" value={options} onChange={setOptions} placeholder="Možnost A, možnost B..." multiline />
            <Field label="Co ti brání se rozhodnout?" value={blockers} onChange={setBlockers} placeholder="Strach, nejistota, konflikt hodnot..." multiline />
            <Field label="Do kdy se musíš rozhodnout?" value={deadline} onChange={setDeadline} placeholder="Za týden, do konce měsíce... (volitelné)" />
          </>
        )}

        {tool.id === "creative-block" && (
          <>
            <Field label="Na čem pracuješ?" value={project} onChange={setProject} placeholder="Projekt, dílo, úkol..." />
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Jak dlouho trvá blok?</Text>
              <View style={styles.chips}>
                {["Den", "Týden", "Měsíc", "Déle"].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, blockDuration === d && styles.chipActive]}
                    onPress={() => setBlockDuration(d)}
                  >
                    <Text style={[styles.chipText, blockDuration === d && styles.chipTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Field label="Jak bys popsal/a blok?" value={blockDescription} onChange={setBlockDescription} placeholder="Prázdnota, přehlcení, strach..." multiline />
            <Field label="Co ti dřív pomáhalo?" value={whatHelped} onChange={setWhatHelped} placeholder="Procházka, hudba, jiné prostředí..." multiline />
          </>
        )}

        {tool.id === "motivation" && (
          <>
            <Field label="V čem cítíš ztrátu motivace?" value={area} onChange={setArea} placeholder="Práce, vztahy, osobní rozvoj..." multiline />
            <Field label="Kdy to přibližně začalo?" value={since} onChange={setSince} placeholder="Před měsícem, po určité události..." />
            <Field label="Co tě dřív motivovalo?" value={previousMotivation} onChange={setPreviousMotivation} placeholder="Cíle, lidé, pocit smyslu..." multiline />
            <Field label="Jak se teď cítíš?" value={currentFeeling} onChange={setCurrentFeeling} placeholder="Vyčerpaný/á, ztracený/á..." multiline />
          </>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>{saved ? "✓ Uloženo" : "Uložit"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatBtn} onPress={handleOpenChat}>
            <Text style={styles.chatBtnText}>Prodiskutovat v chatu →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, multiline && styles.textInputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40, gap: 20 },
  desc: { fontSize: 15, color: colors.muted, lineHeight: 22 },

  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  textInput: {
    borderWidth: 2, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, fontSize: 15, color: colors.foreground,
    backgroundColor: colors.card,
  },
  textInputMulti: { minHeight: 90, textAlignVertical: "top" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: radius.full, borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: "500", color: colors.muted },
  chipTextActive: { color: "#fff" },

  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  saveBtn: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: radius.md, borderWidth: 2, borderColor: colors.border,
  },
  saveBtnText: { fontSize: 14, color: colors.muted, fontWeight: "600" },
  chatBtn: {
    flex: 1, backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 14, alignItems: "center",
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  chatBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
