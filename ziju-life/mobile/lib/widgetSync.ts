import React from "react";
import { Platform } from "react-native";

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

function syncIOS(
  todos: TodoItem[],
  niceTodos: TodoItem[],
  rituals: RitualGroups,
  nextRitual: { name: string; slot: string } | null
) {
  try {
    const ZijuWidget = require("@/widgets/ZijuWidget").default;
    ZijuWidget.updateSnapshot({ todos, niceTodos, rituals, nextRitual });
  } catch {}
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
      ZijuSmallWidget,
      ZijuMediumWidget,
      ZijuLargeWidget,
    } = require("@/widgets/AndroidWidget");

    const props = { todos, niceTodos, rituals, nextRitual };

    requestWidgetUpdate({
      widgetName: "ZijuSmall",
      renderWidget: () => React.createElement(ZijuSmallWidget, props),
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

  if (Platform.OS === "ios") {
    syncIOS(todos, niceTodos, rituals, nextRitual);
  } else if (Platform.OS === "android") {
    syncAndroid(todos, niceTodos, rituals, nextRitual);
  }
}
