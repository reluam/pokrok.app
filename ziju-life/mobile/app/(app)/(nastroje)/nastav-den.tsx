import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";

export default function NastavDenScreen() {
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
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
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 8 },
  text: { fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 22 },
});
