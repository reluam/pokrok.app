import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "@/constants/theme";

export default function NastavDenScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nastav si den</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={s.container}>
        <Text style={s.icon}>☀️</Text>
        <Text style={s.title}>Nastav si den</Text>
        <Text style={s.text}>
          Nastav si ranní, denní a večerní rituály.{"\n"}
          Tato obrazovka bude brzy k dispozici.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 8 },
  text: { fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 22 },
});
