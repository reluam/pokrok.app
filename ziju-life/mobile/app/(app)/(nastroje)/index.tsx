import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getUserContext } from "@/api/laborator";
import { getFeed, type InspirationItem } from "@/api/inspiration";
import { Compass, Heart, Sun } from "lucide-react-native";
import { colors } from "@/constants/theme";

type SubTab = "cviceni" | "inspirace";

const TYPE_FILTERS = [
  { key: "", label: "Vše" },
  { key: "book", label: "📚 Knihy" },
  { key: "video", label: "▶️ Videa" },
  { key: "article", label: "📄 Články" },
  { key: "blog", label: "✍️ Blog" },
  { key: "music", label: "🎵 Hudba" },
  { key: "reel", label: "📱 Reely" },
  { key: "princip", label: "🧭 Principy" },
  { key: "tool", label: "🔧 Nástroje" },
];

export default function NastrojeScreen() {
  const router = useRouter();
  const [subTab, setSubTab] = useState<SubTab>("cviceni");

  // Cvičení state
  const [hasCompass, setHasCompass] = useState(false);
  const [hasValues, setHasValues] = useState(false);
  const [hasRituals, setHasRituals] = useState(false);

  // Inspirace state
  const [inspItems, setInspItems] = useState<InspirationItem[]>([]);
  const [inspType, setInspType] = useState("");
  const [inspOffset, setInspOffset] = useState(0);
  const [inspHasMore, setInspHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getUserContext();
        const ctx = res.context || {};
        setHasCompass(!!ctx.compass);
        setHasValues(!!ctx.values);
        setHasRituals(!!ctx.rituals);
      } catch {}
    })();
  }, []);

  const loadInspirace = useCallback(async (reset = false) => {
    const off = reset ? 0 : inspOffset;
    try {
      const result = await getFeed({ type: inspType || undefined, offset: off, limit: 20 });
      const newItems = result.items ?? [];
      if (reset) {
        setInspItems(newItems);
        setInspOffset(newItems.length);
      } else {
        setInspItems(prev => [...prev, ...newItems]);
        setInspOffset(off + newItems.length);
      }
      setInspHasMore(newItems.length === 20);
    } catch {}
  }, [inspType, inspOffset]);

  useEffect(() => {
    if (subTab === "inspirace") { setInspOffset(0); loadInspirace(true); }
  }, [subTab, inspType]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (subTab === "inspirace") await loadInspirace(true);
    setRefreshing(false);
  };

  const renderCviceni = () => (
    <ScrollView contentContainerStyle={s.cviceniContent}>
      <ExerciseCard
        icon={<Compass size={32} color={colors.secondary} />}
        iconBg="rgba(78,205,196,0.12)"
        title="Kompas"
        subtitle="7-krokový průvodce životním směrem"
        status={hasCompass ? "Rozpracováno" : "Začít"}
        onPress={() => router.push("/(app)/(nastroje)/kompas")}
      />
      <ExerciseCard
        icon={<Heart size={32} color={colors.tertiary} />}
        iconBg="rgba(176,167,245,0.15)"
        title="Moje hodnoty"
        subtitle="Zjisti, co je pro tebe opravdu důležité"
        status={hasValues ? "Upravit" : "Začít"}
        onPress={() => router.push("/(app)/(nastroje)/hodnoty")}
      />
      <ExerciseCard
        icon={<Sun size={32} color={colors.yellowText} />}
        iconBg="rgba(255,217,102,0.2)"
        title="Nastav si den"
        subtitle="Ranní, denní a večerní rituály"
        status={hasRituals ? "Upravit" : "Začít"}
        onPress={() => router.push("/(app)/(nastroje)/nastav-den")}
      />
    </ScrollView>
  );

  const renderInspirace = () => (
    <View style={s.flex}>
      <FlatList
        horizontal
        data={TYPE_FILTERS}
        style={s.catRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        showsHorizontalScrollIndicator={false}
        keyExtractor={f => f.key || "all"}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[s.catChip, inspType === f.key && s.catChipActive]}
            onPress={() => setInspType(f.key)}
          >
            <Text style={[s.catText, inspType === f.key && s.catTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={inspItems}
        style={s.flex}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        onEndReached={() => inspHasMore && !refreshing && loadInspirace(false)}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.inspCard}
            onPress={() => router.push({ pathname: "/(app)/(inspirace)/[id]", params: { id: item.id } })}
            activeOpacity={0.7}
          >
            {(item.thumbnail || item.imageUrl) && (
              <Image source={{ uri: item.thumbnail || item.imageUrl }} style={s.inspImage} resizeMode="cover" />
            )}
            <View style={s.inspBody}>
              <View style={s.inspMeta}>
                <Text style={s.inspType}>{item.type}</Text>
                {item.author && <Text style={s.inspAuthor}>{item.author}</Text>}
              </View>
              <Text style={s.inspTitle} numberOfLines={2}>{item.title}</Text>
              {item.description && <Text style={s.inspDesc} numberOfLines={2}>{item.description}</Text>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={s.emptyText}>Žádné inspirace</Text>}
      />
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Sub-tab switcher */}
      <View style={s.tabBar}>
        {([["cviceni", "Cvičení"], ["inspirace", "Inspirace"]] as [SubTab, string][]).map(
          ([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[s.tabItem, subTab === key && s.tabItemActive]}
              onPress={() => setSubTab(key)}
            >
              <Text style={[s.tabText, subTab === key && s.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {subTab === "cviceni" ? renderCviceni() : renderInspirace()}
    </SafeAreaView>
  );
}

function ExerciseCard({
  icon, iconBg, title, subtitle, status, onPress,
}: {
  icon: React.ReactNode; iconBg: string; title: string; subtitle: string; status: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.exCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.exIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={s.exBody}>
        <Text style={s.exTitle}>{title}</Text>
        <Text style={s.exSub}>{subtitle}</Text>
      </View>
      <View style={s.exBadge}>
        <Text style={s.exBadgeText}>{status}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  // Tabs
  tabBar: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 6 },
  tabItem: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: "center" },
  tabItemActive: { backgroundColor: colors.accent },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  tabTextActive: { color: "#fff" },

  // Cvičení
  cviceniContent: { padding: 16, gap: 10 },
  exCard: {
    backgroundColor: colors.white, borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: colors.borderLight,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  exIconWrap: { width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 14 },
  exBody: { flex: 1 },
  exTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  exSub: { fontSize: 13, color: colors.muted, marginTop: 3 },
  exBadge: { backgroundColor: "rgba(255,140,66,0.1)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  exBadgeText: { fontSize: 12, fontWeight: "600", color: colors.accent },

  // Categories / Filters
  catRow: { maxHeight: 48, paddingVertical: 6 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight },
  catChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  catText: { fontSize: 12, fontWeight: "600", color: colors.foreground },
  catTextActive: { color: "#fff" },

  // Inspiration cards
  inspCard: {
    backgroundColor: colors.white, borderRadius: 18, marginBottom: 10, overflow: "hidden",
    borderWidth: 1, borderColor: colors.borderLight,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  inspImage: { width: "100%", height: 160 },
  inspBody: { padding: 14 },
  inspMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  inspType: { fontSize: 11, fontWeight: "700", color: colors.accent, textTransform: "uppercase" },
  inspAuthor: { fontSize: 12, color: colors.muted },
  inspTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  inspDesc: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 18 },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: "center", paddingVertical: 40 },
});
