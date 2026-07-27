import type { MoveData } from "./types";
import { seedData } from "./data";

export interface MoveRepository {
  load(): Promise<MoveData>;
  save(data: MoveData): Promise<void>;
  clear(): Promise<void>;
}

const KEY = "move-os-v1";
const migrate = (stored: MoveData): MoveData => {
  if (stored.schemaVersion >= 3 && stored.moveFund) return stored;
  if (stored.schemaVersion >= 2 && stored.moveFund) {
    const seededById = new Map(seedData.items.map(item => [item.id,item]));
    const retained = stored.items.filter(item => !seededById.has(item.id));
    return {
      ...stored, schemaVersion:3,
      profile:{...stored.profile,currentUnlock:seedData.profile.currentUnlock},
      items:[...seedData.items,...retained],
    };
  }
  return {
    ...stored,
    schemaVersion: 3,
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
