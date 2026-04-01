import { View, Text } from "react-native";

export default function HodnotyScreen() {
  return (
    <View className="flex-1 bg-background justify-center items-center px-8">
      <Text className="text-4xl mb-4">💜</Text>
      <Text className="text-xl font-bold text-foreground mb-2">Moje hodnoty</Text>
      <Text className="text-base text-center text-muted">
        Reflexe a hodnocení tvých životních hodnot.{"\n"}
        Tato obrazovka bude brzy k dispozici.
      </Text>
    </View>
  );
}
