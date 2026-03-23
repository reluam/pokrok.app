import { useEffect, useState, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { USER_PROFILE_KEY, TOOL_KEYS, CHAT_MESSAGES_KEY } from "@repo/types";
import type { ChatMessage, UserProfile, ToolId } from "@repo/types";
import { supabase } from "../../lib/supabase";
import { colors, radius, spacing } from "../../lib/theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const TOOL_IDS: ToolId[] = ["decision-paralysis", "creative-block", "motivation"];

const STARTER_PROMPTS = [
  "Chci se zamyslet nad tím, kam směřuju",
  "Mám pocit, že mi v životě něco chybí",
  "Nevím jak se rozhodnout v důležité věci",
];

export default function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function load() {
      const [rawMessages, rawProfile] = await Promise.all([
        AsyncStorage.getItem(CHAT_MESSAGES_KEY),
        AsyncStorage.getItem(USER_PROFILE_KEY),
      ]);
      if (rawMessages) try { setMessages(JSON.parse(rawMessages)); } catch {}
      if (rawProfile) try { setUserProfile(JSON.parse(rawProfile)); } catch {}
    }
    load();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, streamingText]);

  async function getToolContexts() {
    const contexts = [];
    for (const toolId of TOOL_IDS) {
      const raw = await AsyncStorage.getItem(TOOL_KEYS[toolId]);
      if (raw) {
        try { contexts.push({ toolId, data: JSON.parse(raw) }); } catch {}
      }
    }
    return contexts;
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content, timestamp: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    await AsyncStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(newMessages));
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    try {
      const [{ data: { session } }, toolContexts] = await Promise.all([
        supabase.auth.getSession(),
        getToolContexts(),
      ]);

      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: newMessages, userProfile, toolContexts }),
      });

      if (!res.ok || !res.body) throw new Error("Chyba API");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamingText(fullText);
      }

      const finalMessages = [...newMessages, { role: "assistant" as const, content: fullText, timestamp: Date.now() }];
      setMessages(finalMessages);
      await AsyncStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(finalMessages));
      setStreamingText("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function clearChat() {
    setMessages([]);
    await AsyncStorage.removeItem(CHAT_MESSAGES_KEY);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Povídej</Text>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Nový chat</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Jak se máš?</Text>
            <Text style={styles.emptyHint}>
              Začni sdílet — o čemkoli. Jsem tady, abych naslouchal a pomohl ti najít vlastní odpovědi.
            </Text>
            <View style={styles.starters}>
              {STARTER_PROMPTS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.starter}
                  onPress={() => sendMessage(p)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.starterText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {messages.map((msg, i) => (
          <View key={i} style={[styles.messageRow, msg.role === "user" ? styles.userRow : styles.assistantRow]}>
            <View style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.assistantBubble]}>
              <Text style={[styles.bubbleText, msg.role === "user" ? styles.userText : styles.assistantText]}>
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {streamingText && (
          <View style={[styles.messageRow, styles.assistantRow]}>
            <View style={[styles.bubble, styles.assistantBubble]}>
              <Text style={[styles.bubbleText, styles.assistantText]}>{streamingText}</Text>
            </View>
          </View>
        )}

        {isLoading && !streamingText && (
          <View style={[styles.messageRow, styles.assistantRow]}>
            <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Napiš zprávu..."
          placeholderTextColor={colors.muted}
          multiline
          editable={!isLoading}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  logo: { fontSize: 20, fontWeight: "800", color: colors.primary },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  clearBtnText: { fontSize: 12, color: colors.muted, fontWeight: "500" },

  messages: { flex: 1 },
  messagesContent: { padding: spacing.md, gap: 10, flexGrow: 1 },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: 40,
    gap: 12,
  },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: colors.foreground, textAlign: "center" },
  emptyHint: { fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 22 },
  starters: { gap: 8, width: "100%", marginTop: 8 },
  starter: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  starterText: { fontSize: 13, color: colors.muted, textAlign: "center" },

  messageRow: { flexDirection: "row", marginBottom: 2 },
  userRow: { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start" },

  bubble: { maxWidth: "82%", borderRadius: radius.xl, paddingVertical: 10, paddingHorizontal: 14 },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: radius.sm },
  assistantBubble: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderBottomLeftRadius: radius.sm },
  loadingBubble: { paddingVertical: 12, paddingHorizontal: 20 },

  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#fff" },
  assistantText: { color: colors.foreground },

  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? 28 : spacing.sm,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 120,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.25, shadowOpacity: 0, elevation: 0 },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
