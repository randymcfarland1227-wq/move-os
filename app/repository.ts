import type { MoveData, Status } from "./types";
import { seedData } from "./data";

export interface MoveRepository {
  load(): Promise<MoveData>;
  save(data: MoveData): Promise<void>;
  clear(): Promise<void>;
}

const KEY = "move-os-v1";
const simplifyStatus = (status: string): Status => {
  if (["Good enough","Secure","Settled","Released","Completed"].includes(status)) return "Completed";
  if (["Carry forward","Deferred"].includes(status)) return "Deferred";
  if (["Not started","In motion","Waiting","Blocked"].includes(status)) return status as Status;
  return "Not started";
};
const migrate = (stored: MoveData): MoveData => {
  if (stored.schemaVersion >= 7 && stored.moveFund) return stored;
  if (stored.schemaVersion >= 6 && stored.moveFund) {
    const seededById = new Map(seedData.items.map(item => [item.id,item]));
    return {...stored,schemaVersion:7,calendarTargets:{...seedData.calendarTargets,...stored.calendarTargets},items:stored.items.map(item=>{const seeded=seededById.get(item.id);return {...item,kind:seeded?.kind||item.kind||"Action",referenceFor:seeded?.referenceFor||item.referenceFor};})};
  }
  if (stored.schemaVersion >= 5 && stored.moveFund) {
    const seededById = new Map(seedData.items.map(item => [item.id,item]));
    return {
      ...stored,
      schemaVersion: 7,
      calendarTargets: structuredClone(seedData.calendarTargets),
      sectionTargets: {...seedData.sectionTargets,...stored.sectionTargets},
      items: stored.items.map(item => {
        const seeded=seededById.get(item.id);
        return {...item,kind:seeded?.kind||item.kind||"Action",referenceFor:seeded?.referenceFor||item.referenceFor};
      }),
    };
  }
  if (stored.schemaVersion >= 4 && stored.moveFund) return {
    ...stored,
    schemaVersion: 7,
    calendarTargets: structuredClone(seedData.calendarTargets),
    sectionTargets: structuredClone(seedData.sectionTargets),
    items: stored.items.map(item => ({...item,status:simplifyStatus(item.status)})),
  };
  if (stored.schemaVersion >= 3 && stored.moveFund) {
    const customItems = stored.items.filter(item => !seedData.items.some(seed => seed.id === item.id));
    return {
      ...structuredClone(seedData),
      items: [...structuredClone(seedData.items), ...customItems.map(item=>({...item,status:simplifyStatus(item.status)}))],
      vault: stored.vault?.filter(entry => !["v1","v2"].includes(entry.id)).length
        ? [...structuredClone(seedData.vault), ...stored.vault.filter(entry => !["v1","v2"].includes(entry.id))]
        : structuredClone(seedData.vault),
      schemaVersion: 7,
    };
  }
  if (stored.schemaVersion >= 2 && stored.moveFund) {
    const seededById = new Map(seedData.items.map(item => [item.id,item]));
    const retained = stored.items.filter(item => !seededById.has(item.id));
    return {
      ...stored, schemaVersion:7, sectionTargets:structuredClone(seedData.sectionTargets), calendarTargets:structuredClone(seedData.calendarTargets),
      profile:{...stored.profile,currentUnlock:seedData.profile.currentUnlock},
      items:[...seedData.items,...retained.map(item=>({...item,status:simplifyStatus(item.status)}))],
    };
  }
  return {
    ...stored,
    schemaVersion: 7,
    calendarTargets: structuredClone(seedData.calendarTargets),
    sectionTargets: structuredClone(seedData.sectionTargets),
    profile: {...stored.profile, targetMoveDate:"2026-10-24", backupDate:"2026-10-31"},
    moveFund: structuredClone(seedData.moveFund),
    money: structuredClone(seedData.money),
    items: structuredClone(seedData.items),
  };
};
export class LocalMoveRepository implements MoveRepository {
  async load() {
    if (typeof window === "undefined") return seedData;
    const stored = window.localStorage.getItem(KEY);
    return stored ? migrate(JSON.parse(stored) as MoveData) : structuredClone(seedData);
  }
  async save(data: MoveData) { window.localStorage.setItem(KEY, JSON.stringify(data)); }
  async clear() { window.localStorage.removeItem(KEY); }
}

// A future GoogleSheetsMoveRepository can implement this same interface.
export const moveRepository: MoveRepository = new LocalMoveRepository();
