export type Area = "Clear" | "Build" | "Become" | "Vault";
export type Status = "Not started" | "In motion" | "Waiting" | "Blocked" | "Completed" | "Deferred";
export type Priority = "Safety" | "Money" | "Income" | "Housing" | "Deadline" | "Relief" | "Someday";
export type Timing = "Now" | "Prepare early" | "After the lease" | "First 72 hours" | "After arrival" | "Allowed to wait";
export type MoveStage = "Foundation" | "Prepare" | "Decide" | "Commit" | "Move" | "Land";
export type MoveStream = "Income" | "Housing" | "Money" | "Clear" | "Health & dog" | "Become";
export type RelationshipType = "Hard dependency" | "Helpful sequence" | "Parallel" | "Decision gate" | "Deferred decision" | "Waiting on event" | "Informational";

export interface MoveItem {
  id: string; title: string; description: string; area: Area; section: string;
  status: Status; priority: Priority; dueDate?: string; cost?: number;
  dependency?: string; unlocks?: string[]; timing: Timing; notes?: string;
  parentId?: string; stage?: MoveStage; stream?: MoveStream;
  relationship?: RelationshipType; knowledgeStatus?: KnowledgeStatus;
  kind?: "Action" | "Reference" | "Reflection"; referenceFor?: string[];
  optional?: boolean;
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

export type ApartmentStatus = "Considering" | "Researching" | "Touring" | "Applied" | "Top choice" | "Passed" | "Lease signed";
export type HousingType = "Standard lease" | "Sublet";
export interface ApartmentListing {
  id: string; name: string; city: "Chicago" | "Denver" | "Other"; neighborhood: string;
  url: string; housingType: HousingType; monthlyRent: number; bedrooms: string; squareFeet?: number;
  qualities: string; incomeRequirement: string; minimumCredit?: number; applicationFee: number;
  deposit: number; petCost: number; parkingCost: number; otherMoveInCosts: number;
  moveInSpecial: string; specialSavings: number; status: ApartmentStatus; notes: string;
}

export interface MoveData {
  schemaVersion: number; profile: MoveProfile; items: MoveItem[]; moveFund: MoveFund; money: MoneyBucket[];
  routes: EmploymentRoute[]; vault: VaultEntry[]; reflections: Reflection[];
  sectionTargets: Record<string, string>;
  calendarTargets: Record<string, string>;
  apartments: ApartmentListing[];
  hideCompleted: boolean;
}
