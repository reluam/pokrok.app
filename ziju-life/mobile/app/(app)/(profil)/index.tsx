import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StyleSheet,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { getAICredits } from "@/api/laborator";
import Constants from "expo-constants";
import { Mail, CreditCard, ExternalLink, LogOut } from "lucide-react-native";
import { colors } from "@/constants/theme";

export default function ProfilScreen() {
  const { email, logout } = useAuth();
  const [budget, setBudget] = useState<{ remainingCzk: number; totalCzk: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const credits = await getAICredits();
        setBudget({ remainingCzk: credits.remainingCzk, totalCzk: credits.totalCzk });
      } catch {}
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert("Odhlásit se", "Opravdu se chceš odhlásit?", [
      { text: "Zrušit", style: "cancel" },
      { text: "Odhlásit", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.header}>Profil</Text>

      <View style={s.card}>
        <View style={[s.iconWrap, { backgroundColor: "rgba(255,140,66,0.12)" }]}>
          <Mail size={20} color={colors.accent} />
        </View>
        <View style={s.cardBody}>
          <Text style={s.cardLabel}>E-mail</Text>
          <Text style={s.cardValue}>{email}</Text>
        </View>
      </View>

      <View style={s.card}>
        <View style={[s.iconWrap, { backgroundColor: "rgba(78,205,196,0.12)" }]}>
          <CreditCard size={20} color={colors.secondary} />
        </View>
        <View style={s.cardBody}>
          <Text style={s.cardLabel}>AI Rozpočet</Text>
          {budget ? (
            <>
              <Text style={s.budgetValue}>{(budget.remainingCzk ?? 0).toFixed(0)} Kč</Text>
              <Text style={s.budgetSub}>z {(budget.totalCzk ?? 0).toFixed(0)} Kč celkem</Text>
              <View style={s.progressBg}>
                <View
                  style={[
                    s.progressBar,
                    { width: `${Math.max(0, Math.min(100, ((budget.remainingCzk ?? 0) / (budget.totalCzk || 1)) * 100))}%` },
                  ]}
                />
              </View>
            </>
          ) : (
            <Text style={s.budgetSub}>Načítám...</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={s.actionRow}
        onPress={() => Linking.openURL("https://ziju.life/laborator")}
        activeOpacity={0.7}
      >
        <ExternalLink size={20} color={colors.accent} />
        <Text style={s.actionText}>Spravovat předplatné</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.actionRow} onPress={handleLogout} activeOpacity={0.7}>
        <LogOut size={20} color={colors.danger} />
        <Text style={[s.actionText, { color: colors.danger }]}>Odhlásit se</Text>
      </TouchableOpacity>

      <Text style={s.version}>
        Žiju Life v{Constants.expoConfig?.version ?? "1.0.0"}
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 20, letterSpacing: -0.5 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 14 },
  cardBody: { flex: 1 },
  cardLabel: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  budgetValue: { fontSize: 24, fontWeight: "800", color: colors.foreground },
  budgetSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  progressBg: { backgroundColor: colors.boxBg, borderRadius: 999, height: 6, marginTop: 10, overflow: "hidden" },
  progressBar: { backgroundColor: colors.accent, height: "100%", borderRadius: 999 },
  actionRow: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionText: { fontSize: 16, fontWeight: "600", color: colors.foreground, marginLeft: 14 },
  version: { fontSize: 12, textAlign: "center", color: colors.muted, marginTop: 20 },
});
