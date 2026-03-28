import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getUserContext, saveUserContext, aiCoach } from "@/api/laborator";
import { getToken } from "@/api/client";
import { MessageCircle, Send, Maximize2, Minimize2, Check, Plus, Trash2 } from "lucide-react-native";
import { colors } from "@/constants/theme";

const { height: SCREEN_H } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "todo" | "priorities" | "rituals";

interface PriorityItem { text: string; done: boolean }
interface PrioritiesData { weekly: PriorityItem[]; monthly: PriorityItem[]; yearly: PriorityItem[] }
interface RitualItem { id: string; name: string; done: boolean }
interface ChatBubble { role: "user" | "assistant"; text: string }

// ── AI Coach Bar ─────────────────────────────────────────────────────────────

function AICoachBar({
  expanded,
  fullScreen,
  onToggle,
  onFullScreen,
  bubbles,
  onSend,
  sending,
}: {
  expanded: boolean;
  fullScreen: boolean;
  onToggle: () => void;
  onFullScreen: () => void;
  bubbles: ChatBubble[];
  onSend: (msg: string) => void;
  sending: boolean;
}) {
  const [msg, setMsg] = useState("");
  const flatRef = useRef<FlatList>(null);

  const handleSend = () => {
    const trimmed = msg.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setMsg("");
  };

  const barHeight = fullScreen ? SCREEN_H - 100 : expanded ? SCREEN_H * 0.45 : 56;

  if (!expanded) {
    return (
      <TouchableOpacity style={s.aiBarCollapsed} onPress={onToggle} activeOpacity={0.8}>
        <MessageCircle size={20} color={colors.accent} />
        <Text style={s.aiBarText}>Potřebuješ s něčím pomoct?</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[s.aiBarExpanded, { height: barHeight }]}>
      <View style={s.aiBarHeader}>
        <TouchableOpacity onPress={onToggle} hitSlop={8}>
          <Minimize2 size={18} color={colors.muted} />
        </TouchableOpacity>
        <Text style={s.aiBarTitle}>AI Kouč</Text>
        <TouchableOpacity onPress={onFullScreen} hitSlop={8}>
          {fullScreen ? <Minimize2 size={18} color={colors.muted} /> : <Maximize2 size={18} color={colors.muted} />}
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatRef}
        data={bubbles}
        style={s.chatList}
        contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
        keyExtractor={(_, i) => String(i)}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[s.bubble, item.role === "user" ? s.bubbleUser : s.bubbleAssistant]}>
            <Text style={s.bubbleText}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={s.chatEmpty}>Zeptej se na cokoliv — pomůžu ti s tvým rozvojem.</Text>
        }
      />

      <View style={s.aiInputRow}>
        <TextInput
          style={s.aiInput}
          value={msg}
          onChangeText={setMsg}
          placeholder="Napiš zprávu..."
          placeholderTextColor="#aaa"
          multiline
          maxLength={2000}
          editable={!sending}
          onSubmitEditing={handleSend}
          blurOnSubmit
        />
        <TouchableOpacity
          style={[s.aiSendBtn, (!msg.trim() || sending) && { opacity: 0.4 }]}
          onPress={handleSend}
          disabled={!msg.trim() || sending}
        >
          <Send size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Checklist Item ───────────────────────────────────────────────────────────

