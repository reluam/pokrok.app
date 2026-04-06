import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

interface TodoItem {
  text: string;
  done: boolean;
}

interface RitualItem {
  id: string;
  name: string;
  done: boolean;
}

interface RitualGroups {
  morning: RitualItem[];
  daily: RitualItem[];
  evening: RitualItem[];
}

export interface WidgetProps {
  todos: TodoItem[];
  niceTodos: TodoItem[];
  rituals: RitualGroups;
  nextRitual: { name: string; slot: string } | null;
}

const ACCENT = "#FF8C42";
const BG = "#FFFFFF";
const FG = "#1a1a1a";
const MUTED = "#999999";
const DONE_COLOR = "#1D9E75";
const DIVIDER = "#f0f0f0";
const CHECKBOX_BG = "#f5f5f5";
const CHECKBOX_DONE = "#e8f5e9";

const SLOT_LABEL: Record<string, string> = {
  morning: "Ráno",
  daily: "Přes den",
  evening: "Večer",
};
const SLOT_ICON: Record<string, string> = {
  morning: "☀️",
  daily: "⚡",
  evening: "🌙",
};

// ── Shared components ─────────────────────────────────────────────────────────

function Checkbox({ done, clickAction, clickActionData }: { done: boolean; clickAction?: string; clickActionData?: Record<string, unknown> }) {
  return (
    <FlexWidget
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: done ? CHECKBOX_DONE : CHECKBOX_BG,
        borderWidth: done ? 0 : 1,
        borderColor: "#ddd",
        justifyContent: "center",
        alignItems: "center",
      }}
      clickAction={clickAction}
      clickActionData={clickActionData}
    >
      <TextWidget
        text={done ? "✓" : ""}
        style={{ fontSize: 14, fontWeight: "bold", color: DONE_COLOR }}
      />
    </FlexWidget>
  );
}

function TodoRow({ item, index }: { item: TodoItem; index: number }) {
  return (
    <FlexWidget
      style={{
        flexDirection: "row",
        alignItems: "center",
        flexGap: 12,
        paddingVertical: 6,
      }}
      clickAction="TOGGLE_TODO"
      clickActionData={{ index }}
    >
      <Checkbox done={item.done} />
      <TextWidget
        text={item.text}
        style={{
          fontSize: 15,
          fontWeight: item.done ? "normal" : "500",
          color: item.done ? MUTED : FG,
        }}
        maxLines={1}
        truncate="END"
      />
    </FlexWidget>
  );
}

function RitualRow({ item, slot }: { item: RitualItem; slot: string }) {
  return (
    <FlexWidget
      style={{
        flexDirection: "row",
        alignItems: "center",
        flexGap: 12,
        paddingVertical: 6,
      }}
      clickAction="TOGGLE_RITUAL"
      clickActionData={{ ritualId: item.id, slot }}
    >
      <Checkbox done={item.done} />
      <TextWidget
        text={item.name}
        style={{
          fontSize: 15,
          fontWeight: item.done ? "normal" : "500",
          color: item.done ? MUTED : FG,
        }}
        maxLines={1}
        truncate="END"
      />
    </FlexWidget>
  );
}

function SectionHeader({ title, icon }: { title: string; icon?: string }) {
  return (
    <FlexWidget
      style={{
        flexDirection: "row",
        alignItems: "center",
        flexGap: 6,
        marginBottom: 4,
        marginTop: 4,
      }}
    >
      {icon && (
        <TextWidget text={icon} style={{ fontSize: 12 }} />
      )}
      <TextWidget
        text={title}
        style={{
          fontSize: 12,
          fontWeight: "bold",
          color: ACCENT,
          letterSpacing: 1,
        }}
      />
    </FlexWidget>
  );
}

function Divider() {
  return (
    <FlexWidget
      style={{
        height: 1,
        backgroundColor: DIVIDER,
        marginVertical: 6,
        width: "match_parent",
      }}
    />
  );
}

// ── Small (2x2) ───────────────────────────────────────────────────────────────

