import { View, Text, ScrollView, Linking, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ExternalLink } from "lucide-react-native";

export default function InspirationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-8">
      <Text className="text-muted text-center py-12">
        Detail inspirace #{id}{"\n"}
        Tato obrazovka bude brzy k dispozici.
      </Text>
    </ScrollView>
  );
}
