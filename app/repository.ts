import type { MoveData } from "./types";
import { seedData } from "./data";

export interface MoveRepository {
  load(): Promise<MoveData>;
  save(data: MoveData): Promise<void>;
  clear(): Promise<void>;
}

const KEY = "move-os-v1";
export class LocalMoveRepository implements MoveRepository {
  async load() {
    if (typeof window === "undefined") return seedData;
    const stored = window.localStorage.getItem(KEY);
    return stored ? JSON.parse(stored) as MoveData : structuredClone(seedData);
  }
  async save(data: MoveData) { window.localStorage.setItem(KEY, JSON.stringify(data)); }
  async clear() { window.localStorage.removeItem(KEY); }
}

// A future GoogleSheetsMoveRepository can implement this same interface.
export const moveRepository: MoveRepository = new LocalMoveRepository();
