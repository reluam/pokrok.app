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
const DONE = "#1D9E75";
const DIVIDER = "#f0f0f0";
const CHECK_BG = "#f5f5f5";

const SLOT_LABEL: Record<string, string> = {
  morning: "RÁNO",
  daily: "PŘES DEN",
  evening: "VEČER",
};

type PendingRitual = { name: string; slot: string; id: string };

function getPendingRituals(rituals: RitualGroups): PendingRitual[] {
  const result: PendingRitual[] = [];
  for (const slot of ["morning", "daily", "evening"] as const) {
    for (const r of rituals[slot]) {
      if (!r.done) result.push({ name: r.name, slot, id: r.id });
    }
  }
  return result;
}

function Checkbox({ clickAction, clickActionData }: { clickAction: string; clickActionData: Record<string, unknown> }) {
  return (
    <FlexWidget
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: CHECK_BG,
        borderWidth: 1,
        borderColor: "#ddd",
        justifyContent: "center",
        alignItems: "center",
      }}
      clickAction={clickAction}
      clickActionData={clickActionData}
    >
      <TextWidget text="" style={{ fontSize: 1, color: "#fff" }} />
    </FlexWidget>
  );
}

// ── Small Ritual (2x2) — next ritual + checkbox ──────────────────────────────

export function ZijuSmallRitualWidget({ rituals }: WidgetProps) {
  const pending = getPendingRituals(rituals);
  const next = pending[0];

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
    >
      <TextWidget text="Rituály" style={{ fontSize: 14, fontWeight: "bold", color: ACCENT }} />
      {next ? (
        <FlexWidget
          style={{ flexDirection: "row", alignItems: "center", flexGap: 12 }}
          clickAction="TOGGLE_RITUAL"
          clickActionData={{ ritualId: next.id, slot: next.slot }}
        >
          <Checkbox clickAction="TOGGLE_RITUAL" clickActionData={{ ritualId: next.id, slot: next.slot }} />
          <FlexWidget style={{ flex: 1, flexDirection: "column", flexGap: 2 }}>
            <TextWidget text={next.name} style={{ fontSize: 17, fontWeight: "bold", color: FG }} maxLines={2} truncate="END" />
            {pending.length > 1 && (
              <TextWidget text={`+${pending.length - 1} dalších`} style={{ fontSize: 12, color: MUTED }} />
            )}
          </FlexWidget>
        </FlexWidget>
      ) : (
        <TextWidget text="Vše hotovo!" style={{ fontSize: 16, fontWeight: "bold", color: DONE }} />
      )}
      <FlexWidget style={{ height: 0 }} />
    </FlexWidget>
  );
}

// ── Small Todo (2x2) — next todo + checkbox ──────────────────────────────────

export function ZijuSmallTodoWidget({ todos, niceTodos }: WidgetProps) {
  const pendingTodos = todos.filter((t) => !t.done);
  const pendingNice = niceTodos.filter((t) => !t.done);
  const firstTodo = pendingTodos[0] ?? pendingNice[0] ?? null;
  const firstIndex = firstTodo ? (pendingTodos[0] ? todos.indexOf(pendingTodos[0]) : todos.length + niceTodos.indexOf(pendingNice[0])) : 0;
  const totalPending = pendingTodos.length + pendingNice.length;

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
    >
      <TextWidget text="To-Do" style={{ fontSize: 14, fontWeight: "bold", color: ACCENT }} />
      {firstTodo ? (
        <FlexWidget
          style={{ flexDirection: "row", alignItems: "center", flexGap: 12 }}
          clickAction="TOGGLE_TODO"
          clickActionData={{ index: firstIndex }}
        >
          <Checkbox clickAction="TOGGLE_TODO" clickActionData={{ index: firstIndex }} />
          <FlexWidget style={{ flex: 1, flexDirection: "column", flexGap: 2 }}>
            <TextWidget text={firstTodo.text} style={{ fontSize: 17, fontWeight: "bold", color: FG }} maxLines={2} truncate="END" />
            {totalPending > 1 && (
              <TextWidget text={`+${totalPending - 1} dalších`} style={{ fontSize: 12, color: MUTED }} />
            )}
          </FlexWidget>
        </FlexWidget>
      ) : (
        <TextWidget text="Vše splněno!" style={{ fontSize: 16, fontWeight: "bold", color: DONE }} />
      )}
      <FlexWidget style={{ height: 0 }} />
    </FlexWidget>
  );
}

// ── Medium (4x2) — left: next ritual, right: next todo ──────────────────────

