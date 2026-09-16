"use client";

import type { MoveData, MoveItem } from "../../types";
import { deriveReadinessState } from "../../domain/readiness";
import { blocker, isDone } from "../../priorities";

export function ReadinessDetail({gateId,data,update,editItem,back,openCashFlow}:{gateId:string;data:MoveData;update:(data:MoveData)=>void;editItem:(item:MoveItem)=>void;back:()=>void;openCashFlow:()=>void}){
  const gate=data.readiness.find(candidate=>candidate.id===gateId);
  if(!gate)return null;
  const routes=data.moveRoutes.filter(route=>route.readinessGateId===gate.id);
  const related=data.items.filter(item=>gate.relatedItemIds?.includes(item.id));
  const watches=data.watches.filter(watch=>gate.watchIds?.includes(watch.id)&&watch.state==="Watching");
  const context=[...data.decisions.filter(item=>item.affects?.some(value=>gate.title.includes(value)||gate.question.includes(value))),...data.assumptions.filter(item=>item.affects?.some(value=>gate.title.includes(value)||gate.question.includes(value)))];
  const toggle=(task:MoveItem)=>update({...data,items:data.items.map(item=>item.id===task.id?{...item,status:isDone(item)?"Not Started":"Done",completedAt:isDone(item)?undefined:new Date().toISOString(),updatedAt:new Date().toISOString().slice(0,10)}:item)});
  return <div className="page readiness-detail"><button className="back-link" onClick={back}>← Where the move stands</button><header><span>{deriveReadinessState(gate,data)}</span><h1>{gate.title}</h1><p>{gate.question}</p></header>{gate.id==="cash-flow"&&<button className="primary-route" onClick={openCashFlow}>Open Cash Flow →</button>}
    {routes.length>0&&<section><div className="section-heading"><h2>Routes in play</h2><p>Different ways this question may become workable.</p></div><div className="route-cards">{routes.map(route=><article key={route.id}><div><span>{route.priority||"Route"}</span><i>{route.state}</i></div><h3>{route.title}</h3><p>{route.purpose}</p>{route.fallbackTrigger&&<small>Use when: {route.fallbackTrigger}</small>}{route.nextTaskId&&data.items.find(item=>item.id===route.nextTaskId)&&<button onClick={()=>editItem(data.items.find(item=>item.id===route.nextTaskId)!)}>Next: {data.items.find(item=>item.id===route.nextTaskId)!.title} →</button>}</article>)}</div></section>}
    <section><div className="section-heading"><h2>Work connected to this</h2><p>Only concrete work belongs here.</p></div><div className="detail-action-list">{related.map(item=><article key={item.id} className={isDone(item)?"done":""}>{item.type==="Task"?<button className="task-check" onClick={()=>toggle(item)}>{isDone(item)?"✓":""}</button>:<span className="structure-mark">{item.type}</span>}<button onClick={()=>editItem(item)}><b>{item.title}</b><small>{item.type} · {item.status}{blocker(item,data.items)?` · ${blocker(item,data.items)}`:""}</small></button></article>)}{!related.length&&<p className="calm-empty">No actionable tasks here right now.</p>}</div></section>
    {(watches.length>0||context.length>0)&&<section><div className="section-heading"><h2>What the system is remembering</h2><p>Context—not more work.</p></div><div className="remembered-context">{watches.map(item=><article key={item.id}><span>Watching</span><b>{item.title}</b><p>{item.reason}</p></article>)}{context.map(item=><article key={item.id}><span>{"selected" in item?"Decided":item.confidence}</span><b>{item.title}</b><p>{"selected" in item?item.selected:item.value}</p></article>)}</div></section>}
  </div>;
}
