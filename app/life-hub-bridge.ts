/** Life Hub postMessage bridge — source id `move`. See frontier LIFE_HUB.md. */

import type { MoveData, MoveItem } from "./types";
import { isDoableNow, toggleDone, togglePin } from "./domain/plans";
import { gateGoals, isLocked, lockReason } from "./domain/gates";
import { isDone } from "./priorities";

/** Allowed Life Hub parent origins (GitHub Pages primary + legacy Worker). */
export const LIFE_HUB_ORIGINS = [
  "https://randymcfarland1227-wq.github.io",
  "https://frontier-work-room.randymcfarland1227.workers.dev",
] as const;
/** Default target for proactive posts — Pages origin (path-agnostic). */
export const LIFE_HUB_ORIGIN: string = LIFE_HUB_ORIGINS[0];
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

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

function goalDetail(data: MoveData, goal: MoveItem) {
  if (goal.id === "save-for-move") {
    const target = data.moveFund.workingTarget;
    return `${money(data.moveFund.current)} of ${target ? money(target) : "a target not set yet"} saved`;
  }
  return goal.description || planLabel(data, goal);
}

/**
 * Life Hub only gets what Randy can act on: doable-now tasks, plus the three gate goals as featured,
 * non-checkable items. Locked work is counted (lockedTasks) but never listed.
 */
export function buildMoveSnapshot(data: MoveData): LifeHubSnapshot {
  const actions = data.items.filter(isActionTask);
  const open = actions.filter(item => isDoableNow(item, data.items));
  const done = actions.filter(item => isDone(item));
  const locked = actions.filter(item => !isDone(item) && isLocked(item, data.items));
  const pinned = open.filter(item => item.pinnedToFocus);
  const tasks: LifeHubTask[] = open.map(item => ({
    id: item.id,
    title: item.title,
    detail: item.notes || item.description || undefined,
    status: "open",
    due: item.dueDate || undefined,
    starred: Boolean(item.pinnedToFocus),
    originUrl: ORIGIN_URL,
  }));
  const goals: LifeHubFeatured[] = gateGoals(data)
    .filter(goal => !isDone(goal))
    .map(goal => ({
      id: goal.id,
      title: goal.title,
      detail: goalDetail(data, goal),
      meta: "Goal · unlocks the move",
      originUrl: ORIGIN_URL,
      completable: false,
    }));
  const featured: LifeHubFeatured[] = [
    ...goals,
    ...pinned.map(item => ({
      id: item.id,
      title: item.title,
      detail: item.notes || item.description || planLabel(data, item),
      meta: planLabel(data, item),
      originUrl: ORIGIN_URL,
      completable: true,
    })),
  ];
  return {
    source: MOVE_SOURCE,
    metrics: {
      openTasks: open.length,
      completedTasks: done.length,
      pinnedFocus: pinned.length,
      lockedTasks: locked.length,
    },
    featured,
    tasks,
    refreshedAt: new Date().toISOString(),
  };
}

/** Goals are finished in Move OS itself, and locked work cannot be checked off from Life Hub. */
function refusesHubAction(data: MoveData, id: string) {
  const item = data.items.find(candidate => candidate.id === id);
  if (!item) return true;
  return item.type === "Goal" || (!isDone(item) && !!lockReason(item, data.items));
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

    if ((type === "randys-workroom:complete" || type === "randys-workroom:star") && refusesHubAction(data, String(payload.id))) {
      // Re-send the real state so Life Hub puts the goal (or locked item) back.
      postMoveSnapshot(data, event.source, event.origin);
      return;
    }
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
