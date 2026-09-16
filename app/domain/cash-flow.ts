export type CashCertainty = "Available" | "Confirmed" | "Expected" | "Pending" | "Estimate" | "Unknown";
export type CashDirection = "in" | "out";
export type CashCategory = "Bills" | "Move In" | "Physical Move" | "Income" | "Unemployment" | "Resale" | "Other";
export type CashFlowView = "September" | "October" | "Through Move" | "Move / Move-In Costs";

export interface CashFlowEntry {
  id: string;
  label: string;
  amount?: number;
  direction: CashDirection;
  category: CashCategory;
  certainty: CashCertainty;
  dueDate?: string;
  recurring?: "none" | "monthly";
  includeInProjection: boolean;
  notes?: string;
  source?: "manual" | "system" | "resale-hub";
  externalId?: string;
  receivedAt?: string;
}

export interface CashAccount {
  id: string;
  label: string;
  balance: number;
  updatedAt: string;
}

export interface ResalePlatformBalance {
  platform: string;
  available: number;
  pending: number;
  source: "manual" | "resale-hub";
  updatedAt: string;
  includePendingInProjection?: boolean;
}

export interface CashFlowPlan {
  accounts: CashAccount[];
  entries: CashFlowEntry[];
  resaleBalances: ResalePlatformBalance[];
}

export interface CashFlowTotals {
  availableNow: number;
  confirmedIncoming: number;
  expectedIncoming: number;
  confirmedOut: number;
  plannedOut: number;
  billsAndObligations: number;
  moveAndMoveInCosts: number;
  conservativePosition: number;
  projectedMovePosition: number;
  unknownEntries: CashFlowEntry[];
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const amount = (entry: CashFlowEntry) => entry.amount ?? 0;

export function entryMatchesView(entry: CashFlowEntry, view: CashFlowView) {
  if (view === "Through Move") return true;
  if (view === "Move / Move-In Costs") return entry.category === "Move In" || entry.category === "Physical Move";
  if (!entry.dueDate) return false;
  const month = entry.dueDate.slice(0, 7);
  return view === "September" ? month === "2026-09" : month === "2026-10";
}

export function calculateCashFlow(plan: CashFlowPlan, view: CashFlowView = "Through Move"): CashFlowTotals {
  const entries = plan.entries.filter(entry => !entry.receivedAt && entryMatchesView(entry, view));
  const availableNow = sum(plan.accounts.map(account => account.balance)) + sum(plan.resaleBalances.map(balance => balance.available));
  const confirmedIncoming = sum(entries.filter(entry => entry.direction === "in" && entry.certainty === "Confirmed").map(amount));
  const expectedEntryIncome = sum(entries.filter(entry => entry.direction === "in" && ["Expected", "Pending"].includes(entry.certainty) && entry.includeInProjection).map(amount));
  const pendingResale = sum(plan.resaleBalances.filter(balance => balance.includePendingInProjection).map(balance => balance.pending));
  const expectedIncoming = expectedEntryIncome + pendingResale;
  const confirmedOutEntries = entries.filter(entry => entry.direction === "out" && ["Available", "Confirmed"].includes(entry.certainty));
  const plannedOutEntries = entries.filter(entry => entry.direction === "out" && entry.certainty === "Estimate" && entry.includeInProjection);
  const confirmedOut = sum(confirmedOutEntries.map(amount));
  const plannedOut = sum(plannedOutEntries.map(amount));
  const moveCategories: CashCategory[] = ["Move In", "Physical Move"];
  const billsAndObligations = sum([...confirmedOutEntries, ...plannedOutEntries].filter(entry => !moveCategories.includes(entry.category)).map(amount));
  const moveAndMoveInCosts = sum([...confirmedOutEntries, ...plannedOutEntries].filter(entry => moveCategories.includes(entry.category)).map(amount));
  return {
    availableNow,
    confirmedIncoming,
    expectedIncoming,
    confirmedOut,
    plannedOut,
    billsAndObligations,
    moveAndMoveInCosts,
    conservativePosition: availableNow + confirmedIncoming - confirmedOut,
    projectedMovePosition: availableNow + confirmedIncoming + expectedIncoming - confirmedOut - plannedOut,
    unknownEntries: entries.filter(entry => entry.certainty === "Unknown" || entry.amount === undefined),
  };
}

export function markCashEntryReceived(plan: CashFlowPlan, entryId: string, receivedAt = new Date().toISOString()): CashFlowPlan {
  return {...plan, entries: plan.entries.map(entry => entry.id === entryId ? {...entry, receivedAt, includeInProjection: false} : entry)};
}
