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
  getRitualCompletionsFull,
  aiCoach,
  getCheckins,
} from "@/api/manual";
import Markdown from "react-native-markdown-display";
import { MessageCircle, Send, Maximize2, Minimize2, Check, Plus, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react-native";
import Svg, { Polygon, Line, Circle, Text as SvgText, G, Polyline } from "react-native-svg";
import { colors } from "@/constants/theme";
import { syncWidgetData } from "@/lib/widgetSync";

const mdStyles = StyleSheet.create({
  body: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  heading1: { fontSize: 17, fontWeight: "800" as const, color: colors.foreground, marginTop: 12, marginBottom: 4 },
  heading2: { fontSize: 15, fontWeight: "700" as const, color: colors.foreground, marginTop: 10, marginBottom: 4 },
  heading3: { fontSize: 14, fontWeight: "700" as const, color: colors.foreground, marginTop: 8, marginBottom: 2 },
  paragraph: { marginBottom: 6, marginTop: 0 },
  strong: { fontWeight: "700" as const, color: colors.foreground },
  em: { fontStyle: "italic" as const },
  list_item: { marginBottom: 2 },
  bullet_list: { marginBottom: 6 },
  ordered_list: { marginBottom: 6 },
  link: { color: colors.accent, textDecorationLine: "underline" as const },
});

const { height: SCREEN_H } = Dimensions.get("window");
const MAX_TODO = 3;

const WHEEL_AREAS = [
  { key: "kariera", short: "Kariéra" },
  { key: "finance", short: "Finance" },
  { key: "zdravi", short: "Zdraví" },
  { key: "rodina", short: "Rodina" },
  { key: "pratele", short: "Přátelé" },
  { key: "rozvoj", short: "Rozvoj" },
  { key: "volny", short: "Volný čas" },
  { key: "smysl", short: "Smysl" },
];

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "todo" | "priorities" | "rituals";

interface TodoItem { text: string; done: boolean }
interface PriorityItem { text: string; done: boolean; overdue?: boolean }
interface PrioritiesData { weekly: PriorityItem[]; monthly: PriorityItem[]; yearly: PriorityItem[] }
interface RitualItem { id: string; name: string; done: boolean; streak: number }
interface ChatBubble { role: "user" | "assistant"; text: string }

// ── Checklist Item ───────────────────────────────────────────────────────────

function CheckItem({
  item,
  onToggle,
  onRemove,
  onEdit,
  accentColor,
}: {
  item: { text: string; done: boolean };
  onToggle: () => void;
  onRemove?: () => void;
  onEdit?: (newText: string) => void;
  accentColor?: string;
}) {
  const color = accentColor || colors.accent;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const commitEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== item.text && onEdit) {
      onEdit(trimmed);
    }
    setEditing(false);
  };

  return (
    <View style={s.checkRow}>
      <TouchableOpacity
        style={[s.checkbox, item.done && { backgroundColor: color, borderColor: color }]}
        onPress={onToggle}
      >
        {item.done && <Check size={12} color="#fff" />}
      </TouchableOpacity>
      {editing ? (
        <TextInput
          style={[s.checkText, { flex: 1, borderBottomWidth: 1, borderBottomColor: colors.accent, paddingVertical: 2 }]}
          value={editText}
          onChangeText={setEditText}
          onBlur={commitEdit}
          onSubmitEditing={commitEdit}
          autoFocus
          returnKeyType="done"
        />
      ) : (
        <TouchableOpacity
          style={{ flex: 1 }}
          onLongPress={() => { if (onEdit && !item.done) { setEditText(item.text); setEditing(true); } }}
          activeOpacity={0.7}
        >
          <Text style={[s.checkText, item.done && s.checkTextDone]}>{item.text}</Text>
        </TouchableOpacity>
      )}
      {onRemove && !editing && (
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
        <Text style={s.aiBarTitle}>AI Průvodce</Text>
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
            {item.role === "user" ? (
              <Text style={s.bubbleText}>{item.text}</Text>
            ) : (
              <Markdown style={mdStyles}>{item.text}</Markdown>
            )}
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

// ── Read-only Checkin Results ────────────────────────────────────────────────

function ReadOnlySpider({ areaScores, size = 220 }: { areaScores: Record<string, number>; size?: number }) {
  const C = size / 2;
  const R = C - 36;
  const N = WHEEL_AREAS.length;

  const pt = (i: number, v: number): [number, number] => {
    const a = (2 * Math.PI * i) / N - Math.PI / 2;
    const r = (v / 10) * R;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[2, 4, 6, 8, 10].map((v) => (
          <Polygon
            key={v}
            points={WHEEL_AREAS.map((_, i) => pt(i, v).join(",")).join(" ")}
            fill="none"
            stroke="rgba(0,0,0,0.07)"
            strokeWidth="0.5"
          />
        ))}
        {WHEEL_AREAS.map((_, i) => {
          const [x, y] = pt(i, 10);
          return <Line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />;
        })}
        <Polygon
          points={WHEEL_AREAS.map((a, i) => pt(i, areaScores[a.key] ?? 5).join(",")).join(" ")}
          fill="rgba(255,140,66,0.13)"
          stroke="#FF8C42"
          strokeWidth="1.5"
        />
        {WHEEL_AREAS.map((a, i) => {
          const [x, y] = pt(i, areaScores[a.key] ?? 5);
          const ang = (2 * Math.PI * i) / N - Math.PI / 2;
          const lx = C + (R + 26) * Math.cos(ang);
          const ly = C + (R + 26) * Math.sin(ang);
          return (
            <G key={a.key}>
              <SvgText x={lx} y={ly} textAnchor="middle" alignmentBaseline="central" fontSize="8" fill="#888" fontFamily="System">
                {a.short}
              </SvgText>
              <Circle cx={x} cy={y} r="3" fill="#FF8C42" />
              <SvgText x={x} y={y - 8} textAnchor="middle" alignmentBaseline="central" fontSize="8" fontWeight="700" fill="#FF8C42" fontFamily="System">
                {String(areaScores[a.key] ?? 5)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

function CheckinResultsSection({ checkins }: { checkins: Array<{ score: number | null; week_start_date: string; value_scores: Record<string, number> | null; area_scores: Record<string, number> | null }> }) {
  const withAreas = checkins.filter(c => c.area_scores && Object.keys(c.area_scores).length > 0);
  if (withAreas.length === 0) return null;

  const latest = withAreas[withAreas.length - 1];
  const W = 80;
  const H = 28;
  const PAD = 2;
  const w = W - PAD * 2;
  const h = H - PAD * 2;

  return (
    <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)" }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
        Poslední check-in
      </Text>

      {latest.area_scores && <ReadOnlySpider areaScores={latest.area_scores} />}

      {withAreas.length >= 2 && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 8 }}>
            Vývoj oblastí ({withAreas.length} týdnů)
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {WHEEL_AREAS.map(area => {
              const scores = withAreas.map(c => c.area_scores?.[area.key] ?? 5);
              const xStep = w / Math.max(scores.length - 1, 1);
              const yScale = (val: number) => PAD + h - ((val - 1) / 9) * h;
              const pts = scores.map((val, i) => `${PAD + i * xStep},${yScale(val)}`).join(" ");
              const last = scores[scores.length - 1];
              const prev = scores[scores.length - 2];
              const delta = last - prev;

              return (
                <View key={area.key} style={{ flexDirection: "row", alignItems: "center", width: "47%", gap: 4 }}>
                  <Text style={{ width: 50, fontSize: 10, color: colors.muted }} numberOfLines={1}>
                    {area.short}
                  </Text>
                  <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                    <Polyline
                      points={pts}
                      fill="none"
                      stroke={colors.accent}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.7}
                    />
                    <Circle
                      cx={PAD + (scores.length - 1) * xStep}
                      cy={yScale(last)}
                      r={2.5}
                      fill={colors.accent}
                    />
                  </Svg>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.foreground }}>{last}</Text>
                    {delta !== 0 && (
                      <Text style={{ fontSize: 9, fontWeight: "600", color: delta > 0 ? "#22c55e" : "#f87171" }}>
                        {delta > 0 ? "+" : ""}{delta}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function ManualDashboard() {
  const [tab, setTab] = useState<Tab>("todo");
  // To-Do (daily)
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [niceTodos, setNiceTodos] = useState<TodoItem[]>([]);
  const [yesterdayTodos, setYesterdayTodos] = useState<TodoItem[]>([]);
  const [yesterdayNice, setYesterdayNice] = useState<TodoItem[]>([]);
  const [showYesterday, setShowYesterday] = useState(false);

  // Priorities (current + overdue)
  const [priorities, setPriorities] = useState<PrioritiesData>({ weekly: [], monthly: [], yearly: [] });
  const [overdue, setOverdue] = useState<PrioritiesData>({ weekly: [], monthly: [], yearly: [] });

  // Rituals
  const [ritualItems, setRitualItems] = useState<{ morning: RitualItem[]; daily: RitualItem[]; evening: RitualItem[] }>({
    morning: [], daily: [], evening: [],
  });
  const [ritualDays, setRitualDays] = useState<string[]>([]);
  const [ritualHistory, setRitualHistory] = useState<Record<string, Set<string>>>({});
  const [ritualDayIdx, setRitualDayIdx] = useState(-1);
  const [ritualSelectionRaw, setRitualSelectionRaw] = useState<{ morning?: string[]; daily?: string[]; evening?: string[] } | null>(null);

  // Checkin results (read-only)
  const [checkins, setCheckins] = useState<Array<{
    score: number | null;
    week_start_date: string;
    value_scores: Record<string, number> | null;
    area_scores: Record<string, number> | null;
  }>>([]);

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
      const [data, checkinData] = await Promise.all([
        getDashboardData(),
        getCheckins().catch(() => null),
      ]);
      if (checkinData) setCheckins(checkinData.checkins ?? []);

      // Todos (today + yesterday)
      setTodos(data.todos.today?.todos ?? []);
      setNiceTodos(data.todos.today?.niceTodos ?? []);
      setYesterdayTodos(data.todos.yesterday?.todos ?? []);
      setYesterdayNice(data.todos.yesterday?.niceTodos ?? []);

      // Priorities (current + detect overdue)
      const ctx = data.context || {};
      if (ctx.priorities && typeof ctx.priorities === "object") {
        const p = ctx.priorities as PrioritiesData & { _overdue?: PrioritiesData };
        setPriorities({
          weekly: Array.isArray(p.weekly) ? p.weekly : [],
          monthly: Array.isArray(p.monthly) ? p.monthly : [],
          yearly: Array.isArray(p.yearly) ? p.yearly : [],
        });
        // Overdue items from previous periods (if backend provides them)
        if (p._overdue) {
          setOverdue(p._overdue);
        }
      }

      // Rituals
      const completedToday = new Set<string>(data.ritualCompletions.today ?? []);
      const stats: Record<string, number> = data.ritualCompletions.stats ?? {};

      // Rituals can be stored in two formats:
      // Format A (from web localStorage sync): [{slot: "ráno", name: "Ledová sprcha"}, ...]
      // Format B (direct selection): {morning: ["cold-shower", ...], daily: [...], evening: [...]}
      const SLOT_MAP: Record<string, "morning" | "daily" | "evening"> = {
        "ráno": "morning", "morning": "morning",
        "přes den": "daily", "daily": "daily", "během dne": "daily",
        "večer": "evening", "evening": "evening",
      };

      if (ctx.rituals) {
        const grouped: { morning: RitualItem[]; daily: RitualItem[]; evening: RitualItem[] } = {
          morning: [], daily: [], evening: [],
        };

        const parseName = (id: string) => {
          if (id.startsWith("custom::")) return id.split("::")[1] ?? id;
          return id.replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase());
        };

        if (Array.isArray(ctx.rituals)) {
          // Format A: [{slot, name, ritualId?}, ...]
          for (const r of ctx.rituals as { slot: string; name: string; ritualId?: string }[]) {
            const slotKey = SLOT_MAP[r.slot] || SLOT_MAP[r.slot?.toLowerCase()];
            if (slotKey && grouped[slotKey]) {
              const id = r.ritualId || r.name;
              const displayName = id.startsWith("custom::") ? parseName(id) : r.name;
              grouped[slotKey].push({
                id, name: displayName,
                done: completedToday.has(id),
                streak: stats[id] ?? 0,
              });
            }
          }
        } else if (typeof ctx.rituals === "object") {
          // Format B: {morning: ["id1", ...], daily: [...], evening: [...]}
          const sel = ctx.rituals as { morning?: string[]; daily?: string[]; evening?: string[] };
          for (const slot of ["morning", "daily", "evening"] as const) {
            for (const id of sel[slot] ?? []) {
              grouped[slot].push({
                id, name: parseName(id),
                done: completedToday.has(id),
                streak: stats[id] ?? 0,
              });
            }
          }
        }

        setRitualItems(grouped);
        setRitualSelectionRaw(typeof ctx.rituals === "object" && !Array.isArray(ctx.rituals) ? ctx.rituals as any : null);

        // Sync widget with latest data
        syncWidgetData(
          data.todos.today?.todos ?? [],
          data.todos.today?.niceTodos ?? [],
          grouped
        );
      }

      // Load full ritual history with days
      try {
        const full = await getRitualCompletionsFull();
        const loadedDays = full.days ?? [];
        setRitualDays(loadedDays);
        const h: Record<string, Set<string>> = {};
        for (const [rid, dates] of Object.entries(full.history ?? {})) {
          h[rid] = new Set(dates as string[]);
        }
        setRitualHistory(h);
        if (loadedDays.length > 0) {
          setRitualDayIdx(prev => prev === -1 ? loadedDays.length - 1 : prev);
        }
      } catch {}
    } catch (err) {
      console.error("Dashboard load error:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 3 minutes to sync with web
  useEffect(() => {
    const interval = setInterval(() => { load(); }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // ── Todo actions ──

  const saveTodos = async (t: TodoItem[], n: TodoItem[]) => {
    setTodos(t); setNiceTodos(n);
    syncWidgetData(t, n, ritualItems);
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

  const editPriority = (scope: keyof PrioritiesData, idx: number, newText: string) => {
    const u = { ...priorities, [scope]: priorities[scope].map((p, i) => i === idx ? { ...p, text: newText } : p) };
    savePriorities(u);
  };

  // ── Ritual actions ──

  const selectedRitualDate = ritualDays[ritualDayIdx] ?? "";
  const todayRitualDate = ritualDays.length > 0 ? ritualDays[ritualDays.length - 1] : "";
  const isRitualToday = selectedRitualDate === todayRitualDate;

  const isRitualDoneOnDay = (ritualId: string) => {
    if (!selectedRitualDate) return false;
    return ritualHistory[ritualId]?.has(selectedRitualDate) ?? false;
  };

  const handleToggleRitual = async (slot: "morning" | "daily" | "evening", idx: number) => {
    const item = ritualItems[slot][idx];
    const isDone = isRitualDoneOnDay(item.id);
    const newDone = !isDone;

    // Optimistic history update
    setRitualHistory(prev => {
      const newSet = new Set(prev[item.id] ?? []);
      if (isDone) newSet.delete(selectedRitualDate); else newSet.add(selectedRitualDate);
      return { ...prev, [item.id]: newSet };
    });

    // Also update ritualItems.done if viewing today
    if (isRitualToday) {
      const updatedRituals = {
        ...ritualItems,
        [slot]: ritualItems[slot].map((r, i) => i === idx ? { ...r, done: newDone } : r),
      };
      setRitualItems(updatedRituals);
      syncWidgetData(todos, niceTodos, updatedRituals);
    }

    try { await toggleRitualCompletion(item.id, newDone, selectedRitualDate); } catch {}
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

  // ── Next ritual helper ──

  const getNextRitual = (): { item: RitualItem; slot: "morning" | "daily" | "evening" } | null => {
    for (const slot of ["morning", "daily", "evening"] as const) {
      for (const item of ritualItems[slot]) {
        if (!item.done) return { item, slot };
      }
    }
    return null;
  };

  const SLOT_EMOJI: Record<string, string> = { morning: "🌅", daily: "☀️", evening: "🌙" };

  // ── Render tabs ──

  const renderTodo = () => (
    <View>
      {/* To Do — max 3 */}
      <Text style={s.sectionLabel}>TO DO ({todos.length}/{MAX_TODO})</Text>
      {todos.map((item, i) => (
        <CheckItem
          key={`t${i}`}
          item={item}
          accentColor={colors.accent}
          onToggle={() => saveTodos(todos.map((t, j) => j === i ? { ...t, done: !t.done } : t), niceTodos)}
          onRemove={() => saveTodos(todos.filter((_, j) => j !== i), niceTodos)}
          onEdit={(newText) => saveTodos(todos.map((t, j) => j === i ? { ...t, text: newText } : t), niceTodos)}
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
          onEdit={(newText) => saveTodos(todos, niceTodos.map((t, j) => j === i ? { ...t, text: newText } : t))}
        />
      ))}
      <AddInline
        placeholder="Nice to do..."
        maxReached={niceTodos.length >= MAX_TODO}
        onAdd={(text) => saveTodos(todos, [...niceTodos, { text, done: false }])}
      />

      {/* Yesterday */}
      {(yesterdayTodos.length > 0 || yesterdayNice.length > 0) && (
        <View style={s.yesterdaySection}>
          <TouchableOpacity
            style={s.yesterdayToggle}
            onPress={() => setShowYesterday(!showYesterday)}
          >
            {showYesterday
              ? <ChevronUp size={14} color={colors.muted} />
              : <ChevronDown size={14} color={colors.muted} />}
            <Text style={s.yesterdayLabel}>Včera</Text>
          </TouchableOpacity>
          {showYesterday && (
            <View style={s.yesterdayContent}>
              {yesterdayTodos.map((t, i) => (
                <Text key={`yt${i}`} style={[s.yesterdayItem, t.done && s.yesterdayDone]}>
                  {t.done ? "✓" : "○"} {t.text}
                </Text>
              ))}
              {yesterdayNice.map((t, i) => (
                <Text key={`yn${i}`} style={[s.yesterdayItem, t.done && s.yesterdayDone]}>
                  {t.done ? "✓" : "○"} {t.text}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderPriorities = () => {
    const scopeLabels = { weekly: "Tento týden", monthly: "Tento měsíc", yearly: "Tento rok" };
    const scopePlaceholders = { weekly: "Nová týdenní priorita...", monthly: "Nová měsíční priorita...", yearly: "Nová roční priorita..." };

    return (
      <View>
        {(["weekly", "monthly", "yearly"] as const).map(scope => {
          const items = priorities[scope];
          const overdueItems = items.filter(p => p.overdue && !p.done);
          const currentItems = items.filter(p => !p.overdue);

          return (
            <View key={scope} style={{ marginBottom: 24 }}>
              <Text style={s.sectionTitle}>{scopeLabels[scope]}</Text>

              {/* Overdue items */}
              {overdueItems.length > 0 && (
                <View style={s.overdueBox}>
                  <View style={s.overdueHeader}>
                    <AlertTriangle size={14} color="#dc2626" />
                    <Text style={s.overdueLabel}>Zpožděné</Text>
                  </View>
                  {overdueItems.map((item, i) => {
                    const realIdx = items.indexOf(item);
                    return (
                      <View key={`o${i}`} style={s.checkRow}>
                        <TouchableOpacity
                          style={[s.checkbox, { borderColor: "#dc2626" }]}
                          onPress={() => togglePriority(scope, realIdx)}
                        >
                          {item.done && <Check size={12} color="#fff" />}
                        </TouchableOpacity>
                        <Text style={[s.checkText, { color: "#dc2626" }]}>{item.text}</Text>
                        <TouchableOpacity onPress={() => removePriority(scope, realIdx)} hitSlop={8} style={{ padding: 4 }}>
                          <Trash2 size={14} color={colors.muted} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Current items */}
              {currentItems.length === 0 && overdueItems.length === 0 && (
                <Text style={s.emptyText}>Žádné priority</Text>
              )}
              {currentItems.map((item, i) => {
                const realIdx = items.indexOf(item);
                return (
                  <CheckItem
                    key={i}
                    item={item}
                    onToggle={() => togglePriority(scope, realIdx)}
                    onRemove={() => removePriority(scope, realIdx)}
                    onEdit={(newText) => editPriority(scope, realIdx, newText)}
                  />
                );
              })}
              <AddInline
                placeholder={scopePlaceholders[scope]}
                onAdd={(text) => addPriority(scope, text)}
              />
            </View>
          );
        })}
      </View>
    );
  };

  const formatRitualDayLabel = (dateStr: string) => {
    if (dateStr === todayRitualDate) return "Dnes";
    const d = new Date(dateStr + "T12:00:00");
    const today = new Date(todayRitualDate + "T12:00:00");
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (diff === 1) return "Včera";
    const dayNames = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
    return `${dayNames[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
  };

  const renderRituals = () => {
    const slots = [
      { key: "morning" as const, label: "Ráno 🌅", items: ritualItems.morning },
      { key: "daily" as const, label: "Během dne ☀️", items: ritualItems.daily },
      { key: "evening" as const, label: "Večer 🌙", items: ritualItems.evening },
    ];
    const total = slots.reduce((a, s) => a + s.items.length, 0);
    const doneCount = slots.reduce((a, s) => a + s.items.filter(i => isRitualDoneOnDay(i.id)).length, 0);
    const canLeft = ritualDayIdx > 0;
    const canRight = ritualDayIdx < ritualDays.length - 1;

    return (
      <View>
        {/* Day navigator */}
        {ritualDays.length > 1 && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 12, gap: 12 }}>
            <TouchableOpacity
              onPress={() => canLeft && setRitualDayIdx(i => i - 1)}
              disabled={!canLeft}
              style={{ padding: 6, opacity: canLeft ? 1 : 0.2 }}
            >
              <ChevronLeft size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: "700", color: isRitualToday ? colors.accent : colors.foreground, minWidth: 100, textAlign: "center" }}>
              {selectedRitualDate ? formatRitualDayLabel(selectedRitualDate) : ""}
            </Text>
            <TouchableOpacity
              onPress={() => canRight && setRitualDayIdx(i => i + 1)}
              disabled={!canRight}
              style={{ padding: 6, opacity: canRight ? 1 : 0.2 }}
            >
              <ChevronRight size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        )}

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
            {slot.items.map((item, i) => {
              const done = isRitualDoneOnDay(item.id);
              return (
                <View key={i} style={s.checkRow}>
                  <TouchableOpacity
                    style={[s.checkbox, done && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    onPress={() => handleToggleRitual(slot.key, i)}
                  >
                    {done && <Check size={12} color="#fff" />}
                  </TouchableOpacity>
                  <Text style={[s.checkText, done && s.checkTextDone, { flex: 1 }]}>{item.name}</Text>
                  {item.streak > 0 && <Text style={s.streakText}>{item.streak}×</Text>}
                </View>
              );
            })}
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
              {/* Next ritual card — only in To-Do tab */}
              {tab === "todo" && (() => {
                const next = getNextRitual();
                if (!next) return null;
                return (
                  <TouchableOpacity
                    style={s.nextRitualCard}
                    onPress={() => {
                      const slotIdx = ritualItems[next.slot].findIndex(r => r.id === next.item.id);
                      if (slotIdx >= 0) handleToggleRitual(next.slot, slotIdx);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={s.nextRitualCheck}>
                      <Check size={14} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.nextRitualLabel}>Následující rituál {SLOT_EMOJI[next.slot]}</Text>
                      <Text style={s.nextRitualName}>{next.item.name}</Text>
                    </View>
                    {next.item.streak > 0 && (
                      <Text style={s.nextRitualStreak}>{next.item.streak}×</Text>
                    )}
                  </TouchableOpacity>
                );
              })()}
              {tab === "todo" && renderTodo()}
              {tab === "priorities" && renderPriorities()}
              {tab === "rituals" && renderRituals()}

              {/* Read-only checkin results */}
              <CheckinResultsSection checkins={checkins} />
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

  // Next ritual
  nextRitualCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(255,140,66,0.2)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  nextRitualCheck: {
    width: 32, height: 32, borderRadius: 10, borderWidth: 2, borderColor: colors.accent,
    justifyContent: "center", alignItems: "center",
  },
  nextRitualLabel: { fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  nextRitualName: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 2 },
  nextRitualStreak: { fontSize: 13, fontWeight: "600", color: colors.muted },

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

  // Yesterday
  yesterdaySection: { marginTop: 24, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12 },
  yesterdayToggle: { flexDirection: "row", alignItems: "center", gap: 6 },
  yesterdayLabel: { fontSize: 13, color: colors.muted },
  yesterdayContent: { marginTop: 8, opacity: 0.6 },
  yesterdayItem: { fontSize: 13, color: colors.muted, lineHeight: 20, paddingVertical: 2 },
  yesterdayDone: { textDecorationLine: "line-through", color: "rgba(0,0,0,0.25)" },

  // Overdue
  overdueBox: {
    backgroundColor: "rgba(220,38,38,0.05)", borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(220,38,38,0.15)", padding: 12, marginBottom: 12,
  },
  overdueHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  overdueLabel: { fontSize: 12, fontWeight: "700", color: "#dc2626", textTransform: "uppercase", letterSpacing: 0.5 },
});
