export type Area = "Clear" | "Build" | "Become" | "Vault";
export type Status = "Not started" | "In motion" | "Waiting" | "Blocked" | "Good enough" | "Secure" | "Settled" | "Carry forward" | "Released";
export type Priority = "Safety" | "Money" | "Income" | "Housing" | "Deadline" | "Relief" | "Someday";
export type Timing = "Now" | "Prepare early" | "After the lease" | "First 72 hours" | "After arrival" | "Allowed to wait";

export interface MoveItem {
  id: string; title: string; description: string; area: Area; section: string;
  status: Status; priority: Priority; dueDate?: string; cost?: number;
  dependency?: string; unlocks?: string[]; timing: Timing; notes?: string;
  createdAt: string; updatedAt: string;
}

export interface MoveProfile {
  reason: string; destination: string; targetMoveDate: string; backupDate: string;
  phase: string; currentUnlock: string; protectedMonth: boolean;
}

export type KnowledgeStatus = "Known" | "Estimate" | "Need to think" | "Need information" | "Waiting on event" | "Decided" | "Not applicable";
export interface MoveFund {
  current: number; workingTarget: number; fullTarget: number;
  status: KnowledgeStatus; source: string; confirmedAt: string;
}
export interface MoneyBucket {
  id: string; label: string; current: number; target: number; included: string;
  status: KnowledgeStatus; source: string; uncertain?: string;
}
export interface EmploymentRoute { id: string; name: string; subtitle: string; active: boolean; status: string; details: string[]; }
export interface VaultEntry { id: string; title: string; category: string; url: string; date: string; notes: string; }
export interface Reflection { id: string; prompt: string; value: string; }

export interface MoveData {
  schemaVersion: number; profile: MoveProfile; items: MoveItem[]; moveFund: MoveFund; money: MoneyBucket[];
  routes: EmploymentRoute[]; vault: VaultEntry[]; reflections: Reflection[];
}
