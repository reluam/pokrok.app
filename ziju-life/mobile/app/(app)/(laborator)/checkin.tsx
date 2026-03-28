import { View, Text } from "react-native";

export default function CheckinScreen() {
  return (
    <View className="flex-1 bg-background justify-center items-center px-8">
      <Text className="text-4xl mb-4">✅</Text>
      <Text className="text-xl font-bold text-foreground mb-2">Týdenní check-in</Text>
      <Text className="text-base text-center text-muted">
        Ohodnoť svůj týden v 8 životních oblastech.{"\n"}
        Tato obrazovka bude brzy k dispozici.
      </Text>
    </View>
  );
}