export function ZijuMediumWidget({ todos, niceTodos, rituals }: WidgetProps) {
  const pending = getPendingRituals(rituals);
  const next = pending[0];
  const pendingTodos = todos.filter((t) => !t.done);
  const pendingNice = niceTodos.filter((t) => !t.done);
  const firstTodo = pendingTodos[0] ?? pendingNice[0] ?? null;
  const firstTodoIndex = firstTodo ? (pendingTodos[0] ? todos.indexOf(pendingTodos[0]) : todos.length + niceTodos.indexOf(pendingNice[0])) : 0;

  return (
    <FlexWidget
      style={{
        flexDirection: "row",
        backgroundColor: BG,
        borderRadius: 20,
        padding: 16,
        flexGap: 12,
        height: "match_parent",
        width: "match_parent",
      }}
    >
      {/* Left: next ritual + checkbox */}
      <FlexWidget style={{ flex: 1, flexDirection: "column", justifyContent: "space-between" }}>
        <TextWidget text="Rituály" style={{ fontSize: 13, fontWeight: "bold", color: ACCENT }} />
        {next ? (
          <FlexWidget
            style={{ flexDirection: "row", alignItems: "center", flexGap: 10 }}
            clickAction="TOGGLE_RITUAL"
            clickActionData={{ ritualId: next.id, slot: next.slot }}
          >
            <Checkbox clickAction="TOGGLE_RITUAL" clickActionData={{ ritualId: next.id, slot: next.slot }} />
            <FlexWidget style={{ flex: 1, flexDirection: "column", flexGap: 2 }}>
              <TextWidget text={next.name} style={{ fontSize: 16, fontWeight: "bold", color: FG }} maxLines={2} truncate="END" />
              {pending.length > 1 && (
                <TextWidget text={`+${pending.length - 1} dalších`} style={{ fontSize: 11, color: MUTED }} />
              )}
            </FlexWidget>
          </FlexWidget>
        ) : (
          <TextWidget text="Hotovo" style={{ fontSize: 15, fontWeight: "bold", color: DONE }} />
        )}
        <FlexWidget style={{ height: 0 }} />
      </FlexWidget>

      <FlexWidget style={{ width: 1, backgroundColor: DIVIDER, height: "match_parent" }} />

      {/* Right: next todo + checkbox */}
      <FlexWidget style={{ flex: 1, flexDirection: "column", justifyContent: "space-between" }}>
        <TextWidget text="To-Do" style={{ fontSize: 13, fontWeight: "bold", color: ACCENT }} />
        {firstTodo ? (
          <FlexWidget
            style={{ flexDirection: "row", alignItems: "center", flexGap: 10 }}
            clickAction="TOGGLE_TODO"
            clickActionData={{ index: firstTodoIndex }}
          >
            <Checkbox clickAction="TOGGLE_TODO" clickActionData={{ index: firstTodoIndex }} />
            <FlexWidget style={{ flex: 1, flexDirection: "column", flexGap: 2 }}>
              <TextWidget text={firstTodo.text} style={{ fontSize: 16, fontWeight: "bold", color: FG }} maxLines={2} truncate="END" />
              {pendingTodos.length + pendingNice.length > 1 && (
                <TextWidget text={`+${pendingTodos.length + pendingNice.length - 1} dalších`} style={{ fontSize: 11, color: MUTED }} />
              )}
            </FlexWidget>
          </FlexWidget>
        ) : (
          <TextWidget text="Splněno" style={{ fontSize: 15, fontWeight: "bold", color: DONE }} />
        )}
        <FlexWidget style={{ height: 0 }} />
      </FlexWidget>
    </FlexWidget>
  );
}

// ── Large (4x4) — left: rituals by slot, right: todos ────────────────────────

