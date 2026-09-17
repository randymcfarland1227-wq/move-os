"use client";

import { useState } from "react";
import type { MoveAssumption, MoveDecision, PlanQuestion, WatchItem } from "../../domain/plans";
import type { MoveData, MoveItem, WorkArea } from "../../types";

type CaptureKind="Something to do"|"Something I decided"|"Something I’m assuming"|"Something I need to figure out"|"Something to remember";
const kinds:CaptureKind[]=["Something to do","Something I decided","Something I’m assuming","Something I need to figure out","Something to remember"];
const planArea:Record<string,WorkArea>={"cash-flow":"Money","secure-home":"Housing","physical-move":"Logistics","continuity":"Health + Marvel"};

export function CaptureModal({data,save,close}:{data:MoveData;save:(data:MoveData)=>void;close:()=>void}){
  const [text,setText]=useState("");
  const [kind,setKind]=useState<CaptureKind>("Something to do");
  const [planId,setPlanId]=useState("");
  const plans=[...data.plans].sort((a,b)=>a.order-b.order);
  const submit=(event:React.FormEvent)=>{
    event.preventDefault();
    const id=crypto.randomUUID();const now=new Date().toISOString();const day=now.slice(0,10);
    const plan=planId||undefined;
    if(kind==="Something to do"){
      const section=data.planSections.filter(candidate=>candidate.planId===planId).sort((a,b)=>a.order-b.order)[0];
      const item:MoveItem={id,title:text,description:"",phase:"Pre-Move",type:"Task",workArea:planArea[planId]||"Admin",status:"Not Started",importance:"Normal",schedule:"This Week",kind:"Action",planId:plan,planSectionId:section?.id,actionStage:"Next",createdAt:day,updatedAt:day};
      save({...data,items:[...data.items,item]});
    }else if(kind==="Something I decided"){
      const decision:MoveDecision={id,planId:plan,title:text,selected:"Decided",decidedAt:day};save({...data,decisions:[...data.decisions,decision]});
    }else if(kind==="Something I’m assuming"){
      const assumption:MoveAssumption={id,planId:plan,title:text,value:text,confidence:"Working",updatedAt:now};save({...data,assumptions:[...data.assumptions,assumption]});
    }else if(kind==="Something I need to figure out"){
      const question:PlanQuestion={id,planId:planId,question:text,status:"Open",order:data.planQuestions.length+1};save({...data,planQuestions:[...data.planQuestions,question]});
    }else{
      const watch:WatchItem={id,planId:plan,title:text,reason:"Captured to remember; no action required yet.",state:"Watching",label:"Worth remembering"};save({...data,watches:[...data.watches,watch]});
    }
    close();
  };
  return <div className="overlay" onMouseDown={event=>event.currentTarget===event.target&&close()}><form className="modal capture-modal" onSubmit={submit}>
    <header className="modal-head"><div><small>QUICK CAPTURE</small><h2>Get it out of your head.</h2></div><button type="button" onClick={close}>×</button></header>
    <label className="field"><span>What should Move OS remember?</span><textarea autoFocus required value={text} placeholder="I need to ask my doctor what documentation I should get before moving." onChange={event=>setText(event.target.value)}/></label>
    <fieldset><legend>What kind of thing is this?</legend>{kinds.map(value=><label key={value}><input type="radio" name="capture-kind" checked={kind===value} onChange={()=>setKind(value)}/><span>{value}</span></label>)}</fieldset>
    <fieldset className="capture-plans"><legend>Which plan does this belong to?</legend>{plans.map(plan=><label key={plan.id}><input type="radio" name="capture-plan" checked={planId===plan.id} onChange={()=>setPlanId(plan.id)}/><span>{plan.title}</span></label>)}<label><input type="radio" name="capture-plan" checked={planId===""} onChange={()=>setPlanId("")}/><span>Not sure</span></label></fieldset>
    <footer className="modal-actions"><span/><button className="button" type="button" onClick={close}>Cancel</button><button className="button primary" type="submit">Capture</button></footer>
  </form></div>;
}
