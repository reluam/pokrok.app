import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getToolBySlug, type Tool } from "@/api/toolbox";

export default function ToolDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const result = await getToolBySlug(slug);
        setTool(result.tool);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  if (!tool) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted text-base">Nástroj nenalezen</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-8">
      <Text className="text-2xl font-bold text-foreground mb-2">
        {tool.title}
      </Text>

      <View className="flex-row mb-4">
        <Text className="text-xs text-accent bg-accent/10 px-2 py-1 rounded-full mr-2">
          {tool.category}
        </Text>
        {tool.duration && (
          <Text className="text-xs text-muted bg-box-bg px-2 py-1 rounded-full">
            {tool.duration}
          </Text>
        )}
      </View>

      <Text className="text-base text-foreground leading-6">
        {tool.description}
      </Text>
    </ScrollView>
  );
}
