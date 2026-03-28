import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Linking,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Send, CalendarPlus } from "lucide-react-native";
import { colors } from "@/constants/theme";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text: "Ahoj! Jsem tu, abych ti pomohl na tvé cestě. Můžeš se mě zeptat na cokoliv ohledně osobního rozvoje, nebo si zarezervuj koučovací sezení.",
};

export default function KoucingScreen() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");

    const userMsg: Message = { id: `u${Date.now()}`, role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    // Simple echo for now — can be connected to AI endpoint later
    setTimeout(() => {
      const reply: Message = {
        id: `a${Date.now()}`,
        role: "assistant",
        text: "Díky za zprávu! Pro hlubší práci na tvém tématu si můžeš zarezervovat koučovací sezení. Klikni na tlačítko dole.",
      };
      setMessages(prev => [...prev, reply]);
      setSending(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Koučing</Text>
        </View>

        {/* Chat */}
        <FlatList
          data={messages}
          style={s.flex}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <View style={[s.bubble, item.role === "user" ? s.bubbleUser : s.bubbleAI]}>
              <Text style={s.bubbleText}>{item.text}</Text>
            </View>
          )}
        />

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
          onPress={() => Linking.openURL("https://ziju.life/koucing")}
          activeOpacity={0.8}
        >
          <CalendarPlus size={20} color={colors.accent} />
          <Text style={s.bookingText}>Objednat koučovací sezení</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: colors.foreground, letterSpacing: -0.5 },

  // Chat
  bubble: { maxWidth: "85%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginVertical: 4 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "rgba(255,140,66,0.12)", borderBottomRightRadius: 4 },
  bubbleAI: { alignSelf: "flex-start", backgroundColor: colors.boxBg, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: colors.foreground, lineHeight: 20 },

  // Input
  inputRow: {
    flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 8, gap: 8,
    borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.white,
  },
  input: {
    flex: 1, backgroundColor: colors.background, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.foreground, maxHeight: 80,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent,
    justifyContent: "center", alignItems: "center",
  },

  // Booking bar
  bookingBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight,
    paddingVertical: 14,
  },
  bookingText: { fontSize: 15, fontWeight: "700", color: colors.accent },
});
