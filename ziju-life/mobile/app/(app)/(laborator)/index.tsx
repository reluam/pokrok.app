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
  Dimensions,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getUserContext,
  saveUserContext,
  getDashboardData,
  saveDailyTodos,
  toggleRitualCompletion,
  aiCoach,
} from "@/api/laborator";
import { MessageCircle, Send, Maximize2, Minimize2, Check, Plus, Trash2 } from "lucide-react-native";
import { colors } from "@/constants/theme";

const { height: SCREEN_H } = Dimensions.get("window");
const MAX_TODO = 3;

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "todo" | "priorities" | "rituals";

interface TodoItem { text: string; done: boolean }
interface PriorityItem { text: string; done: boolean }
interface PrioritiesData { weekly: PriorityItem[]; monthly: PriorityItem[]; yearly: PriorityItem[] }
interface RitualItem { id: string; name: string; done: boolean; streak: number }
interface ChatBubble { role: "user" | "assistant"; text: string }

// ── Checklist Item ───────────────────────────────────────────────────────────

function CheckItem({
  item,
  onToggle,
  onRemove,
  accentColor,
}: {
  item: { text: string; done: boolean };
  onToggle: () => void;
  onRemove?: () => void;
  accentColor?: string;
}) {
  const color = accentColor || colors.accent;
  return (
    <View style={s.checkRow}>
      <TouchableOpacity
        style={[s.checkbox, item.done && { backgroundColor: color, borderColor: color }]}
        onPress={onToggle}
      >
        {item.done && <Check size={12} color="#fff" />}
      </TouchableOpacity>
      <Text style={[s.checkText, item.done && s.checkTextDone]}>{item.text}</Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} hitSlop={8} style={{ padding: 4 }}>
          <Trash2 size={14} color={colors.muted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Add Item Inline ──────────────────────────────────────────────────────────

function AddInline({
  placeholder,
  onAdd,
  maxReached,
}: {
  placeholder: string;
  onAdd: (text: string) => void;
  maxReached?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  if (maxReached) return null;

  if (!adding) {
    return (
      <TouchableOpacity style={s.addTrigger} onPress={() => setAdding(true)}>
        <Plus size={14} color={colors.muted} />
        <Text style={s.addTriggerText}>Přidat</Text>
      </TouchableOpacity>
    );
  }

  const handleAdd = () => {
    if (text.trim()) { onAdd(text.trim()); setText(""); setAdding(false); }
  };

  return (
    <View style={s.addRow}>
      <TextInput
        style={s.addInput}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        autoFocus
        onSubmitEditing={handleAdd}
      />
      <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
        <Check size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── AI Coach Bar ─────────────────────────────────────────────────────────────

function AICoachBar({
  expanded, fullScreen, onToggle, onFullScreen,
  bubbles, onSend, sending,
}: {
  expanded: boolean; fullScreen: boolean;
  onToggle: () => void; onFullScreen: () => void;
  bubbles: ChatBubble[]; onSend: (msg: string) => void; sending: boolean;
}) {
  const [msg, setMsg] = useState("");
  const flatRef = useRef<FlatList>(null);

  const handleSend = () => {
    const t = msg.trim();
    if (!t || sending) return;
    onSend(t);
    setMsg("");
  };

  if (!expanded) {
    return (
      <TouchableOpacity style={s.aiBarCollapsed} onPress={onToggle} activeOpacity={0.8}>
        <MessageCircle size={20} color={colors.accent} />
        <Text style={s.aiBarText}>Potřebuješ s něčím pomoct?</Text>
      </TouchableOpacity>
    );
  }

  const barHeight = fullScreen ? SCREEN_H - 100 : SCREEN_H * 0.45;

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
        ListEmptyComponent={<Text style={s.chatEmpty}>Zeptej se na cokoliv.</Text>}
      />
      <View style={s.aiInputRow}>
        <TextInput
          style={s.aiInput} value={msg} onChangeText={setMsg}
          placeholder="Napiš zprávu..." placeholderTextColor="#aaa"
          multiline maxLength={2000} editable={!sending}
          onSubmitEditing={handleSend} blurOnSubmit
        />
        <TouchableOpacity
          style={[s.aiSendBtn, (!msg.trim() || sending) && { opacity: 0.4 }]}
          onPress={handleSend} disabled={!msg.trim() || sending}
        >
          <Send size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function LaboratorDashboard() {
  const [tab, setTab] = useState<Tab>("todo");

  // To-Do (daily)
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [niceTodos, setNiceTodos] = useState<TodoItem[]>([]);

  // Priorities
  const [priorities, setPriorities] = useState<PrioritiesData>({ weekly: [], monthly: [], yearly: [] });

  // Rituals
  const [ritualItems, setRitualItems] = useState<{ morning: RitualItem[]; daily: RitualItem[]; evening: RitualItem[] }>({
    morning: [], daily: [], evening: [],
  });

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // AI Coach
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiFullScreen, setAiFullScreen] = useState(false);
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [sending, setSending] = useState(false);

  // ── Load data (single batched request) ──

  const load = useCallback(async () => {
    try {
      setLoadError(false);
      const data = await getDashboardData();

      // Todos
      setTodos(data.todos.today?.todos ?? []);
      setNiceTodos(data.todos.today?.niceTodos ?? []);

      // Priorities
      const ctx = data.context || {};
      if (ctx.priorities && typeof ctx.priorities === "object") {
        const p = ctx.priorities as PrioritiesData;
        setPriorities({
          weekly: Array.isArray(p.weekly) ? p.weekly : [],
          monthly: Array.isArray(p.monthly) ? p.monthly : [],
          yearly: Array.isArray(p.yearly) ? p.yearly : [],
        });
      }

      // Rituals
      const completedToday = new Set<string>(data.ritualCompletions.today ?? []);
      const stats: Record<string, number> = data.ritualCompletions.stats ?? {};

      if (ctx.rituals && typeof ctx.rituals === "object" && !Array.isArray(ctx.rituals)) {
        const sel = ctx.rituals as { morning?: string[]; daily?: string[]; evening?: string[] };
        const parseName = (id: string) => {
          if (id.startsWith("custom::")) return id.split("::")[1] ?? id;
          return id.replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase());
        };
        const toItems = (ids: string[]) =>
          ids.map(id => ({ id, name: parseName(id), done: completedToday.has(id), streak: stats[id] ?? 0 }));

        setRitualItems({
          morning: toItems(sel.morning ?? []),
          daily: toItems(sel.daily ?? []),
          evening: toItems(sel.evening ?? []),
        });
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // ── Todo actions ──

  const saveTodos = async (t: TodoItem[], n: TodoItem[]) => {
    setTodos(t); setNiceTodos(n);
    try { await saveDailyTodos(t, n); } catch {}
  };

  // ── Priority actions ──

  const savePriorities = async (updated: PrioritiesData) => {
    setPriorities(updated);
    try { await saveUserContext("priorities", updated); } catch {}
  };

  const togglePriority = (scope: keyof PrioritiesData, idx: number) => {
    const u = { ...priorities, [scope]: priorities[scope].map((p, i) => i === idx ? { ...p, done: !p.done } : p) };
    savePriorities(u);
  };

  const removePriority = (scope: keyof PrioritiesData, idx: number) => {
    const u = { ...priorities, [scope]: priorities[scope].filter((_, i) => i !== idx) };
    savePriorities(u);
  };

  const addPriority = (scope: keyof PrioritiesData, text: string) => {
    const u = { ...priorities, [scope]: [...priorities[scope], { text, done: false }] };
    savePriorities(u);
  };

  // ── Ritual actions ──

  const handleToggleRitual = async (slot: "morning" | "daily" | "evening", idx: number) => {
    const item = ritualItems[slot][idx];
    const newDone = !item.done;
    setRitualItems(prev => ({
      ...prev,
      [slot]: prev[slot].map((r, i) => i === idx ? { ...r, done: newDone } : r),
    }));
    try { await toggleRitualCompletion(item.id, newDone); } catch {}
  };

  // ── AI ──

  const handleAISend = async (msg: string) => {
    const userBubble: ChatBubble = { role: "user", text: msg };
    const newBubbles = [...bubbles, userBubble];
    setBubbles(newBubbles);
    setSending(true);
    try {
      const res = await aiCoach(newBubbles.map(b => ({ role: b.role, content: b.text })));
      const aiText = res.type === "reflection"
        ? (res.text || "")
        : (res.response as { summary?: string })?.summary || "Nemám odpověď.";
      setBubbles([...newBubbles, { role: "assistant", text: aiText }]);
    } catch {
      setBubbles([...newBubbles, { role: "assistant", text: "Promiň, něco se pokazilo." }]);
    }
    setSending(false);
  };

  // ── Render tabs ──

  const renderTodo = () => (
    <View>
      {/* To Do — max 3 */}
      <Text style={s.sectionLabel}>TO DO ({todos.length}/{MAX_TODO})</Text>
      {todos.map((item, i) => (
        <CheckItem
          key={`t${i}`}
          item={item}
          accentColor="#22c55e"
          onToggle={() => saveTodos(todos.map((t, j) => j === i ? { ...t, done: !t.done } : t), niceTodos)}
          onRemove={() => saveTodos(todos.filter((_, j) => j !== i), niceTodos)}
        />
      ))}
      <AddInline
        placeholder="Nový úkol..."
        maxReached={todos.length >= MAX_TODO}
        onAdd={(text) => saveTodos([...todos, { text, done: false }], niceTodos)}
      />

      {/* Nice To Do — max 3 */}
      <Text style={[s.sectionLabel, { marginTop: 24, color: colors.accent }]}>
        NICE TO DO ({niceTodos.length}/{MAX_TODO})
      </Text>
      {niceTodos.map((item, i) => (
        <CheckItem
          key={`n${i}`}
          item={item}
          accentColor={colors.accent}
          onToggle={() => saveTodos(todos, niceTodos.map((t, j) => j === i ? { ...t, done: !t.done } : t))}
          onRemove={() => saveTodos(todos, niceTodos.filter((_, j) => j !== i))}
        />
      ))}
      <AddInline
        placeholder="Nice to do..."
        maxReached={niceTodos.length >= MAX_TODO}
        onAdd={(text) => saveTodos(todos, [...niceTodos, { text, done: false }])}
      />
    </View>
  );

  const renderPriorities = () => (
    <View>
      {(["weekly", "monthly", "yearly"] as const).map(scope => (
        <View key={scope} style={{ marginBottom: 24 }}>
          <Text style={s.sectionTitle}>
            {scope === "weekly" ? "Tento týden" : scope === "monthly" ? "Tento měsíc" : "Tento rok"}
          </Text>
          {priorities[scope].length === 0 && <Text style={s.emptyText}>Žádné priority</Text>}
          {priorities[scope].map((item, i) => (
            <CheckItem
              key={i}
              item={item}
              onToggle={() => togglePriority(scope, i)}
              onRemove={() => removePriority(scope, i)}
            />
          ))}
          <AddInline
            placeholder={scope === "weekly" ? "Nová týdenní priorita..." : scope === "monthly" ? "Nová měsíční priorita..." : "Nová roční priorita..."}
            onAdd={(text) => addPriority(scope, text)}
          />
        </View>
      ))}
    </View>
  );

  const renderRituals = () => {
    const slots = [
      { key: "morning" as const, label: "Ráno 🌅", items: ritualItems.morning },
      { key: "daily" as const, label: "Během dne ☀️", items: ritualItems.daily },
      { key: "evening" as const, label: "Večer 🌙", items: ritualItems.evening },
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
            <Text style={s.progressText}>{doneCount}/{total} ({total ? Math.round((doneCount / total) * 100) : 0}%)</Text>
          </View>
        )}
        {slots.map(slot => (
          <View key={slot.key} style={s.ritualSlot}>
            <Text style={s.ritualSlotLabel}>{slot.label}</Text>
            {slot.items.length === 0 && <Text style={s.emptyText}>Žádné rituály</Text>}
            {slot.items.map((item, i) => (
              <View key={i} style={s.checkRow}>
                <TouchableOpacity
                  style={[s.checkbox, item.done && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                  onPress={() => handleToggleRitual(slot.key, i)}
                >
                  {item.done && <Check size={12} color="#fff" />}
                </TouchableOpacity>
                <Text style={[s.checkText, item.done && s.checkTextDone, { flex: 1 }]}>{item.name}</Text>
                {item.streak > 0 && <Text style={s.streakText}>{item.streak}×</Text>}
              </View>
            ))}
          </View>
        ))}
        {total === 0 && (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>Nastav si rituály v sekci "Nastav si den" na webu.</Text>
          </View>
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
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: colors.muted, fontSize: 14 }}>Načítám...</Text>
            </View>
          ) : loadError ? (
            <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 14 }}>Nepodařilo se načíst data</Text>
              <TouchableOpacity
                onPress={() => { setLoading(true); load(); }}
                style={{ backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Zkusit znovu</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {tab === "todo" && renderTodo()}
              {tab === "priorities" && renderPriorities()}
              {tab === "rituals" && renderRituals()}
            </>
          )}
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
  tabItem: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: "center" },
  tabItemActive: { backgroundColor: colors.accent },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  tabTextActive: { color: "#fff" },

  // Sections
  sectionLabel: { fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 },
  emptyText: { fontSize: 13, color: colors.muted, fontStyle: "italic", paddingVertical: 4 },
  emptyCard: { backgroundColor: colors.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.borderLight },

  // Checklist
  checkRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 2 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: colors.border, justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  checkText: { flex: 1, fontSize: 15, color: colors.foreground },
  checkTextDone: { color: colors.muted, textDecorationLine: "line-through" },

  // Add
  addTrigger: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 6 },
  addTriggerText: { fontSize: 13, color: colors.muted },
  addRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  addInput: {
    flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.foreground,
  },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent, justifyContent: "center", alignItems: "center" },

  // Rituals
  ritualSlot: {
    backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight,
    padding: 14, marginBottom: 10,
  },
  ritualSlotLabel: { fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 },
  streakText: { fontSize: 11, color: colors.muted, marginLeft: 8 },
  progressRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  progressBg: { flex: 1, height: 6, backgroundColor: colors.boxBg, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 999 },
  progressText: { fontSize: 13, fontWeight: "600", color: colors.muted },

  // AI collapsed
  aiBarCollapsed: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  aiBarText: { fontSize: 14, color: colors.muted },

  // AI expanded
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
  chatList: { flex: 1 },
  chatEmpty: { fontSize: 14, color: colors.muted, textAlign: "center", paddingVertical: 20, fontStyle: "italic" },
  bubble: { maxWidth: "85%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginVertical: 4 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "rgba(255,140,66,0.12)", borderBottomRightRadius: 4 },
  bubbleAssistant: { alignSelf: "flex-start", backgroundColor: colors.boxBg, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
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
