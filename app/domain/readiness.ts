import type { CashFlowPlan } from "./cash-flow";
import { calculateCashFlow } from "./cash-flow";

export type ReadinessState = "Needs Attention" | "Active" | "Waiting" | "Ready" | "No Action Yet";
export type RouteState = "Active" | "Waiting" | "Paused" | "Successful" | "Closed" | "No Action Yet";

export interface ReadinessGate {
  id: string;
  title: string;
  question: string;
  state: ReadinessState;
  summary?: string;
  routeIds?: string[];
  relatedItemIds?: string[];
  watchIds?: string[];
  nextTaskId?: string;
}

export interface MoveRoute {
  id: string;
  readinessGateId: string;
  title: string;
  purpose: string;
  state: RouteState;
  priority?: "Primary" | "Parallel" | "Backup";
  contributesTo?: string[];
  relatedItemIds?: string[];
  nextTaskId?: string;
  fallbackTrigger?: string;
  notes?: string;
}

export interface MoveDecision {
  id: string;
  title: string;
  selected: string;
  reason?: string;
  decidedAt: string;
  affects?: string[];
  supersededBy?: string;
}

export interface MoveAssumption {
  id: string;
  title: string;
  value: string;
  confidence: "Working" | "Likely" | "Confirmed";
  notes?: string;
  updatedAt: string;
  affects?: string[];
}

export interface WatchItem {
  id: string;
  title: string;
  reason: string;
  state: "Watching" | "Resolved";
  relatedItemIds?: string[];
  reviewAfter?: string;
}

type ReadinessItem = { id: string; status: string };
type ReadinessData = {
  items: ReadinessItem[];
  profile: { moveWindowStatus?: "Working Window" | "Confirmed Date" };
  cashFlow: CashFlowPlan;
};

const done = (item?: ReadinessItem) => item?.status === "Done";

export function deriveReadinessState(gate: ReadinessGate, data: ReadinessData): ReadinessState {
  if (gate.id === "cash-flow") {
    const totals = calculateCashFlow(data.cashFlow as CashFlowPlan);
    return totals.unknownEntries.length ? "Needs Attention" : totals.projectedMovePosition >= 0 ? "Active" : "Needs Attention";
  }
  if (gate.id === "income-proof") return done(data.items.find(item => item.id === "income-proof")) ? "Ready" : "Active";
  if (gate.id === "housing") return done(data.items.find(item => item.id === "lease")) ? "Ready" : "Waiting";
  if (gate.id === "move-window") return data.profile.moveWindowStatus === "Confirmed Date" ? "Ready" : "Active";
  if (gate.id === "physical-move") return done(data.items.find(item => item.id === "lease")) ? "Active" : "No Action Yet";
  if (gate.id === "continuity") return done(data.items.find(item => item.id === "health-continuity")) ? "Ready" : "Needs Attention";
  return gate.state;
}