function CheckItem({
  item,
  onToggle,
  onRemove,
}: {
  item: PriorityItem;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={s.checkRow}>
      <TouchableOpacity
        style={[s.checkbox, item.done && s.checkboxDone]}
        onPress={onToggle}
      >
        {item.done && <Check size={12} color="#fff" />}
      </TouchableOpacity>
      <Text style={[s.checkText, item.done && s.checkTextDone]}>{item.text}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={8} style={{ padding: 4 }}>
        <Trash2 size={14} color={colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function LaboratorDashboard() {
  const [tab, setTab] = useState<Tab>("todo");
  const [priorities, setPriorities] = useState<PrioritiesData>({ weekly: [], monthly: [], yearly: [] });
  const [rituals, setRituals] = useState<{ morning: RitualItem[]; daily: RitualItem[]; evening: RitualItem[] }>({
    morning: [], daily: [], evening: [],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);

  // AI Coach
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiFullScreen, setAiFullScreen] = useState(false);
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await getUserContext();
      const ctx = res.context || {};

      // Priorities
      if (ctx.priorities && typeof ctx.priorities === "object") {
        const p = ctx.priorities as PrioritiesData;
        setPriorities({
          weekly: Array.isArray(p.weekly) ? p.weekly : [],
          monthly: Array.isArray(p.monthly) ? p.monthly : [],
          yearly: Array.isArray(p.yearly) ? p.yearly : [],
        });
      }

      // Rituals — stored as { morning: ["id1", "custom::Name::dur"], daily: [...], evening: [...] }
      if (ctx.rituals && typeof ctx.rituals === "object" && !Array.isArray(ctx.rituals)) {
        const sel = ctx.rituals as { morning?: string[]; daily?: string[]; evening?: string[]; durationOverrides?: Record<string, number> };
        const parseName = (id: string) => {
          if (id.startsWith("custom::")) return id.split("::")[1] ?? id;
          // Fallback: use ID as name, capitalize
          return id.replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase());
        };
        const grouped = {
          morning: (sel.morning ?? []).map(id => ({ id, name: parseName(id), done: false })),
          daily: (sel.daily ?? []).map(id => ({ id, name: parseName(id), done: false })),
          evening: (sel.evening ?? []).map(id => ({ id, name: parseName(id), done: false })),
        };
        setRituals(grouped);

        // Load today's completions
        try {
          const compRes = await fetch("https://ziju.life/api/laborator/ritual-completions", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (compRes.ok) {
            const comp = await compRes.json();
            const todaySet = new Set<string>(comp.today ?? []);
            setRituals({
              morning: grouped.morning.map(r => ({ ...r, done: todaySet.has(r.id) })),
              daily: grouped.daily.map(r => ({ ...r, done: todaySet.has(r.id) })),
              evening: grouped.evening.map(r => ({ ...r, done: todaySet.has(r.id) })),
            });
          }
        } catch {}
      }
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // Priority actions
  const savePriorities = async (updated: PrioritiesData) => {
    setPriorities(updated);
    try { await saveUserContext("priorities", updated); } catch {}
  };

  const togglePriority = (scope: keyof PrioritiesData, idx: number) => {
    const updated = { ...priorities };
    updated[scope] = [...updated[scope]];
    updated[scope][idx] = { ...updated[scope][idx], done: !updated[scope][idx].done };
    savePriorities(updated);
  };

  const removePriority = (scope: keyof PrioritiesData, idx: number) => {
    const updated = { ...priorities };
    updated[scope] = updated[scope].filter((_, i) => i !== idx);
    savePriorities(updated);
  };

  const addPriority = (scope: keyof PrioritiesData) => {
    if (!newItem.trim()) return;
    const updated = { ...priorities };
    updated[scope] = [...updated[scope], { text: newItem.trim(), done: false }];
    savePriorities(updated);
    setNewItem("");
    setAddingTo(null);
  };

  // AI actions
  const handleAISend = async (msg: string) => {
    const userBubble: ChatBubble = { role: "user", text: msg };
    const newBubbles = [...bubbles, userBubble];
    setBubbles(newBubbles);
    setSending(true);
    try {
      const res = await aiCoach(newBubbles.map(b => ({ role: b.role, content: b.text })));
      const aiText = res.type === "reflection" ? (res.text || "") : (res.response as { summary?: string })?.summary || "Nemám odpověď.";
      setBubbles([...newBubbles, { role: "assistant", text: aiText }]);
    } catch {
      setBubbles([...newBubbles, { role: "assistant", text: "Promiň, něco se pokazilo. Zkus to znovu." }]);
    }
    setSending(false);
  };

  // Tab content rendering
  const renderTodo = () => {
    const todo = priorities.weekly.filter(p => !p.done);
    const done = priorities.weekly.filter(p => p.done);
    return (
      <View>
        <Text style={s.sectionTitle}>To-Do tento týden</Text>
        {todo.slice(0, 3).map((item, i) => {
          const realIdx = priorities.weekly.indexOf(item);
          return <CheckItem key={`t${i}`} item={item} onToggle={() => togglePriority("weekly", realIdx)} onRemove={() => removePriority("weekly", realIdx)} />;
        })}
        {todo.length > 3 && <Text style={s.moreText}>+ {todo.length - 3} dalších</Text>}

        {done.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 20 }]}>Hotovo</Text>
            {done.slice(0, 3).map((item, i) => {
              const realIdx = priorities.weekly.indexOf(item);
              return <CheckItem key={`d${i}`} item={item} onToggle={() => togglePriority("weekly", realIdx)} onRemove={() => removePriority("weekly", realIdx)} />;
            })}
          </>
        )}

        {addingTo === "weekly" ? (
          <View style={s.addRow}>
            <TextInput
              style={s.addInput}
              value={newItem}
              onChangeText={setNewItem}
              placeholder="Nový úkol..."
              placeholderTextColor="#aaa"
              autoFocus
              onSubmitEditing={() => addPriority("weekly")}
            />
            <TouchableOpacity style={s.addBtn} onPress={() => addPriority("weekly")}>
              <Plus size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.addTrigger} onPress={() => setAddingTo("weekly")}>
            <Plus size={14} color={colors.muted} />
            <Text style={s.addTriggerText}>Přidat úkol</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPriorities = () => (
    <View>
      {(["weekly", "monthly", "yearly"] as const).map(scope => (
        <View key={scope} style={{ marginBottom: 24 }}>
          <Text style={s.sectionTitle}>{scope === "weekly" ? "Tento týden" : scope === "monthly" ? "Tento měsíc" : "Tento rok"}</Text>
          {priorities[scope].map((item, i) => (
            <CheckItem key={i} item={item} onToggle={() => togglePriority(scope, i)} onRemove={() => removePriority(scope, i)} />
          ))}
          {addingTo === scope ? (
            <View style={s.addRow}>
              <TextInput
                style={s.addInput}
                value={newItem}
                onChangeText={setNewItem}
                placeholder={scope === "weekly" ? "Nový úkol..." : scope === "monthly" ? "Nová měsíční priorita..." : "Nová roční priorita..."}
                placeholderTextColor="#aaa"
                autoFocus
                onSubmitEditing={() => addPriority(scope)}
              />
              <TouchableOpacity style={s.addBtn} onPress={() => addPriority(scope)}>
                <Plus size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.addTrigger} onPress={() => { setAddingTo(scope); setNewItem(""); }}>
              <Plus size={14} color={colors.muted} />
              <Text style={s.addTriggerText}>Přidat</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderRituals = () => {
    const slots = [
      { key: "morning" as const, label: "Ráno 🌅", items: rituals.morning },
      { key: "daily" as const, label: "Během dne ☀️", items: rituals.daily },
      { key: "evening" as const, label: "Večer 🌙", items: rituals.evening },
    ];
    const total = slots.reduce((a, s) => a + s.items.length, 0);
    const doneCount = slots.reduce((a, s) => a + s.items.filter(i => i.done).length, 0);

    return (
      <View>
        {total > 0 && (
          <View style={s.progressRow}>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${total ? (doneCount / total) * 100 : 0}%` }]} />
            </View>
            <Text style={s.progressText}>{doneCount}/{total}</Text>
          </View>
        )}
        {slots.map(slot => (
          <View key={slot.key} style={s.ritualSlot}>
            <Text style={s.ritualSlotLabel}>{slot.label}</Text>
            {slot.items.length === 0 && <Text style={s.emptyText}>Žádné rituály</Text>}
            {slot.items.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={s.checkRow}
                onPress={() => {
                  const updated = { ...rituals };
                  updated[slot.key] = [...updated[slot.key]];
                  updated[slot.key][i] = { ...updated[slot.key][i], done: !updated[slot.key][i].done };
                  setRituals(updated);
                }}
              >
                <View style={[s.checkbox, item.done && s.checkboxDone]}>
                  {item.done && <Check size={12} color="#fff" />}
                </View>
                <Text style={[s.checkText, item.done && s.checkTextDone]}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {total === 0 && (
          <Text style={s.emptyText}>Nastav si rituály v sekci Nastav si den na webu.</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Tab bar */}
        <View style={s.tabBar}>
          {([["todo", "To-Do"], ["priorities", "Priority"], ["rituals", "Rituály"]] as [Tab, string][]).map(
            ([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[s.tabItem, tab === key && s.tabItemActive]}
                onPress={() => setTab(key)}
              >
                <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Content */}
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {tab === "todo" && renderTodo()}
          {tab === "priorities" && renderPriorities()}
          {tab === "rituals" && renderRituals()}
        </ScrollView>

        {/* AI Coach */}
        <AICoachBar
          expanded={aiExpanded}
          fullScreen={aiFullScreen}
          onToggle={() => { setAiExpanded(!aiExpanded); setAiFullScreen(false); }}
          onFullScreen={() => setAiFullScreen(!aiFullScreen)}
          bubbles={bubbles}
          onSend={handleAISend}
          sending={sending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 20 },

  // Tabs
  tabBar: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 6 },
  tabItem: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: "center", backgroundColor: "transparent" },
  tabItemActive: { backgroundColor: colors.accent },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  tabTextActive: { color: "#fff" },

  // Sections
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 },
  moreText: { fontSize: 13, color: colors.muted, marginTop: 4, marginLeft: 32 },

  // Checklist
  checkRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 4 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: colors.border, justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  checkboxDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkText: { flex: 1, fontSize: 15, color: colors.foreground },
  checkTextDone: { color: colors.muted, textDecorationLine: "line-through" },

  // Add item
  addTrigger: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 4, gap: 6 },
  addTriggerText: { fontSize: 13, color: colors.muted },
  addRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  addInput: {
    flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.foreground,
  },
  addBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent,
    justifyContent: "center", alignItems: "center",
  },

  // Rituals
  ritualSlot: {
    backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight,
    padding: 14, marginBottom: 10,
  },
  ritualSlotLabel: { fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 },
  progressRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  progressBg: { flex: 1, height: 6, backgroundColor: colors.boxBg, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 999 },
  progressText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  emptyText: { fontSize: 13, color: colors.muted, fontStyle: "italic", paddingVertical: 8 },

  // AI Coach — collapsed
  aiBarCollapsed: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  aiBarText: { fontSize: 14, color: colors.muted },

  // AI Coach — expanded
  aiBarExpanded: {
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 8,
  },
  aiBarHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  aiBarTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground },

  // Chat
  chatList: { flex: 1 },
  chatEmpty: { fontSize: 14, color: colors.muted, textAlign: "center", paddingVertical: 20, fontStyle: "italic" },
  bubble: { maxWidth: "85%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginVertical: 4 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "rgba(255,140,66,0.12)", borderBottomRightRadius: 4 },
  bubbleAssistant: { alignSelf: "flex-start", backgroundColor: colors.boxBg, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: colors.foreground, lineHeight: 20 },

  // Input
  aiInputRow: {
    flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  aiInput: {
    flex: 1, backgroundColor: colors.background, borderRadius: 16, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, color: colors.foreground, maxHeight: 80,
  },
  aiSendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent,
    justifyContent: "center", alignItems: "center",
  },
});
