"use client";

import type { MoveData, MoveItem } from "../../types";
import { gateGoals, milestoneReached, MILESTONES } from "../../domain/gates";

const money=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
const isoToday=()=>new Date().toISOString().slice(0,10);

function progress(goal:MoveItem,data:MoveData){
  if(goal.id==="save-for-move"){
    const target=data.moveFund.workingTarget;
    return {label:target?`${money(data.moveFund.current)} of ${money(target)} saved`:`${money(data.moveFund.current)} saved · target not set`,percent:target?Math.min(100,Math.round(data.moveFund.current/target*100)):undefined};
  }
  if(goal.metric?.target) return {label:`${goal.metric.current??"—"} → ${goal.metric.target}${goal.metric.unit?` ${goal.metric.unit}`:""}`,percent:goal.metric.current!==undefined?Math.min(100,Math.round(goal.metric.current/goal.metric.target*100)):undefined};
  return {label:goal.id==="income-evidence"?"Proof needed: offer letter or pay stubs":goal.status,percent:undefined};
}

/** The three goals that gate the move. Randy marks each one reached himself. */
export function GateGoals({data,update,edit}:{data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void}){
  const goals=gateGoals(data);
  const reached=goals.filter(goal=>goal.status==="Done").length;
  const setReached=(goal:MoveItem,done:boolean)=>update({...data,items:data.items.map(item=>item.id===goal.id?{...item,status:done?"Done":"In Progress",completedAt:done?new Date().toISOString():undefined,updatedAt:isoToday()}:item)});
  const ready=milestoneReached("ready-to-search",data.items);
  const lease=milestoneReached("lease-signed",data.items);
  return <section className="home-block gate-goals">
    <header><div><h2>Three goals first</h2><p>Work on these in parallel. When all three are reached, apartment search and the rest of the move unlock.</p></div></header>
    <div className="gate-goal-list">{goals.map(goal=>{
      const done=goal.status==="Done";
      const info=progress(goal,data);
      return <article key={goal.id} className={`gate-goal${done?" reached":""}`}>
        <button type="button" className="gate-goal-copy" onClick={()=>edit(goal)}>
          <span className="gate-goal-kicker">{done?"Reached":"Goal"}</span>
          <b>{goal.title}</b>
          <small>{info.label}</small>
          {info.percent!==undefined&&<span className="gate-bar" aria-hidden="true"><i style={{width:`${info.percent}%`}}/></span>}
        </button>
        <button type="button" className="gate-goal-toggle" onClick={()=>setReached(goal,!done)}>{done?"Reopen":"Mark reached"}</button>
      </article>;
    })}</div>
    <ol className="milestones">
      <li className={ready?"met":""}><b>{MILESTONES[0].title}</b><span>{ready?"Unlocked":`${reached} of ${goals.length} goals reached`}</span></li>
      <li className={lease?"met":""}><b>{MILESTONES[1].title}</b><span>{lease?"Unlocked":ready?"Next: apply and sign":"After Ready to search"}</span></li>
    </ol>
  </section>;
}
