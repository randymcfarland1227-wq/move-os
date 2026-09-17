"use client";

import type { MoveData } from "../../types";
import type { MovePlan } from "../../domain/plans";
import { actionPlan, planRecords } from "../../domain/plans";
import { calculateCashFlow } from "../../domain/cash-flow";

const money=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
const plural=(count:number,word:string)=>`${count} ${word}${count===1?"":"s"}`;

function facts(plan:MovePlan,data:MoveData):string[]{
  const records=planRecords(plan.id,data);
  const live=records.routes.filter(route=>route.status!=="Rejected");
  const openQuestions=records.questions.filter(question=>question.status==="Open").length;
  const notMet=records.requirements.filter(requirement=>requirement.status==="Not Yet"||requirement.status==="Unknown");
  if(plan.id==="cash-flow"){
    const totals=calculateCashFlow(data.cashFlow);
    return [`${money(totals.availableNow)} available now`,`Projected position: ${money(totals.projectedMovePosition)}`,totals.unknownEntries.length?`${plural(totals.unknownEntries.length,"cost")} still unknown`:"All known costs have numbers"];
  }
  if(plan.id==="secure-home"){
    const leadingIncome=records.routes.filter(route=>route.sectionId==="sh-qualify"&&route.status==="Leading").map(route=>route.title.replace(" Role","").replace("Fully ",""));
    const housing=records.routes.filter(route=>route.sectionId==="sh-route");
    const preferred=housing.find(route=>route.status==="Chosen"||route.status==="Leading");
    const fallback=housing.find(route=>route.status==="Backup");
    return [leadingIncome.length?`${leadingIncome.join(" + ")} searches active`:"Qualification path not started",preferred?`${preferred.title} preferred`:"Housing route open",fallback?`${fallback.title} available as fallback`:`${plural(notMet.length,"requirement")} still open`];
  }
  if(plan.id==="physical-move"){
    const address=records.requirements.find(requirement=>requirement.id==="req-final-address");
    return [`${plural(live.length,"route")} considered`,address&&address.status!=="Met"?"Final address still needed":`${plural(openQuestions,"open question")}`,actionPlan(plan.id,data).now.length?`${plural(actionPlan(plan.id,data).now.length,"action")} now`:"No booking required yet"];
  }
  return [`${plural(notMet.length,"requirement")} not yet in place`,`${plural(live.length,"route")} being considered`,`${plural(openQuestions,"open question")}`];
}

export function BigPlanOverview({data,openPlan}:{data:MoveData;openPlan:(id:string)=>void}){
  const plans=[...data.plans].sort((a,b)=>a.order-b.order);
  return <section className="home-block big-plan">
    <header><div><h2>The big plan</h2><p>The four parts of the move that need real planning.</p></div></header>
    <div className="big-plan-list">{plans.map(plan=>{
      const next=actionPlan(plan.id,data).now[0];
      return <button key={plan.id} className={`big-plan-card state-${plan.status.toLowerCase().replace(" ","-")}`} onClick={()=>openPlan(plan.id)}>
        <div className="big-plan-top"><span className="state-pill">{plan.status}</span><i>Open plan →</i></div>
        <h3>{plan.title}</h3>
        <p>{plan.question}</p>
        <ul>{facts(plan,data).map(fact=><li key={fact}>{fact}</li>)}</ul>
        {next?<small><b>Next:</b> {next.title}</small>:plan.summary?<small>{plan.summary}</small>:null}
      </button>;
    })}</div>
  </section>;
}