export function ZijuLargeWidget({ todos, niceTodos, rituals }: WidgetProps) {
  const pendingTodos = todos.filter((t) => !t.done);
  const pendingNice = niceTodos.filter((t) => !t.done);

  const morningPending = rituals.morning.filter((r) => !r.done);
  const dailyPending = rituals.daily.filter((r) => !r.done);
  const eveningPending = rituals.evening.filter((r) => !r.done);
  const hasRituals = morningPending.length + dailyPending.length + eveningPending.length > 0;

  return (
    <FlexWidget
      style={{
        flexDirection: "row",
        backgroundColor: BG,
        borderRadius: 20,
        padding: 16,
        flexGap: 12,
        height: "match_parent",
        width: "match_parent",
      }}
    >
      {/* Left: rituals grouped by slot */}
      <FlexWidget style={{ flex: 1, flexDirection: "column", flexGap: 6 }}>
        <TextWidget text="Rituály" style={{ fontSize: 15, fontWeight: "bold", color: ACCENT, marginBottom: 2 }} />
        {hasRituals ? (
          <FlexWidget style={{ flexDirection: "column", flexGap: 8 }}>
            {morningPending.length > 0 && (
              <FlexWidget style={{ flexDirection: "column", flexGap: 3 }}>
                <TextWidget text="RÁNO" style={{ fontSize: 11, fontWeight: "bold", color: MUTED }} />
                {morningPending.map((r) => (
                  <FlexWidget
                    key={r.id}
                    style={{ flexDirection: "row", alignItems: "center", flexGap: 10, paddingVertical: 3 }}
                    clickAction="TOGGLE_RITUAL"
                    clickActionData={{ ritualId: r.id, slot: "morning" }}
                  >
                    <Checkbox clickAction="TOGGLE_RITUAL" clickActionData={{ ritualId: r.id, slot: "morning" }} />
                    <TextWidget text={r.name} style={{ fontSize: 14, fontWeight: "500", color: FG }} maxLines={1} truncate="END" />
                  </FlexWidget>
                ))}
              </FlexWidget>
            )}
            {dailyPending.length > 0 && (
              <FlexWidget style={{ flexDirection: "column", flexGap: 3 }}>
                <TextWidget text="PŘES DEN" style={{ fontSize: 11, fontWeight: "bold", color: MUTED }} />
                {dailyPending.map((r) => (
                  <FlexWidget
                    key={r.id}
                    style={{ flexDirection: "row", alignItems: "center", flexGap: 10, paddingVertical: 3 }}
                    clickAction="TOGGLE_RITUAL"
                    clickActionData={{ ritualId: r.id, slot: "daily" }}
                  >
                    <Checkbox clickAction="TOGGLE_RITUAL" clickActionData={{ ritualId: r.id, slot: "daily" }} />
                    <TextWidget text={r.name} style={{ fontSize: 14, fontWeight: "500", color: FG }} maxLines={1} truncate="END" />
                  </FlexWidget>
                ))}
              </FlexWidget>
            )}
            {eveningPending.length > 0 && (
              <FlexWidget style={{ flexDirection: "column", flexGap: 3 }}>
                <TextWidget text="VEČER" style={{ fontSize: 11, fontWeight: "bold", color: MUTED }} />
                {eveningPending.map((r) => (
                  <FlexWidget
                    key={r.id}
                    style={{ flexDirection: "row", alignItems: "center", flexGap: 10, paddingVertical: 3 }}
                    clickAction="TOGGLE_RITUAL"
                    clickActionData={{ ritualId: r.id, slot: "evening" }}
                  >
                    <Checkbox clickAction="TOGGLE_RITUAL" clickActionData={{ ritualId: r.id, slot: "evening" }} />
                    <TextWidget text={r.name} style={{ fontSize: 14, fontWeight: "500", color: FG }} maxLines={1} truncate="END" />
                  </FlexWidget>
                ))}
              </FlexWidget>
            )}
          </FlexWidget>
        ) : (
          <TextWidget text="Vše hotovo!" style={{ fontSize: 15, fontWeight: "bold", color: DONE, marginTop: 8 }} />
        )}
      </FlexWidget>

      <FlexWidget style={{ width: 1, backgroundColor: DIVIDER, height: "match_parent" }} />

      {/* Right: todos */}
      <FlexWidget style={{ flex: 1, flexDirection: "column", flexGap: 4 }}>
        <TextWidget text="To-Do" style={{ fontSize: 15, fontWeight: "bold", color: ACCENT, marginBottom: 2 }} />
        {pendingTodos.map((t, i) => (
          <FlexWidget
            key={`t${i}`}
            style={{ flexDirection: "row", alignItems: "center", flexGap: 10, paddingVertical: 3 }}
            clickAction="TOGGLE_TODO"
            clickActionData={{ index: i }}
          >
            <Checkbox clickAction="TOGGLE_TODO" clickActionData={{ index: i }} />
            <TextWidget text={t.text} style={{ fontSize: 14, fontWeight: "500", color: FG }} maxLines={1} truncate="END" />
          </FlexWidget>
        ))}
        {pendingNice.length > 0 && (
          <FlexWidget style={{ flexDirection: "column", flexGap: 3, marginTop: pendingTodos.length > 0 ? 6 : 0 }}>
            <TextWidget text="NICE TO-DO" style={{ fontSize: 11, fontWeight: "bold", color: MUTED }} />
            {pendingNice.map((t, i) => (
              <FlexWidget
                key={`n${i}`}
                style={{ flexDirection: "row", alignItems: "center", flexGap: 10, paddingVertical: 3 }}
                clickAction="TOGGLE_TODO"
                clickActionData={{ index: todos.length + i }}
              >
                <Checkbox clickAction="TOGGLE_TODO" clickActionData={{ index: todos.length + i }} />
                <TextWidget text={t.text} style={{ fontSize: 14, fontWeight: "500", color: FG }} maxLines={1} truncate="END" />
              </FlexWidget>
            ))}
          </FlexWidget>
        )}
        {pendingTodos.length === 0 && pendingNice.length === 0 && (
          <TextWidget text="Vše splněno!" style={{ fontSize: 15, fontWeight: "bold", color: DONE, marginTop: 8 }} />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}
