import type { MoveItem } from "./types";

export const isDone=(item:MoveItem)=>item.status==="Done";
export const isAction=(item:MoveItem)=>(!item.kind||item.kind==="Action")&&item.type==="Task";
export const isWorkItem=(item:MoveItem)=>!item.kind||item.kind==="Action";

export const blocker=(item:MoveItem,all:MoveItem[])=>{
  if(item.blocker) return item.blocker;
  if(!item.dependency) return undefined;
  const prerequisite=all.find(candidate=>candidate.id===item.dependency);
  return prerequisite&&!isDone(prerequisite)?`Waiting for ${prerequisite.title}`:undefined;
};

export interface RecommendationOptions { suppressedItemIds?: string[]; }

export const taskScore=(item:MoveItem,all:MoveItem[],options:RecommendationOptions={})=>{
  if(!isAction(item)||isDone(item)||item.optional||item.schedule==="Later"||blocker(item,all)||options.suppressedItemIds?.includes(item.id)) return -1000;
  let value=0;
  const language=`${item.title} ${item.description}`.toLowerCase();
  if(/fee|legal|claim|payment|overdue|damage/.test(language)) value+=52;
  if(item.workArea==="Housing"||/landlord|rental|apartment|income proof|verification/.test(language)) value+=44;
  if(item.workArea==="Income"||/job|role|employment|apply/.test(language)) value+=38;
  if(/medication|vyvanse|prescription|refill|provider|pharmacy|continuity/.test(language)) value+=42;
  if(item.status==="In Progress") value+=35;
  if(item.importance==="Important") value+=28;
  if(item.unlocks?.length) value+=Math.min(item.unlocks.length*10,30);
  if(item.dueDate){
    const days=Math.ceil((new Date(`${item.dueDate}T23:59:59`).getTime()-Date.now())/86400000);
    if(days<0) value+=100;
    else if(days<=3) value+=70;
    else if(days<=7) value+=50;
    else if(days<=21) value+=20;
  }
  if(item.schedule==="Now") value+=24;
  if(item.schedule==="This Week") value+=12;
  return value-(item.sortOrder||0)/1000;
};

export const recommendations=(items:MoveItem[],limit=5,options:RecommendationOptions={})=>items
  .filter(item=>taskScore(item,items,options)>-1000)
  .sort((a,b)=>taskScore(b,items,options)-taskScore(a,items,options))
  .slice(0,limit);

export const childProgress=(item:MoveItem,all:MoveItem[])=>{
  const children=all.filter(candidate=>candidate.parentId===item.id&&isWorkItem(candidate));
  const tasks=children.flatMap(child=>child.type==="Task"?[child]:all.filter(candidate=>candidate.parentId===child.id&&candidate.type==="Task"&&isWorkItem(candidate)));
  return {done:tasks.filter(isDone).length,total:tasks.length};
};
