import React from "react";
import * as SecureStore from "expo-secure-store";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import {
  ZijuSmallRitualWidget,
  ZijuSmallTodoWidget,
  ZijuMediumWidget,
  ZijuLargeWidget,
  type WidgetProps,
} from "./AndroidWidget";
import { categories } from "../data/adhdRituals";

const API_BASE = "https://ziju.life";
const TOKEN_KEY = "auth_token";

const EMPTY_PROPS: WidgetProps = {
  todos: [],
  niceTodos: [],
  rituals: { morning: [], daily: [], evening: [] },
  nextRitual: null,
};

// Build ritual ID → Czech name lookup
const ritualNameMap = new Map<string, string>();
for (const cat of categories) {
  for (const r of cat.rituals) {
    ritualNameMap.set(r.id, r.name);
  }
}

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

function parseName(id: string) {
  if (id.startsWith("custom::")) return id.split("::")[1] ?? id;
  return ritualNameMap.get(id) ?? id.replace(/-/g, " ").replace(/^\w/, (c: string) => c.toUpperCase());
}

function renderByName(
  widgetName: string,
  renderWidget: (w: React.JSX.Element) => void,
  props: WidgetProps
) {
  switch (widgetName) {
    case "ZijuSmallRitual":
      renderWidget(<ZijuSmallRitualWidget {...props} />);
      break;
    case "ZijuSmallTodo":
      renderWidget(<ZijuSmallTodoWidget {...props} />);
      break;
    case "ZijuMedium":
      renderWidget(<ZijuMediumWidget {...props} />);
      break;
    case "ZijuLarge":
      renderWidget(<ZijuLargeWidget {...props} />);
      break;
  }
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
          // Fetch current data and render optimistically
          const currentData = await fetchWidgetData();

          if (clickAction === "TOGGLE_TODO") {
            const index = (clickActionData?.index as number) ?? -1;
            const allTodos = [...currentData.todos, ...currentData.niceTodos];
            if (index >= 0 && index < allTodos.length) {
              allTodos[index].done = !allTodos[index].done;
              currentData.todos = allTodos.slice(0, currentData.todos.length);
              currentData.niceTodos = allTodos.slice(currentData.todos.length);
            }
          } else {
            const ritualId = clickActionData?.ritualId as string;
            const slot = clickActionData?.slot as "morning" | "daily" | "evening";
            if (ritualId && slot && currentData.rituals[slot]) {
              currentData.rituals[slot] = currentData.rituals[slot].map((r) =>
                r.id === ritualId ? { ...r, done: !r.done } : r
              );
            }
            currentData.nextRitual = null;
            for (const s of ["morning", "daily", "evening"] as const) {
              const next = currentData.rituals[s].find((r) => !r.done);
              if (next) {
                currentData.nextRitual = { name: next.name, slot: s };
                break;
              }
            }
          }

          // Render immediately
          renderByName(widgetInfo.widgetName, renderWidget, currentData);

          // Persist in background
          if (clickAction === "TOGGLE_TODO") {
            const index = (clickActionData?.index as number) ?? -1;
            const data: any = await widgetFetch("/api/manual/daily-todos");
            const todos = [...(data.today?.todos ?? [])];
            const niceTodos = [...(data.today?.niceTodos ?? [])];
            const allTodos = [...todos, ...niceTodos];
            if (index >= 0 && index < allTodos.length) {
              allTodos[index].done = !allTodos[index].done;
              widgetFetch("/api/manual/daily-todos", {
                method: "POST",
                body: JSON.stringify({
                  todos: allTodos.slice(0, todos.length),
                  niceTodos: allTodos.slice(todos.length),
                }),
              }).catch(() => {});
            }
          } else {
            const ritualId = clickActionData?.ritualId as string;
            if (ritualId) {
              const completions: any = await widgetFetch("/api/manual/ritual-completions");
              const isCurrentlyDone = (completions.today ?? []).includes(ritualId);
              widgetFetch("/api/manual/ritual-completions", {
                method: "POST",
                body: JSON.stringify({ ritualId, completed: !isCurrentlyDone }),
              }).catch(() => {});
            }
          }
        } catch {
          renderByName(widgetInfo.widgetName, renderWidget, EMPTY_PROPS);
        }
      }
      break;

    case "WIDGET_DELETED":
      break;
  }
}
