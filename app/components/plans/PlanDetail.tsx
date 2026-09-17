"use client";

import { useState } from "react";
import type { MoveData, MoveItem } from "../../types";
import type { MovePlan, PlanStatus } from "../../domain/plans";
import { planRecords, upsert } from "../../domain/plans";
import { calculateCashFlow } from "../../domain/cash-flow";
import { RequirementList } from "./RequirementsSection";
import { RouteList } from "./RoutesSection";
import { PlanGuideSection } from "./PlanGuideSection";
import { QuestionsSection } from "./QuestionsSection";
import { ActionPlanSection, CompletedSection } from "./ActionPlanSection";
import { DecisionContext, WaitingSection } from "./DecisionContext";

const planStatuses:PlanStatus[]=["Planning","Active","Needs Attention","Waiting","Ready","Complete"];
const money=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);

interface Props{
  planId:string;
  data:MoveData;
  update:(data:MoveData)=>void;
  edit:(item:MoveItem)=>void;
  addTask:(partial:Partial<MoveItem>)=>void;
  back:()=>void;
  openCashFlow:()=>void;
  openApartments:()=>void;
}

export function PlanDetail({planId,data,update,edit,addTask,back,openCashFlow,openApartments}:Props){
  const [editingPlan,setEditingPlan]=useState(false);
  const plan=data.plans.find(candidate=>candidate.id===planId);
  if(!plan)return null;
  const records=planRecords(plan.id,data);
  const open=records.questions.filter(question=>question.status==="Open");
  const answered=records.questions.filter(question=>question.status==="Answered");
  const sectioned=plan.id==="secure-home";
  const loose=sectioned?records.requirements.filter(requirement=>!requirement.sectionId):records.requirements;
  const looseRoutes=sectioned?records.routes.filter(route=>!route.sectionId):records.routes;
  return <div className="page plan-doc">
    <button className="back-link" onClick={back}>← Home</button>
    <header className="plan-head">
      <p className="eyebrow">Planning workspace</p>
      <h1>{plan.title}</h1>
      <p className="plan-question">{plan.question}</p>
      <div className="plan-state"><span className={`state-pill state-${plan.status.toLowerCase().replace(" ","-")}`}>{plan.status}</span>{plan.summary&&<span>{plan.summary}</span>}<button onClick={()=>setEditingPlan(true)}>Edit plan</button></div>
    </header>

    <section className="plan-part outcome"><h2>Outcome</h2><p>{plan.outcome}</p></section>

    {plan.id==="cash-flow"&&<CashSnapshot data={data} openCashFlow={openCashFlow}/>}

    {sectioned&&<section className="plan-part journey">
      <h2>The path to a home</h2>
      <ol>{records.sections.map((section,index)=>{
        const goals=data.items.filter(item=>item.planSectionId===section.id&&(item.type==="Goal"||item.type==="Project")&&item.kind!=="Reference"&&item.kind!=="Reflection");
        const homes=data.apartments.filter(home=>["Top choice","Applied","Touring","Lease signed"].includes(home.status));
        return <li key={section.id}>
          <header><span>{index+1}</span><div><h3>{section.title}</h3>{section.description&&<p>{section.description}</p>}</div></header>
          <RouteList planId={plan.id} routes={records.routes.filter(route=>route.sectionId===section.id)} data={data} update={update} edit={edit} sections={records.sections} sectionId={section.id} compact/>
          {goals.length>0&&<div className="journey-goals">{goals.map(goal=><button key={goal.id} onClick={()=>edit(goal)}><b>{goal.title}</b><small>{goal.metric?.target?`${goal.metric.current??"Current —"} → ${goal.metric.target}${goal.metric.unit==="credit score"?"+ credit score":""}`:goal.status}</small></button>)}</div>}
          {section.id==="sh-find"&&<div className="journey-find"><button className="plan-link" onClick={openApartments}>Open Apartment Search →</button>{homes.map(home=><p key={home.id}><b>{home.name}</b> · {home.status} · {money(home.monthlyRent)}/mo</p>)}{!homes.length&&<small>{data.apartments.length} {data.apartments.length===1?"home":"homes"} saved · no top choice yet</small>}</div>}
          <RequirementList planId={plan.id} requirements={records.requirements.filter(requirement=>requirement.sectionId===section.id)} data={data} update={update} sections={records.sections} sectionId={section.id}/>
        </li>;
      })}</ol>
    </section>}

    {(!sectioned||loose.length>0)&&<section className="plan-part"><h2>What needs to be true</h2><RequirementList planId={plan.id} requirements={loose} data={data} update={update} sections={records.sections}/></section>}

    {(!sectioned||looseRoutes.length>0)&&<section className="plan-part"><h2>{plan.id==="physical-move"?"Routes I've considered":plan.id==="continuity"?"Potential routes":"Routes / options"}</h2><RouteList planId={plan.id} routes={looseRoutes} data={data} update={update} edit={edit} sections={records.sections}/></section>}

    <PlanGuideSection guide={records.guide} answered={answered} data={data} update={update}/>
    <QuestionsSection planId={plan.id} questions={open} data={data} update={update}/>
    <ActionPlanSection planId={plan.id} data={data} update={update} edit={edit} addTask={()=>addTask({planId:plan.id,planSectionId:records.sections[0]?.id,actionStage:"Now"})}/>
    <WaitingSection planId={plan.id} watches={records.watches} data={data} update={update}/>
    <CompletedSection planId={plan.id} data={data} update={update} edit={edit}/>
    <DecisionContext decisions={records.decisions} assumptions={records.assumptions}/>

    {editingPlan&&<PlanEditor plan={plan} close={()=>setEditingPlan(false)} save={next=>{update({...data,plans:upsert(data.plans,{...next,updatedAt:new Date().toISOString().slice(0,10)})});setEditingPlan(false)}}/>}
  </div>;
}

