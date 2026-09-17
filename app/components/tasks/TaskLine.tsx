"use client";

import type { MoveData, MoveItem } from "../../types";
import { MAX_PINNED, planContext, stageOf, togglePin, toggleDone, triggerLabel } from "../../domain/plans";

const shortDate=(value:string)=>new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(new Date(`${value}T12:00:00`));

export function TaskLine({item,data,update,edit,showContext=true,showTrigger=false}:{item:MoveItem;data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void;showContext?:boolean;showTrigger?:boolean}){
  const done=item.status==="Done";
  const pinnedCount=data.items.filter(candidate=>candidate.pinnedToFocus&&candidate.status!=="Done").length;
  const canPin=item.pinnedToFocus||pinnedCount<MAX_PINNED;
  const triggered=!done&&stageOf(item,data.items)==="Triggered";
  const meta=[
    showContext?planContext(item,data):null,
    item.dueDate&&!done?`Due ${shortDate(item.dueDate)}`:null,
    showTrigger&&triggered?triggerLabel(item,data.items,data.planRequirements):null,
    item.status==="In Progress"?"In progress":null,
  ].filter(Boolean).join(" · ");
  return <div className={`task-line${done?" done":""}${item.pinnedToFocus?" pinned":""}`}>
    <button className="task-check" onClick={()=>update(toggleDone(data,item.id))} aria-label={done?`Mark ${item.title} not done`:`Complete ${item.title}`}>{done?"✓":""}</button>
    <button className="task-line-copy" onClick={()=>edit(item)}><b>{item.title}</b>{meta&&<small>{meta}</small>}</button>
    {!done&&<button className="pin-toggle" disabled={!canPin} title={item.pinnedToFocus?"Unpin from Current Focus":canPin?"Pin to Current Focus":`Current Focus holds ${MAX_PINNED} pinned tasks`} aria-pressed={!!item.pinnedToFocus} onClick={()=>update(togglePin(data,item.id))}>{item.pinnedToFocus?"Pinned":"Pin"}</button>}
  </div>;
}
