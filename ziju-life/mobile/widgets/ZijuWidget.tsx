import { createWidget, type WidgetEnvironment } from "expo-widgets";
import { VStack, HStack, Text, Spacer } from "@expo/ui/swift-ui";
import {
  font,
  foregroundColor,
  padding,
  frame,
  opacity,
  cornerRadius,
  background,
  strikethrough,
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

const ACCENT = "#FF8C42";
const BG = "#FDFDF7";
const FG = "#171717";
const MUTED = "#666666";
const DONE_COLOR = "#1D9E75";

const SLOT_LABEL: Record<string, string> = {
  morning: "Rano",
  daily: "Pres den",
  evening: "Vecer",
};

function CheckIcon({ done }: { done: boolean }) {
  "widget";
  return (
    <Text modifiers={[font({ size: 12 }), foregroundColor(done ? DONE_COLOR : MUTED)]}>
      {done ? "\u2713" : "\u25CB"}
    </Text>
  );
}

function TodoRow({ item }: { item: TodoItem }) {
  "widget";
  return (
    <HStack spacing={6} alignment="firstTextBaseline">
      <CheckIcon done={item.done} />
      <Text
        modifiers={[
          font({ size: 13 }),
          foregroundColor(item.done ? MUTED : FG),
          ...(item.done ? [strikethrough({ isActive: true, pattern: "solid" })] : []),
        ]}
      >
        {item.text}
      </Text>
      <Spacer />
    </HStack>
  );
}

function RitualRow({ item }: { item: RitualItem }) {
  "widget";
  return (
    <HStack spacing={6} alignment="firstTextBaseline">
      <CheckIcon done={item.done} />
      <Text
        modifiers={[
          font({ size: 13 }),
          foregroundColor(item.done ? MUTED : FG),
          ...(item.done ? [strikethrough({ isActive: true, pattern: "solid" })] : []),
        ]}
      >
        {item.name}
      </Text>
      <Spacer />
    </HStack>
  );
}

function SectionTitle({ title }: { title: string }) {
  "widget";
  return (
    <Text modifiers={[font({ size: 11, weight: "semibold" }), foregroundColor(MUTED)]}>
      {title}
    </Text>
  );
}

// ── Small Widget ──────────────────────────────────────────────────────────────

function SmallWidget({ todos, nextRitual }: ZijuWidgetProps) {
  "widget";
  const firstTodo = todos.find((t) => !t.done);
  return (
    <VStack alignment="leading" spacing={8} modifiers={[padding({ all: 14 })]}>
      <Text modifiers={[font({ size: 13, weight: "bold" }), foregroundColor(ACCENT)]}>
        Ziju Life
      </Text>
      <Spacer />
      {nextRitual ? (
        <VStack alignment="leading" spacing={4}>
          <SectionTitle title={`Ritual - ${SLOT_LABEL[nextRitual.slot] ?? nextRitual.slot}`} />
          <Text modifiers={[font({ size: 14, weight: "medium" }), foregroundColor(FG)]}>
            {nextRitual.name}
          </Text>
        </VStack>
      ) : (
        <Text modifiers={[font({ size: 12 }), foregroundColor(DONE_COLOR)]}>
          Vsechny ritualy hotove!
        </Text>
      )}
      {firstTodo ? (
        <VStack alignment="leading" spacing={4}>
          <SectionTitle title="To-Do" />
          <TodoRow item={firstTodo} />
        </VStack>
      ) : null}
      <Spacer />
    </VStack>
  );
}

// ── Medium Widget ─────────────────────────────────────────────────────────────

function MediumWidget({ todos, nextRitual }: ZijuWidgetProps) {
  "widget";
  const pendingTodos = todos.filter((t) => !t.done).slice(0, 3);
  return (
    <HStack spacing={12} modifiers={[padding({ all: 14 })]}>
      <VStack alignment="leading" spacing={6} modifiers={[frame({ maxWidth: 99999 })]}>
        <Text modifiers={[font({ size: 13, weight: "bold" }), foregroundColor(ACCENT)]}>
          Ziju Life
        </Text>
        {nextRitual ? (
          <VStack alignment="leading" spacing={3}>
            <SectionTitle title={`Ritual - ${SLOT_LABEL[nextRitual.slot] ?? nextRitual.slot}`} />
            <Text modifiers={[font({ size: 14, weight: "medium" }), foregroundColor(FG)]}>
              {nextRitual.name}
            </Text>
          </VStack>
        ) : (
          <Text modifiers={[font({ size: 12 }), foregroundColor(DONE_COLOR)]}>
            Vsechny ritualy hotove!
          </Text>
        )}
        <Spacer />
      </VStack>
      <VStack alignment="leading" spacing={4} modifiers={[frame({ maxWidth: 99999 })]}>
        <SectionTitle title="To-Do" />
        {pendingTodos.length > 0
          ? pendingTodos.map((t, i) => <TodoRow key={i} item={t} />)
          : (
            <Text modifiers={[font({ size: 12 }), foregroundColor(DONE_COLOR)]}>
              Vse splneno!
            </Text>
          )}
        <Spacer />
      </VStack>
    </HStack>
  );
}

// ── Large Widget ──────────────────────────────────────────────────────────────

function LargeWidget({ todos, niceTodos, rituals }: ZijuWidgetProps) {
  "widget";
  const allSlots = (["morning", "daily", "evening"] as const).filter(
    (s) => rituals[s].length > 0
  );
  return (
    <VStack alignment="leading" spacing={8} modifiers={[padding({ all: 14 })]}>
      <Text modifiers={[font({ size: 14, weight: "bold" }), foregroundColor(ACCENT)]}>
        Ziju Life
      </Text>

      {/* To-Do */}
      {todos.length > 0 && (
        <VStack alignment="leading" spacing={3}>
          <SectionTitle title="TO-DO" />
          {todos.map((t, i) => (
            <TodoRow key={`t${i}`} item={t} />
          ))}
        </VStack>
      )}

      {/* Nice To-Do */}
      {niceTodos.length > 0 && (
        <VStack alignment="leading" spacing={3}>
          <SectionTitle title="NICE TO-DO" />
          {niceTodos.map((t, i) => (
            <TodoRow key={`n${i}`} item={t} />
          ))}
        </VStack>
      )}

      {/* Rituals by slot */}
      {allSlots.map((slot) => (
        <VStack key={slot} alignment="leading" spacing={3}>
          <SectionTitle title={`RITUALY - ${(SLOT_LABEL[slot] ?? slot).toUpperCase()}`} />
          {rituals[slot].map((r, i) => (
            <RitualRow key={`r${slot}${i}`} item={r} />
          ))}
        </VStack>
      ))}

      <Spacer />
    </VStack>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────

function ZijuWidgetLayout(props: ZijuWidgetProps, env: WidgetEnvironment) {
  "widget";

  const safeProps: ZijuWidgetProps = {
    todos: props.todos ?? [],
    niceTodos: props.niceTodos ?? [],
    rituals: props.rituals ?? { morning: [], daily: [], evening: [] },
    nextRitual: props.nextRitual ?? null,
  };

  switch (env.widgetFamily) {
    case "systemSmall":
      return <SmallWidget {...safeProps} />;
    case "systemMedium":
      return <MediumWidget {...safeProps} />;
    case "systemLarge":
      return <LargeWidget {...safeProps} />;
    default:
      return <MediumWidget {...safeProps} />;
  }
}

export default createWidget<ZijuWidgetProps>("ZijuWidget", ZijuWidgetLayout);