function CashSnapshot({data,openCashFlow}:{data:MoveData;openCashFlow:()=>void}){
  const totals=calculateCashFlow(data.cashFlow);
  return <section className="plan-part cash-snapshot">
    <h2>Current state</h2>
    <dl>
      <div><dt>Available now</dt><dd>{money(totals.availableNow)}</dd></div>
      <div><dt>Expected incoming</dt><dd>{money(totals.confirmedIncoming+totals.expectedIncoming)}</dd></div>
      <div><dt>Conservative position</dt><dd>{money(totals.conservativePosition)}</dd></div>
      <div><dt>Projected move position</dt><dd>{money(totals.projectedMovePosition)}</dd></div>
    </dl>
    {totals.unknownEntries.length>0&&<p className="plan-lede">{totals.unknownEntries.length} {totals.unknownEntries.length===1?"cost still needs":"costs still need"} a real number: {totals.unknownEntries.map(entry=>entry.label).join(", ")}.</p>}
    <button className="plan-link" onClick={openCashFlow}>Open the Cash Flow tool →</button>
  </section>;
}

function PlanEditor({plan,close,save}:{plan:MovePlan;close:()=>void;save:(plan:MovePlan)=>void}){
  const [draft,setDraft]=useState(plan);
  return <div className="overlay" onMouseDown={event=>event.currentTarget===event.target&&close()}><form className="modal compact-modal plan-editor" onSubmit={event=>{event.preventDefault();save(draft)}}>
    <header className="modal-head"><div><small>PLAN</small><h2>Edit {plan.title}</h2></div><button type="button" onClick={close} aria-label="Close">×</button></header>
    <div className="form-grid"><label className="field"><span>Current state</span><select value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value as PlanStatus})}>{planStatuses.map(status=><option key={status}>{status}</option>)}</select></label><label className="field"><span>One-line state note</span><input value={draft.summary||""} placeholder="No booking needed yet." onChange={event=>setDraft({...draft,summary:event.target.value||undefined})}/></label></div>
    <label className="field"><span>Guiding question</span><textarea value={draft.question} onChange={event=>setDraft({...draft,question:event.target.value})}/></label>
    <label className="field"><span>Outcome</span><textarea value={draft.outcome} onChange={event=>setDraft({...draft,outcome:event.target.value})}/></label>
    <footer className="modal-actions"><span/><button type="button" className="button secondary" onClick={close}>Cancel</button><button type="submit" className="button primary">Save</button></footer>
  </form></div>;
}
