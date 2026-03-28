import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { verifyMobileToken } from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/constants/theme";

export default function CallbackScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Chybí token. Zkus se přihlásit znovu.");
      return;
    }

    (async () => {
      try {
        const result = await verifyMobileToken(token);
        await login(result.accessToken, result.user.email);
      } catch {
        setError("Odkaz je neplatný nebo vypršel. Zkus se přihlásit znovu.");
      }
    })();
  }, [token]);

  if (error) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          <Text style={s.icon}>😕</Text>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={s.link}>Zpět na přihlášení</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={s.loadingText}>Přihlašuji...</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  icon: { fontSize: 48, marginBottom: 24 },
  errorText: { fontSize: 18, textAlign: "center", color: colors.foreground, marginBottom: 16 },
  link: { color: colors.accent, fontWeight: "600", fontSize: 16 },
  loadingText: { color: colors.muted, marginTop: 16 },
});
