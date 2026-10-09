import type { MoveData, MoveItem } from "../types";

/**
 * Gating: a few goals decide when the rest of the move becomes doable.
 * An item's `gates` lists milestone ids (below) or other item ids that must be done first.
 * Locked items stay visible in Move OS with their unlock reason, but never reach the Life Hub list.
 */

export const GATE_GOAL_IDS = ["income-evidence", "save-for-move", "credit-plan"] as const;

export interface Milestone { id: string; title: string; requires: string[]; summary: string; }

export const MILESTONES: Milestone[] = [
  { id: "ready-to-search", title: "Ready to search", requires: [...GATE_GOAL_IDS], summary: "Income, move savings, and credit are in place." },
  { id: "lease-signed", title: "Lease signed", requires: ["lease"], summary: "A lease or workable sublet is signed." },
];

export type GateChoice = "now" | "ready-to-search" | "lease-signed" | "item";

const isDone = (item?: MoveItem) => item?.status === "Done";
const milestone = (id: string) => MILESTONES.find(candidate => candidate.id === id);

export function milestoneReached(id: string, all: MoveItem[]) {
  const found = milestone(id);
  if (!found) return false;
  // A missing required item never silently unlocks a milestone.
  return found.requires.every(required => isDone(all.find(item => item.id === required)));
}

/** Title of whatever a gate points at: a milestone or an item. */
export function gateTitle(gate: string, all: MoveItem[]) {
  return milestone(gate)?.title || all.find(item => item.id === gate)?.title || gate;
}

function gateOpen(gate: string, all: MoveItem[]) {
  if (milestone(gate)) return milestoneReached(gate, all);
  const target = all.find(item => item.id === gate);
  // A gate pointing at a deleted item no longer holds anything back.
  return !target || isDone(target);
}

/** The first gate still closed for this item, inherited from its parents. */
export function closedGate(item: MoveItem, all: MoveItem[], seen = new Set<string>()): string | undefined {
  if (seen.has(item.id)) return undefined;
  seen.add(item.id);
  const own = (item.gates || []).find(gate => !gateOpen(gate, all));
  if (own) return own;
  const parent = item.parentId ? all.find(candidate => candidate.id === item.parentId) : undefined;
  return parent ? closedGate(parent, all, seen) : undefined;
}

/** Plain-language unlock reason, e.g. "After Ready to search". */
export function lockReason(item: MoveItem, all: MoveItem[]) {
  if (isDone(item)) return undefined;
  const gate = closedGate(item, all);
  return gate ? `After ${gateTitle(gate, all)}` : undefined;
}

export const isLocked = (item: MoveItem, all: MoveItem[]) => !!lockReason(item, all);

export const gateGoals = (data: Pick<MoveData, "items">) =>
  GATE_GOAL_IDS.map(id => data.items.find(item => item.id === id)).filter(Boolean) as MoveItem[];

/** Editor helper: which "Can I do this now?" option an item currently uses. */
export function gateChoice(item: Pick<MoveItem, "gates">): { choice: GateChoice; itemId?: string } {
  const gate = item.gates?.[0];
  if (!gate) return { choice: "now" };
  if (gate === "ready-to-search" || gate === "lease-signed") return { choice: gate };
  return { choice: "item", itemId: gate };
}

export function gatesFor(choice: GateChoice, itemId?: string): string[] | undefined {
  if (choice === "ready-to-search" || choice === "lease-signed") return [choice];
  if (choice === "item" && itemId) return [itemId];
  return undefined;
}
