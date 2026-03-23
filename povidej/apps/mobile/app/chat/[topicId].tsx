import { useLocalSearchParams, useNavigation } from "expo-router";
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
import { COACHING_TOPICS, USER_PROFILE_KEY } from "@repo/types";
import type { ChatMessage, CoachingTopicId, UserProfile } from "@repo/types";
import { supabase } from "../../lib/supabase";
import { colors, radius, spacing } from "../../lib/theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function ChatScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const navigation = useNavigation();
  const topic = COACHING_TOPICS.find((t) => t.id === topicId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (topic) {
      navigation.setOptions({ title: `${topic.icon} ${topic.title}` });
    }
  }, [topic, navigation]);

  useEffect(() => {
    AsyncStorage.getItem(USER_PROFILE_KEY).then((val) => {
      if (val) setUserProfile(JSON.parse(val));
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, streamingText]);

  async function sendMessage() {
    if (!input.trim() || isLoading || !topic) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          topicId: topic.id as CoachingTopicId,
          messages: newMessages,
          userProfile,
        }),
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

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullText, timestamp: Date.now() },
      ]);
      setStreamingText("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  if (!topic) return null;

  const firstName = userProfile?.name?.split(" ")[0];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{topic.icon}</Text>
            <Text style={styles.emptyTitle}>{topic.title}</Text>
            <Text style={styles.emptyHint}>
              {firstName ? `Ahoj ${firstName}, ` : ""}
              {topic.description}
            </Text>
          </View>
        )}

        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.messageRow,
              msg.role === "user" ? styles.userRow : styles.assistantRow,
            ]}
          >
            <View
              style={[
                styles.bubble,
                msg.role === "user" ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === "user" ? styles.userText : styles.assistantText,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {streamingText && (
          <View style={[styles.messageRow, styles.assistantRow]}>
            <View style={[styles.bubble, styles.assistantBubble]}>
              <Text style={[styles.bubbleText, styles.assistantText]}>
                {streamingText}
              </Text>
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
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={sendMessage}
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
  messages: { flex: 1 },
  messagesContent: { padding: spacing.md, gap: 10, flexGrow: 1 },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },

  messageRow: { flexDirection: "row", marginBottom: 2 },
  userRow: { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start" },

  bubble: {
    maxWidth: "82%",
    borderRadius: radius.xl,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  assistantBubble: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.25, shadowOpacity: 0, elevation: 0 },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
