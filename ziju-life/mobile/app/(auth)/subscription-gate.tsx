import { useState } from "react";
import { View, Text, TouchableOpacity, Linking, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/constants/theme";

export default function SubscriptionGateScreen() {
  const { email, logout, recheckSubscription } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRecheck = async () => {
    setChecking(true);
    await recheckSubscription();
    setChecking(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.iconWrap}>
          <Text style={s.icon}>🔒</Text>
        </View>

        <Text style={s.title}>Aktivní předplatné vyžadováno</Text>
        <Text style={s.text}>
          Pro používání aplikace potřebuješ aktivní předplatné Laboratoře.
        </Text>
        {email && <Text style={s.email}>Přihlášen/a jako {email}</Text>}

        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => Linking.openURL("https://ziju.life/laborator")}
          activeOpacity={0.8}
        >
          <Text style={s.primaryBtnText}>Získat předplatné →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.secondaryBtn} onPress={handleRecheck} disabled={checking}>
          {checking ? (
            <ActivityIndicator size="small" color={colors.secondary} />
          ) : (
            <Text style={s.secondaryBtnText}>Zkontrolovat znovu</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={s.linkBtn} onPress={logout}>
          <Text style={s.linkText}>Odhlásit se</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  iconWrap: { alignItems: "center", marginBottom: 24 },
  icon: { fontSize: 56 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: colors.foreground, marginBottom: 12 },
  text: { fontSize: 16, textAlign: "center", color: colors.muted, marginBottom: 8, lineHeight: 24 },
  email: { fontSize: 14, textAlign: "center", color: colors.muted, marginBottom: 28 },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: "#fff", fontWeight: "bold", fontSize: 17, letterSpacing: 0.3 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  secondaryBtnText: { color: colors.foreground, fontWeight: "500", fontSize: 15 },
  linkBtn: { paddingVertical: 12, alignItems: "center" },
  linkText: { color: colors.muted, fontSize: 14 },
});