export function ZijuSmallWidget({ todos, nextRitual }: WidgetProps) {
  const firstTodo = todos.find((t) => !t.done);
  return (
    <FlexWidget
      style={{
        flexDirection: "column",
        backgroundColor: BG,
        borderRadius: 20,
        padding: 16,
        height: "match_parent",
        width: "match_parent",
        justifyContent: "space-between",
      }}
      clickAction="OPEN_APP"
    >
      <TextWidget
        text="Žiju Life"
        style={{ fontSize: 16, fontWeight: "bold", color: ACCENT }}
      />
      {nextRitual ? (
        <FlexWidget style={{ flexDirection: "column", flexGap: 4 }}>
          <TextWidget
            text={`${SLOT_ICON[nextRitual.slot] ?? ""} Další rituál`}
            style={{ fontSize: 11, fontWeight: "bold", color: MUTED }}
          />
          <TextWidget
            text={nextRitual.name}
            style={{ fontSize: 18, fontWeight: "bold", color: FG }}
            maxLines={2}
            truncate="END"
          />
        </FlexWidget>
      ) : (
        <TextWidget
          text="✅ Vše hotovo!"
          style={{ fontSize: 16, fontWeight: "bold", color: DONE_COLOR }}
        />
      )}
      {firstTodo ? (
        <FlexWidget style={{ flexDirection: "column", flexGap: 2 }}>
          <TextWidget
            text="📋 To-Do"
            style={{ fontSize: 11, fontWeight: "bold", color: MUTED }}
          />
          <TextWidget
            text={firstTodo.text}
            style={{ fontSize: 14, color: FG }}
            maxLines={1}
            truncate="END"
          />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ height: 0 }} />
      )}
    </FlexWidget>
  );
}

// ── Medium (4x2) ──────────────────────────────────────────────────────────────

export function ZijuMediumWidget({ todos, nextRitual }: WidgetProps) {
  return (
    <FlexWidget
      style={{
        flexDirection: "row",
        backgroundColor: BG,
        borderRadius: 20,
        padding: 16,
        flexGap: 16,
        height: "match_parent",
        width: "match_parent",
      }}
    >
      {/* Left: next ritual */}
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
        }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text="Žiju Life"
          style={{ fontSize: 16, fontWeight: "bold", color: ACCENT }}
        />
        {nextRitual ? (
          <FlexWidget style={{ flexDirection: "column", flexGap: 4 }}>
            <TextWidget
              text={`${SLOT_ICON[nextRitual.slot] ?? ""} Další rituál`}
              style={{ fontSize: 11, fontWeight: "bold", color: MUTED }}
            />
            <TextWidget
              text={nextRitual.name}
              style={{ fontSize: 18, fontWeight: "bold", color: FG }}
              maxLines={2}
              truncate="END"
            />
          </FlexWidget>
        ) : (
          <TextWidget
            text="✅ Rituály hotové!"
            style={{ fontSize: 15, fontWeight: "bold", color: DONE_COLOR }}
          />
        )}
        <FlexWidget style={{ height: 0 }} />
      </FlexWidget>

      {/* Divider */}
      <FlexWidget
        style={{
          width: 1,
          backgroundColor: DIVIDER,
          height: "match_parent",
        }}
      />

      {/* Right: todos */}
      <FlexWidget style={{ flex: 1, flexDirection: "column", flexGap: 2 }}>
        <SectionHeader title="TO-DO" icon="📋" />
        {todos.length > 0 ? (
          todos.slice(0, 3).map((t, i) => (
            <TodoRow key={`t${i}`} item={t} index={i} />
          ))
        ) : (
          <TextWidget
            text="Žádné úkoly"
            style={{ fontSize: 14, color: MUTED, marginTop: 8 }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

// ── Large (4x4) ───────────────────────────────────────────────────────────────

export function ZijuLargeWidget({ todos, niceTodos, rituals }: WidgetProps) {
  const allSlots = (["morning", "daily", "evening"] as const).filter(
    (s) => rituals[s].some((r) => !r.done)
  );
  return (
    <FlexWidget
      style={{
        flexDirection: "column",
        backgroundColor: BG,
        borderRadius: 20,
        padding: 16,
        flexGap: 2,
        height: "match_parent",
        width: "match_parent",
      }}
    >
      <TextWidget
        text="Žiju Life"
        style={{ fontSize: 18, fontWeight: "bold", color: ACCENT, marginBottom: 4 }}
      />

      {/* To-Do */}
      {todos.length > 0 && (
        <FlexWidget style={{ flexDirection: "column" }}>
          <SectionHeader title="TO-DO" icon="📋" />
          {todos.map((t, i) => (
            <TodoRow key={`t${i}`} item={t} index={i} />
          ))}
        </FlexWidget>
      )}

      {/* Nice To-Do */}
      {niceTodos.length > 0 && (
        <FlexWidget style={{ flexDirection: "column" }}>
          <Divider />
          <SectionHeader title="NICE TO-DO" icon="✨" />
          {niceTodos.map((t, i) => (
            <TodoRow key={`n${i}`} item={t} index={todos.length + i} />
          ))}
        </FlexWidget>
      )}

      {/* Rituals by slot */}
      {allSlots.map((slot) => (
        <FlexWidget key={slot} style={{ flexDirection: "column" }}>
          <Divider />
          <SectionHeader
            title={(SLOT_LABEL[slot] ?? slot).toUpperCase()}
            icon={SLOT_ICON[slot]}
          />
          {rituals[slot].filter((r) => !r.done).map((r) => (
            <RitualRow key={r.id} item={r} slot={slot} />
          ))}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
