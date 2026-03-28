import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { apiFetch } from "@/api/client";
import { ChevronLeft, ExternalLink } from "lucide-react-native";
import { colors } from "@/constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");

interface FullItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  url?: string;
  author?: string;
  content?: string;
  thumbnail?: string;
  imageUrl?: string;
  bookCoverFit?: string;
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m?.[1] ?? null;
}

export default function InspirationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<FullItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await apiFetch<{ item: FullItem }>(`/api/inspiration/${id}`);
        setItem(res.item);
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><Text style={s.emptyText}>Položka nenalezena</Text></View>
      </SafeAreaView>
    );
  }

  const ytId = item.url ? getYouTubeId(item.url) : null;
  const vimeoId = item.url ? getVimeoId(item.url) : null;
  const hasVideo = item.type === "video" && (ytId || vimeoId);
  const hasBookCover = item.type === "book" && (item.imageUrl || item.thumbnail);
  const hasContent = item.content && (item.type === "blog" || item.type === "princip");

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerType}>{item.type.toUpperCase()}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={s.flex} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Video embed */}
        {hasVideo && (
          <View style={s.videoWrap}>
            <WebView
              source={{
                uri: ytId
                  ? `https://www.youtube.com/embed/${ytId}?playsinline=1`
                  : `https://player.vimeo.com/video/${vimeoId}`,
              }}
              style={s.video}
              allowsFullscreenVideo
              javaScriptEnabled
            />
          </View>
        )}

        {/* Book cover */}
        {hasBookCover && (
          <Image
            source={{ uri: item.imageUrl || item.thumbnail }}
            style={s.bookCover}
            resizeMode={item.bookCoverFit === "contain" ? "contain" : "cover"}
          />
        )}

        {/* Thumbnail for other types */}
        {!hasVideo && !hasBookCover && (item.thumbnail || item.imageUrl) && (
          <Image source={{ uri: item.thumbnail || item.imageUrl }} style={s.thumbnail} resizeMode="cover" />
        )}

        {/* Title + author */}
        <Text style={s.title}>{item.title}</Text>
        {item.author && <Text style={s.author}>{item.author}</Text>}

        {/* Description */}
        {item.description && <Text style={s.desc}>{item.description}</Text>}

        {/* Content (blog/princip) */}
        {hasContent && <Text style={s.contentText}>{item.content}</Text>}

        {/* External link */}
        {item.url && !hasVideo && (
          <TouchableOpacity
            style={s.linkBtn}
            onPress={() => Linking.openURL(item.url!)}
            activeOpacity={0.8}
          >
            <ExternalLink size={16} color="#fff" />
            <Text style={s.linkBtnText}>
              {item.type === "book" ? "Koupit knihu" :
               item.type === "article" ? "Otevřít článek" :
               item.type === "music" ? "Poslechnout" :
               "Otevřít"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingBottom: 40 },
  emptyText: { fontSize: 15, color: colors.muted },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  headerType: { fontSize: 12, fontWeight: "700", color: colors.accent, letterSpacing: 1 },

  videoWrap: { width: SCREEN_W, height: SCREEN_W * 0.5625, backgroundColor: "#000" },
  video: { flex: 1 },
  bookCover: { width: SCREEN_W * 0.5, height: SCREEN_W * 0.75, alignSelf: "center", marginVertical: 20, borderRadius: 12 },
  thumbnail: { width: SCREEN_W, height: 200 },

  title: { fontSize: 24, fontWeight: "800", color: colors.foreground, paddingHorizontal: 20, marginTop: 16, lineHeight: 30 },
  author: { fontSize: 15, color: colors.muted, paddingHorizontal: 20, marginTop: 4 },
  desc: { fontSize: 15, color: colors.foreground, lineHeight: 24, paddingHorizontal: 20, marginTop: 16 },
  contentText: { fontSize: 15, color: colors.foreground, lineHeight: 26, paddingHorizontal: 20, marginTop: 16 },

  linkBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 14, marginHorizontal: 20, marginTop: 24,
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  linkBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
