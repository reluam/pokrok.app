import { View, Text } from "react-native";

export default function KompasScreen() {
  return (
    <View className="flex-1 bg-background justify-center items-center px-8">
      <Text className="text-4xl mb-4">🧭</Text>
      <Text className="text-xl font-bold text-foreground mb-2">Kompas</Text>
      <Text className="text-base text-center text-muted">
        7-krokový průvodce pro nalezení životního směru.{"\n"}
        Tato obrazovka bude brzy k dispozici.
      </Text>
    </View>
  );
}
