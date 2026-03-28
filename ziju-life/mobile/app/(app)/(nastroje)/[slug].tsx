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
import { getToolBySlug, type Tool } from "@/api/toolbox";
import Markdown from "react-native-markdown-display";
import { ChevronLeft, ExternalLink, BookOpen, Video, FileText } from "lucide-react-native";
import { colors } from "@/constants/theme";

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  book: <BookOpen size={14} color={colors.accent} />,
  video: <Video size={14} color={colors.accent} />,
  article: <FileText size={14} color={colors.accent} />,
};

const mdStyles = StyleSheet.create({
  body: { fontSize: 15, color: colors.foreground, lineHeight: 24 },
  heading1: { fontSize: 20, fontWeight: "800" as const, color: colors.foreground, marginTop: 24, marginBottom: 8 },
  heading2: { fontSize: 18, fontWeight: "700" as const, color: colors.foreground, marginTop: 20, marginBottom: 8 },
  heading3: { fontSize: 16, fontWeight: "700" as const, color: colors.foreground, marginTop: 16, marginBottom: 6 },
  paragraph: { marginBottom: 12 },
  strong: { fontWeight: "700" as const, color: colors.foreground },
  em: { fontStyle: "italic" as const },
  list_item: { marginBottom: 4 },
  bullet_list: { marginBottom: 12 },
  ordered_list: { marginBottom: 12 },
  blockquote: {
    backgroundColor: colors.boxBg,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  hr: { borderBottomWidth: 1, borderBottomColor: colors.borderLight, marginVertical: 20 },
  link: { color: colors.accent, textDecorationLine: "underline" as const },
});

export default function ToolDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const result = await getToolBySlug(slug);
        setTool(result.tool);
      } catch (e) {
        console.warn("[tool detail] Failed:", slug, e);
      }
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

  const toolType = tool.toolType || tool.tool_type;
  const duration = tool.durationEstimate || tool.duration;
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
        {/* Meta row */}
        <View style={s.metaRow}>
          {tool.category && <Text style={s.catBadge}>{tool.icon ? `${tool.icon} ` : ""}{tool.category}</Text>}
          {tool.difficulty && (
            <View style={s.dots}>
              {[1, 2, 3].map(d => (
                <View key={d} style={[s.dot, d <= tool.difficulty && s.dotFilled]} />
              ))}
            </View>
          )}
          {duration && <Text style={s.durText}>{duration}</Text>}
        </View>

        {/* Tags */}
        {tool.tags && tool.tags.length > 0 && (
          <View style={s.tagsRow}>
            {tool.tags.map(t => <Text key={t} style={s.tag}>#{t}</Text>)}
          </View>
        )}

        {/* Interactive button */}
        {toolType === "interactive" && interactiveRoute && (
          <TouchableOpacity
            style={s.interactiveBtn}
            onPress={() => router.push(interactiveRoute as never)}
            activeOpacity={0.8}
          >
            <Text style={s.interactiveBtnText}>Otevřít interaktivní cvičení →</Text>
          </TouchableOpacity>
        )}

        {/* Description markdown */}
        {tool.descriptionMarkdown ? (
          <Markdown style={mdStyles}>{tool.descriptionMarkdown}</Markdown>
        ) : tool.shortDescription || tool.description ? (
          <Text style={s.desc}>{tool.shortDescription || tool.description}</Text>
        ) : null}

        {/* Application markdown */}
        {tool.applicationMarkdown && (
          <>
            <View style={s.divider} />
            <Text style={s.sectionTitle}>JAK NA TO</Text>
            <Markdown style={mdStyles}>{tool.applicationMarkdown}</Markdown>
          </>
        )}

        {/* Sources */}
        {tool.sources && tool.sources.length > 0 && (
          <>
            <View style={s.divider} />
            <Text style={s.sectionTitle}>ZDROJE</Text>
            {tool.sources.map((src, i) => (
              <TouchableOpacity
                key={i}
                style={s.sourceRow}
                onPress={() => src.url && Linking.openURL(src.url)}
                activeOpacity={0.7}
              >
                {SOURCE_ICONS[src.type || "article"] || <ExternalLink size={14} color={colors.accent} />}
                <Text style={s.sourceText}>{src.title}</Text>
                <ExternalLink size={12} color={colors.muted} />
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
  content: { padding: 20, paddingBottom: 60 },
  emptyText: { fontSize: 15, color: colors.muted },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground, flex: 1, textAlign: "center" },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" },
  catBadge: {
    fontSize: 13, fontWeight: "600", color: colors.accent,
    backgroundColor: "rgba(255,140,66,0.1)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  durText: { fontSize: 13, color: colors.muted },
  dots: { flexDirection: "row", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderLight },
  dotFilled: { backgroundColor: colors.foreground },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  tag: { fontSize: 12, color: colors.muted },

  interactiveBtn: {
    backgroundColor: colors.secondary, borderRadius: 16, paddingVertical: 14, alignItems: "center", marginBottom: 20,
    shadowColor: colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  interactiveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  desc: { fontSize: 15, color: colors.foreground, lineHeight: 24, marginBottom: 16 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 24 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.muted, letterSpacing: 1.5, marginBottom: 16 },

  sourceRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  sourceText: { fontSize: 14, color: colors.foreground, flex: 1 },
});
