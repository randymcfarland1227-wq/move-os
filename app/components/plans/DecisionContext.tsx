"use client";

import { useState } from "react";
import type { MoveData } from "../../types";
import type { MoveAssumption, MoveDecision, WatchItem } from "../../domain/plans";
import { removeById, upsert } from "../../domain/plans";
import { WatchEditor } from "./PlanEditors";

export function WaitingSection({planId,watches,data,update}:{planId:string;watches:WatchItem[];data:MoveData;update:(data:MoveData)=>void}){
  const [editing,setEditing]=useState<{record:WatchItem;isNew:boolean}|null>(null);
  return <section className="plan-part">
    <h2>Waiting on</h2>
    <ul className="waiting-list">{watches.map(watch=><li key={watch.id}><button onClick={()=>setEditing({record:watch,isNew:false})}><span>{watch.label||"Waiting on"}</span><b>{watch.title}</b><small>{watch.reason}</small></button></li>)}</ul>
    {!watches.length&&<p className="plan-empty">Not waiting on anything outside your control.</p>}
    <button className="plan-add" onClick={()=>setEditing({record:{id:crypto.randomUUID(),planId,title:"",reason:"",state:"Watching",label:"Waiting on"},isNew:true})}>＋ Add something you're waiting on</button>
    {editing&&<WatchEditor record={editing.record} isNew={editing.isNew} onSave={record=>{update({...data,watches:upsert(data.watches,record)});setEditing(null)}} onDelete={()=>{update({...data,watches:removeById(data.watches,editing.record.id)});setEditing(null)}} onClose={()=>setEditing(null)}/>}
  </section>;
}

export function DecisionContext({decisions,assumptions}:{decisions:MoveDecision[];assumptions:MoveAssumption[]}){
  if(!decisions.length&&!assumptions.length)return null;
  return <section className="plan-part">
    <h2>Decisions & assumptions</h2>
    <dl className="decision-list">
      {decisions.map(decision=><div key={decision.id}><dt><span>Decided</span>{decision.title}</dt><dd><b>{decision.selected}</b>{decision.reason&&<small>{decision.reason}</small>}</dd></div>)}
      {assumptions.map(assumption=><div key={assumption.id}><dt><span>{assumption.confidence}</span>{assumption.title}</dt><dd><b>{assumption.value}</b>{assumption.notes&&<small>{assumption.notes}</small>}</dd></div>)}
    </dl>
  </section>;
}
