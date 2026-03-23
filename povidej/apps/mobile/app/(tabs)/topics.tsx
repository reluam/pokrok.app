import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { TOOLS } from "@repo/types";
import { colors, radius, spacing } from "../../lib/theme";

export default function TopicsTab() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Nástroje</Text>
      <Text style={styles.subtitle}>Interaktivní průvodci pro konkrétní situace. Vyplněné informace jsou dostupné v chatu.</Text>

      <View style={styles.list}>
        {TOOLS.map((tool, i) => (
          <TouchableOpacity
            key={tool.id}
            style={[styles.row, i === TOOLS.length - 1 && styles.rowLast]}
            onPress={() => router.push(`/tools/${tool.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{tool.icon}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{tool.title}</Text>
              <Text style={styles.rowDesc}>{tool.description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32 },
  heading: { fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 6, paddingTop: spacing.sm },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: spacing.xl, lineHeight: 20 },
  list: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: colors.border, flexShrink: 0,
  },
  icon: { fontSize: 20 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 3 },
  rowDesc: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  arrow: { fontSize: 22, color: colors.border, flexShrink: 0 },
});
