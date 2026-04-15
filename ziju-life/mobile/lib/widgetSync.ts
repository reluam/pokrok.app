import React from "react";
import { Platform } from "react-native";

// Static import on iOS so createWidget registers the layout with the native module
const ZijuWidget = Platform.OS === "ios"
  ? require("@/widgets/ZijuWidget").default
  : null;

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

function getNextRitual(
  rituals: RitualGroups
): { name: string; slot: string } | null {
  for (const slot of ["morning", "daily", "evening"] as const) {
    const next = rituals[slot].find((r) => !r.done);
    if (next) return { name: next.name, slot };
  }
  return null;
}

function syncAndroid(
  todos: TodoItem[],
  niceTodos: TodoItem[],
  rituals: RitualGroups,
  nextRitual: { name: string; slot: string } | null
) {
  try {
    const { requestWidgetUpdate } = require("react-native-android-widget");
    const {
      ZijuSmallRitualWidget,
      ZijuSmallTodoWidget,
      ZijuMediumWidget,
      ZijuLargeWidget,
    } = require("@/widgets/AndroidWidget");

    const props = { todos, niceTodos, rituals, nextRitual };

    requestWidgetUpdate({
      widgetName: "ZijuSmallRitual",
      renderWidget: () => React.createElement(ZijuSmallRitualWidget, props),
    }).catch(() => {});
    requestWidgetUpdate({
      widgetName: "ZijuSmallTodo",
      renderWidget: () => React.createElement(ZijuSmallTodoWidget, props),
    }).catch(() => {});
    requestWidgetUpdate({
      widgetName: "ZijuMedium",
      renderWidget: () => React.createElement(ZijuMediumWidget, props),
    }).catch(() => {});
    requestWidgetUpdate({
      widgetName: "ZijuLarge",
      renderWidget: () => React.createElement(ZijuLargeWidget, props),
    }).catch(() => {});
  } catch {}
}

export function syncWidgetData(
  todos: TodoItem[],
  niceTodos: TodoItem[],
  rituals: RitualGroups
) {
  const nextRitual = getNextRitual(rituals);

  if (Platform.OS === "ios" && ZijuWidget) {
    try {
      ZijuWidget.updateSnapshot({ todos, niceTodos, rituals, nextRitual });
    } catch {}
  } else if (Platform.OS === "android") {
    syncAndroid(todos, niceTodos, rituals, nextRitual);
  }
}
