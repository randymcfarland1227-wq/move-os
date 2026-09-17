import type { MoveData, MoveItem } from "../types";

// Planning workspaces: a plan is the "why and how"; tasks are only its final layer.

export type PlanStatus = "Planning" | "Active" | "Needs Attention" | "Waiting" | "Ready" | "Complete";
export type RequirementStatus = "Met" | "Not Yet" | "Unknown" | "Not Needed";
export type RouteStatus = "Considering" | "Leading" | "Backup" | "Rejected" | "Chosen";
export type ActionStage = "Now" | "Next" | "Triggered" | "Later";

export interface MovePlan {
  id: string;
  title: string;
  question: string;
  outcome: string;
  status: PlanStatus;
  summary?: string;
  sectionIds: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanSection {
  id: string;
  planId: string;
  title: string;
  description?: string;
  order: number;
}

export interface PlanRequirement {
  id: string;
  planId: string;
  sectionId?: string;
  title: string;
  status: RequirementStatus;
  whyItMatters?: string;
  notes?: string;
  relatedTaskIds?: string[];
  order?: number;
}

export interface PlanRoute {
  id: string;
  planId: string;
  sectionId?: string;
  title: string;
  status: RouteStatus;
  summary?: string;
  whyItCouldWork?: string;
  concerns?: string;
  estimatedCost?: number;
  costStatus?: string;
  notes?: string;
  relatedTaskIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanQuestion {
  id: string;
  planId: string;
  question: string;
  answer?: string;
  status: "Open" | "Answered";
  relatedTaskId?: string;
  order?: number;
}

export interface GuideBlock {
  id: string;
  kind?: "note" | "instruction";
  title: string;
  body: string;
  order?: number;
}

export interface PlanGuide {
  planId: string;
  overview?: string;
  instructions: GuideBlock[];
  notes?: string;
}

export interface MoveDecision {
  id: string;
  planId?: string;
  title: string;
  selected: string;
  reason?: string;
  decidedAt: string;
  affects?: string[];
  supersededBy?: string;
}

export interface MoveAssumption {
  id: string;
  planId?: string;
  title: string;
  value: string;
  confidence: "Working" | "Likely" | "Confirmed";
  notes?: string;
  updatedAt: string;
  affects?: string[];
}

export interface WatchItem {
  id: string;
  planId?: string;
  title: string;
  reason: string;
  state: "Watching" | "Resolved";
  label?: "Waiting on" | "Open loop" | "Worth remembering";
  relatedItemIds?: string[];
  reviewAfter?: string;
}

/** Legacy (schema 10) readiness route, kept only so old browser data can migrate. */
export interface LegacyMoveRoute {
  id: string;
  readinessGateId: string;
  title: string;
  purpose: string;
  state: string;
  priority?: "Primary" | "Parallel" | "Backup";
  fallbackTrigger?: string;
  notes?: string;
  relatedItemIds?: string[];
}

export const MAX_PINNED = 5;

const isDone = (item: MoveItem) => item.status === "Done";
const isTask = (item: MoveItem) => item.type === "Task" && (!item.kind || item.kind === "Action");

export const upsert = <T extends { id: string }>(list: T[], record: T) =>
  list.some(item => item.id === record.id) ? list.map(item => item.id === record.id ? record : item) : [...list, record];
export const removeById = <T extends { id: string }>(list: T[], id: string) => list.filter(item => item.id !== id);

export function waitingOn(item: MoveItem, all: MoveItem[]) {
  if (item.blocker) return item.blocker;
  if (!item.dependency) return undefined;
  const prerequisite = all.find(candidate => candidate.id === item.dependency);
  return prerequisite && !isDone(prerequisite) ? `When ${prerequisite.title.charAt(0).toLowerCase()}${prerequisite.title.slice(1)} is done` : undefined;
}

/** Explicit actionStage wins; older tasks derive one from schedule and blockers. */
export function stageOf(item: MoveItem, all: MoveItem[]): ActionStage {
  const blocked = item.status === "Blocked" || !!waitingOn(item, all);
  if (item.actionStage === "Triggered" || (blocked && item.actionStage !== "Later")) return "Triggered";
  if (item.actionStage) return item.actionStage;
  if (item.optional || item.schedule === "Later") return "Later";
  if (item.schedule === "Now") return "Now";
  return "Next";
}

export function triggerLabel(item: MoveItem, all: MoveItem[], requirements: PlanRequirement[] = []) {
  if (item.triggerText) return item.triggerText;
  const requirement = item.triggerRequirementId && requirements.find(candidate => candidate.id === item.triggerRequirementId);
  if (requirement) return `When ${requirement.title.charAt(0).toLowerCase()}${requirement.title.slice(1)}`;
  return waitingOn(item, all) || "When something else happens first";
}

export function planContext(item: MoveItem, data: Pick<MoveData, "plans" | "planSections">) {
  const plan = data.plans.find(candidate => candidate.id === item.planId);
  if (!plan) return item.workArea;
  const section = data.planSections.find(candidate => candidate.id === item.planSectionId);
  return section ? `${plan.title} · ${section.title}` : plan.title;
}

export const planTasks = (planId: string, items: MoveItem[]) => items.filter(item => item.planId === planId && isTask(item));

export function actionPlan(planId: string, data: Pick<MoveData, "items" | "planRequirements">) {
  const tasks = planTasks(planId, data.items);
  const open = tasks.filter(item => !isDone(item));
  const byStage = (stage: ActionStage) => open.filter(item => stageOf(item, data.items) === stage).sort(byFocusOrder(data.items));
  const triggered = byStage("Triggered");
  const triggerGroups = new Map<string, MoveItem[]>();
  triggered.forEach(item => {
    const label = triggerLabel(item, data.items, data.planRequirements);
    triggerGroups.set(label, [...(triggerGroups.get(label) || []), item]);
  });
  return {
    now: byStage("Now"),
    next: byStage("Next"),
    triggered: [...triggerGroups.entries()].map(([trigger, items]) => ({ trigger, items })),
    later: byStage("Later"),
    done: tasks.filter(isDone).sort((a, b) => (b.completedAt || b.updatedAt).localeCompare(a.completedAt || a.updatedAt)),
  };
}

const dueWeight = (item: MoveItem) => {
  if (!item.dueDate) return 0;
  const days = Math.ceil((new Date(`${item.dueDate}T23:59:59`).getTime() - Date.now()) / 86400000);
  return days < 0 ? 4 : days <= 3 ? 3 : days <= 7 ? 2 : days <= 21 ? 1 : 0;
};

const byFocusOrder = (all: MoveItem[], plans: MovePlan[] = []) => (a: MoveItem, b: MoveItem) => {
  const activePlan = (item: MoveItem) => {
    const plan = plans.find(candidate => candidate.id === item.planId);
    return plan && ["Active", "Needs Attention"].includes(plan.status) ? 1 : 0;
  };
  const unlocks = (item: MoveItem) => (item.unlocks?.length ? 1 : 0) + all.filter(other => other.dependency === item.id && !isDone(other)).length;
  const keys = (item: MoveItem) => [
    item.pinnedToFocus ? 1 : 0,
    activePlan(item),
    stageOf(item, all) === "Now" ? 1 : 0,
    item.status === "In Progress" ? 1 : 0,
    unlocks(item),
    dueWeight(item),
    item.importance === "Important" ? 1 : 0,
  ];
  const left = keys(a), right = keys(b);
  for (let index = 0; index < left.length; index++) if (left[index] !== right[index]) return right[index] - left[index];
  return (a.sortOrder || 0) - (b.sortOrder || 0);
};

/** Pinned tasks first, then actionable Now work, then Next work to fill empty slots. Never triggered or later work. */
export function currentFocus(data: Pick<MoveData, "items" | "plans">, limit = 5) {
  const open = data.items.filter(item => isTask(item) && !isDone(item) && item.phase === "Pre-Move");
  const pinned = open.filter(item => item.pinnedToFocus).slice(0, MAX_PINNED);
  const actionable = (stage: ActionStage) => open.filter(item => !item.pinnedToFocus && stageOf(item, data.items) === stage);
  const order = byFocusOrder(data.items, data.plans);
  const ranked = [...actionable("Now").sort(order), ...actionable("Next").sort(order)];
  // Suggestions spread across plans: at most two per plan until every plan has had a turn.
  const perPlan = new Map<string, number>();
  pinned.forEach(item => perPlan.set(item.planId || "", (perPlan.get(item.planId || "") || 0) + 1));
  const spread: MoveItem[] = [];
  ranked.forEach(item => {
    const key = item.planId || "";
    if ((perPlan.get(key) || 0) < 2) { spread.push(item); perPlan.set(key, (perPlan.get(key) || 0) + 1); }
  });
  const fill = [...spread, ...ranked.filter(item => !spread.includes(item))];
  return [...pinned, ...fill].slice(0, Math.max(limit, pinned.length));
}

export function togglePin(data: MoveData, taskId: string): MoveData {
  const task = data.items.find(item => item.id === taskId);
  if (!task) return data;
  const pinnedCount = data.items.filter(item => item.pinnedToFocus && !isDone(item)).length;
  if (!task.pinnedToFocus && pinnedCount >= MAX_PINNED) return data;
  return { ...data, items: data.items.map(item => item.id === taskId ? { ...item, pinnedToFocus: !item.pinnedToFocus, updatedAt: new Date().toISOString().slice(0, 10) } : item) };
}

export function toggleDone(data: MoveData, taskId: string): MoveData {
  return { ...data, items: data.items.map(item => item.id === taskId ? { ...item, status: isDone(item) ? "Not Started" : "Done", completedAt: isDone(item) ? undefined : new Date().toISOString(), pinnedToFocus: isDone(item) ? item.pinnedToFocus : false, updatedAt: new Date().toISOString().slice(0, 10) } : item) };
}

export interface ProgressEntry { id: string; title: string; date: string; kind: "Done" | "Decided"; taskId?: string; }

export function recentProgress(data: Pick<MoveData, "items" | "decisions">, limit = 5): ProgressEntry[] {
  const done = data.items
    .filter(item => isDone(item) && (!item.kind || item.kind === "Action") && item.type !== "Goal")
    .map(item => ({ id: item.id, title: item.title, date: item.completedAt || item.updatedAt, kind: "Done" as const, taskId: item.id }));
  const decided = data.decisions
    .filter(decision => !decision.supersededBy)
    .map(decision => ({ id: decision.id, title: `${decision.title}: ${decision.selected}`, date: decision.decidedAt, kind: "Decided" as const }));
  return [...done, ...decided].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export const planRecords = (planId: string, data: MoveData) => ({
  sections: data.planSections.filter(section => section.planId === planId).sort((a, b) => a.order - b.order),
  requirements: data.planRequirements.filter(requirement => requirement.planId === planId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  routes: data.planRoutes.filter(route => route.planId === planId),
  questions: data.planQuestions.filter(question => question.planId === planId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  guide: data.planGuides.find(guide => guide.planId === planId) || { planId, instructions: [] },
  watches: data.watches.filter(watch => watch.planId === planId && watch.state === "Watching"),
  decisions: data.decisions.filter(decision => decision.planId === planId && !decision.supersededBy),
  assumptions: data.assumptions.filter(assumption => assumption.planId === planId),
});
