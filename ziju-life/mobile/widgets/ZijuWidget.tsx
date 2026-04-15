import { createWidget, type WidgetEnvironment } from "expo-widgets";
import { VStack, HStack, Text, Spacer } from "@expo/ui/swift-ui";
import {
  font,
  foregroundColor,
  padding,
  frame,
} from "@expo/ui/swift-ui/modifiers";

interface TodoItem {
  text: string;
  done: boolean;
}

interface RitualItem {
  id: string;
  name: string;
  done: boolean;
}

interface ZijuWidgetProps {
  todos: TodoItem[];
  niceTodos: TodoItem[];
  rituals: { morning: RitualItem[]; daily: RitualItem[]; evening: RitualItem[] };
  nextRitual: { name: string; slot: string } | null;
}

function ZijuWidgetLayout(props: ZijuWidgetProps, env: WidgetEnvironment) {
  "widget";

  var ACCENT = "#FF8C42";
  var FG = "#1a1a1a";
  var MUTED = "#999999";
  var DONE_CLR = "#1D9E75";

  var todos = props.todos || [];
  var niceTodos = props.niceTodos || [];
  var rituals = props.rituals || { morning: [], daily: [], evening: [] };

  var morningPending: RitualItem[] = [];
  var dailyPending: RitualItem[] = [];
  var eveningPending: RitualItem[] = [];

  for (var i = 0; i < (rituals.morning || []).length; i++) {
    if (!rituals.morning[i].done) morningPending.push(rituals.morning[i]);
  }
  for (var j = 0; j < (rituals.daily || []).length; j++) {
    if (!rituals.daily[j].done) dailyPending.push(rituals.daily[j]);
  }
  for (var k = 0; k < (rituals.evening || []).length; k++) {
    if (!rituals.evening[k].done) eveningPending.push(rituals.evening[k]);
  }

  var allPending = morningPending.concat(dailyPending).concat(eveningPending);
  var nextRitual = allPending.length > 0 ? allPending[0] : null;

  var pendingTodos: TodoItem[] = [];
  for (var ti = 0; ti < todos.length; ti++) {
    if (!todos[ti].done) pendingTodos.push(todos[ti]);
  }
  var pendingNice: TodoItem[] = [];
  for (var ni = 0; ni < niceTodos.length; ni++) {
    if (!niceTodos[ni].done) pendingNice.push(niceTodos[ni]);
  }
  var firstTodo = pendingTodos.length > 0 ? pendingTodos[0] : (pendingNice.length > 0 ? pendingNice[0] : null);

  // ── Small (2x2) ──
  if (env.widgetFamily === "systemSmall") {
    return (
      <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 16 })]}>
        <HStack spacing={0}>
          <Text modifiers={[font({ size: 12, weight: "bold" }), foregroundColor(ACCENT)]}>
            Rituály
          </Text>
          <Spacer />
          <Text modifiers={[font({ size: 12, weight: "bold" }), foregroundColor(ACCENT)]}>
            To-Do
          </Text>
        </HStack>
        <Spacer />
        {nextRitual ? (
          <VStack alignment="leading" spacing={2}>
            <Text modifiers={[font({ size: 11, weight: "bold" }), foregroundColor(MUTED)]}>
              DALŠÍ RITUÁL
            </Text>
            <Text modifiers={[font({ size: 17, weight: "bold" }), foregroundColor(FG)]}>
              {nextRitual.name}
            </Text>
          </VStack>
        ) : firstTodo ? (
          <VStack alignment="leading" spacing={2}>
            <Text modifiers={[font({ size: 11, weight: "bold" }), foregroundColor(MUTED)]}>
              DALŠÍ ÚKOL
            </Text>
            <Text modifiers={[font({ size: 17, weight: "bold" }), foregroundColor(FG)]}>
              {firstTodo.text}
            </Text>
          </VStack>
        ) : (
          <Text modifiers={[font({ size: 16, weight: "bold" }), foregroundColor(DONE_CLR)]}>
            Vše hotovo!
          </Text>
        )}
        <Spacer />
      </VStack>
    );
  }

  // ── Medium (4x2) ──
  if (env.widgetFamily === "systemMedium") {
    return (
      <HStack spacing={12} modifiers={[padding({ all: 16 })]}>
        <VStack alignment="leading" spacing={4} modifiers={[frame({ maxWidth: 99999 })]}>
          <Text modifiers={[font({ size: 13, weight: "bold" }), foregroundColor(ACCENT)]}>
            Rituály
          </Text>
          {nextRitual ? (
            <VStack alignment="leading" spacing={2}>
              <Text modifiers={[font({ size: 17, weight: "bold" }), foregroundColor(FG)]}>
                {nextRitual.name}
              </Text>
              {allPending.length > 1 ? (
                <Text modifiers={[font({ size: 12 }), foregroundColor(MUTED)]}>
                  {"+" + (allPending.length - 1) + " dalších"}
                </Text>
              ) : null}
            </VStack>
          ) : (
            <Text modifiers={[font({ size: 14, weight: "bold" }), foregroundColor(DONE_CLR)]}>
              Hotovo
            </Text>
          )}
          <Spacer />
        </VStack>
        <VStack alignment="leading" spacing={4} modifiers={[frame({ maxWidth: 99999 })]}>
          <Text modifiers={[font({ size: 13, weight: "bold" }), foregroundColor(ACCENT)]}>
            To-Do
          </Text>
          {firstTodo ? (
            <VStack alignment="leading" spacing={2}>
              <Text modifiers={[font({ size: 17, weight: "bold" }), foregroundColor(FG)]}>
                {firstTodo.text}
              </Text>
              {pendingTodos.length + pendingNice.length > 1 ? (
                <Text modifiers={[font({ size: 12 }), foregroundColor(MUTED)]}>
                  {"+" + (pendingTodos.length + pendingNice.length - 1) + " dalších"}
                </Text>
              ) : null}
            </VStack>
          ) : (
            <Text modifiers={[font({ size: 14, weight: "bold" }), foregroundColor(DONE_CLR)]}>
              Splněno
            </Text>
          )}
          <Spacer />
        </VStack>
      </HStack>
    );
  }

  // ── Large (4x4) ──
  return (
    <HStack spacing={12} modifiers={[padding({ all: 16 })]}>
      <VStack alignment="leading" spacing={6} modifiers={[frame({ maxWidth: 99999 })]}>
        <Text modifiers={[font({ size: 14, weight: "bold" }), foregroundColor(ACCENT)]}>
          Rituály
        </Text>
        {allPending.length > 0 ? (
          <VStack alignment="leading" spacing={4}>
            {morningPending.length > 0 ? (
              <VStack alignment="leading" spacing={3}>
                <Text modifiers={[font({ size: 11, weight: "bold" }), foregroundColor(MUTED)]}>
                  RÁNO
                </Text>
                {morningPending.map((r, idx) => (
                  <HStack key={"m" + idx} spacing={8} alignment="firstTextBaseline">
                    <Text modifiers={[font({ size: 14 }), foregroundColor(MUTED)]}>○</Text>
                    <Text modifiers={[font({ size: 15 }), foregroundColor(FG)]}>{r.name}</Text>
                  </HStack>
                ))}
              </VStack>
            ) : null}
            {dailyPending.length > 0 ? (
              <VStack alignment="leading" spacing={3}>
                <Text modifiers={[font({ size: 11, weight: "bold" }), foregroundColor(MUTED)]}>
                  PŘES DEN
                </Text>
                {dailyPending.map((r, idx) => (
                  <HStack key={"d" + idx} spacing={8} alignment="firstTextBaseline">
                    <Text modifiers={[font({ size: 14 }), foregroundColor(MUTED)]}>○</Text>
                    <Text modifiers={[font({ size: 15 }), foregroundColor(FG)]}>{r.name}</Text>
                  </HStack>
                ))}
              </VStack>
            ) : null}
            {eveningPending.length > 0 ? (
              <VStack alignment="leading" spacing={3}>
                <Text modifiers={[font({ size: 11, weight: "bold" }), foregroundColor(MUTED)]}>
                  VEČER
                </Text>
                {eveningPending.map((r, idx) => (
                  <HStack key={"e" + idx} spacing={8} alignment="firstTextBaseline">
                    <Text modifiers={[font({ size: 14 }), foregroundColor(MUTED)]}>○</Text>
                    <Text modifiers={[font({ size: 15 }), foregroundColor(FG)]}>{r.name}</Text>
                  </HStack>
                ))}
              </VStack>
            ) : null}
          </VStack>
        ) : (
          <Text modifiers={[font({ size: 14, weight: "bold" }), foregroundColor(DONE_CLR)]}>
            Vše hotovo!
          </Text>
        )}
        <Spacer />
      </VStack>

      <VStack alignment="leading" spacing={6} modifiers={[frame({ maxWidth: 99999 })]}>
        <Text modifiers={[font({ size: 14, weight: "bold" }), foregroundColor(ACCENT)]}>
          To-Do
        </Text>
        {pendingTodos.length > 0 ? (
          <VStack alignment="leading" spacing={3}>
            {pendingTodos.map((t, idx) => (
              <HStack key={"t" + idx} spacing={8} alignment="firstTextBaseline">
                <Text modifiers={[font({ size: 14 }), foregroundColor(MUTED)]}>○</Text>
                <Text modifiers={[font({ size: 15 }), foregroundColor(FG)]}>{t.text}</Text>
              </HStack>
            ))}
          </VStack>
        ) : null}
        {pendingNice.length > 0 ? (
          <VStack alignment="leading" spacing={3}>
            <Text modifiers={[font({ size: 11, weight: "bold" }), foregroundColor(MUTED)]}>
              NICE TO-DO
            </Text>
            {pendingNice.map((t, idx) => (
              <HStack key={"n" + idx} spacing={8} alignment="firstTextBaseline">
                <Text modifiers={[font({ size: 14 }), foregroundColor(MUTED)]}>○</Text>
                <Text modifiers={[font({ size: 15 }), foregroundColor(FG)]}>{t.text}</Text>
              </HStack>
            ))}
          </VStack>
        ) : null}
        {pendingTodos.length === 0 && pendingNice.length === 0 ? (
          <Text modifiers={[font({ size: 14, weight: "bold" }), foregroundColor(DONE_CLR)]}>
            Vše splněno!
          </Text>
        ) : null}
        <Spacer />
      </VStack>
    </HStack>
  );
}

export default createWidget<ZijuWidgetProps>("ZijuWidget", ZijuWidgetLayout);
