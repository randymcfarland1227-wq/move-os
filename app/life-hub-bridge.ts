/** Life Hub postMessage bridge — source id `move`. See frontier LIFE_HUB.md. */

import type { MoveData, MoveItem } from "./types";
import { toggleDone, togglePin } from "./domain/plans";
import { isDone } from "./priorities";

/** Allowed Life Hub parent origins (GitHub Pages primary + legacy Worker). */
export const LIFE_HUB_ORIGINS = [
  "https://randymcfarland1227-wq.github.io",
  "https://frontier-work-room.randymcfarland1227.workers.dev",
] as const;
/** Default target for proactive posts — Pages origin (path-agnostic). */
export const LIFE_HUB_ORIGIN = LIFE_HUB_ORIGINS[0];
export const MOVE_SOURCE = "move" as const;
const ORIGIN_URL = "https://randymcfarland1227-wq.github.io/move-os/";

export function isLifeHubOrigin(origin: string) {
  return (LIFE_HUB_ORIGINS as readonly string[]).includes(origin);
}

export type LifeHubFeatured = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  originUrl?: string;
  completable?: boolean;
};

export type LifeHubTask = {
  id: string;
  title: string;
  detail?: string;
  status?: string;
  due?: string;
  starred?: boolean;
  originUrl?: string;
};

export type LifeHubSnapshot = {
  source: typeof MOVE_SOURCE;
  metrics: Record<string, number>;
  featured: LifeHubFeatured[];
  tasks: LifeHubTask[];
  refreshedAt: string;
};

const isActionTask = (item: MoveItem) =>
  item.type === "Task" && (!item.kind || item.kind === "Action");

function planLabel(data: MoveData, item: MoveItem) {
  const plan = data.plans.find(candidate => candidate.id === item.planId);
  return plan?.title || item.workArea || item.phase;
}

export function buildMoveSnapshot(data: MoveData): LifeHubSnapshot {
  const open = data.items.filter(item => isActionTask(item) && !isDone(item));
  const done = data.items.filter(item => isActionTask(item) && isDone(item));
  const pinned = open.filter(item => item.pinnedToFocus);
  const tasks: LifeHubTask[] = open.map(item => ({
    id: item.id,
    title: item.title,
    detail: item.notes || item.description || undefined,
    status: item.status === "Blocked" ? "blocked" : "open",
    due: item.dueDate || undefined,
    starred: Boolean(item.pinnedToFocus),
    originUrl: ORIGIN_URL,
  }));
  const featured: LifeHubFeatured[] = pinned.map(item => ({
    id: item.id,
    title: item.title,
    detail: item.notes || item.description || planLabel(data, item),
    meta: planLabel(data, item),
    originUrl: ORIGIN_URL,
    completable: true,
  }));
  return {
    source: MOVE_SOURCE,
    metrics: {
      openTasks: open.length,
      completedTasks: done.length,
      pinnedFocus: pinned.length,
    },
    featured,
    tasks,
    refreshedAt: new Date().toISOString(),
  };
}

export function postMoveSnapshot(data: MoveData, target?: MessageEventSource | null, origin = LIFE_HUB_ORIGIN) {
  const message = { type: "randys-workroom:snapshot" as const, payload: buildMoveSnapshot(data) };
  const fanout = origin === LIFE_HUB_ORIGIN ? [...LIFE_HUB_ORIGINS] : [origin];
  try {
    if (target && "postMessage" in target) (target as Window).postMessage(message, { targetOrigin: origin });
  } catch { /* ignore closed targets */ }
  for (const o of fanout) {
    try {
      if (window.opener && !window.opener.closed) window.opener.postMessage(message, o);
    } catch { /* ignore */ }
    try {
      if (window.parent !== window) window.parent.postMessage(message, o);
    } catch { /* ignore */ }
  }
}

type BridgeHandlers = {
  getData: () => MoveData | null;
  setData: (next: MoveData | ((current: MoveData) => MoveData)) => void;
};

/** Listen for Life Hub request / complete / star. Returns cleanup. */
export function attachMoveLifeHubBridge(handlers: BridgeHandlers) {
  const onMessage = (event: MessageEvent) => {
    if (!isLifeHubOrigin(event.origin)) return;
    const type = event.data?.type;
    if (type === "randys-workroom:request") {
      const data = handlers.getData();
      if (data) postMoveSnapshot(data, event.source, event.origin);
      return;
    }
    const payload = event.data?.payload || {};
    if (payload.source && payload.source !== MOVE_SOURCE) return;
    const data = handlers.getData();
    if (!data || !payload.id) return;

    if (type === "randys-workroom:complete") {
      handlers.setData(current => toggleDone(current, String(payload.id)));
      return;
    }
    if (type === "randys-workroom:star") {
      const item = data.items.find(candidate => candidate.id === String(payload.id));
      if (!item) return;
      const want = typeof payload.starred === "boolean" ? payload.starred : !item.pinnedToFocus;
      if (Boolean(item.pinnedToFocus) === want) {
        postMoveSnapshot(data, event.source, event.origin);
        return;
      }
      let refused = false;
      handlers.setData(current => {
        const next = togglePin(current, String(payload.id));
        refused = next === current;
        return next;
      });
      if (refused) postMoveSnapshot(handlers.getData() || data, event.source, event.origin);
    }
  };

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
