import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getFeed, aiRecommend, type InspirationItem } from "@/api/inspiration";
import { MessageCircle, Send, X } from "lucide-react-native";
import { colors } from "@/constants/theme";

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

interface AIMessage { role: "user" | "assistant"; content: string }

export default function InspiraceScreen() {
  const router = useRouter();
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [type, setType] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // AI chat
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiSending, setAiSending] = useState(false);

  const load = useCallback(async (reset = false) => {
    const newOffset = reset ? 0 : offset;
    try {
      const result = await getFeed({ type: type || undefined, offset: newOffset, limit: 20 });
      const newItems = result.items ?? [];
      if (reset) {
        setItems(newItems);
        setOffset(newItems.length);
      } else {
        setItems(prev => [...prev, ...newItems]);
        setOffset(newOffset + newItems.length);
      }
      setHasMore(newItems.length === 20);
    } catch {}
  }, [type, offset]);

  useEffect(() => { setOffset(0); load(true); }, [type]);

  const onRefresh = async () => { setRefreshing(true); await load(true); setRefreshing(false); };

  const handleAISend = async () => {
    const text = aiInput.trim();
    if (!text || aiSending) return;
    setAiInput("");
    const newMsgs: AIMessage[] = [...aiMessages, { role: "user", content: text }];
    setAiMessages(newMsgs);
    setAiSending(true);
    try {
      const res = await aiRecommend(newMsgs);
      const reply = res.type === "reflection" ? (res.text || "") : (res.response as { summary?: string })?.summary || "";
      setAiMessages([...newMsgs, { role: "assistant", content: reply }]);
    } catch {
      setAiMessages([...newMsgs, { role: "assistant", content: "Promiň, něco se pokazilo." }]);
    }
    setAiSending(false);
  };

  const renderItem = ({ item }: { item: InspirationItem }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push({ pathname: "/(app)/(inspirace)/[id]", params: { id: item.id } })}
      activeOpacity={0.7}
    >
      {(item.thumbnail || item.imageUrl) && (
        <Image source={{ uri: item.thumbnail || item.imageUrl }} style={s.cardImage} resizeMode="cover" />
      )}
      <View style={s.cardBody}>
        <View style={s.cardMeta}>
          <Text style={s.cardType}>{item.type}</Text>
          {item.author && <Text style={s.cardAuthor}>{item.author}</Text>}
        </View>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.description && <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Filters */}
      <FlatList
        horizontal
        data={TYPE_FILTERS}
        style={s.filterRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        showsHorizontalScrollIndicator={false}
        keyExtractor={f => f.key}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[s.filterChip, type === f.key && s.filterChipActive]}
            onPress={() => setType(f.key)}
          >
            <Text style={[s.filterText, type === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Feed */}
      <FlatList
        data={items}
        style={s.flex}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: aiOpen ? 280 : 16 }}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        onEndReached={() => hasMore && !refreshing && load(false)}
        onEndReachedThreshold={0.3}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={s.emptyText}>Žádné inspirace nenalezeny</Text>
        }
      />

      {/* AI bar */}
      {aiOpen ? (
        <View style={s.aiPanel}>
          <View style={s.aiHeader}>
            <Text style={s.aiTitle}>AI doporučení</Text>
            <TouchableOpacity onPress={() => setAiOpen(false)} hitSlop={8}>
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={aiMessages}
            style={s.aiChat}
            contentContainerStyle={{ padding: 12 }}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item: m }) => (
              <View style={[s.aiBubble, m.role === "user" ? s.aiBubbleUser : s.aiBubbleAI]}>
                <Text style={s.aiBubbleText}>{m.content}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={s.aiEmpty}>Na co máš chuť? Doporučím ti knihu, video nebo článek.</Text>}
          />
          <View style={s.aiInputRow}>
            <TextInput
              style={s.aiInput}
              value={aiInput}
              onChangeText={setAiInput}
              placeholder="Co tě zajímá?"
              placeholderTextColor="#aaa"
              onSubmitEditing={handleAISend}
              editable={!aiSending}
            />
            <TouchableOpacity style={s.aiSendBtn} onPress={handleAISend} disabled={aiSending || !aiInput.trim()}>
              <Send size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.aiBarCollapsed} onPress={() => setAiOpen(true)} activeOpacity={0.8}>
          <MessageCircle size={18} color={colors.secondary} />
          <Text style={s.aiBarText}>AI doporučení</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  // Filters
  filterRow: { maxHeight: 48, paddingVertical: 6 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight },
  filterChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { fontSize: 13, fontWeight: "600", color: colors.foreground },
  filterTextActive: { color: "#fff" },

  // Cards
  card: {
    backgroundColor: colors.white, borderRadius: 18, marginBottom: 10, overflow: "hidden",
    borderWidth: 1, borderColor: colors.borderLight,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardImage: { width: "100%", height: 160 },
  cardBody: { padding: 14 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardType: { fontSize: 11, fontWeight: "700", color: colors.accent, textTransform: "uppercase" },
  cardAuthor: { fontSize: 12, color: colors.muted },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  cardDesc: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 18 },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: "center", paddingVertical: 40 },

  // AI collapsed
  aiBarCollapsed: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  aiBarText: { fontSize: 14, color: colors.muted },

  // AI expanded
  aiPanel: {
    height: 260, backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
  },
  aiHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  aiTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  aiChat: { flex: 1 },
  aiEmpty: { fontSize: 13, color: colors.muted, textAlign: "center", fontStyle: "italic", padding: 16 },
  aiBubble: { maxWidth: "85%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginVertical: 3 },
  aiBubbleUser: { alignSelf: "flex-end", backgroundColor: "rgba(78,205,196,0.12)", borderBottomRightRadius: 4 },
  aiBubbleAI: { alignSelf: "flex-start", backgroundColor: colors.boxBg, borderBottomLeftRadius: 4 },
  aiBubbleText: { fontSize: 13, color: colors.foreground, lineHeight: 19 },
  aiInputRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 8,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  aiInput: { flex: 1, backgroundColor: colors.background, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: colors.foreground },
  aiSendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.secondary, justifyContent: "center", alignItems: "center" },
});
