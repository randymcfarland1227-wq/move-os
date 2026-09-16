export type MovePhase = "Pre-Move" | "Post-Move";
export type ItemType = "Goal" | "Project" | "Task";
export type Status = "Not Started" | "In Progress" | "Blocked" | "Done";
export type Importance = "Normal" | "Important";
export type PreMoveArea = "Money" | "Income" | "Housing" | "Packing" | "Logistics" | "Health + Marvel" | "Admin" | "People + Closure";
export type PostMoveArea = "Home Setup" | "Admin" | "Money" | "Health + Marvel" | "Community" | "Settling In";
export type WorkArea = PreMoveArea | PostMoveArea;
export type Schedule = "Now" | "This Week" | "Later" | "First 72 Hours" | "First Week" | "First Month";

// Optional compatibility fields let old browser data migrate without losing detail.
export type Area = "Clear" | "Build" | "Become" | "Vault";
export type Priority = "Safety" | "Money" | "Income" | "Housing" | "Deadline" | "Relief" | "Someday";
export type Timing = "Now" | "Prepare early" | "After the lease" | "First 72 hours" | "After arrival" | "Allowed to wait";
export type MoveStage = "Foundation" | "Prepare" | "Decide" | "Commit" | "Move" | "Land";
export type MoveStream = "Income" | "Housing" | "Money" | "Clear" | "Health & dog" | "Become";
export type RelationshipType = "Hard dependency" | "Helpful sequence" | "Parallel" | "Decision gate" | "Deferred decision" | "Waiting on event" | "Informational";
export type KnowledgeStatus = "Known" | "Estimate" | "Need to think" | "Need information" | "Waiting on event" | "Decided" | "Not applicable";

export interface GoalMetric { current?: number; target?: number; unit?: string; }
export interface ProjectDecision { prompt: string; options: string[]; selected?: string; deadline?: string; }

export interface MoveItem {
  id: string;
  title: string;
  description: string;
  phase: MovePhase;
  type: ItemType;
  workArea: WorkArea;
  status: Status;
  importance: Importance;
  dueDate?: string;
  notes?: string;
  parentId?: string;
  dependency?: string;
  blocker?: string;
  schedule?: Schedule;
  optional?: boolean;
  metric?: GoalMetric;
  decision?: ProjectDecision;
  sortOrder?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Supporting content and legacy fields are not part of the main UI taxonomy.
  kind?: "Action" | "Reference" | "Reflection";
  referenceFor?: string[];
  area?: Area;
  section?: string;
  priority?: Priority;
  timing?: Timing;
  cost?: number;
  unlocks?: string[];
  stage?: MoveStage;
  stream?: MoveStream;
  relationship?: RelationshipType;
  knowledgeStatus?: KnowledgeStatus;
}

export interface MoveProfile {
  reason: string;
  destination: string;
  targetMoveDate: string;
  backupDate: string;
  phase: string;
  currentUnlock: string;
  protectedMonth: boolean;
}

export interface MoveFund {
  current: number;
  workingTarget: number;
  fullTarget: number;
  status: KnowledgeStatus;
  source: string;
  confirmedAt: string;
}
export interface MoneyBucket {
  id: string;
  label: string;
  current: number;
  target: number;
  included: string;
  status: KnowledgeStatus;
  source: string;
  uncertain?: string;
}
export interface EmploymentRoute { id: string; name: string; subtitle: string; active: boolean; status: string; details: string[]; }
export interface VaultEntry { id: string; title: string; category: string; url: string; date: string; notes: string; attachedTo?: string[]; }
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
  sectionTargets: Record<string, string>; calendarTargets: Record<string, string>;
  apartments: ApartmentListing[]; hideCompleted: boolean;
}

export type SyncMode = "local" | "sheet" | "offline";
export interface SyncState { mode: SyncMode; label: string; lastSyncedAt?: string; pending: boolean; error?: string; }
