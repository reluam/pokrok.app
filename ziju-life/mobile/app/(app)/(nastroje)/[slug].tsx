import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getToolBySlug } from "@/api/toolbox";
import { ChevronLeft, ExternalLink, Compass, Heart, Sun } from "lucide-react-native";
import { colors } from "@/constants/theme";

interface FullTool {
  slug: string;
  title: string;
  shortDescription?: string;
  descriptionMarkdown?: string;
  applicationMarkdown?: string;
  sources?: { title: string; url: string; type?: string }[];
  tags?: string[];
  category?: string;
  difficulty?: number;
  durationEstimate?: string;
  toolType?: string;
  componentId?: string;
}

export default function ToolDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [tool, setTool] = useState<FullTool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const result = await getToolBySlug(slug);
        setTool(result.tool as unknown as FullTool);
      } catch {}
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  if (!tool) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><Text style={s.emptyText}>Nástroj nenalezen</Text></View>
      </SafeAreaView>
    );
  }

  const interactiveRoute =
    tool.componentId === "tvuj-kompas" ? "/(app)/(nastroje)/kompas" :
    tool.componentId === "moje-hodnoty" ? "/(app)/(nastroje)/hodnoty" :
    tool.componentId === "nastav-si-den" ? "/(app)/(nastroje)/nastav-den" :
    null;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{tool.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={s.flex} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Meta */}
        <View style={s.metaRow}>
          {tool.category && <Text style={s.catBadge}>{tool.category}</Text>}
          {tool.durationEstimate && <Text style={s.durText}>{tool.durationEstimate}</Text>}
          {tool.difficulty && (
            <View style={s.dots}>
              {[1, 2, 3].map(d => (
                <View key={d} style={[s.dot, d <= tool.difficulty! && s.dotFilled]} />
              ))}
            </View>
          )}
        </View>

        {/* Tags */}
        {tool.tags && tool.tags.length > 0 && (
          <View style={s.tagsRow}>
            {tool.tags.map(t => <Text key={t} style={s.tag}>{t}</Text>)}
          </View>
        )}

        {/* Interactive button */}
        {tool.toolType === "interactive" && interactiveRoute && (
          <TouchableOpacity
            style={s.interactiveBtn}
            onPress={() => router.push(interactiveRoute as never)}
            activeOpacity={0.8}
          >
            <Text style={s.interactiveBtnText}>Otevřít cvičení →</Text>
          </TouchableOpacity>
        )}

        {/* Description */}
        {tool.descriptionMarkdown ? (
          <Text style={s.markdown}>{tool.descriptionMarkdown}</Text>
        ) : tool.shortDescription ? (
          <Text style={s.desc}>{tool.shortDescription}</Text>
        ) : null}

        {/* Application */}
        {tool.applicationMarkdown && (
          <>
            <Text style={s.sectionTitle}>Jak na to</Text>
            <Text style={s.markdown}>{tool.applicationMarkdown}</Text>
          </>
        )}

        {/* Sources */}
        {tool.sources && tool.sources.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Zdroje</Text>
            {tool.sources.map((src, i) => (
              <TouchableOpacity
                key={i}
                style={s.sourceRow}
                onPress={() => src.url && Linking.openURL(src.url)}
                activeOpacity={0.7}
              >
                <ExternalLink size={14} color={colors.accent} />
                <Text style={s.sourceText}>{src.title}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 20, paddingBottom: 40 },
  emptyText: { fontSize: 15, color: colors.muted },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground, flex: 1, textAlign: "center" },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  catBadge: { fontSize: 12, fontWeight: "600", color: colors.accent, backgroundColor: "rgba(255,140,66,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  durText: { fontSize: 12, color: colors.muted },
  dots: { flexDirection: "row", gap: 3 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.borderLight },
  dotFilled: { backgroundColor: colors.accent },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  tag: { fontSize: 11, color: colors.muted, backgroundColor: colors.boxBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },

  interactiveBtn: {
    backgroundColor: colors.secondary, borderRadius: 16, paddingVertical: 14, alignItems: "center", marginBottom: 20,
    shadowColor: colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  interactiveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  desc: { fontSize: 15, color: colors.foreground, lineHeight: 24, marginBottom: 20 },
  markdown: { fontSize: 15, color: colors.foreground, lineHeight: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12, marginTop: 8 },

  sourceRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  sourceText: { fontSize: 14, color: colors.accent, flex: 1 },
});
