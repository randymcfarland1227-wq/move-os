import type { MoveItem } from "./types";

const weights = { Safety:100, Money:90, Income:80, Housing:70, Deadline:60, Relief:35, Someday:5 };
export const isDone = (item: MoveItem) => item.status === "Completed";
export const blocker = (item: MoveItem, all: MoveItem[]) => {
  if (!item.dependency || item.relationship !== "Hard dependency") return undefined;
  const dependency = all.find(candidate => candidate.id === item.dependency);
  return dependency && !isDone(dependency) ? `Waiting for “${dependency.title}”` : undefined;
};
export const score = (item: MoveItem, all: MoveItem[]) => {
  if (isDone(item) || item.timing === "Allowed to wait" || blocker(item, all)) return -100;
  let value = weights[item.priority];
  value += (item.unlocks?.length || 0) * 12;
  if (item.dueDate) {
    const days = (new Date(item.dueDate).getTime() - Date.now()) / 86400000;
    if (days < 30) value += 25;
  }
  if (item.status === "In motion") value += 8;
  return value;
};
export const recommendations = (items: MoveItem[]) =>
  (["Clear","Build","Become"] as const).map(area =>
    items.filter(item => item.area === area).sort((a,b) => score(b,items) - score(a,items))[0]
  ).filter(Boolean) as MoveItem[];
