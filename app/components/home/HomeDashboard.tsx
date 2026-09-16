"use client";

import type { MoveData, MoveItem } from "../../types";
import { calculateCashFlow } from "../../domain/cash-flow";
import { deriveReadinessState } from "../../domain/readiness";
import { blocker, isDone, recommendations } from "../../priorities";

interface Props {
  data: MoveData;
  update: (data: MoveData) => void;
  editItem: (item: MoveItem) => void;
  openReadiness: (id: string) => void;
  openPreMove: () => void;
  openCashFlow: () => void;
  openApartments: () => void;
  openReferences: () => void;
}

const money = (value:number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
const compactMoney = (value:number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:1}).format(value);

export function HomeDashboard({data,update,editItem,openReadiness,openPreMove,openCashFlow,openApartments,openReferences}:Props){
  const suppressed=data.moveRoutes.filter(route=>route.state==="No Action Yet").flatMap(route=>route.relatedItemIds||[]);
  const next=recommendations(data.items.filter(item=>item.phase==="Pre-Move"),4,{suppressedItemIds:suppressed});
  const totals=calculateCashFlow(data.cashFlow);
  const watches=data.watches.filter(watch=>watch.state==="Watching").slice(0,4);
  const completed=data.items.filter(item=>isDone(item)&&item.kind!=="Reference"&&item.kind!=="Reflection").sort((a,b)=>(b.completedAt||b.updatedAt).localeCompare(a.completedAt||a.updatedAt)).slice(0,2);
  const complete=(task:MoveItem)=>update({...data,items:data.items.map(item=>item.id===task.id?{...item,status:"Done",completedAt:new Date().toISOString(),updatedAt:new Date().toISOString().slice(0,10)}:item)});
  const gateFacts=(id:string):string[]=>{
    if(id==="cash-flow")return [`${money(totals.availableNow)} available`,`${money(totals.expectedIncoming)} expected`,totals.unknownEntries.length?`${totals.unknownEntries.length} costs need numbers`:`${money(totals.projectedMovePosition)} projected left`];
    if(id==="income-proof")return ["Remote + Chicago active","Unemployment is bridge cash","Rental proof still needed"];
    if(id==="housing")return ["Chicago leading","Standard lease preferred","Sublet stays valid"];
    if(id==="move-window")return [data.profile.workingMoveWindow||"End of October","Working window—not confirmed","Housing and income may shift it"];
    if(id==="physical-move")return ["Likely: car + small trailer","Waiting for destination + address","No reservation needed yet"];
    return ["Health continuity first","Marvel records already saved","Protect the first days"];
  };
  return <div className="page memory-home">
    <header className="move-context-header">
      <div><p className="eyebrow">Randy’s Move</p><h1>Chicago leading</h1><p className="route-line">Denver + Remote remain open</p></div>
      <div className="window-note"><span>Working move window</span><b>{data.profile.workingMoveWindow||"End of October"}</b><small>A target, not a forced deadline</small></div>
    </header>
    <aside className="north-star"><span>Why I’m moving</span><p>{data.profile.reason}</p></aside>

    <section className="home-block do-next">
      <header><div><h2>Do next</h2><p>The few things that are actually worth acting on now.</p></div><button onClick={openPreMove}>View full Pre-Move plan →</button></header>
      <div className="action-list">{next.map(task=><article className="action-row" key={task.id}><button className="task-check" onClick={()=>complete(task)} aria-label={`Complete ${task.title}`}/><button className="action-copy" onClick={()=>editItem(task)}><b>{task.title}</b><small>{task.workArea}{task.dueDate?` · due ${new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(new Date(`${task.dueDate}T12:00:00`))}`:""}{blocker(task,data.items)?` · ${blocker(task,data.items)}`:""}</small></button><button className="task-open" onClick={()=>editItem(task)} aria-label={`Open ${task.title}`}>→</button></article>)}{!next.length&&<p className="calm-empty">No actionable tasks need you right now.</p>}</div>
    </section>

    <section className="home-block readiness-overview">
      <header><div><h2>Where the move stands</h2><p>The big questions that determine whether the move works.</p></div></header>
      <div className="readiness-grid">{data.readiness.map(gate=>{const state=deriveReadinessState(gate,data);return <button key={gate.id} className={`readiness-card state-${state.toLowerCase().replaceAll(" ","-")}`} onClick={()=>gate.id==="cash-flow"?openCashFlow():openReadiness(gate.id)}><div className="readiness-title"><span>{state}</span><i>→</i></div><h3>{gate.title}</h3><p>{gate.question}</p><ul>{gateFacts(gate.id).map(fact=><li key={fact}>{fact}</li>)}</ul><small>{gate.id==="cash-flow"?`Projected: ${compactMoney(totals.projectedMovePosition)}`:"Open details"}</small></button>})}</div>
    </section>

    <div className="memory-columns">
      <section className="home-block watch-block"><header><div><h2>Waiting or worth watching</h2><p>Important things I do not necessarily need to act on today.</p></div></header><div>{watches.map(watch=><article key={watch.id}><span>Watching</span><div><b>{watch.title}</b><p>{watch.reason}</p></div></article>)}{!watches.length&&<p className="calm-empty">Nothing is waiting on you here.</p>}</div></section>
      <section className="home-block decided-block"><header><div><h2>Done & decided</h2><p>Handled or figured out, so it does not need to live in your head.</p></div></header><div>{data.decisions.filter(decision=>!decision.supersededBy).slice(0,2).map(decision=><article key={decision.id}><span>Decided</span><div><b>{decision.title}: {decision.selected}</b><p>{decision.reason}</p></div></article>)}{completed.map(item=><button key={item.id} onClick={()=>editItem(item)}><span>Done</span><b>{item.title}</b></button>)}</div></section>
    </div>

    <section className="quiet-tools"><h2>Tools</h2><div><button onClick={openApartments}><b>Apartment Search</b><small>{data.apartments.length} homes saved</small></button><button onClick={openCashFlow}><b>Cash Flow</b><small>{money(totals.availableNow)} available now</small></button><button onClick={openReferences}><b>References</b><small>Context without more tasks</small></button><button disabled><b>Resale Hub Sync</b><small>Coming after the balance endpoint</small></button></div></section>
  </div>;
}
