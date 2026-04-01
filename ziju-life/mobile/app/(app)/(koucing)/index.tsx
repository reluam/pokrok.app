import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";
import { getCoachingHistory, sendCoachingMessage } from "@/api/dilna";
import { Send, CalendarPlus } from "lucide-react-native";
import { colors } from "@/constants/theme";

interface Message {
  role: string;
  content: string;
  created_at?: string;
}

const mdStyles = StyleSheet.create({
  body: { fontSize: 15, color: colors.foreground, lineHeight: 22 },
  heading1: { fontSize: 18, fontWeight: "800" as const, color: colors.foreground, marginTop: 16, marginBottom: 6 },
  heading2: { fontSize: 16, fontWeight: "700" as const, color: colors.foreground, marginTop: 12, marginBottom: 4 },
  heading3: { fontSize: 15, fontWeight: "700" as const, color: colors.foreground, marginTop: 10, marginBottom: 4 },
  paragraph: { marginBottom: 8, marginTop: 0 },
  strong: { fontWeight: "700" as const, color: colors.foreground },
  em: { fontStyle: "italic" as const },
  list_item: { marginBottom: 2 },
  bullet_list: { marginBottom: 8 },
  ordered_list: { marginBottom: 8 },
  hr: { borderBottomWidth: 1, borderBottomColor: colors.borderLight, marginVertical: 12 },
  link: { color: colors.accent, textDecorationLine: "underline" as const },
});

export default function KoucingScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getCoachingHistory();
        if (res.messages.length > 0) {
          setMessages(res.messages);
        } else {
          // Welcome message for new users
          setMessages([{
            role: "assistant",
            content: `Ahoj! 👋 Jsem tvůj chytrý průvodce životem.

Funguju jako tvůj společník a thinking parťák na cestě osobního rozvoje. Můžeš se mnou probírat cokoliv — své cíle, výzvy, nápady, pocity. Čím víc toho o tobě vím, tím lépe ti dokážu pomoct.

Co ode mě můžeš čekat:
• Naslouchám a kladu otázky, které ti pomůžou přemýšlet jinak
• Pamatuju si naši konverzaci a buduji tvůj profil
• Doporučuju nástroje a inspirace šité na míru tobě
• Pomáhám ti stanovit priority a udržet směr

Naše konverzace se ukládá — kdykoli se vrátíš, navážeme tam, kde jsme skončili.

Tak povídej — co právě řešíš? 🌱`,
          }]);
        }
      } catch {
        setMessages([{
          role: "assistant",
          content: "Ahoj! 👋 Jsem tvůj chytrý průvodce životem. Povídej mi o sobě — co řešíš, na čem pracuješ. Čím víc toho o tobě vím, tím lépe ti pomůžu. 🌱",
        }]);
      }
      setLoading(false);
    })();
  }, []);

  // Scroll to end after messages load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [loading, messages.length === 0]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await sendCoachingMessage(text);
      setMessages(prev => [...prev, { role: "assistant", content: res.message }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Promiň, něco se pokazilo. Zkus to znovu." }]);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>AI Průvodce</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          style={s.flex}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          keyExtractor={(_, i) => String(i)}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[s.bubble, item.role === "user" ? s.bubbleUser : s.bubbleAI]}>
              {item.role === "user" ? (
                <Text style={s.bubbleText}>{item.content}</Text>
              ) : (
                <Markdown style={mdStyles}>{item.content}</Markdown>
              )}
            </View>
          )}
        />

        {/* Typing indicator */}
        {sending && (
          <View style={s.typingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={s.typingText}>Průvodce přemýšlí...</Text>
          </View>
        )}

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Napiš zprávu..."
            placeholderTextColor="#aaa"
            multiline
            maxLength={2000}
            editable={!sending}
            onSubmitEditing={handleSend}
            blurOnSubmit
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Booking bar */}
        <TouchableOpacity
          style={s.bookingBar}
          onPress={() => Linking.openURL("https://ziju.life/koucing#rezervace")}
          activeOpacity={0.8}
        >
          <CalendarPlus size={18} color={colors.accent} />
          <Text style={s.bookingText}>Objednat osobní sezení</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTitle: { fontSize: 28, fontWeight: "800", color: colors.foreground, letterSpacing: -0.5 },

  bubble: { maxWidth: "85%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginVertical: 4 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "rgba(255,140,66,0.12)", borderBottomRightRadius: 4 },
  bubbleAI: { alignSelf: "flex-start", backgroundColor: colors.boxBg, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: colors.foreground, lineHeight: 22 },

  typingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingBottom: 8 },
  typingText: { fontSize: 13, color: colors.muted },

  inputRow: {
    flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 8, gap: 8,
    borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.white,
  },
  input: {
    flex: 1, backgroundColor: colors.background, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.foreground, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent,
    justifyContent: "center", alignItems: "center",
  },

  bookingBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight,
    paddingVertical: 12,
  },
  bookingText: { fontSize: 14, fontWeight: "700", color: colors.accent },
});
