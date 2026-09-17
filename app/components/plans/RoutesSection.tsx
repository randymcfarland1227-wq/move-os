"use client";

import { useState } from "react";
import type { MoveData, MoveItem } from "../../types";
import type { PlanRoute, PlanSection } from "../../domain/plans";
import { removeById, upsert } from "../../domain/plans";
import { RouteEditor } from "./PlanEditors";

const money=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
const statusOrder=["Chosen","Leading","Considering","Backup","Rejected"];

export function RouteList({planId,routes,data,update,edit,sections=[],sectionId,compact=false}:{planId:string;routes:PlanRoute[];data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void;sections?:PlanSection[];sectionId?:string;compact?:boolean}){
  const [editing,setEditing]=useState<{record:PlanRoute;isNew:boolean}|null>(null);
  const today=new Date().toISOString().slice(0,10);
  const sorted=[...routes].sort((a,b)=>statusOrder.indexOf(a.status)-statusOrder.indexOf(b.status));
  const related=(route:PlanRoute)=>data.items.filter(item=>item.type==="Task"&&(item.routeId===route.id||route.relatedTaskIds?.includes(item.id))&&item.status!=="Done");
  return <>
    <div className={`route-list-plan${compact?" compact":""}`}>{sorted.map(route=>{const actions=related(route);return <article key={route.id} className={`route-${route.status.toLowerCase()}`}>
      <header><span>{route.status}</span><button onClick={()=>setEditing({record:route,isNew:false})}>Edit →</button></header>
      <h3>{route.title}</h3>
      {route.summary&&<p>{route.summary}</p>}
      {!compact&&route.whyItCouldWork&&<dl><dt>Why it could work</dt><dd>{route.whyItCouldWork}</dd></dl>}
      {!compact&&route.concerns&&<dl><dt>Concerns</dt><dd>{route.concerns}</dd></dl>}
      {!compact&&(route.estimatedCost!==undefined||route.costStatus)&&<dl><dt>Estimated cost</dt><dd>{route.estimatedCost!==undefined?money(route.estimatedCost):""}{route.estimatedCost!==undefined&&route.costStatus?" · ":""}{route.costStatus}</dd></dl>}
      {!compact&&route.notes&&<dl><dt>Notes</dt><dd>{route.notes}</dd></dl>}
      {actions.length>0&&<div className="route-actions">{actions.slice(0,3).map(item=><button key={item.id} onClick={()=>edit(item)}>○ {item.title}</button>)}</div>}
    </article>})}</div>
    {!routes.length&&!compact&&<p className="plan-empty">No routes recorded yet.</p>}
    <button className="plan-add" onClick={()=>setEditing({record:{id:crypto.randomUUID(),planId,sectionId,title:"",status:"Considering",createdAt:today,updatedAt:today},isNew:true})}>＋ Add route / option</button>
    {editing&&<RouteEditor record={editing.record} isNew={editing.isNew} sections={sections} onSave={record=>{update({...data,planRoutes:upsert(data.planRoutes,record)});setEditing(null)}} onDelete={()=>{update({...data,planRoutes:removeById(data.planRoutes,editing.record.id)});setEditing(null)}} onClose={()=>setEditing(null)}/>}
  </>;
}
