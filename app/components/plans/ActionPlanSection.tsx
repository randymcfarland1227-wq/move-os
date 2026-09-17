"use client";

import type { MoveData, MoveItem } from "../../types";
import { actionPlan } from "../../domain/plans";
import { TaskLine } from "../tasks/TaskLine";

export function ActionPlanSection({planId,data,update,edit,addTask}:{planId:string;data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void;addTask:()=>void}){
  const plan=actionPlan(planId,data);
  const line=(item:MoveItem)=><TaskLine key={item.id} item={item} data={data} update={update} edit={edit} showContext={false}/>;
  const nothingNow=!plan.now.length&&!plan.next.length;
  return <section className="plan-part action-plan">
    <h2>Action plan</h2>
    {plan.now.length>0&&<div className="stage"><h3>Now</h3>{plan.now.map(line)}</div>}
    {plan.next.length>0&&<div className="stage"><h3>Next</h3>{plan.next.map(line)}</div>}
    {plan.triggered.map(group=><div className="stage triggered" key={group.trigger}><h3>{group.trigger}</h3>{group.items.map(line)}</div>)}
    {nothingNow&&<p className="plan-empty">{plan.triggered.length?"No other action needed yet.":"No current action required."}</p>}
    {plan.later.length>0&&<details className="stage later"><summary><h3>Later</h3><span>{plan.later.length} captured {plan.later.length===1?"item":"items"}</span></summary>{plan.later.map(line)}</details>}
    <button className="plan-add" onClick={addTask}>＋ Add task</button>
  </section>;
}

export function CompletedSection({planId,data,update,edit}:{planId:string;data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void}){
  const done=actionPlan(planId,data).done;
  if(!done.length)return null;
  return <section className="plan-part handled">
    <h2>Already handled</h2>
    <ul className="handled-list">{done.map(item=><li key={item.id}><TaskLine item={item} data={data} update={update} edit={edit} showContext={false}/></li>)}</ul>
  </section>;
}
