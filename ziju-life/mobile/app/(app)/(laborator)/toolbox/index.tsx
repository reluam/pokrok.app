import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { getTools, type Tool } from "@/api/toolbox";

const CATEGORIES = [
  "Vše",
  "Rozhodování",
  "Plánování",
  "Reflexe",
  "Komunikace",
  "Myšlení",
  "Návyky",
  "Emoce",
  "Produktivita",
  "Kreativita",
  "Vztahy",
];

export default function ToolboxScreen() {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Vše");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const params: { q?: string; category?: string } = {};
      if (search.trim()) params.q = search.trim();
      if (category !== "Vše") params.category = category;
      const result = await getTools({ ...params, limit: 50 });
      setTools(result.tools);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    load();
  }, [search, category]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-2 pb-1">
        <TextInput
          className="bg-white border border-border rounded-2xl px-4 py-3 text-base text-foreground"
          placeholder="Hledat nástroje..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        className="max-h-12 px-4 py-1"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`mr-2 px-4 py-2 rounded-full ${
              category === item ? "bg-accent" : "bg-white border border-border"
            }`}
            onPress={() => setCategory(item)}
          >
            <Text
              className={`text-sm font-medium ${
                category === item ? "text-white" : "text-foreground"
              }`}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={tools}
        className="flex-1 px-4"
        contentContainerClassName="pb-8 pt-2"
        keyExtractor={(item) => item.slug}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ECDC4" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-3 border border-border"
            onPress={() =>
              router.push(`/(app)/(laborator)/toolbox/${item.slug}`)
            }
            activeOpacity={0.7}
          >
            <Text className="text-base font-bold text-foreground mb-1">
              {item.title}
            </Text>
            <Text className="text-sm text-muted" numberOfLines={2}>
              {item.description}
            </Text>
            <View className="flex-row mt-2 items-center">
              <Text className="text-xs text-accent bg-accent/10 px-2 py-1 rounded-full mr-2">
                {item.category}
              </Text>
              {item.duration && (
                <Text className="text-xs text-muted">{item.duration}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-muted text-base">Žádné nástroje nenalezeny</Text>
          </View>
        }
      />
    </View>
  );
}
