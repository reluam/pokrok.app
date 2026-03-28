import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getUserContext } from "@/api/laborator";
import { getTools, type Tool } from "@/api/toolbox";
import { Compass, Heart, Sun, Search } from "lucide-react-native";
import { colors } from "@/constants/theme";

type SubTab = "cviceni" | "nastroje";

const CATEGORIES = [
  { id: "", label: "Vše" },
  { id: "rozhodovani", label: "🎯 Rozhodování" },
  { id: "planovani", label: "📋 Plánování" },
  { id: "reflexe", label: "🪞 Reflexe" },
  { id: "komunikace", label: "💬 Komunikace" },
  { id: "mysleni", label: "🧠 Myšlení" },
  { id: "navyky", label: "🔗 Návyky" },
  { id: "emoce", label: "🌊 Emoce" },
  { id: "produktivita", label: "⚡ Produktivita" },
  { id: "kreativita", label: "🎨 Kreativita" },
  { id: "vztahy", label: "🤝 Vztahy" },
];

export default function NastrojeScreen() {
  const router = useRouter();
  const [subTab, setSubTab] = useState<SubTab>("cviceni");

  // Cvičení state
  const [hasCompass, setHasCompass] = useState(false);
  const [hasValues, setHasValues] = useState(false);
  const [hasRituals, setHasRituals] = useState(false);

  // Nástroje state
  const [tools, setTools] = useState<Tool[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
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

  const loadTools = async () => {
    try {
      const params: { q?: string; category?: string } = {};
      if (search.trim()) params.q = search.trim();
      if (category) params.category = category;
      const result = await getTools({ ...params, limit: 50 });
      setTools(result.tools);
    } catch {}
  };

  useEffect(() => {
    if (subTab === "nastroje") loadTools();
  }, [subTab, search, category]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (subTab === "nastroje") await loadTools();
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

  const renderNastroje = () => (
    <View style={s.flex}>
      <View style={s.searchRow}>
        <Search size={16} color={colors.muted} />
        <TextInput
          style={s.searchInput}
          placeholder="Hledat nástroje..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        style={s.catRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        showsHorizontalScrollIndicator={false}
        keyExtractor={c => c.id || "all"}
        renderItem={({ item: c }) => (
          <TouchableOpacity
            style={[s.catChip, category === c.id && s.catChipActive]}
            onPress={() => setCategory(c.id)}
          >
            <Text style={[s.catText, category === c.id && s.catTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={tools}
        style={s.flex}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        keyExtractor={t => t.slug}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.toolCard}
            onPress={() => router.push({ pathname: "/(app)/(nastroje)/[slug]", params: { slug: item.slug } })}
            activeOpacity={0.7}
          >
            <Text style={s.toolTitle}>{item.title}</Text>
            <Text style={s.toolDesc} numberOfLines={2}>{item.description}</Text>
            <View style={s.toolMeta}>
              <Text style={s.toolCat}>{item.category}</Text>
              {item.duration && <Text style={s.toolDur}>{item.duration}</Text>}
              <View style={s.toolDots}>
                {[1, 2, 3].map(d => (
                  <View key={d} style={[s.dot, d <= (item.difficulty || 1) && s.dotFilled]} />
                ))}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={s.emptyText}>Žádné nástroje</Text>}
      />
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Sub-tab switcher */}
      <View style={s.tabBar}>
        {([["cviceni", "Cvičení"], ["nastroje", "Nástroje"]] as [SubTab, string][]).map(
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

      {subTab === "cviceni" ? renderCviceni() : renderNastroje()}
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

  // Nástroje search
  searchRow: {
    flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 8,
    backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.borderLight,
    paddingHorizontal: 12, gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.foreground },

  // Categories
  catRow: { maxHeight: 44, marginBottom: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight },
  catChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  catText: { fontSize: 12, fontWeight: "600", color: colors.foreground },
  catTextActive: { color: "#fff" },

  // Tool cards
  toolCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  toolTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 4 },
  toolDesc: { fontSize: 13, color: colors.muted, lineHeight: 18, marginBottom: 8 },
  toolMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  toolCat: { fontSize: 11, fontWeight: "600", color: colors.accent, backgroundColor: "rgba(255,140,66,0.08)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  toolDur: { fontSize: 11, color: colors.muted },
  toolDots: { flexDirection: "row", gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderLight },
  dotFilled: { backgroundColor: colors.accent },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: "center", paddingVertical: 40 },
});
