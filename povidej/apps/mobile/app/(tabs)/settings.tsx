import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { USER_PROFILE_KEY } from "@repo/types";
import type { UserProfile } from "@repo/types";
import { supabase } from "../../lib/supabase";
import { colors, radius, spacing } from "../../lib/theme";

type Row = { label: string; value?: string; onPress?: () => void; danger?: boolean };

export default function SettingsTab() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(USER_PROFILE_KEY).then((val) => {
      if (val) setProfile(JSON.parse(val));
    });
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    Alert.alert("Odhlásit se", "Opravdu se chceš odhlásit?", [
      { text: "Zrušit", style: "cancel" },
      {
        text: "Odhlásit",
        style: "destructive",
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  }

  async function handleDeleteProfile() {
    Alert.alert("Smazat profil", "Tím smažeš všechna lokální data onboardingu. Pokračovat?", [
      { text: "Zrušit", style: "cancel" },
      {
        text: "Smazat",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(USER_PROFILE_KEY);
          setProfile(null);
        },
      },
    ]);
  }

  function Section({ title, rows }: { title: string; rows: Row[] }) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionCard}>
          {rows.map((row, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.row, i < rows.length - 1 && styles.rowBorder]}
              onPress={row.onPress}
              disabled={!row.onPress}
              activeOpacity={row.onPress ? 0.7 : 1}
            >
              <Text style={[styles.rowLabel, row.danger && styles.rowDanger]}>{row.label}</Text>
              {row.value ? <Text style={styles.rowValue}>{row.value}</Text> : null}
              {row.onPress && !row.value ? <Text style={styles.rowArrow}>›</Text> : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Nastavení</Text>

      <Section
        title="Účet"
        rows={[
          { label: "E-mail", value: email ?? "—" },
          { label: "Jméno", value: profile?.name ?? "—" },
          { label: "Věk", value: profile?.age ?? "—" },
        ]}
      />

      <Section
        title="Profil"
        rows={[
          {
            label: "Smazat data onboardingu",
            onPress: handleDeleteProfile,
            danger: true,
          },
        ]}
      />

      <Section
        title="Aplikace"
        rows={[
          { label: "Verze", value: "1.0.0" },
        ]}
      />

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Odhlásit se</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },

  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },

  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  rowLabel: { fontSize: 15, color: colors.foreground, fontWeight: "500" },
  rowDanger: { color: "#D94F4F" },
  rowValue: { fontSize: 15, color: colors.muted },
  rowArrow: { fontSize: 20, color: colors.border },

  logoutBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: "#D94F4F",
    padding: spacing.md,
    alignItems: "center",
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#D94F4F" },
});
