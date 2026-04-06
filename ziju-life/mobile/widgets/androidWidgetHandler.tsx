import React from "react";
import * as SecureStore from "expo-secure-store";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import {
  ZijuSmallWidget,
  ZijuMediumWidget,
  ZijuLargeWidget,
  type WidgetProps,
} from "./AndroidWidget";

const API_BASE = "https://ziju.life";
const TOKEN_KEY = "auth_token";

const EMPTY_PROPS: WidgetProps = {
  todos: [],
  niceTodos: [],
  rituals: { morning: [], daily: [], evening: [] },
  nextRitual: null,
};

async function widgetFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) throw new Error("No auth token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers as Record<string, string>),
    },
  });

  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function renderByName(
  widgetName: string,
  renderWidget: (w: React.JSX.Element) => void,
  props: WidgetProps
) {
  switch (widgetName) {
    case "ZijuSmall":
      renderWidget(<ZijuSmallWidget {...props} />);
      break;
    case "ZijuMedium":
      renderWidget(<ZijuMediumWidget {...props} />);
      break;
    case "ZijuLarge":
      renderWidget(<ZijuLargeWidget {...props} />);
      break;
  }
}

function parseName(id: string) {
  if (id.startsWith("custom::")) return id.split("::")[1] ?? id;
  return id.replace(/-/g, " ").replace(/^\w/, (c: string) => c.toUpperCase());
}

async function fetchWidgetData(): Promise<WidgetProps> {
  const dashboard: any = await widgetFetch("/api/manual/dashboard-data");
  const ctx = dashboard.context || {};
  const completedToday = new Set<string>(dashboard.ritualCompletions?.today ?? []);

  const ritualGroups = {
    morning: [] as { id: string; name: string; done: boolean }[],
    daily: [] as { id: string; name: string; done: boolean }[],
    evening: [] as { id: string; name: string; done: boolean }[],
  };

  if (ctx.rituals && typeof ctx.rituals === "object" && !Array.isArray(ctx.rituals)) {
    const sel = ctx.rituals as Record<string, string[]>;
    for (const slot of ["morning", "daily", "evening"] as const) {
      for (const id of sel[slot] ?? []) {
        ritualGroups[slot].push({
          id,
          name: parseName(id),
          done: completedToday.has(id),
        });
      }
    }
  }

  let nextRitual: { name: string; slot: string } | null = null;
  for (const slot of ["morning", "daily", "evening"] as const) {
    const next = ritualGroups[slot].find((r) => !r.done);
    if (next) {
      nextRitual = { name: next.name, slot };
      break;
    }
  }

  return {
    todos: dashboard.todos?.today?.todos ?? [],
    niceTodos: dashboard.todos?.today?.niceTodos ?? [],
    rituals: ritualGroups,
    nextRitual,
  };
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, clickAction, clickActionData, renderWidget } = props;

  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      try {
        const data = await fetchWidgetData();
        renderByName(widgetInfo.widgetName, renderWidget, data);
      } catch {
        renderByName(widgetInfo.widgetName, renderWidget, EMPTY_PROPS);
      }
      break;

    case "WIDGET_CLICK":
      if (clickAction === "TOGGLE_TODO" || clickAction === "TOGGLE_RITUAL") {
        try {
          if (clickAction === "TOGGLE_TODO") {
            const data: any = await widgetFetch("/api/manual/daily-todos");
            const index = (clickActionData?.index as number) ?? -1;
            const todos = [...(data.today?.todos ?? [])];
            const niceTodos = [...(data.today?.niceTodos ?? [])];
            const allTodos = [...todos, ...niceTodos];

            if (index >= 0 && index < allTodos.length) {
              allTodos[index].done = !allTodos[index].done;
              const updatedTodos = allTodos.slice(0, todos.length);
              const updatedNice = allTodos.slice(todos.length);
              await widgetFetch("/api/manual/daily-todos", {
                method: "POST",
                body: JSON.stringify({ todos: updatedTodos, niceTodos: updatedNice }),
              });
            }
          } else if (clickAction === "TOGGLE_RITUAL") {
            const ritualId = clickActionData?.ritualId as string;
            if (ritualId) {
              const completions: any = await widgetFetch("/api/manual/ritual-completions");
              const isCurrentlyDone = (completions.today ?? []).includes(ritualId);
              await widgetFetch("/api/manual/ritual-completions", {
                method: "POST",
                body: JSON.stringify({ ritualId, completed: !isCurrentlyDone }),
              });
            }
          }

          // Re-render with fresh data
          const freshData = await fetchWidgetData();
          renderByName(widgetInfo.widgetName, renderWidget, freshData);
        } catch {
          renderByName(widgetInfo.widgetName, renderWidget, EMPTY_PROPS);
        }
      }
      break;

    case "WIDGET_DELETED":
      break;
  }
}
